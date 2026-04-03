const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = {
  // Admin Registration
  registerAdmin: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin already exists with this email.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        username,
        email,
        password: hashedPassword,
      });

      await newAdmin.save();

      return res.status(201).json({
        success: true,
        message: 'Admin registered successfully!',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Error occurred during admin registration.',
      });
    }
  },

  // Admin Login
  loginAdmin: async (req, res) => {
    try {
      const { email, password } = req.body;

      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found with this email.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password.',
        });
      }

      const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Error occurred during admin login.',
      });
    }
  },

  // Admin Dashboard
  dashboard: async (req, res) => {
    try {
      // Since this route is protected by authMiddleware, we can access the admin's info from req.user
      const admin = await Admin.findById(req.user.id).select('-password');
      
      return res.status(200).json({
        success: true,
        data: {
          admin,
          message: 'Welcome to admin dashboard'
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Error occurred while accessing dashboard.'
      });
    }
  }
};
