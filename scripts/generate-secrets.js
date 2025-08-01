#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 FamTree Secret Generator\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT Secret:');
console.log(jwtSecret);
console.log();

// Generate Refresh Token Secret
const refreshSecret = crypto.randomBytes(64).toString('hex');
console.log('Refresh Token Secret:');
console.log(refreshSecret);
console.log();

// Generate API Key (32 bytes)
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('API Key:');
console.log(apiKey);
console.log();

// Generate Session Secret (32 bytes)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('Session Secret:');
console.log(sessionSecret);
console.log();

console.log('📋 Copy these secrets to your environment variables:');
console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + refreshSecret);
console.log('API_KEY=' + apiKey);
console.log('SESSION_SECRET=' + sessionSecret);
console.log();

console.log('⚠️  Important:');
console.log('- Keep these secrets secure and never commit them to version control');
console.log('- Use different secrets for development, staging, and production');
console.log('- Store them in environment variables or secure secret management systems'); 