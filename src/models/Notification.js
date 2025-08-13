const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: [
      'FAMILY_LINKED',           // When someone links with your family
      'MEMBER_ADDED',            // When a new member is added to your family
      'MEMBER_UPDATED',          // When a family member is updated
      'JOIN_ID_SHARED',          // When someone shares a join ID with you
      'FAMILY_INVITATION',       // When someone invites you to join their family
      'PROFILE_UPDATE',          // When someone updates their profile
      'BIRTHDAY_REMINDER',       // Birthday reminders for family members
      'DEATH_ANNIVERSARY',       // Death anniversary reminders
      'FAMILY_EVENT',            // General family events
      'SYSTEM_UPDATE',           // System-wide updates
      'SECURITY_ALERT',          // Security-related notifications
      'VERIFICATION_REQUIRED'    // When verification is needed
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  data: {
    // Flexible data object for additional context
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family'
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMember'
    },
    linkedFamilyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family'
    },
    joinId: String,
    eventDate: Date,
    actionUrl: String, // URL to navigate to when notification is clicked
    metadata: mongoose.Schema.Types.Mixed // Additional flexible data
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    // Notifications expire after 30 days by default
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
});

// Static method to create notification
notificationSchema.statics.createNotification = function(userId, type, title, message, data = {}) {
  return this.create({
    userId,
    type,
    title,
    message,
    data
  });
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    isRead = null,
    type = null,
    isArchived = false
  } = options;

  const query = { userId, isArchived };
  
  if (isRead !== null) query.isRead = isRead;
  if (type) query.type = type;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('data.familyId', 'name')
    .populate('data.memberId', 'firstName lastName')
    .populate('data.linkedFamilyId', 'name');
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(userId, notificationIds = null) {
  const query = { userId };
  if (notificationIds) {
    query._id = { $in: notificationIds };
  }

  return this.updateMany(query, {
    isRead: true,
    readAt: new Date()
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false, isArchived: false });
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema); 