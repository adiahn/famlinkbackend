const mongoose = require('mongoose');

const linkedFamiliesSchema = new mongoose.Schema({
  mainFamilyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: [true, 'Main family ID is required']
  },
  linkedFamilyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: [true, 'Linked family ID is required']
  },
  linkedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'active'
  },
  linkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User who created the link is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index to prevent duplicate links
linkedFamiliesSchema.index(
  { mainFamilyId: 1, linkedFamilyId: 1 }, 
  { unique: true }
);

// Index for querying linked families
linkedFamiliesSchema.index({ mainFamilyId: 1, status: 1 });
linkedFamiliesSchema.index({ linkedFamilyId: 1, status: 1 });

// Static method to find all linked families for a given family
linkedFamiliesSchema.statics.findLinkedFamilies = function(familyId) {
  return this.find({
    $or: [
      { mainFamilyId: familyId },
      { linkedFamilyId: familyId }
    ],
    status: 'active'
  }).populate('mainFamilyId', 'name creatorId')
    .populate('linkedFamilyId', 'name creatorId')
    .populate('linkedBy', 'firstName lastName');
};

// Static method to check if two families are linked
linkedFamiliesSchema.statics.areFamiliesLinked = function(familyId1, familyId2) {
  return this.findOne({
    $or: [
      { mainFamilyId: familyId1, linkedFamilyId: familyId2 },
      { mainFamilyId: familyId2, linkedFamilyId: familyId1 }
    ],
    status: 'active'
  });
};

// Static method to create a link between families
linkedFamiliesSchema.statics.createLink = function(mainFamilyId, linkedFamilyId, linkedBy) {
  return this.create({
    mainFamilyId,
    linkedFamilyId,
    linkedBy
  });
};

// Method to deactivate a link
linkedFamiliesSchema.methods.deactivate = function() {
  this.status = 'inactive';
  return this.save();
};

module.exports = mongoose.model('LinkedFamilies', linkedFamiliesSchema); 