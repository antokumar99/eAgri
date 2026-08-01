// const Auth = require('../models/User');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');


// controllers/AuthController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // for generating random tokens
const nodemailer = require('nodemailer');

require('dotenv').config();

const User = require('../models/User');
const { BACKEND_URL } = require('../config/appConfig');

// Google displays app passwords as "abcd efgh ijkl mnop". Pasting that verbatim
// is rejected with 535-5.7.8, so the spaces are stripped here rather than
// leaving it as a trap in the .env file.
const emailPassword = (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');
const emailConfigured = Boolean(process.env.EMAIL_USERNAME && emailPassword);

const transporter = emailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USERNAME, pass: emailPassword }
    })
  : null;

// Set AUTO_VERIFY_USERS=true in Backend/.env to skip email verification. Intended
// for local development, where outbound SMTP is often unavailable. Ignored in
// production so a misconfigured deploy cannot silently accept unverified users.
const autoVerify =
  String(process.env.AUTO_VERIFY_USERS).toLowerCase() === 'true' &&
  process.env.NODE_ENV !== 'production';

// The verification route lives on this API, so the link must point at the
// backend. It previously used FRONTEND_URL, which defaults to localhost and is
// unreachable from a phone.
const buildVerificationUrl = (token) => `${BACKEND_URL}/verify-email/${token}`;

/**
 * Sends the verification email. Returns false instead of throwing when mail
 * cannot be delivered — a signup must not be lost because SMTP is down.
 */
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = buildVerificationUrl(token);

  if (!transporter) {
    console.warn(
      `[auth] Email is not configured. Verification link for ${email}:\n  ${verificationUrl}`
    );
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Please verify your email',
      html: `
        <h1>Welcome to eAgri!</h1>
        <p>Hello ${name || 'there'}, thanks for registering. Please confirm your email address:</p>
        <a href="${verificationUrl}" style="
          background-color: #008E97;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          margin: 16px 0;
        ">Verify your email</a>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p>${verificationUrl}</p>
      `
    });
    return true;
  } catch (error) {
    // Surfaced in the server log so a developer can still complete the flow.
    console.error(`[auth] Could not send verification email to ${email}:`, error.message);
    console.warn(`[auth] Verification link for ${email}:\n  ${verificationUrl}`);
    return false;
  }
};

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
        verified: autoVerify,
        verificationToken: autoVerify ? undefined : verificationToken
      });

      // Save user
      await newUser.save();

      if (autoVerify) {
        return res.status(201).json({
          success: true,
          emailSent: false,
          verified: true,
          message: 'Account created. You can log in now.'
        });
      }

      // The send is deliberately NOT awaited inside the try/catch that returns
      // 500. Previously a rejected sendMail threw after the user had already
      // been saved, so the caller saw "registration failed" while the account
      // existed unverified — they could then neither log in ("verify your
      // email") nor register again ("user already exists"). Permanently stuck.
      const emailSent = await sendVerificationEmail(email, name, verificationToken);

      return res.status(201).json({
        success: true,
        emailSent,
        verified: false,
        message: emailSent
          ? 'Account created. Check your email to verify your account.'
          : 'Account created, but the verification email could not be sent. Use "Resend verification email", or ask an administrator to verify the account.'
      });
    } catch (error) {
      console.error('Registration error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong during registration',
        error: error.message
      });
    }
  },


  //     // Mark user as verified
  //     user.verified = true;
  //     user.verificationToken = undefined; // clear the token
  //     await user.save();

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

      const emailSent = await sendVerificationEmail(
        user.email,
        user.name,
        newVerificationToken
      );

      // A dead SMTP connection used to 500 here too, leaving no way forward.
      // The token is rotated regardless, and the link is printed to the server
      // log so the account can still be verified.
      return res.status(200).json({
        success: true,
        emailSent,
        message: emailSent
          ? 'Verification email resent successfully!'
          : 'Could not send the email. The verification link has been written to the server log.'
      });
    } catch (error) {
      console.error('Resend verification error:', error.message);
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
          needsVerification: true,
          message:
            'Please verify your email before logging in. Tap "Resend verification email" if it never arrived.'
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
