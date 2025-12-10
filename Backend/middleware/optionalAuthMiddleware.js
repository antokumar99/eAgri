const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Attaches req.user when a valid token is present, but never rejects.
 *
 * Public feeds still need to know who is looking so they can report things like
 * "have I already liked this post". A missing or expired token simply means the
 * viewer is anonymous — routes that actually require a login should keep using
 * authMiddleware.
 */
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      if (decoded?.id) req.user = decoded;
    } catch (error) {
      // Anonymous view; nothing to report.
    }
  }

  next();
};

module.exports = optionalAuthMiddleware;
