const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const FamilyBranch = require('../models/FamilyBranch');
const FamilyCreationFlow = require('../models/FamilyCreationFlow');
const LinkedFamilies = require('../models/LinkedFamilies');
const User = require('../models/User');
const { generateJoinId } = require('../utils/generateJoinId');
const NotificationService = require('../utils/notificationService');
const logger = require('../utils/logger');

// @desc    Create a new family
// @route   POST /api/families
// @access  Private
const createFamily = async (req, res) => {
  try {
    const { name, creatorJoinId } = req.body;
    const userId = req.user.id;

    // Check if user already has a main family
    const existingMainFamily = await Family.findMainFamilyByUser(userId);
    if (existingMainFamily) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'User already has a main family'
        }
      });
    }

    // Generate creator join ID if not provided
    const finalCreatorJoinId = creatorJoinId || await generateJoinId();

    // Create the family
    const family = await Family.create({
      name,
      creatorId: userId,
      creatorJoinId: finalCreatorJoinId,
      isMainFamily: true
    });

    // Create the creator as the first family member
    const user = await User.findById(userId);
    const creatorMember = await FamilyMember.create({
      familyId: family._id,
      userId: userId,
      joinId: finalCreatorJoinId,
      firstName: user.firstName,
      lastName: user.lastName,
      relationship: 'Creator',
      isVerified: true,
      isFamilyCreator: true,
      position: 1
    });

    logger.info(`Family created: ${family.name} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Family created successfully',
      data: {
        family: {
          id: family._id,
          name: family.name,
          creatorId: family.creatorId,
          creatorJoinId: family.creatorJoinId,
          isMainFamily: family.isMainFamily
        }
      }
    });
  } catch (error) {
    logger.error('Create family error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create family'
      }
    });
  }
};

// @desc    Get user's family with members
// @route   GET /api/families/my-family
// @access  Private
const getMyFamily = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's main family
    const family = await Family.findMainFamilyByUser(userId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No family found for this user'
        }
      });
    }

    // Get family members (including linked members)
    const members = await FamilyMember.findByFamilyId(family._id);

    // Get linked families
    const linkedFamilies = await LinkedFamilies.findLinkedFamilies(family._id);

    // Get linked members from other families
    const linkedMembers = [];
    for (const link of linkedFamilies) {
      const otherFamilyId = link.mainFamilyId._id.toString() === family._id.toString() 
        ? link.linkedFamilyId._id 
        : link.mainFamilyId._id;

      const otherFamilyMembers = await FamilyMember.find({ 
        familyId: otherFamilyId,
        isLinkedMember: true,
        originalFamilyId: family._id
      });

      linkedMembers.push(...otherFamilyMembers);
    }

    // Combine all members
    const allMembers = [
      ...members.map(member => ({
        ...member.toObject(),
        isLinkedMember: false,
        sourceFamily: family.name
      })),
      ...linkedMembers.map(member => ({
        ...member.toObject(),
        isLinkedMember: true,
        sourceFamily: linkedFamilies.find(link => 
          link.mainFamilyId._id.toString() === member.originalFamilyId.toString() ||
          link.linkedFamilyId._id.toString() === member.originalFamilyId.toString()
        )?.mainFamilyId._id.toString() === family._id.toString() 
          ? link.linkedFamilyId.name 
          : link.mainFamilyId.name
      }))
    ];

    // Sort by position
    allMembers.sort((a, b) => a.position - b.position);

    res.json({
      success: true,
      data: {
        family: {
          id: family._id,
          name: family.name,
          creatorId: family.creatorId,
          creatorJoinId: family.creatorJoinId,
          isMainFamily: family.isMainFamily,
          createdAt: family.createdAt
        },
        members: allMembers,
        linkedFamilies: linkedFamilies.map(link => ({
          id: link.mainFamilyId._id.toString() === family._id.toString() 
            ? link.linkedFamilyId._id 
            : link.mainFamilyId._id,
          name: link.mainFamilyId._id.toString() === family._id.toString() 
            ? link.linkedFamilyId.name 
            : link.mainFamilyId.name,
          linkedAt: link.linkedAt,
          linkedBy: link.linkedBy
        })),
        statistics: {
          totalMembers: allMembers.length,
          originalMembers: members.length,
          linkedMembers: linkedMembers.length,
          linkedFamilies: linkedFamilies.length
        }
      }
    });
  } catch (error) {
    logger.error('Get my family error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get family'
      }
    });
  }
};

// @desc    Add a family member
// @route   POST /api/families/:familyId/members
// @access  Private
const addFamilyMember = async (req, res) => {
  try {
    const { familyId } = req.params;
    const { firstName, lastName, relationship, birthYear, isDeceased, deathYear, motherId, parentType } = req.body;
    const userId = req.user.id;

    console.log('🔍 Adding family member:', { familyId, firstName, lastName, relationship, birthYear, isDeceased, deathYear, motherId, parentType });

    // Validate required fields
    if (!firstName || !lastName || !relationship || !birthYear) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'firstName, lastName, relationship, and birthYear are required'
        }
      });
    }

    // Validate isDeceased is boolean
    if (typeof isDeceased !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'isDeceased must be a boolean value'
        }
      });
    }

    // Validate deathYear if isDeceased is true
    if (isDeceased && !deathYear) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'deathYear is required when isDeceased is true'
        }
      });
    }

    // Check if family exists and user is creator
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family not found'
        }
      });
    }

    if (!family.isCreator(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Only family creator can add members'
        }
      });
    }

    console.log('✅ Family validation passed, generating join ID...');

    // Generate unique join ID
    const joinId = await generateJoinId();
    console.log('✅ Join ID generated:', joinId);

    // Handle avatar file upload if present
    let avatarUrl = null;
    if (req.file) {
      console.log('📁 Avatar file uploaded:', req.file.filename);
      // TODO: Upload file to cloud storage (AWS S3, etc.)
      // For now, we'll store a placeholder
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    console.log('✅ Creating family member...');

    // Determine parent type and root member status based on relationship and provided parentType
    let finalParentType = parentType || 'child';
    let isRootMember = false;
    let branchId = null;
    
    if (finalParentType === 'father' || relationship.toLowerCase().includes('father')) {
      finalParentType = 'father';
      isRootMember = true;
    } else if (finalParentType === 'mother' || relationship.toLowerCase().includes('mother') || relationship.toLowerCase().includes('wife')) {
      finalParentType = 'mother';
      isRootMember = true;
    } else if (finalParentType === 'child') {
      // For children, validate motherId if provided
      if (motherId) {
        // Validate mother exists and belongs to this family
        const mother = await FamilyMember.findOne({
          _id: motherId,
          familyId,
          parentType: 'mother'
        });

        if (!mother) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Mother not found or not valid for this family'
            }
          });
        }

        // Validate age relationship
        const motherBirthYear = parseInt(mother.birthYear);
        const childBirthYear = parseInt(birthYear);
        
        if (childBirthYear <= motherBirthYear) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Child must be born after mother'
            }
          });
        }

        // Get mother's branch
        const branch = await FamilyBranch.findByMotherId(motherId);
        if (branch) {
          branchId = branch._id;
        }
      }
    }

    // Create family member
    const member = await FamilyMember.create({
      familyId,
      firstName,
      lastName,
      relationship,
      birthYear,
      isDeceased,
      deathYear: isDeceased ? deathYear : undefined,
      joinId,
      isVerified: false,
      isFamilyCreator: false,
      avatarUrl,
      parentType: finalParentType,
      isRootMember,
      motherId: finalParentType === 'child' ? motherId : undefined,
      branchId
    });

    console.log('✅ Family member created successfully:', member._id);

    // Create notification for family creator
    await NotificationService.createMemberAddedNotification(familyId, member._id, userId);

    logger.info(`Family member added: ${member.fullName} to family ${familyId}`);

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: {
        member: {
          id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          name: member.fullName,
          relationship: member.relationship,
          birthYear: member.birthYear,
          isDeceased: member.isDeceased,
          deathYear: member.deathYear,
          isVerified: member.isVerified,
          isFamilyCreator: member.isFamilyCreator,
          joinId: member.joinId,
          avatarUrl: member.avatarUrl,
          parentType: member.parentType,
          isRootMember: member.isRootMember,
          motherId: member.motherId,
          branchId: member.branchId
        }
      }
    });
  } catch (error) {
    console.error('❌ Add family member error:', error);
    logger.error('Add family member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add family member',
        details: error.message
      }
    });
  }
};

// @desc    Update a family member
// @route   PUT /api/families/:familyId/members/:memberId
// @access  Private
const updateFamilyMember = async (req, res) => {
  try {
    const { familyId, memberId } = req.params;
    const { firstName, lastName, relationship, birthYear, isDeceased, deathYear } = req.body;
    const userId = req.user.id;

    // Check if family exists and user is creator
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family not found'
        }
      });
    }

    if (!family.isCreator(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Only family creator can update members'
        }
      });
    }

    // Find and update member
    const member = await FamilyMember.findById(memberId);
    if (!member || member.familyId.toString() !== familyId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family member not found'
        }
      });
    }

    // Update member fields
    member.firstName = firstName || member.firstName;
    member.lastName = lastName || member.lastName;
    member.relationship = relationship || member.relationship;
    member.birthYear = birthYear || member.birthYear;
    member.isDeceased = isDeceased !== undefined ? isDeceased : member.isDeceased;
    member.deathYear = deathYear || member.deathYear;

    await member.save();

    // Create notification for family creator
    await NotificationService.createMemberUpdatedNotification(familyId, memberId, userId);

    logger.info(`Family member updated: ${member.fullName} in family ${familyId}`);

    res.json({
      success: true,
      message: 'Family member updated successfully',
      data: {
        member: {
          id: member._id,
          name: member.fullName,
          relationship: member.relationship,
          birthYear: member.birthYear,
          isDeceased: member.isDeceased,
          isVerified: member.isVerified,
          isFamilyCreator: member.isFamilyCreator,
          joinId: member.joinId,
          avatarUrl: member.avatarUrl
        }
      }
    });
  } catch (error) {
    logger.error('Update family member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update family member'
      }
    });
  }
};

// @desc    Delete a family member
// @route   DELETE /api/families/:familyId/members/:memberId
// @access  Private
const deleteFamilyMember = async (req, res) => {
  try {
    const { familyId, memberId } = req.params;
    const userId = req.user.id;

    // Check if family exists and user is creator
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family not found'
        }
      });
    }

    if (!family.isCreator(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Only family creator can delete members'
        }
      });
    }

    // Find and delete member
    const member = await FamilyMember.findById(memberId);
    if (!member || member.familyId.toString() !== familyId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family member not found'
        }
      });
    }

    // Prevent deleting the family creator
    if (member.isFamilyCreator) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete the family creator'
        }
      });
    }

    await FamilyMember.findByIdAndDelete(memberId);

    logger.info(`Family member deleted: ${member.fullName} from family ${familyId}`);

    res.json({
      success: true,
      message: 'Family member deleted successfully'
    });
  } catch (error) {
    logger.error('Delete family member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete family member'
      }
    });
  }
};

// @desc    Generate join ID for a family member
// @route   POST /api/families/:familyId/join-ids
// @access  Private
const generateMemberJoinId = async (req, res) => {
  try {
    const { familyId } = req.params;
    const { memberId } = req.body;
    const userId = req.user.id;

    // Check if family exists and user is creator
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family not found'
        }
      });
    }

    if (!family.isCreator(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Only family creator can generate join IDs'
        }
      });
    }

    // Find the member
    const member = await FamilyMember.findById(memberId);
    if (!member || member.familyId.toString() !== familyId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family member not found'
        }
      });
    }

    // Generate new join ID
    const newJoinId = await generateJoinId();
    member.joinId = newJoinId;
    member.joinIdUsed = false;
    await member.save();

    logger.info(`Join ID generated for member: ${member.fullName} - ${newJoinId}`);

    res.json({
      success: true,
      data: {
        joinId: newJoinId,
        memberName: member.fullName
      }
    });
  } catch (error) {
    logger.error('Generate join ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate join ID'
      }
    });
  }
};

// @desc    Link family using join ID
// @route   POST /api/families/link
// @access  Private
const linkFamily = async (req, res) => {
  try {
    const { joinId, linkType = 'child_family' } = req.body;
    const userId = req.user.id;

    console.log('🔗 Linking family with join ID:', joinId);

    // Find member by join ID
    const member = await FamilyMember.findByJoinId(joinId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invalid join ID'
        }
      });
    }

    // Check if join ID is already used
    if (member.joinIdUsed) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Join ID has already been used'
        }
      });
    }

    // Check if member is a family creator
    if (!member.isFamilyCreator) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Join ID must belong to a family creator'
        }
      });
    }

    // Get the family to be linked
    const linkedFamily = await Family.findById(member.familyId);
    if (!linkedFamily) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family not found'
        }
      });
    }

    // Get user's main family
    const userMainFamily = await Family.findMainFamilyByUser(userId);
    if (!userMainFamily) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'You must have a main family to link with others'
        }
      });
    }

    // Prevent linking to own family
    if (linkedFamily._id.toString() === userMainFamily._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot link to your own family'
        }
      });
    }

    // Check if families are already linked
    const existingLink = await LinkedFamilies.areFamiliesLinked(userMainFamily._id, linkedFamily._id);
    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Families are already linked'
        }
      });
    }

    // Start transaction for linking process
    const session = await FamilyMember.startSession();
    session.startTransaction();

    try {
      // Mark join ID as used
      await member.markJoinIdAsUsed();

      // Create linked families relationship
      const link = await LinkedFamilies.createLink(userMainFamily._id, linkedFamily._id, userId);

      // Get all members from the linked family
      const linkedFamilyMembers = await FamilyMember.find({ familyId: linkedFamily._id });

      // Create linked members in user's family
      const linkedMembers = [];
      for (const linkedMember of linkedFamilyMembers) {
        // Skip the creator member (already exists)
        if (linkedMember._id.toString() === member._id.toString()) {
          continue;
        }

        // Create a linked member in user's family
        const newLinkedMember = new FamilyMember({
          familyId: userMainFamily._id,
          firstName: linkedMember.firstName,
          lastName: linkedMember.lastName,
          relationship: linkedMember.relationship,
          birthYear: linkedMember.birthYear,
          deathYear: linkedMember.deathYear,
          isDeceased: linkedMember.isDeceased,
          isVerified: linkedMember.isVerified,
          isFamilyCreator: false,
          isLinkedMember: true,
          originalFamilyId: linkedFamily._id,
          linkedFrom: linkedMember._id,
          avatarUrl: linkedMember.avatarUrl,
          bio: linkedMember.bio,
          contactInfo: linkedMember.contactInfo,
          socialLinks: linkedMember.socialLinks
        });

        await newLinkedMember.save({ session });
        linkedMembers.push(newLinkedMember);

        // Update the original member to point to the linked member
        linkedMember.linkedTo = newLinkedMember._id;
        await linkedMember.save({ session });
      }

      // Get all members from user's family
      const userFamilyMembers = await FamilyMember.find({ familyId: userMainFamily._id });

      // Create linked members in the other family
      const userLinkedMembers = [];
      for (const userMember of userFamilyMembers) {
        // Skip the creator member (already exists)
        if (userMember._id.toString() === member._id.toString()) {
          continue;
        }

        // Create a linked member in the other family
        const newUserLinkedMember = new FamilyMember({
          familyId: linkedFamily._id,
          firstName: userMember.firstName,
          lastName: userMember.lastName,
          relationship: userMember.relationship,
          birthYear: userMember.birthYear,
          deathYear: userMember.deathYear,
          isDeceased: userMember.isDeceased,
          isVerified: userMember.isVerified,
          isFamilyCreator: false,
          isLinkedMember: true,
          originalFamilyId: userMainFamily._id,
          linkedFrom: userMember._id,
          avatarUrl: userMember.avatarUrl,
          bio: userMember.bio,
          contactInfo: userMember.contactInfo,
          socialLinks: userMember.socialLinks
        });

        await newUserLinkedMember.save({ session });
        userLinkedMembers.push(newUserLinkedMember);

        // Update the original member to point to the linked member
        userMember.linkedTo = newUserLinkedMember._id;
        await userMember.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      // Create notifications for both family creators
      await NotificationService.createFamilyLinkedNotification(
        userMainFamily.creatorId,
        linkedFamily._id,
        linkedFamily.name,
        userId
      );

      await NotificationService.createFamilyLinkedNotification(
        linkedFamily.creatorId,
        userMainFamily._id,
        userMainFamily.name,
        userId
      );

      logger.info(`Family linked successfully: ${userMainFamily.name} linked with ${linkedFamily.name}`);

      res.json({
        success: true,
        message: 'Family linked successfully',
        data: {
          linkedFamily: {
            id: linkedFamily._id,
            name: linkedFamily.name,
            creatorName: member.fullName,
            linkedAs: linkType
          },
          mainFamily: {
            id: userMainFamily._id,
            name: userMainFamily.name
          },
          linkedMember: {
            id: member._id,
            name: member.fullName,
            branch: member.branchId ? 'Has Branch' : 'No Branch'
          },
          integrationDetails: {
            totalLinkedMembers: linkedMembers.length + userLinkedMembers.length,
            branchStructure: linkType === 'child_family' ? 'Linked as child family' : 'Standard family link'
          }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    logger.error('Link family error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to link family'
      }
    });
  }
};

// @desc    Validate join ID
// @route   GET /api/families/validate-join-id/:joinId
// @access  Private
const validateJoinId = async (req, res) => {
  try {
    const { joinId } = req.params;

    // Find member by join ID
    const member = await FamilyMember.findByJoinId(joinId);
    if (!member) {
      return res.json({
        success: true,
        data: {
          isValid: false,
          memberName: null,
          familyName: null,
          isFamilyCreator: false
        }
      });
    }

    // Check if join ID is already used
    if (member.joinIdUsed) {
      return res.json({
        success: true,
        data: {
          isValid: false,
          memberName: member.fullName,
          familyName: null,
          isFamilyCreator: member.isFamilyCreator
        }
      });
    }

    // Get family name
    const family = await Family.findById(member.familyId);

    res.json({
      success: true,
      data: {
        isValid: true,
        memberName: member.fullName,
        familyName: family ? family.name : null,
        isFamilyCreator: member.isFamilyCreator
      }
    });
  } catch (error) {
    logger.error('Validate join ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate join ID'
      }
    });
  }
};

// @desc    Get a specific family by ID
// @route   GET /api/families/:familyId
// @access  Private
const getFamilyById = async (req, res) => {
  try {
    const { familyId } = req.params;
    const userId = req.user.id;

    // Find the family
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family not found'
        }
      });
    }

    // Check if user has access to this family
    if (!family.isCreator(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You do not have access to this family'
        }
      });
    }

    // Get family members
    const members = await FamilyMember.findByFamilyId(family._id);

    // Get linked families
    const linkedFamilies = await LinkedFamilies.findLinkedFamilies(family._id);
    
    // Get members from linked families
    const linkedMembers = [];
    for (const link of linkedFamilies) {
      const linkedFamilyId = link.mainFamilyId._id.toString() === family._id.toString() 
        ? link.linkedFamilyId._id 
        : link.mainFamilyId._id;
      
      const linkedFamilyMembers = await FamilyMember.findByFamilyId(linkedFamilyId);
      
      // Add linked family info to each member
      const linkedFamilyName = link.mainFamilyId._id.toString() === family._id.toString() 
        ? link.linkedFamilyId.name 
        : link.mainFamilyId.name;
      
      linkedMembers.push(...linkedFamilyMembers.map(member => ({
        ...member.toObject(),
        linkedFamilyName,
        isLinkedMember: true
      })));
    }

    // Format members for response
    const formattedMembers = members.map(member => ({
      id: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      name: member.fullName,
      relationship: member.relationship,
      birthYear: member.birthYear,
      isDeceased: member.isDeceased,
      deathYear: member.deathYear,
      isVerified: member.isVerified,
      isFamilyCreator: member.isFamilyCreator,
      joinId: member.joinId,
      joinIdUsed: member.joinIdUsed,
      avatarUrl: member.avatarUrl,
      isLinkedMember: false
    }));

    // Format linked members
    const formattedLinkedMembers = linkedMembers.map(member => ({
      id: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      name: member.fullName,
      relationship: member.relationship,
      birthYear: member.birthYear,
      isDeceased: member.isDeceased,
      deathYear: member.deathYear,
      isVerified: member.isVerified,
      isFamilyCreator: member.isFamilyCreator,
      joinId: member.joinId,
      joinIdUsed: member.joinIdUsed,
      avatarUrl: member.avatarUrl,
      linkedFamilyName: member.linkedFamilyName,
      isLinkedMember: true
    }));

    // Format linked families info
    const formattedLinkedFamilies = linkedFamilies.map(link => ({
      id: link._id,
      linkedFamilyId: link.mainFamilyId._id.toString() === family._id.toString() 
        ? link.linkedFamilyId._id 
        : link.mainFamilyId._id,
      linkedFamilyName: link.mainFamilyId._id.toString() === family._id.toString() 
        ? link.linkedFamilyId.name 
        : link.mainFamilyId.name,
      linkedAt: link.linkedAt,
      linkedBy: link.linkedBy
    }));

    res.json({
      success: true,
      data: {
        family: {
          id: family._id,
          name: family.name,
          creatorId: family.creatorId,
          creatorJoinId: family.creatorJoinId,
          isMainFamily: family.isMainFamily
        },
        members: formattedMembers,
        linkedMembers: formattedLinkedMembers,
        linkedFamilies: formattedLinkedFamilies,
        totalMembers: formattedMembers.length + formattedLinkedMembers.length
      }
    });
  } catch (error) {
    logger.error('Get family by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get family'
      }
    });
  }
};

// @desc    Get family members only
// @route   GET /api/families/:familyId/members
// @access  Private
const getFamilyMembers = async (req, res) => {
  try {
    const { familyId } = req.params;
    const userId = req.user.id;

    // Find the family
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Family not found'
        }
      });
    }

    // Check if user has access to this family
    if (!family.isCreator(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You do not have access to this family'
        }
      });
    }

    // Get family members
    const members = await FamilyMember.findByFamilyId(family._id);

    // Format members for response
    const formattedMembers = members.map(member => ({
      id: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      name: member.fullName,
      relationship: member.relationship,
      birthYear: member.birthYear,
      isDeceased: member.isDeceased,
      deathYear: member.deathYear,
      isVerified: member.isVerified,
      isFamilyCreator: member.isFamilyCreator,
      joinId: member.joinId,
      joinIdUsed: member.joinIdUsed,
      avatarUrl: member.avatarUrl
    }));

    res.json({
      success: true,
      data: {
        members: formattedMembers,
        totalCount: formattedMembers.length
      }
    });
  } catch (error) {
    logger.error('Get family members error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get family members'
      }
    });
  }
};

// @desc    Get member's join ID for sharing
// @route   GET /api/families/members/:memberId/join-id
// @access  Private
const getMemberJoinId = async (req, res) => {
  try {
    const { memberId } = req.params;
    const userId = req.user.id;

    // Find the member
    const member = await FamilyMember.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found'
        }
      });
    }

    // Check if user owns this family
    const family = await Family.findById(member.familyId);
    if (!family || family.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You can only get join IDs for members in your family'
        }
      });
    }

    // Check if join ID is already used
    if (member.joinIdUsed) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'This join ID has already been used for linking'
        }
      });
    }

    res.json({
      success: true,
      data: {
        memberId: member._id,
        memberName: member.fullName,
        joinId: member.joinId,
        isFamilyCreator: member.isFamilyCreator,
        canBeLinked: !member.joinIdUsed
      }
    });
  } catch (error) {
    logger.error('Get member join ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get member join ID'
      }
    });
  }
};

// @desc    Initialize family creation
// @route   POST /api/families/initialize-creation
// @access  Private
const initializeFamilyCreation = async (req, res) => {
  try {
    const { creationType, familyName } = req.body;
    const userId = req.user.id;

    // Check if user already has an active family creation flow
    const existingFlow = await FamilyCreationFlow.findActiveByUserId(userId);
    if (existingFlow.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'User already has an active family creation flow'
        }
      });
    }

    // Generate family name if not provided
    const finalFamilyName = familyName || `${req.user.firstName}'s Family`;

    // Create the family
    const family = await Family.create({
      name: finalFamilyName,
      creatorId: userId,
      creatorJoinId: await generateJoinId(),
      isMainFamily: true,
      creationType,
      currentStep: 'initialized'
    });

    // Create the creation flow
    const creationFlow = await FamilyCreationFlow.create({
      userId,
      familyId: family._id,
      creationType,
      currentStep: 'initialized'
    });

    logger.info(`Family creation initialized: ${family.name} by user ${userId} (${creationType})`);

    res.status(201).json({
      success: true,
      message: 'Family creation initialized',
      data: {
        familyId: family._id,
        creationType,
        currentStep: 'initialized',
        nextStep: 'parent_setup'
      }
    });
  } catch (error) {
    logger.error('Initialize family creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to initialize family creation'
      }
    });
  }
};

// @desc    Setup parents for family
// @route   POST /api/families/:familyId/setup-parents
// @access  Private
const setupParents = async (req, res) => {
  try {
    const { familyId } = req.params;
    const { father, mothers } = req.body;
    const userId = req.user.id;

    // Check if user owns this family
    const family = await Family.findById(familyId);
    if (!family || family.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You can only setup parents for your own family'
        }
      });
    }

    // Validate age relationships
    const fatherBirthYear = parseInt(father.birthYear);
    const motherBirthYears = mothers.map(m => parseInt(m.birthYear));
    
    // Father must be older than mothers
    if (motherBirthYears.some(year => year < fatherBirthYear)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Father must be older than all mothers'
        }
      });
    }

    // Validate spouse order
    const spouseOrders = mothers.map(m => m.spouseOrder).sort((a, b) => a - b);
    if (!spouseOrders.every((order, index) => order === index + 1)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Spouse order must be sequential starting from 1'
        }
      });
    }

    // Create father
    const fatherMember = await FamilyMember.create({
      familyId,
      firstName: father.firstName,
      lastName: father.lastName,
      birthYear: father.birthYear,
      isDeceased: father.isDeceased,
      deathYear: father.deathYear,
      relationship: 'Father',
      parentType: 'father',
      isRootMember: true,
      isVerified: true,
      joinId: await generateJoinId(),
      position: 1
    });

    // Create mothers and branches
    const createdMothers = [];
    const createdBranches = [];

    for (const motherData of mothers) {
      // Create mother
      const motherMember = await FamilyMember.create({
        familyId,
        firstName: motherData.firstName,
        lastName: motherData.lastName,
        birthYear: motherData.birthYear,
        isDeceased: motherData.isDeceased,
        deathYear: motherData.deathYear,
        relationship: `Wife ${motherData.spouseOrder}`,
        parentType: 'mother',
        isRootMember: true,
        spouseOrder: motherData.spouseOrder,
        isVerified: true,
        joinId: await generateJoinId(),
        position: 2 + motherData.spouseOrder
      });

      // Create branch for this mother
      const branchName = motherData.spouseOrder === 1 ? 'First Wife\'s Branch' : `${motherData.spouseOrder}${getOrdinalSuffix(motherData.spouseOrder)} Wife\'s Branch`;
      const branch = await FamilyBranch.create({
        familyId,
        motherId: motherMember._id,
        branchName,
        branchOrder: motherData.spouseOrder
      });

      // Update mother with branch ID
      motherMember.branchId = branch._id;
      await motherMember.save();

      createdMothers.push(motherMember);
      createdBranches.push(branch);
    }

    // Update family step
    family.currentStep = 'parent_setup';
    await family.save();

    // Update creation flow
    const creationFlow = await FamilyCreationFlow.findByFamilyId(familyId);
    if (creationFlow) {
      await creationFlow.markParentsSetupComplete();
    }

    logger.info(`Parents setup completed for family ${familyId}: ${father.firstName} ${father.lastName} and ${mothers.length} mothers`);

    res.status(200).json({
      success: true,
      message: 'Parents setup completed',
      data: {
        family: {
          id: family._id,
          name: family.name,
          creationType: family.creationType,
          currentStep: family.currentStep
        },
        father: {
          id: fatherMember._id,
          firstName: fatherMember.firstName,
          lastName: fatherMember.lastName,
          birthYear: fatherMember.birthYear,
          isDeceased: fatherMember.isDeceased,
          deathYear: fatherMember.deathYear
        },
        mothers: createdMothers.map(mother => ({
          id: mother._id,
          firstName: mother.firstName,
          lastName: mother.lastName,
          birthYear: mother.birthYear,
          isDeceased: mother.isDeceased,
          deathYear: mother.deathYear,
          spouseOrder: mother.spouseOrder
        })),
        branches: createdBranches.map(branch => ({
          id: branch._id,
          name: branch.branchName,
          order: branch.branchOrder
        }))
      }
    });
  } catch (error) {
    logger.error('Setup parents error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to setup parents'
      }
    });
  }
};



// @desc    Get family tree structure
// @route   GET /api/families/:familyId/tree-structure
// @access  Private
const getFamilyTreeStructure = async (req, res) => {
  try {
    const { familyId } = req.params;
    const userId = req.user.id;

    // Check if user owns this family
    const family = await Family.findById(familyId);
    if (!family || family.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You can only view your own family tree structure'
        }
      });
    }

    // Get all family members
    const members = await FamilyMember.find({ familyId }).populate('branch');
    
    // Get branches
    const branches = await FamilyBranch.findByFamilyId(familyId);

    // Organize tree structure
    const father = members.find(m => m.parentType === 'father');
    const mothers = members.filter(m => m.parentType === 'mother').sort((a, b) => a.spouseOrder - b.spouseOrder);
    const children = members.filter(m => m.parentType === 'child');

    // Organize children by mother
    const childrenByMother = {};
    children.forEach(child => {
      if (child.motherId) {
        if (!childrenByMother[child.motherId.toString()]) {
          childrenByMother[child.motherId.toString()] = [];
        }
        childrenByMother[child.motherId.toString()].push(child);
      }
    });

    // Build tree structure
    const treeStructure = {
      father: father ? {
        id: father._id,
        name: `${father.firstName} ${father.lastName}`,
        details: father
      } : null,
      mothers: mothers.map(mother => ({
        id: mother._id,
        name: `${mother.firstName} ${mother.lastName}`,
        details: mother,
        branch: branches.find(b => b.motherId.toString() === mother._id.toString()),
        children: childrenByMother[mother._id.toString()] || []
      })),
      branches: branches,
      statistics: {
        totalMembers: members.length,
        totalBranches: branches.length,
        totalChildren: children.length
      }
    };

    res.json({
      success: true,
      data: {
        family: {
          id: family._id,
          name: family.name,
          creationType: family.creationType
        },
        treeStructure
      }
    });
  } catch (error) {
    logger.error('Get family tree structure error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get family tree structure'
      }
    });
  }
};

// @desc    Get available mothers for child
// @route   GET /api/families/:familyId/available-mothers
// @access  Private
const getAvailableMothers = async (req, res) => {
  try {
    const { familyId } = req.params;
    const userId = req.user.id;

    // Check if user owns this family
    const family = await Family.findById(familyId);
    if (!family || family.creatorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You can only view mothers in your own family'
        }
      });
    }

    // Get mothers with their branches and children count
    const mothers = await FamilyMember.find({
      familyId,
      parentType: 'mother'
    }).sort({ spouseOrder: 1 });

    const mothersWithDetails = await Promise.all(
      mothers.map(async (mother) => {
        const branch = await FamilyBranch.findByMotherId(mother._id);
        const childrenCount = await FamilyMember.countDocuments({
          familyId,
          motherId: mother._id
        });

        return {
          id: mother._id,
          name: `${mother.firstName} ${mother.lastName}`,
          spouseOrder: mother.spouseOrder,
          branchName: branch ? branch.branchName : 'Unknown Branch',
          childrenCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        mothers: mothersWithDetails
      }
    });
  } catch (error) {
    logger.error('Get available mothers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get available mothers'
      }
    });
  }
};

// Helper function to get ordinal suffix
const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

// Helper function to get next position
const getNextPosition = async (familyId) => {
  const lastMember = await FamilyMember.findOne(
    { familyId },
    {},
    { sort: { position: -1 } }
  );
  return lastMember ? lastMember.position + 1 : 1;
};

module.exports = {
  createFamily,
  getMyFamily,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  generateMemberJoinId,
  linkFamily,
  validateJoinId,
  getFamilyById,
  getFamilyMembers,
  getMemberJoinId,
  initializeFamilyCreation,
  setupParents,

  getFamilyTreeStructure,
  getAvailableMothers
}; 