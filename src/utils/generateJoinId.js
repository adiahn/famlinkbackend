const logger = require('./logger');

/**
 * Generate a unique join ID for family members
 * @returns {Promise<string>} A unique 12-character alphanumeric join ID
 */
const generateJoinId = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  
  // Generate random join ID
  let joinId = '';
  for (let i = 0; i < length; i++) {
    joinId += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Add timestamp to ensure uniqueness (last 4 digits)
  const timestamp = Date.now().toString().slice(-4);
  
  // Create final join ID: 4 random chars + 4 timestamp digits
  const finalJoinId = joinId.slice(0, 4) + timestamp;

  logger.info(`Generated unique join ID: ${finalJoinId}`);
  return finalJoinId;
};

module.exports = {
  generateJoinId
}; 