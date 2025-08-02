const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testRenderServer() {
  console.log('🧪 Testing FamTree API on Render configuration...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    console.log('   Database:', healthResponse.data.database);
    console.log('   Environment:', healthResponse.data.environment);
    console.log('');

    // Test 2: Test Endpoint
    console.log('2️⃣ Testing Test Endpoint...');
    const testResponse = await axios.get(`${BASE_URL}/test`);
    console.log('✅ Test Endpoint:', testResponse.data.message);
    console.log('   Deployment:', testResponse.data.deployment);
    console.log('');

    // Test 3: API Info
    console.log('3️⃣ Testing API Info...');
    const apiResponse = await axios.get(`${BASE_URL}/api`);
    console.log('✅ API Info:', apiResponse.data.message);
    console.log('   Version:', apiResponse.data.version);
    console.log('   Endpoints available:', Object.keys(apiResponse.data.endpoints).length);
    console.log('');

    // Test 4: Register User
    console.log('4️⃣ Testing User Registration...');
    const registerData = {
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      password: 'password123',
      confirmPassword: 'password123',
      email: 'test@example.com',
      gender: 'male'
    };

    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    console.log('✅ User Registration:', registerResponse.data.message);
    console.log('   User ID:', registerResponse.data.data.user.id);
    console.log('');

    // Test 5: Login
    console.log('5️⃣ Testing User Login...');
    const loginData = {
      phone: '+1234567890',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/signin`, loginData);
    console.log('✅ User Login:', loginResponse.data.message);
    console.log('   Access Token:', loginResponse.data.data.accessToken ? '✅ Present' : '❌ Missing');
    console.log('   Refresh Token:', loginResponse.data.data.refreshToken ? '✅ Present' : '❌ Missing');
    console.log('');

    console.log('🎉 All tests passed! Render configuration is working perfectly!');
    console.log('🚀 Ready for deployment to Render!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 503) {
      console.log('💡 Database connection issue. Check MongoDB URI.');
    } else if (error.response?.status === 400) {
      console.log('💡 Validation error. Check request data.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server not running. Start with: npm run render');
    }
  }
}

// Run the test
testRenderServer(); 