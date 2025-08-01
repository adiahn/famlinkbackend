const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.verificationRequired).toBe(true);

      // Check if user was created in database
      const user = await User.findById(response.body.data.userId);
      expect(user).toBeDefined();
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.phone).toBe(userData.phone);
      expect(user.isVerified).toBe(false);
    });

    it('should return error for duplicate phone number', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        password: 'password123',
        confirmPassword: 'password123'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create second user with same phone
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('User with this phone number already exists');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        firstName: 'J', // Too short
        lastName: 'Doe',
        phone: 'invalid-phone',
        dateOfBirth: '1990-01-01',
        password: '123', // Too short
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/signin', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        password: 'password123',
        confirmPassword: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should sign in user successfully', async () => {
      const signinData = {
        phone: '+1234567890',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(signinData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sign in successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.phone).toBe(signinData.phone);
    });

    it('should return error for invalid credentials', async () => {
      const invalidData = {
        phone: '+1234567890',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const nonExistentData = {
        phone: '+9999999999',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(nonExistentData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });
}); 