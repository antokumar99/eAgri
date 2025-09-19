// const Auth = require('../models/User');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');



// exports.register = async (req, res) => {
//     const { username, email, password, phone } = req.body;
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }
//     try {
//         let user = await Auth.findOne({ email });
//         if (user) {
//             return res.status(400).json({ msg: 'User already exists' });
//         }
//         user = new Auth({
//             username,
//             email,
//             password,
//             phone
//         });
//         const salt = await bcrypt.genSalt(10);
//         user.password = await bcrypt.hash(password, salt);
//         await user.save();
//         const payload = {
//             user: {
//                 id: user.id
//             }
//         };
//         const secret = process.env.JWT_SECRET || 'default_secret_key';
//         jwt.sign(payload, secret, {
//             expiresIn: 3600
//         }, (err, token) => {
//             if (err) throw err;
//             res.json({ token });
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: err.message });
//     }
// }

// exports.login = async (req, res) => {
//     const { email, password } = req.body;
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }
//     try {
//         let user = await Auth.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ msg: 'Invalid Credentials' });
//         }
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ msg: 'Invalid Credentials' });
//         }
//         const payload = {
//             user: {
//                 id: user.id
//             }
//         };
//         const secret = process.env.JWT_SECRET || 'default_secret_key';
//         jwt.sign(payload, secret, {
//             expiresIn: 3600
//         }, (err, token) => {
//             if (err) throw err;
//             res.json({ token });
//         });
//         res.status(200).json({ msg: 'User logged in' });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: err.message });
//     }
// }

// controllers/AuthController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // for generating random tokens
const nodemailer = require('nodemailer');

require('dotenv').config();

const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USERNAME, 
    pass: process.env.EMAIL_PASSWORD
  }
});

module.exports = {
  // -------------------------------
  // 1) Register
  // -------------------------------
  register: async (req, res) => {
    try {
      const { name, email, password, phone, address, photo, farm } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email.'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create new user document
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        photo,
        farm,
        verified: false,
        verificationToken
      });

      // Save user
      await newUser.save();

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      const emailContent = `
        <h1>Welcome to eAgri!</h1>
        <p>Thank you for registering. Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="
          background-color: #008E97;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          margin: 16px 0;
        ">Verify your email</a>
        <p>If the button doesn't work, you can also copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USERNAME, 
        to: email,
        subject: 'Please verify your email',
        html: emailContent
      };

      await transporter.sendMail(mailOptions);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully! Please check your email to verify your account.'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong during registration',
        error: error.message
      });
    }
  },

  // -------------------------------
  // 2) Verify Email
  // -------------------------------
  // verifyEmail: async (req, res) => {
  //   try {
  //     const { token } = req.params;

  //     // Find user by verificationToken
  //     const user = await User.findOne({ verificationToken: token });
  //     if (!user) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Invalid or expired verification token'
  //       });
  //     }

  //     // Mark user as verified
  //     user.verified = true;
  //     user.verificationToken = undefined; // clear the token
  //     await user.save();

  //     return res.status(200).json({
  //       success: true,
  //       message: 'Email verified successfully! You may now login.'
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({
  //       success: false,
  //       message: 'Something went wrong during email verification',
  //       error: error.message
  //     });
  //   }
  // },
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({ verificationToken: token });
      
      if (!user) {
        return res.status(400).send(`
          <html>
            <head>
              <title>Verification Failed</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f5f5f5;
                }
                .container {
                  text-align: center;
                  padding: 40px;
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                h1 {
                  color: #dc3545;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  font-size: 18px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>❌ Verification Failed</h1>
                <p>Invalid or expired verification link.</p>
                <p>Please request a new verification email.</p>
              </div>
            </body>
          </html>
        `);
      }
  
      user.verified = true;
      user.verificationToken = undefined;
      await user.save();
  
      // Redirect to success page
      res.redirect('/verification-success');
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).send(`
        <html>
          <head>
            <title>Verification Error</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 40px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h1 {
                color: #dc3545;
                margin-bottom: 20px;
              }
              p {
                color: #666;
                font-size: 18px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ Error</h1>
              <p>Something went wrong while verifying your email.</p>
              <p>Please try again later.</p>
            </div>
          </body>
        </html>
      `);
    }
  },
  // -------------------------------
  // 3) Resend Verification Email
  // -------------------------------
  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No user found with this email'
        });
      }

      if (user.verified) {
        return res.status(400).json({
          success: false,
          message: 'This email is already verified'
        });
      }

      // Generate new verification token
      const newVerificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = newVerificationToken;
      await user.save();

      // Send verification email
      const verificationLink = `${req.protocol}://${req.get(
        'host'
      )}/verify-email/${newVerificationToken}`;

      // or use an external link:
      // const verificationLink = `${process.env.MOBILE_APP_URL}/verify?token=${newVerificationToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USERNAME, 
        to: user.email,
        subject: 'Please verify your email',
        html: `
          <p>Hello ${user.name},</p>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}" target="_blank">Verify Email</a>
        `
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        success: true,
        message: 'Verification email resent successfully!'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while resending verification email',
        error: error.message
      });
    }
  },

  // -------------------------------
  // 4) Login
  // -------------------------------
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email.'
        });
      }

      // Check if user is verified
      if (!user.verified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in.'
        });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password'
        });
      }

      // Generate token
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email 
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: '24h'
        }
      );

      console.log('Generated token:', token);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong during login',
        error: error.message
      });
    }
  }
};
