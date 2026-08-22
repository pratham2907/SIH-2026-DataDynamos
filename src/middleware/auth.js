const jwt = require('jsonwebtoken');
const { Users } = require('../models/dbStore');

const JWT_SECRET = process.env.JWT_SECRET || 'kpms_super_secret_jwt_key_2026_sih_hackathon';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-access-token'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required. Please login.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User not found.'
      });
    }

    req.user = {
      id: user._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      officerId: user.officerId,
      assignedCenterId: user.assignedCenterId,
      assignedCounter: user.assignedCounter
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token expired or invalid. Please login again.',
      error: err.message
    });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] roles.`
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET
};
