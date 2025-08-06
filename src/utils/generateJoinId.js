const crypto = require('crypto');

const generateJoinId = async () => {
  try {
    // Generate a more unique join ID with timestamp and random characters
    const timestamp = Date.now().toString(36); // Convert timestamp to base36
    const randomBytes = crypto.randomBytes(4).toString('hex'); // 8 random hex characters
    const randomChars = Math.random().toString(36).substring(2, 6); // 4 random alphanumeric chars
    
    // Combine to create a 16-character unique ID
    const joinId = `${timestamp.slice(-4)}${randomBytes}${randomChars}`.toUpperCase();
    
    console.log('🔑 Generated Join ID:', joinId);
    
    return joinId;
  } catch (error) {
    console.error('Error generating join ID:', error);
    // Fallback to simple generation
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp.slice(-4)}${random}`.toUpperCase();
  }
};

module.exports = { generateJoinId }; 