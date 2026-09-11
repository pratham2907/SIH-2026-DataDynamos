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

    // Check if account has been blocked or suspended
    if (user.isBlocked || user.status === 'Suspended' || user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or blocked. Please contact system administrator.'
      });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const effectiveRole = req.user.role === 'superadmin' ? 'admin' : req.user.role;
    const normalizedAllowed = allowedRoles.map(r => r === 'superadmin' ? 'admin' : r);

    if (!normalizedAllowed.includes(effectiveRole) && !allowedRoles.includes(req.user.role)) {
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
