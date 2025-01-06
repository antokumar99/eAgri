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
require('dotenv').config(); // So that we can access process.env.JWT_SECRET

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Typically the token is passed as: Authorization: Bearer <token>
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1]; // 'Bearer <token>' => <token>
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token missing'
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload (user data) to req.user for further use
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
