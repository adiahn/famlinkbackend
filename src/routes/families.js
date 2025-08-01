const express = require('express');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  createFamily,
  getMyFamily,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  generateMemberJoinId,
  linkFamily,
  validateJoinId
} = require('../controllers/familyController');
const {
  createFamilySchema,
  addFamilyMemberSchema,
  updateFamilyMemberSchema,
  generateJoinIdSchema,
  linkFamilySchema
} = require('../validators/familyValidators');

const router = express.Router();

// All routes are protected
router.use(protect);

// Family management routes
router.post('/', validateRequest(createFamilySchema), createFamily);
router.get('/my-family', getMyFamily);

// Family member management routes
router.post('/:familyId/members', validateRequest(addFamilyMemberSchema), addFamilyMember);
router.put('/:familyId/members/:memberId', validateRequest(updateFamilyMemberSchema), updateFamilyMember);
router.delete('/:familyId/members/:memberId', deleteFamilyMember);

// Join ID system routes
router.post('/:familyId/join-ids', validateRequest(generateJoinIdSchema), generateMemberJoinId);
router.post('/link', validateRequest(linkFamilySchema), linkFamily);
router.get('/validate-join-id/:joinId', validateJoinId);

module.exports = router; 