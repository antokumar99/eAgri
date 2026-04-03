const express = require('express');
const adminController = require('../controllers/AdminController');
const authMiddleware = require('../middleware/authMiddleware');


const router = express.Router();

// Admin login route
router.post('/login', adminController.loginAdmin);

// Protect routes using middleware
router.use(authMiddleware);

// Admin dashboard route (example)
router.get('/dashboard', adminController.dashboard);

module.exports = router;
