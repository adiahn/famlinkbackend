require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Find all users
    const users = await User.find({}).select('-password -verificationCode');
    console.log(`📊 Found ${users.length} users in database:`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Email: ${user.email || 'Not set'}`);
        console.log(`   Gender: ${user.gender || 'Not set'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Phone Verified: ${user.isPhoneVerified}`);
        console.log(`   Email Verified: ${user.isEmailVerified}`);
      });
    }
    
    // Check specific user by phone
    const specificUser = await User.findOne({ phone: '+1234567890' }).select('-password -verificationCode');
    if (specificUser) {
      console.log('\n🎯 Found user with phone +1234567890:');
      console.log(`   Name: ${specificUser.firstName} ${specificUser.lastName}`);
      console.log(`   Created: ${specificUser.createdAt}`);
    } else {
      console.log('\n❌ User with phone +1234567890 not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUsers(); 