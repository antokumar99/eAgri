const jwt = require('jsonwebtoken');
require('dotenv').config();

// This middleware used to log the full request headers, the raw bearer token
// and process.env.JWT_SECRET on every authenticated request. Anyone with access
// to the server logs could mint tokens for any account, so all of it is gone.
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header must start with Bearer'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        error: 'Server authentication is misconfigured'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format'
        });
      }

      // Add user to request
      req.user = decoded;
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error:
          tokenError.name === 'TokenExpiredError'
            ? 'Your session has expired. Please log in again.'
            : 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = authMiddleware;
