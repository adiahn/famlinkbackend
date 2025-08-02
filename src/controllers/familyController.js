const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const LinkedFamilies = require('../models/LinkedFamilies');
const User = require('../models/User');
const { generateJoinId } = require('../utils/generateJoinId');
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
    const { firstName, lastName, relationship, birthYear, isDeceased, deathYear } = req.body;
    const userId = req.user.id;

    console.log('🔍 Adding family member:', { familyId, firstName, lastName, relationship, birthYear, isDeceased, deathYear });

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
      avatarUrl
    });

    console.log('✅ Family member created successfully:', member._id);

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
          avatarUrl: member.avatarUrl
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
    const { joinId } = req.body;
    const userId = req.user.id;

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

    // Mark join ID as used
    await member.markJoinIdAsUsed();

    // Create linked families relationship
    await LinkedFamilies.createLink(userMainFamily._id, linkedFamily._id, userId);

    logger.info(`Family linked: ${userMainFamily.name} linked with ${linkedFamily.name}`);

    res.json({
      success: true,
      message: 'Family linked successfully',
      data: {
        linkedFamily: {
          id: linkedFamily._id,
          name: linkedFamily.name,
          creatorName: member.fullName
        }
      }
    });
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

module.exports = {
  createFamily,
  getMyFamily,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  generateMemberJoinId,
  linkFamily,
  validateJoinId
}; 