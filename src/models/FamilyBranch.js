const mongoose = require('mongoose');

const familyBranchSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: [true, 'Family ID is required']
  },
  motherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: [true, 'Mother ID is required']
  },
  branchName: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    maxlength: [255, 'Branch name cannot exceed 255 characters']
  },
  branchOrder: {
    type: Number,
    required: [true, 'Branch order is required'],
    min: [1, 'Branch order must be at least 1']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for children count in this branch
familyBranchSchema.virtual('childrenCount', {
  ref: 'FamilyMember',
  localField: '_id',
  foreignField: 'branchId',
  count: true
});

// Virtual for branch members
familyBranchSchema.virtual('members', {
  ref: 'FamilyMember',
  localField: '_id',
  foreignField: 'branchId'
});

// Indexes for performance
familyBranchSchema.index({ familyId: 1, branchOrder: 1 });
familyBranchSchema.index({ familyId: 1, motherId: 1 }, { unique: true });
familyBranchSchema.index({ motherId: 1 });

// Pre-save middleware to ensure unique branch order within family
familyBranchSchema.pre('save', async function(next) {
  if (this.isModified('branchOrder') || this.isNew) {
    const existingBranch = await this.constructor.findOne({
      familyId: this.familyId,
      branchOrder: this.branchOrder,
      _id: { $ne: this._id }
    });
    
    if (existingBranch) {
      return next(new Error(`Branch order ${this.branchOrder} already exists in this family`));
    }
  }
  next();
});

// Static method to find branches by family ID
familyBranchSchema.statics.findByFamilyId = function(familyId) {
  return this.find({ familyId }).sort({ branchOrder: 1 });
};

// Static method to find branch by mother ID
familyBranchSchema.statics.findByMotherId = function(motherId) {
  return this.findOne({ motherId });
};

// Static method to get next available branch order
familyBranchSchema.statics.getNextBranchOrder = async function(familyId) {
  const lastBranch = await this.findOne({ familyId }).sort({ branchOrder: -1 });
  return lastBranch ? lastBranch.branchOrder + 1 : 1;
};

// Method to check if branch has children
familyBranchSchema.methods.hasChildren = async function() {
  const FamilyMember = mongoose.model('FamilyMember');
  const childrenCount = await FamilyMember.countDocuments({ branchId: this._id });
  return childrenCount > 0;
};

module.exports = mongoose.model('FamilyBranch', familyBranchSchema);
