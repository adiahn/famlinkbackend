const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Search users
// @route   GET /api/search/users
// @access  Private (optional)
const searchUsers = async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id; // Optional auth

    // Validate search term
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search term must be at least 2 characters long'
        }
      });
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50); // Max 50 results per page
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {
      $and: [
        {
          $or: [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { phone: { $regex: searchTerm, $options: 'i' } }
          ]
        },
        { 'privacySettings.allowSearch': true } // Only show users who allow search
      ]
    };

    // Exclude current user from search results
    if (userId) {
      searchQuery.$and.push({ _id: { $ne: userId } });
    }

    // Execute search with pagination
    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .select('firstName lastName phone isVerified')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(searchQuery)
    ]);

    // Format results
    const formattedUsers = users.map(user => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isVerified: user.isVerified
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search users'
      }
    });
  }
};

// @desc    Search family members (for internal use)
// @route   GET /api/search/family-members
// @access  Private
const searchFamilyMembers = async (req, res) => {
  try {
    const { q: searchTerm, familyId, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Validate search term
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search term must be at least 2 characters long'
        }
      });
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    // Build search query for family members
    const searchQuery = {
      familyId,
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { relationship: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    // Execute search with pagination
    const [members, total] = await Promise.all([
      FamilyMember.find(searchQuery)
        .select('firstName lastName relationship birthYear isVerified joinId')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FamilyMember.countDocuments(searchQuery)
    ]);

    // Format results
    const formattedMembers = members.map(member => ({
      id: member._id,
      name: `${member.firstName} ${member.lastName}`,
      relationship: member.relationship,
      birthYear: member.birthYear,
      isVerified: member.isVerified,
      joinId: member.joinId
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        members: formattedMembers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    logger.error('Search family members error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search family members'
      }
    });
  }
};

module.exports = {
  searchUsers,
  searchFamilyMembers
}; 