const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markSingleAsRead,
  archiveNotification,
  getNotificationStats,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get notifications with filtering and pagination
router.get('/', getNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark notifications as read (bulk or all)
router.put('/mark-read', markAsRead);

// Mark single notification as read
router.put('/:notificationId/read', markSingleAsRead);

// Archive notification
router.put('/:notificationId/archive', archiveNotification);

// Delete single notification
router.delete('/:notificationId', deleteNotification);

// Clear all notifications (with optional filters)
router.delete('/', clearAllNotifications);

module.exports = router; 