const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const logger = require('../utils/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'User with this phone number already exists'
        }
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      password
    });

    // Generate verification code
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // TODO: Send SMS verification code
    logger.info(`Verification code for ${phone}: ${verificationCode}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userId: user._id,
        verificationRequired: true
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    });
  }
};

// @desc    Sign in user
// @route   POST /api/auth/signin
// @access  Public
const signin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user by phone
    const user = await User.findByPhone(phone);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid credentials'
        }
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid credentials'
        }
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Sign in successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Sign in error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Sign in failed'
      }
    });
  }
};

// @desc    Verify phone number
// @route   POST /api/auth/verify-phone
// @access  Public
const verifyPhone = async (req, res) => {
  try {
    const { phone, verificationCode } = req.body;

    // Find user by phone
    const user = await User.findByPhone(phone);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Phone number is already verified'
        }
      });
    }

    // Verify code
    if (!user.verifyCode(verificationCode)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid or expired verification code'
        }
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpiresAt = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        user: {
          id: user._id,
          isVerified: true
        }
      }
    });
  } catch (error) {
    logger.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Phone verification failed'
      }
    });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find user by phone
    const user = await User.findByPhone(phone);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Phone number is already verified'
        }
      });
    }

    // Generate new verification code
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // TODO: Send SMS verification code
    logger.info(`New verification code for ${phone}: ${verificationCode}`);

    res.json({
      success: true,
      message: 'Verification code sent'
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to resend verification code'
      }
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Refresh token is required'
        }
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid refresh token'
        }
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid refresh token'
      }
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // TODO: Invalidate refresh token in database/Redis
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Logout failed'
      }
    });
  }
};

module.exports = {
  register,
  signin,
  verifyPhone,
  resendVerification,
  refreshToken,
  logout
}; 