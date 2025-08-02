const FamilyMember = require('../models/FamilyMember');
const logger = require('./logger');

/**
 * Generate a unique join ID for family members
 * @returns {Promise<string>} A unique 8-character alphanumeric join ID
 */
const generateJoinId = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let joinId;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    // Generate random join ID
    joinId = '';
    for (let i = 0; i < length; i++) {
      joinId += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if join ID already exists
    let existingMember;
    try {
      existingMember = await FamilyMember.findByJoinId(joinId);
    } catch (error) {
      logger.error('Error checking existing join ID:', error);
      throw new Error('Failed to check existing join ID');
    }
    
    attempts++;

    if (attempts >= maxAttempts) {
      logger.error('Failed to generate unique join ID after maximum attempts');
      throw new Error('Unable to generate unique join ID');
    }
  } while (existingMember);

  logger.info(`Generated unique join ID: ${joinId}`);
  return joinId;
};

module.exports = {
  generateJoinId
}; 