const Notification = require('../models/Notification');
const User = require('../models/User');
const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const logger = require('../utils/logger');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      isRead, 
      type, 
      isArchived = false 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : null,
      type: type || null,
      isArchived: isArchived === 'true'
    };

    const notifications = await Notification.getUserNotifications(userId, options);
    const unreadCount = await Notification.getUnreadCount(userId);

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      isRead: notification.isRead,
      isArchived: notification.isArchived,
      timeAgo: notification.timeAgo,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      data: {
        familyId: notification.data.familyId?._id,
        familyName: notification.data.familyId?.name,
        memberId: notification.data.memberId?._id,
        memberName: notification.data.memberId ? 
          `${notification.data.memberId.firstName} ${notification.data.memberId.lastName}` : null,
        linkedFamilyId: notification.data.linkedFamilyId?._id,
        linkedFamilyName: notification.data.linkedFamilyId?.name,
        joinId: notification.data.joinId,
        eventDate: notification.data.eventDate,
        actionUrl: notification.data.actionUrl,
        metadata: notification.data.metadata
      }
    }));

    res.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: formattedNotifications.length
        },
        unreadCount,
        filters: {
          isRead: options.isRead,
          type: options.type,
          isArchived: options.isArchived
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get notifications'
      }
    });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/mark-read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    // If specific notification IDs provided, mark only those as read
    // Otherwise, mark all unread notifications as read
    const result = await Notification.markAsRead(userId, notificationIds);

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      message: 'Notifications marked as read',
      data: {
        markedCount: result.modifiedCount,
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notifications as read'
      }
    });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:notificationId/read
// @access  Private
const markSingleAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    await notification.markAsRead();
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Mark single notification as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notification as read'
      }
    });
  }
};

// @desc    Archive notification
// @route   PUT /api/notifications/:notificationId/archive
// @access  Private
const archiveNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    await notification.archive();

    res.json({
      success: true,
      message: 'Notification archived'
    });
  } catch (error) {
    logger.error('Archive notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to archive notification'
      }
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalNotifications,
      unreadCount,
      readCount,
      archivedCount,
      typeStats
    ] = await Promise.all([
      Notification.countDocuments({ userId, isArchived: false }),
      Notification.countDocuments({ userId, isRead: false, isArchived: false }),
      Notification.countDocuments({ userId, isRead: true, isArchived: false }),
      Notification.countDocuments({ userId, isArchived: true }),
      Notification.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId(userId), isArchived: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        unread: unreadCount,
        read: readCount,
        archived: archivedCount,
        byType: typeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get notification statistics'
      }
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification'
      }
    });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isRead, isArchived } = req.query;

    const query = { userId };
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';

    const result = await Notification.deleteMany(query);

    res.json({
      success: true,
      message: 'Notifications cleared',
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    logger.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to clear notifications'
      }
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markSingleAsRead,
  archiveNotification,
  getNotificationStats,
  deleteNotification,
  clearAllNotifications
}; 