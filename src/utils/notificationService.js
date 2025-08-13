const Notification = require('../models/Notification');
const User = require('../models/User');
const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const logger = require('./logger');

class NotificationService {
  // Create family linking notification
  static async createFamilyLinkedNotification(userId, linkedFamilyId, linkedFamilyName, linkedBy) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      await Notification.createNotification(
        userId,
        'FAMILY_LINKED',
        'Family Linked Successfully',
        `Your family has been linked with ${linkedFamilyName}. You can now see their family members in your tree.`,
        {
          linkedFamilyId,
          actionUrl: '/families/my-family',
          metadata: {
            linkedBy,
            linkedFamilyName
          }
        }
      );

      logger.info(`Family linked notification created for user ${userId}`);
    } catch (error) {
      logger.error('Create family linked notification error:', error);
    }
  }

  // Create member added notification
  static async createMemberAddedNotification(familyId, memberId, addedBy) {
    try {
      const family = await Family.findById(familyId);
      if (!family) return;

      const member = await FamilyMember.findById(memberId);
      if (!member) return;

      const user = await User.findById(addedBy);
      if (!user) return;

      await Notification.createNotification(
        family.creatorId,
        'MEMBER_ADDED',
        'New Family Member Added',
        `${user.firstName} ${user.lastName} added ${member.firstName} ${member.lastName} to your family tree.`,
        {
          familyId,
          memberId,
          actionUrl: `/families/${familyId}/members/${memberId}`,
          metadata: {
            addedBy: user.firstName + ' ' + user.lastName,
            memberName: member.firstName + ' ' + member.lastName
          }
        }
      );

      logger.info(`Member added notification created for family ${familyId}`);
    } catch (error) {
      logger.error('Create member added notification error:', error);
    }
  }

  // Create member updated notification
  static async createMemberUpdatedNotification(familyId, memberId, updatedBy) {
    try {
      const family = await Family.findById(familyId);
      if (!family) return;

      const member = await FamilyMember.findById(memberId);
      if (!member) return;

      const user = await User.findById(updatedBy);
      if (!user) return;

      await Notification.createNotification(
        family.creatorId,
        'MEMBER_UPDATED',
        'Family Member Updated',
        `${user.firstName} ${user.lastName} updated ${member.firstName} ${member.lastName}'s information.`,
        {
          familyId,
          memberId,
          actionUrl: `/families/${familyId}/members/${memberId}`,
          metadata: {
            updatedBy: user.firstName + ' ' + user.lastName,
            memberName: member.firstName + ' ' + member.lastName
          }
        }
      );

      logger.info(`Member updated notification created for family ${familyId}`);
    } catch (error) {
      logger.error('Create member updated notification error:', error);
    }
  }

  // Create join ID shared notification
  static async createJoinIdSharedNotification(userId, joinId, sharedBy) {
    try {
      const user = await User.findById(sharedBy);
      if (!user) return;

      await Notification.createNotification(
        userId,
        'JOIN_ID_SHARED',
        'Join ID Shared',
        `${user.firstName} ${user.lastName} shared a join ID with you. Use it to link your family trees.`,
        {
          joinId,
          actionUrl: '/families/link',
          metadata: {
            sharedBy: user.firstName + ' ' + user.lastName
          }
        }
      );

      logger.info(`Join ID shared notification created for user ${userId}`);
    } catch (error) {
      logger.error('Create join ID shared notification error:', error);
    }
  }

  // Create birthday reminder notification
  static async createBirthdayReminderNotification(userId, memberId, memberName, birthYear) {
    try {
      const currentYear = new Date().getFullYear();
      const age = currentYear - parseInt(birthYear);

      await Notification.createNotification(
        userId,
        'BIRTHDAY_REMINDER',
        'Birthday Reminder',
        `${memberName} will be ${age + 1} years old today!`,
        {
          memberId,
          eventDate: new Date(),
          actionUrl: `/families/members/${memberId}`,
          metadata: {
            memberName,
            age: age + 1,
            birthYear
          }
        },
        'high'
      );

      logger.info(`Birthday reminder notification created for ${memberName}`);
    } catch (error) {
      logger.error('Create birthday reminder notification error:', error);
    }
  }

  // Create death anniversary notification
  static async createDeathAnniversaryNotification(userId, memberId, memberName, deathYear) {
    try {
      const currentYear = new Date().getFullYear();
      const yearsSince = currentYear - parseInt(deathYear);

      await Notification.createNotification(
        userId,
        'DEATH_ANNIVERSARY',
        'Death Anniversary',
        `Today marks ${yearsSince} years since ${memberName} passed away.`,
        {
          memberId,
          eventDate: new Date(),
          actionUrl: `/families/members/${memberId}`,
          metadata: {
            memberName,
            yearsSince,
            deathYear
          }
        },
        'medium'
      );

      logger.info(`Death anniversary notification created for ${memberName}`);
    } catch (error) {
      logger.error('Create death anniversary notification error:', error);
    }
  }

  // Create system update notification
  static async createSystemUpdateNotification(userId, title, message, priority = 'medium') {
    try {
      await Notification.createNotification(
        userId,
        'SYSTEM_UPDATE',
        title,
        message,
        {
          actionUrl: '/notifications',
          metadata: {
            systemUpdate: true
          }
        },
        priority
      );

      logger.info(`System update notification created for user ${userId}`);
    } catch (error) {
      logger.error('Create system update notification error:', error);
    }
  }

  // Create security alert notification
  static async createSecurityAlertNotification(userId, title, message) {
    try {
      await Notification.createNotification(
        userId,
        'SECURITY_ALERT',
        title,
        message,
        {
          actionUrl: '/profile/security',
          metadata: {
            securityAlert: true
          }
        },
        'urgent'
      );

      logger.info(`Security alert notification created for user ${userId}`);
    } catch (error) {
      logger.error('Create security alert notification error:', error);
    }
  }

  // Create verification required notification
  static async createVerificationRequiredNotification(userId, verificationType) {
    try {
      const titles = {
        email: 'Email Verification Required',
        phone: 'Phone Verification Required',
        profile: 'Profile Verification Required'
      };

      const messages = {
        email: 'Please verify your email address to access all features.',
        phone: 'Please verify your phone number to access all features.',
        profile: 'Please complete your profile verification to access all features.'
      };

      await Notification.createNotification(
        userId,
        'VERIFICATION_REQUIRED',
        titles[verificationType] || 'Verification Required',
        messages[verificationType] || 'Please complete verification to access all features.',
        {
          actionUrl: '/profile/verification',
          metadata: {
            verificationType
          }
        },
        'high'
      );

      logger.info(`Verification required notification created for user ${userId}`);
    } catch (error) {
      logger.error('Create verification required notification error:', error);
    }
  }

  // Create family event notification
  static async createFamilyEventNotification(userId, eventTitle, eventMessage, eventDate) {
    try {
      await Notification.createNotification(
        userId,
        'FAMILY_EVENT',
        eventTitle,
        eventMessage,
        {
          eventDate,
          actionUrl: '/families/events',
          metadata: {
            eventType: 'family_event'
          }
        },
        'medium'
      );

      logger.info(`Family event notification created for user ${userId}`);
    } catch (error) {
      logger.error('Create family event notification error:', error);
    }
  }

  // Bulk create notifications for multiple users
  static async createBulkNotifications(userIds, type, title, message, data = {}, priority = 'medium') {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        data,
        priority,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await Notification.insertMany(notifications);
      logger.info(`Bulk notifications created for ${userIds.length} users`);
    } catch (error) {
      logger.error('Create bulk notifications error:', error);
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      logger.info(`Cleaned up ${result.deletedCount} expired notifications`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Cleanup expired notifications error:', error);
      return 0;
    }
  }
}

module.exports = NotificationService; 