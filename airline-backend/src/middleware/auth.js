const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'airline_jwt_super_secret_key_2026_academic';

/**
 * Middleware: Verify JWT Authentication Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired authentication token. Please log in again.'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Middleware: Require Admin Role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges required for this action.'
    });
  }
  next();
}

/**
 * Middleware: Optional Authentication (attaches user if valid token present)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  JWT_SECRET
};
