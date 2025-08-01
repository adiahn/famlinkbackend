const express = require('express');
const { protect } = require('../middleware/auth');
const {
  register,
  signin,
  verifyPhone,
  resendVerification,
  refreshToken,
  logout
} = require('../controllers/authController');
const {
  registerSchema,
  signinSchema,
  verifyPhoneSchema,
  resendVerificationSchema,
  refreshTokenSchema
} = require('../validators/authValidators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/signin', validateRequest(signinSchema), signin);
router.post('/verify-phone', validateRequest(verifyPhoneSchema), verifyPhone);
router.post('/resend-verification', validateRequest(resendVerificationSchema), resendVerification);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router; 