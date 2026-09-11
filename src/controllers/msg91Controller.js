const msg91Service = require('../services/msg91Service');
const { Users, TemporaryRegistrations, AuditLogs, generateId } = require('../models/dbStore');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * 1. Get MSG91 Widget Configuration for Frontend
 */
const getWidgetConfig = async (req, res) => {
  try {
    const config = msg91Service.getMsg91Config();
    return res.json({
      success: true,
      widgetId: config.widgetId,
      tokenAuth: config.tokenAuth,
      isConfigured: config.isConfigured
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2. Verify MSG91 Widget Verification Response Token
 */
const verifyToken = async (req, res) => {
  try {
    const { token, mobile, context, tempId, tempSessionId } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token from MSG91 is required.' });
    }

    const verificationResult = await msg91Service.verifyAccessToken(token);

    // Determine the phone number authenticated
    const targetMobile = mobile || verificationResult.mobile;
    const cleanMobile = targetMobile ? String(targetMobile).replace(/\D/g, '').slice(-10) : null;

    // Record verified status
    if (cleanMobile) {
      msg91Service.recordVerifiedPhone(cleanMobile, {
        token: typeof token === 'string' ? token.substring(0, 30) + '...' : 'object_token',
        context: context || 'general_auth',
        ip: req.ip
      });
    }

    // A. If linked to an in-flight Farmer/Officer registration
    if (tempId) {
      const tempReg = await TemporaryRegistrations.findById(tempId);
      if (tempReg) {
        tempReg.data.isPhoneVerified = true;
        tempReg.data.phoneVerifiedVia = 'MSG91_OTP';
        await TemporaryRegistrations.findByIdAndUpdate(tempId, {
          data: tempReg.data,
          verifiedVia: 'MSG91_OTP'
        });
      }
    }

    // B. If linked to an in-flight 2FA Login Session
    if (tempSessionId) {
      const authCtrl = require('./authController');
      if (authCtrl.pendingLoginSessions && authCtrl.pendingLoginSessions.has(tempSessionId)) {
        const session = authCtrl.pendingLoginSessions.get(tempSessionId);
        authCtrl.pendingLoginSessions.delete(tempSessionId);
        const user = await Users.findById(session.userId);
        if (user) {
          const authToken = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: session.rememberMe ? '7d' : '24h' }
          );

          await AuditLogs.create({
            action: 'LOGIN_SUCCESS',
            userId: user._id,
            userName: user.name,
            role: user.role,
            details: `User completed 2FA login verification via MSG91 Real SMS OTP.`,
            ip: req.ip || req.connection.remoteAddress
          });

          return res.json({
            success: true,
            verified: true,
            isLoginComplete: true,
            token: authToken,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              mobile: user.mobile,
              role: user.role
            },
            message: `Welcome back, ${user.name}! 2FA verified successfully via MSG91 Real OTP.`
          });
        }
      }
    }

    // B. Audit Log
    try {
      await AuditLogs.create({
        action: 'MSG91_PHONE_AUTHENTICATED',
        details: `Mobile ${cleanMobile || 'unknown'} authenticated via MSG91 Real OTP (Context: ${context || 'N/A'}).`,
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (e) {
      console.warn('Audit log write note:', e.message);
    }

    return res.json({
      success: true,
      verified: true,
      mobile: cleanMobile,
      message: `Phone number ${cleanMobile ? ('+91 ' + cleanMobile) : ''} has been authenticated successfully via MSG91 Real SMS OTP!`,
      details: verificationResult
    });
  } catch (err) {
    console.error('MSG91 verifyToken error:', err);
    return res.status(500).json({ success: false, message: 'Error validating MSG91 token: ' + err.message });
  }
};

/**
 * 3. Send Real SMS OTP via MSG91 Live Carrier Route
 */
const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number.' });
    }

    const result = await msg91Service.sendRealOtpViaMsg91(cleanMobile);
    return res.json(result);
  } catch (err) {
    console.error('MSG91 sendOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 4. Verify Entered OTP
 */
const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, tempId, tempSessionId, context } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required.' });
    }

    const result = msg91Service.verifyDirectOtp(mobile, otp);
    if (!result.success) {
      return res.status(400).json(result);
    }

    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);

    // If linked to registration
    if (tempId) {
      const tempReg = await TemporaryRegistrations.findById(tempId);
      if (tempReg) {
        tempReg.data.isPhoneVerified = true;
        tempReg.data.phoneVerifiedVia = 'MSG91_OTP';
        await TemporaryRegistrations.findByIdAndUpdate(tempId, {
          data: tempReg.data,
          verifiedVia: 'MSG91_OTP'
        });
      }
    }

    // If linked to 2FA login session
    if (tempSessionId) {
      const authCtrl = require('./authController');
      if (authCtrl.pendingLoginSessions && authCtrl.pendingLoginSessions.has(tempSessionId)) {
        const session = authCtrl.pendingLoginSessions.get(tempSessionId);
        authCtrl.pendingLoginSessions.delete(tempSessionId);
        const user = await Users.findById(session.userId);
        if (user) {
          const authToken = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: session.rememberMe ? '7d' : '24h' }
          );

          await AuditLogs.create({
            action: 'LOGIN_SUCCESS',
            userId: user._id,
            userName: user.name,
            role: user.role,
            details: `User completed 2FA login verification via MSG91 Real SMS OTP.`,
            ip: req.ip || req.connection.remoteAddress
          });

          return res.json({
            success: true,
            verified: true,
            isLoginComplete: true,
            token: authToken,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              mobile: user.mobile,
              role: user.role
            },
            message: `Welcome back, ${user.name}! 2FA verified successfully via MSG91 Real OTP.`
          });
        }
      }
    }

    // Audit Log
    try {
      await AuditLogs.create({
        action: 'MSG91_PHONE_AUTHENTICATED',
        details: `Mobile +91 ${cleanMobile} authenticated via MSG91 Live SMS OTP (Context: ${context || 'direct_test'}).`,
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (e) {}

    return res.json({
      success: true,
      verified: true,
      mobile: cleanMobile,
      message: `Phone number +91 ${cleanMobile} authenticated successfully via MSG91 Real SMS OTP!`
    });
  } catch (err) {
    console.error('MSG91 verifyOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getWidgetConfig,
  verifyToken,
  sendOtp,
  verifyOtp
};
