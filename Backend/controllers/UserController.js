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
  },

  // -------------------------------
  // 2) Update Profile
  // -------------------------------
  updateProfile: async (req, res) => {
    try {
      // req.user was attached by the authMiddleware
      const userId = req.user.id;

      const user = await User.findById(userId );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user fields
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.photo = req.body.photo || user.photo;
      user.farm = req.body.farm || user.farm;
      user.verified = req.body.verified || user.verified;
      user.verificationToken = req.body.verificationToken || user.verificationToken;

      // Save the updated user
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while updating user profile',
        error: error.message
      });
    }
  },

  // -------------------------------
  // 3) Get User by ID (for viewing other users' profiles)
  // -------------------------------
  getUserById: async (req, res) => {
    try {
      const userId = req.params.userId;

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
        message: 'Something went wrong while fetching user data',
        error: error.message
      });
    }
  }
  
};
