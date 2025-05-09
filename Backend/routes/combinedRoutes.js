const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const ResearchController = require('../controllers/ResearchController');
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/AdminController');
const multer = require('multer');
const path = require('path');
const PostController = require('../controllers/PostController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Increased to 10MB
  },
  fileFilter: fileFilter
}).single('image');

// Wrap multer in error handling
const uploadMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Image file size should be less than 10MB'
        });
      }
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      console.error('Unknown error:', err);
      return res.status(500).json({
        success: false,
        error: `Upload error: ${err.message}`
      });
    }
    next();
  });
};

// Make sure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Authentication routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);
// router.get('/verify-email/:token', AuthController.verifyEmail);

// Admin routes
// router.post('/admin/register', adminController.registerAdmin);
// router.use(authMiddleware);
// router.post('/admin/login', adminController.loginAdmin);

// User routes
// router.get('/profile', UserController.getProfile);
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);             

// Research routes
router.get('/research', ResearchController.getAllResearch);
router.post('/research', ResearchController.addResearch);

// Post routes
router.post('/posts', authMiddleware, uploadMiddleware, PostController.createPost);
router.get('/posts', PostController.getAllPosts);

// Add this route to test authentication
router.get('/test-auth', authMiddleware, (req, res) => {
  console.log('Test auth endpoint hit');
  console.log('User from request:', req.user);
  res.json({
    success: true,
    message: 'Authentication successful',
    user: req.user
  });
});

module.exports = router;
