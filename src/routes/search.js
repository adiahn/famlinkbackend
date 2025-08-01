const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { searchUsers, searchFamilyMembers } = require('../controllers/searchController');

const router = express.Router();

// Search routes can be accessed with optional authentication
router.use(optionalAuth);

// Search routes
router.get('/users', searchUsers);
router.get('/family-members', protect, searchFamilyMembers);

module.exports = router; 