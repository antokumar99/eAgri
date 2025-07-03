const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const ResearchController = require('../controllers/ResearchController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const PostController = require('../controllers/PostController');

// Authentication routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);

// User routes
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);             

// Research routes
router.get('/research', ResearchController.getAllResearch);
router.post('/research', ResearchController.addResearch);

// Post routes
router.post('/posts', authMiddleware, uploadMiddleware, PostController.createPost);
router.get('/posts', PostController.getAllPosts);
router.post('/posts/:postId/like', authMiddleware, PostController.likePost);
router.get('/posts/user/:userId', authMiddleware, PostController.getUserPosts);
router.delete('/posts/:postId', authMiddleware, PostController.deletePost);
router.put('/posts/:postId', authMiddleware, uploadMiddleware, PostController.updatePost);

// Test authentication route
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
