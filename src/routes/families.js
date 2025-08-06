const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
  validateJoinId,
  getFamilyById,
  getFamilyMembers,
  getMemberJoinId
} = require('../controllers/familyController');
const {
  createFamilySchema,
  addFamilyMemberSchema,
  updateFamilyMemberSchema,
  generateJoinIdSchema,
  linkFamilySchema
} = require('../validators/familyValidators');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes are protected
router.use(protect);

// Family management routes
router.post('/', validateRequest(createFamilySchema), createFamily);
router.get('/my-family', getMyFamily);
router.get('/:familyId', getFamilyById);
router.get('/:familyId/members', getFamilyMembers);

// Family member management routes
router.post('/:familyId/members', upload.single('avatar'), validateRequest(addFamilyMemberSchema), addFamilyMember);
router.put('/:familyId/members/:memberId', upload.single('avatar'), validateRequest(updateFamilyMemberSchema), updateFamilyMember);
router.delete('/:familyId/members/:memberId', deleteFamilyMember);

// Join ID system routes
router.post('/:familyId/join-ids', validateRequest(generateJoinIdSchema), generateMemberJoinId);
// Family linking routes
router.post('/link', validateRequest(linkFamilySchema), linkFamily);
router.get('/validate-join-id/:joinId', validateJoinId);

// Member join ID routes
router.get('/members/:memberId/join-id', getMemberJoinId);

module.exports = router; 