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
    .required()
    .pattern(/^\d{4}$/)
    .messages({
      'string.empty': 'Birth year is required',
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
    }),
  motherId: Joi.string()
    .optional()
    .messages({
      'string.empty': 'Mother ID must be a valid string if provided'
    }),
  parentType: Joi.string()
    .optional()
    .valid('father', 'mother', 'child')
    .messages({
      'any.only': 'Parent type must be one of: father, mother, child'
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
    }),
  linkType: Joi.string()
    .valid('child_family')
    .default('child_family')
    .messages({
      'any.only': 'Link type must be "child_family"'
    })
});

// Initialize family creation validation schema
const initializeFamilyCreationSchema = Joi.object({
  creationType: Joi.string()
    .required()
    .valid('own_family', 'parents_family')
    .messages({
      'string.empty': 'Creation type is required',
      'any.only': 'Creation type must be either "own_family" or "parents_family"'
    }),
  familyName: Joi.string()
    .optional()
    .min(2)
    .max(255)
    .messages({
      'string.min': 'Family name must be at least 2 characters long',
      'string.max': 'Family name cannot exceed 255 characters'
    })
});

// Setup parents validation schema
const setupParentsSchema = Joi.object({
  father: Joi.object({
    firstName: Joi.string()
      .required()
      .min(1)
      .max(100)
      .trim()
      .messages({
        'string.empty': 'Father first name is required',
        'string.min': 'Father first name must be at least 1 character long',
        'string.max': 'Father first name cannot exceed 100 characters'
      }),
    lastName: Joi.string()
      .required()
      .min(1)
      .max(100)
      .trim()
      .messages({
        'string.empty': 'Father last name is required',
        'string.min': 'Father last name must be at least 1 character long',
        'string.max': 'Father last name cannot exceed 100 characters'
      }),
    birthYear: Joi.string()
      .required()
      .pattern(/^\d{4}$/)
      .messages({
        'string.empty': 'Father birth year is required',
        'string.pattern.base': 'Father birth year must be a 4-digit year'
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
        'string.pattern.base': 'Father death year must be a 4-digit year',
        'any.required': 'Father death year is required when deceased',
        'any.forbidden': 'Father death year should not be provided for living members'
      })
  }).required(),
  mothers: Joi.array()
    .items(Joi.object({
      firstName: Joi.string()
        .required()
        .min(1)
        .max(100)
        .trim()
        .messages({
          'string.empty': 'Mother first name is required',
          'string.min': 'Mother first name must be at least 1 character long',
          'string.max': 'Mother first name cannot exceed 100 characters'
        }),
      lastName: Joi.string()
        .required()
        .min(1)
        .max(100)
        .trim()
        .messages({
          'string.empty': 'Mother last name is required',
          'string.min': 'Mother last name must be at least 1 character long',
          'string.max': 'Mother last name cannot exceed 100 characters'
        }),
      birthYear: Joi.string()
        .required()
        .pattern(/^\d{4}$/)
        .messages({
          'string.empty': 'Mother birth year is required',
          'string.pattern.base': 'Mother birth year must be a 4-digit year'
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
          'string.pattern.base': 'Mother death year must be a 4-digit year',
          'any.required': 'Mother death year is required when deceased',
          'any.forbidden': 'Mother death year should not be provided for living members'
        }),
      spouseOrder: Joi.number()
        .required()
        .min(1)
        .messages({
          'number.base': 'Spouse order must be a number',
          'number.min': 'Spouse order must be at least 1'
        })
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one mother is required',
      'array.base': 'Mothers must be an array'
    })
});

module.exports = {
  createFamilySchema,
  addFamilyMemberSchema,
  updateFamilyMemberSchema,
  generateJoinIdSchema,
  linkFamilySchema,
  initializeFamilyCreationSchema,
  setupParentsSchema
}; 