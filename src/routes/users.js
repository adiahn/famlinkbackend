const express = require('express');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getPrivacySettings,
  updatePrivacySettings,
  getUserStatistics
} = require('../controllers/userController');
const {
  updateProfileSchema,
  changePasswordSchema,
  updatePrivacySettingsSchema
} = require('../validators/userValidators');

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', validateRequest(updateProfileSchema), updateUserProfile);
router.put('/change-password', validateRequest(changePasswordSchema), changePassword);

// Privacy settings routes
router.get('/privacy-settings', getPrivacySettings);
router.put('/privacy-settings', validateRequest(updatePrivacySettingsSchema), updatePrivacySettings);

// Statistics route
router.get('/statistics', getUserStatistics);

module.exports = router; 