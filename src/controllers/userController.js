const User = require('../models/User');
const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const LinkedFamilies = require('../models/LinkedFamilies');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth.toISOString().split('T')[0],
          isVerified: user.isVerified,
          profilePictureUrl: user.profilePictureUrl,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user profile'
      }
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, dateOfBirth } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if phone number is already taken by another user
    if (phone && phone !== user.phone) {
      const existingUser = await User.findByPhone(phone);
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Phone number is already in use'
          }
        });
      }
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);

    // TODO: Handle profile picture upload
    // if (req.file) {
    //   user.profilePictureUrl = req.file.path;
    // }

    await user.save();

    logger.info(`User profile updated: ${user.fullName}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth.toISOString().split('T')[0],
          profilePictureUrl: user.profilePictureUrl
        }
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password is incorrect'
        }
      });
    }

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password and confirmation do not match'
        }
      });
    }

    // Check if new password is different from current
    const isNewPasswordSame = await user.matchPassword(newPassword);
    if (isNewPasswordSame) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be different from current password'
        }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.fullName}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to change password'
      }
    });
  }
};

// @desc    Get user privacy settings
// @route   GET /api/users/privacy-settings
// @access  Private
const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('privacySettings');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        showProfile: user.privacySettings.showProfile,
        allowSearch: user.privacySettings.allowSearch,
        notifications: user.privacySettings.notifications,
        familyVisibility: user.privacySettings.familyVisibility
      }
    });
  } catch (error) {
    logger.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get privacy settings'
      }
    });
  }
};

// @desc    Update user privacy settings
// @route   PUT /api/users/privacy-settings
// @access  Private
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { showProfile, allowSearch, notifications, familyVisibility } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update privacy settings
    if (showProfile !== undefined) user.privacySettings.showProfile = showProfile;
    if (allowSearch !== undefined) user.privacySettings.allowSearch = allowSearch;
    if (notifications !== undefined) user.privacySettings.notifications = notifications;
    if (familyVisibility !== undefined) user.privacySettings.familyVisibility = familyVisibility;

    await user.save();

    logger.info(`Privacy settings updated for user: ${user.fullName}`);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    logger.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update privacy settings'
      }
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/statistics
// @access  Private
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's main family
    const mainFamily = await Family.findMainFamilyByUser(userId);
    if (!mainFamily) {
      return res.json({
        success: true,
        data: {
          familyMembers: 0,
          linkedFamilies: 0,
          verifiedMembers: 0,
          totalConnections: 0
        }
      });
    }

    // Count family members
    const familyMembers = await FamilyMember.countDocuments({ familyId: mainFamily._id });

    // Count verified members
    const verifiedMembers = await FamilyMember.countDocuments({ 
      familyId: mainFamily._id, 
      isVerified: true 
    });

    // Count linked families
    const linkedFamilies = await LinkedFamilies.countDocuments({
      $or: [
        { mainFamilyId: mainFamily._id },
        { linkedFamilyId: mainFamily._id }
      ],
      status: 'active'
    });

    // Calculate total connections (family members + linked family members)
    const totalConnections = familyMembers + linkedFamilies;

    res.json({
      success: true,
      data: {
        familyMembers,
        linkedFamilies,
        verifiedMembers,
        totalConnections
      }
    });
  } catch (error) {
    logger.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user statistics'
      }
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getPrivacySettings,
  updatePrivacySettings,
  getUserStatistics
}; 