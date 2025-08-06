const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: [true, 'Family ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Allow null values but ensure uniqueness when not null
  },
  joinId: {
    type: String,
    required: [true, 'Join ID is required'],
    maxlength: [20, 'Join ID cannot be more than 20 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [100, 'First name cannot be more than 100 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [100, 'Last name cannot be more than 100 characters']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true,
    maxlength: [50, 'Relationship cannot be more than 50 characters']
  },
  birthYear: {
    type: String,
    maxlength: 4,
    match: [/^\d{4}$/, 'Birth year must be a 4-digit year']
  },
  deathYear: {
    type: String,
    maxlength: 4,
    match: [/^\d{4}$/, 'Death year must be a 4-digit year']
  },
  isDeceased: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFamilyCreator: {
    type: Boolean,
    default: false
  },
  joinIdUsed: {
    type: Boolean,
    default: false
  },
  linkedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember'
  },
  linkedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember'
  },
  isLinkedMember: {
    type: Boolean,
    default: false
  },
  originalFamilyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family'
  },
  avatarUrl: {
    type: String,
    maxlength: 500
  },
  position: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  contactInfo: {
    phone: {
      type: String,
      maxlength: 20
    },
    email: {
      type: String,
      maxlength: 255
    },
    address: {
      type: String,
      maxlength: 500
    }
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
familyMemberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
familyMemberSchema.virtual('age').get(function() {
  if (!this.birthYear) return null;
  const currentYear = new Date().getFullYear();
  const birthYear = parseInt(this.birthYear);
  if (this.isDeceased && this.deathYear) {
    return parseInt(this.deathYear) - birthYear;
  }
  return currentYear - birthYear;
});

// Indexes
familyMemberSchema.index({ familyId: 1, position: 1 });
familyMemberSchema.index({ joinId: 1 }, { unique: true });
// userId index is automatically created by sparse: true in schema
familyMemberSchema.index({ 
  firstName: 'text', 
  lastName: 'text' 
});

// Pre-save middleware to set position if not provided
familyMemberSchema.pre('save', async function(next) {
  if (!this.position && this.isNew) {
    const lastMember = await this.constructor.findOne(
      { familyId: this.familyId },
      {},
      { sort: { position: -1 } }
    );
    this.position = lastMember ? lastMember.position + 1 : 1;
  }
  next();
});

// Static method to find by join ID
familyMemberSchema.statics.findByJoinId = function(joinId) {
  return this.findOne({ joinId });
};

// Static method to find family members by family ID
familyMemberSchema.statics.findByFamilyId = function(familyId) {
  return this.find({ familyId }).sort({ position: 1 });
};

// Static method to find verified members by family ID
familyMemberSchema.statics.findVerifiedByFamilyId = function(familyId) {
  return this.find({ familyId, isVerified: true }).sort({ position: 1 });
};

// Method to check if member is linked
familyMemberSchema.methods.isLinked = function() {
  return !!this.linkedFrom;
};

// Method to check if member is creator
familyMemberSchema.methods.isCreator = function() {
  return this.isFamilyCreator;
};

// Method to mark join ID as used
familyMemberSchema.methods.markJoinIdAsUsed = function() {
  this.joinIdUsed = true;
  return this.save();
};

module.exports = mongoose.model('FamilyMember', familyMemberSchema); 