const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Family name is required'],
    trim: true,
    maxlength: [255, 'Family name cannot be more than 255 characters']
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  creatorJoinId: {
    type: String,
    required: [true, 'Creator join ID is required'],
    maxlength: [20, 'Join ID cannot be more than 20 characters']
  },
  isMainFamily: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  coverImageUrl: {
    type: String,
    maxlength: 500
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    privacyLevel: {
      type: String,
      enum: ['public', 'private', 'family-only'],
      default: 'family-only'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
familySchema.virtual('memberCount', {
  ref: 'FamilyMember',
  localField: '_id',
  foreignField: 'familyId',
  count: true
});

// Index for search functionality
familySchema.index({ name: 'text' });
familySchema.index({ creatorJoinId: 1 }, { unique: true });

// Pre-save middleware to ensure only one main family per creator
familySchema.pre('save', async function(next) {
  if (this.isMainFamily && this.isModified('isMainFamily')) {
    // Find other main families by the same creator
    const otherMainFamilies = await this.constructor.find({
      creatorId: this.creatorId,
      isMainFamily: true,
      _id: { $ne: this._id }
    });
    
    if (otherMainFamilies.length > 0) {
      // Set other families to not main
      await this.constructor.updateMany(
        { _id: { $in: otherMainFamilies.map(f => f._id) } },
        { isMainFamily: false }
      );
    }
  }
  next();
});

// Static method to find by creator join ID
familySchema.statics.findByCreatorJoinId = function(creatorJoinId) {
  return this.findOne({ creatorJoinId });
};

// Static method to find user's main family
familySchema.statics.findMainFamilyByUser = function(userId) {
  return this.findOne({ creatorId: userId, isMainFamily: true });
};

// Method to check if user is creator
familySchema.methods.isCreator = function(userId) {
  return this.creatorId.toString() === userId.toString();
};

module.exports = mongoose.model('Family', familySchema); 