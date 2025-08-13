const mongoose = require('mongoose');

const familyCreationFlowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: [true, 'Family ID is required']
  },
  creationType: {
    type: String,
    required: [true, 'Creation type is required'],
    enum: {
      values: ['own_family', 'parents_family'],
      message: 'Creation type must be either "own_family" or "parents_family"'
    }
  },
  setupCompleted: {
    type: Boolean,
    default: false
  },
  currentStep: {
    type: String,
    enum: {
      values: ['initialized', 'parent_setup', 'children_setup', 'completed'],
      message: 'Current step must be one of: initialized, parent_setup, children_setup, completed'
    },
    default: 'initialized'
  },
  setupData: {
    parentsSetup: {
      type: Boolean,
      default: false
    },
    childrenSetup: {
      type: Boolean,
      default: false
    },
    branchesCreated: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    totalSteps: {
      type: Number,
      default: 3
    },
    completedSteps: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
familyCreationFlowSchema.virtual('progressPercentage').get(function() {
  if (this.metadata.totalSteps === 0) return 0;
  return Math.round((this.metadata.completedSteps / this.metadata.totalSteps) * 100);
});

// Virtual for next step
familyCreationFlowSchema.virtual('nextStep').get(function() {
  const steps = ['initialized', 'parent_setup', 'children_setup', 'completed'];
  const currentIndex = steps.indexOf(this.currentStep);
  return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
});

// Indexes for performance
familyCreationFlowSchema.index({ userId: 1 });
familyCreationFlowSchema.index({ familyId: 1 });
familyCreationFlowSchema.index({ userId: 1, creationType: 1 });

// Pre-save middleware to update completed steps count
familyCreationFlowSchema.pre('save', function(next) {
  let completedSteps = 0;
  
  if (this.setupData.parentsSetup) completedSteps++;
  if (this.setupData.childrenSetup) completedSteps++;
  if (this.setupData.branchesCreated) completedSteps++;
  
  this.metadata.completedSteps = completedSteps;
  this.metadata.lastActivity = new Date();
  
  // Update current step based on completion
  if (completedSteps === 0) {
    this.currentStep = 'initialized';
  } else if (completedSteps === 1) {
    this.currentStep = 'parent_setup';
  } else if (completedSteps === 2) {
    this.currentStep = 'children_setup';
  } else {
    this.currentStep = 'completed';
    this.setupCompleted = true;
  }
  
  next();
});

// Static method to find by user ID
familyCreationFlowSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Static method to find by family ID
familyCreationFlowSchema.statics.findByFamilyId = function(familyId) {
  return this.findOne({ familyId });
};

// Static method to find active flows by user ID
familyCreationFlowSchema.statics.findActiveByUserId = function(userId) {
  return this.find({ userId, setupCompleted: false });
};

// Method to mark parents setup as complete
familyCreationFlowSchema.methods.markParentsSetupComplete = function() {
  this.setupData.parentsSetup = true;
  return this.save();
};

// Method to mark children setup as complete
familyCreationFlowSchema.methods.markChildrenSetupComplete = function() {
  this.setupData.childrenSetup = true;
  return this.save();
};

// Method to mark branches as created
familyCreationFlowSchema.methods.markBranchesCreated = function() {
  this.setupData.branchesCreated = true;
  return this.save();
};

// Method to reset to a specific step
familyCreationFlowSchema.methods.resetToStep = function(step) {
  this.currentStep = step;
  this.setupData.parentsSetup = false;
  this.setupData.childrenSetup = false;
  this.setupData.branchesCreated = false;
  return this.save();
};

module.exports = mongoose.model('FamilyCreationFlow', familyCreationFlowSchema);
