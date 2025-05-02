// const jwt = require('jsonwebtoken');

// const authMiddleware = async (req, res, next) => {
//     try {
//         const authHeader = req.header('Authorization');
        
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Authorization header must start with Bearer'
//             });
//         }

//         const token = authHeader.replace('Bearer ', '');
        
//         try {
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);
//             req.user = decoded;
//             next();
//         } catch (error) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Token is invalid or expired'
//             });
//         }
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: 'Authentication error',
//             error: error.message
//         });
//     }
// };

// module.exports = authMiddleware;

// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Request Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return res.status(401).json({
        success: false,
        error: 'Authorization header must start with Bearer'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token);

    try {
      console.log('JWT Secret:', process.env.JWT_SECRET); // Be careful with this in production
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      // Add more user verification here
      if (!decoded.id) {
        console.log('Token missing user ID');
        return res.status(401).json({
          success: false,
          error: 'Invalid token format'
        });
      }

      // Add user to request
      req.user = decoded;
      console.log('User set in request:', req.user);
      next();
    } catch (tokenError) {
      console.log('Token verification failed:', tokenError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = authMiddleware;
