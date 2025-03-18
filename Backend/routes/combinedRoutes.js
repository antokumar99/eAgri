const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const ResearchController = require('../controllers/ResearchController');
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/AdminController');

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

// Research routes
router.get('/research', ResearchController.getAllResearch);
router.post('/research', ResearchController.addResearch);

module.exports = router;
