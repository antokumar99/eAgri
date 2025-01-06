// controllers/UserController.js

const User = require('../models/User');

module.exports = {
  // -------------------------------
  // 1) Get Profile
  // -------------------------------
  getProfile: async (req, res) => {
    try {
      // req.user was attached by the authMiddleware
      const userId = req.user.id;

      const user = await User.findById(userId).select('-password'); 
      // Omit the password field (for security)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while fetching user profile',
        error: error.message
      });
    }
  }
};
