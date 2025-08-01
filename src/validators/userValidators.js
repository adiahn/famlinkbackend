const Joi = require('joi');

// Update user profile validation schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .optional()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'First name must be at least 1 character long',
      'string.max': 'First name cannot exceed 100 characters'
    }),
  lastName: Joi.string()
    .optional()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Last name must be at least 1 character long',
      'string.max': 'Last name cannot exceed 100 characters'
    }),
  phone: Joi.string()
    .optional()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    }),
  dateOfBirth: Joi.date()
    .optional()
    .max('now')
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    })
});

// Change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .min(6)
    .messages({
      'string.empty': 'Current password is required',
      'string.min': 'Current password must be at least 6 characters long'
    }),
  newPassword: Joi.string()
    .required()
    .min(6)
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters long'
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'string.empty': 'Password confirmation is required',
      'any.only': 'Password confirmation must match new password'
    })
});

// Update privacy settings validation schema
const updatePrivacySettingsSchema = Joi.object({
  showProfile: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Show profile must be a boolean value'
    }),
  allowSearch: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Allow search must be a boolean value'
    }),
  notifications: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Notifications must be a boolean value'
    }),
  familyVisibility: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Family visibility must be a boolean value'
    })
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  updatePrivacySettingsSchema
}; 