const Joi = require('joi');

// Create family validation schema
const createFamilySchema = Joi.object({
  name: Joi.string()
    .required()
    .min(2)
    .max(255)
    .messages({
      'string.empty': 'Family name is required',
      'string.min': 'Family name must be at least 2 characters long',
      'string.max': 'Family name cannot exceed 255 characters'
    }),
  creatorJoinId: Joi.string()
    .required()
    .length(8)
    .pattern(/^[A-Z0-9]{8}$/)
    .messages({
      'string.empty': 'Creator join ID is required',
      'string.length': 'Creator join ID must be exactly 8 characters',
      'string.pattern.base': 'Creator join ID must contain only uppercase letters and numbers'
    })
});

// Add family member validation schema
const addFamilyMemberSchema = Joi.object({
  firstName: Joi.string()
    .required()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 1 character long',
      'string.max': 'First name cannot exceed 100 characters'
    }),
  lastName: Joi.string()
    .required()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 1 character long',
      'string.max': 'Last name cannot exceed 100 characters'
    }),
  relationship: Joi.string()
    .required()
    .min(1)
    .max(50)
    .trim()
    .messages({
      'string.empty': 'Relationship is required',
      'string.min': 'Relationship must be at least 1 character long',
      'string.max': 'Relationship cannot exceed 50 characters'
    }),
  birthYear: Joi.string()
    .optional()
    .pattern(/^\d{4}$/)
    .messages({
      'string.pattern.base': 'Birth year must be a 4-digit year'
    }),
  isDeceased: Joi.boolean()
    .default(false),
  deathYear: Joi.string()
    .optional()
    .pattern(/^\d{4}$/)
    .when('isDeceased', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'string.pattern.base': 'Death year must be a 4-digit year',
      'any.required': 'Death year is required when member is deceased',
      'any.forbidden': 'Death year should not be provided for living members'
    })
});

// Update family member validation schema
const updateFamilyMemberSchema = Joi.object({
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
  relationship: Joi.string()
    .optional()
    .min(1)
    .max(50)
    .trim()
    .messages({
      'string.min': 'Relationship must be at least 1 character long',
      'string.max': 'Relationship cannot exceed 50 characters'
    }),
  birthYear: Joi.string()
    .optional()
    .pattern(/^\d{4}$/)
    .messages({
      'string.pattern.base': 'Birth year must be a 4-digit year'
    }),
  isDeceased: Joi.boolean()
    .optional(),
  deathYear: Joi.string()
    .optional()
    .pattern(/^\d{4}$/)
    .when('isDeceased', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'string.pattern.base': 'Death year must be a 4-digit year',
      'any.required': 'Death year is required when member is deceased',
      'any.forbidden': 'Death year should not be provided for living members'
    })
});

// Generate join ID validation schema
const generateJoinIdSchema = Joi.object({
  memberId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Member ID is required'
    })
});

// Link family validation schema
const linkFamilySchema = Joi.object({
  joinId: Joi.string()
    .required()
    .length(8)
    .pattern(/^[A-Z0-9]{8}$/)
    .messages({
      'string.empty': 'Join ID is required',
      'string.length': 'Join ID must be exactly 8 characters',
      'string.pattern.base': 'Join ID must contain only uppercase letters and numbers'
    })
});

module.exports = {
  createFamilySchema,
  addFamilyMemberSchema,
  updateFamilyMemberSchema,
  generateJoinIdSchema,
  linkFamilySchema
}; 