const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Users, Farmers, generateId, AuditLogs } = require('../models/dbStore');
const { JWT_SECRET } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');
const { sendOtpEmail } = require('../services/emailService');

// OTP Storage container for active verifications
const pendingOTPs = new Map();

/**
 * Step 1-5 Comprehensive Farmer Registration
 */
const registerFarmer = async (req, res) => {
  try {
    const {
      // Step 1: Personal
      fullName, fatherName, dob, gender, mobile, email, password,
      // Step 2: Location / Aadhaar
      aadhaarNumber, state, district, taluka, village, address, pinCode,
      // Step 3: Bank
      bankName, branch, ifscCode, accountNumber, accountHolderName,
      // Step 4: Land & Crop
      totalLandArea, landOwnershipType, primaryCrop, estimatedQuantity, preferredCenterId,
      // Priority options
      isPriorityCategory, priorityReason
    } = req.body;

    if (!fullName || !mobile || !password || !aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory fields (Name, Mobile, Password, Aadhaar).'
      });
    }

    // Check duplicate mobile or email or aadhaar
    const existingUser = await Users.findOne({
      $or: [{ mobile }, { email: email || 'NONE_PLACEHOLDER' }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this mobile number or email already exists.'
      });
    }

    const existingFarmer = await Farmers.findOne({ aadhaarNumber });
    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: 'A farmer is already registered with this Aadhaar number.'
      });
    }

    // Auto-generate Farmer ID (e.g. FARM000012)
    const farmerCount = await Farmers.countDocuments();
    const farmerId = `FARM${String(farmerCount + 1).padStart(6, '0')}`;
    const userId = generateId('usr_f_');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Process uploaded documents if any
    const documents = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        documents.push({
          docType: file.fieldname || 'Identity Document',
          fileUrl: `/uploads/${file.filename}`,
          fileName: file.originalname,
          status: 'Pending',
          uploadDate: new Date().toISOString().split('T')[0]
        });
      });
    }

    // Create User record
    await Users.create({
      _id: userId,
      name: fullName,
      email: email || `${mobile}@kpms.gov.in`,
      mobile,
      password: passwordHash,
      role: 'farmer',
      isVerified: false // Requires OTP verification
    });

    // Create Farmer profile
    await Farmers.create({
      _id: userId,
      userId,
      farmerId,
      fullName,
      fatherName: fatherName || '',
      dob: dob || '',
      gender: gender || 'Male',
      mobile,
      email: email || '',
      aadhaarNumber,
      state: state || 'Madhya Pradesh',
      district: district || 'Bhopal',
      taluka: taluka || '',
      village: village || '',
      address: address || '',
      pinCode: pinCode || '',
      bankName: bankName || 'State Bank of India',
      branch: branch || 'Main Branch',
      ifscCode: ifscCode || 'SBIN0001234',
      accountNumber: accountNumber || '00000000000',
      accountHolderName: accountHolderName || fullName,
      totalLandArea: parseFloat(totalLandArea) || 5.0,
      landOwnershipType: landOwnershipType || 'Owned',
      primaryCrop: primaryCrop || 'Wheat',
      estimatedQuantity: parseFloat(estimatedQuantity) || 50,
      preferredCenterId: preferredCenterId || 'CTR-01',
      documents,
      isVerified: false,
      verificationStatus: 'Pending',
      isPriorityCategory: isPriorityCategory === 'true' || isPriorityCategory === true,
      priorityReason: priorityReason || ''
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingOTPs.set(mobile, { otp, userId, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`🔑 [OTP DISPATCH] Generated OTP for ${mobile} (${fullName}): ${otp}`);

    if (email) {
      sendOtpEmail({ to: email, fullName, otp }).catch(e =>
        console.error('Brevo OTP email dispatch error:', e.message)
      );
    }

    await sendNotification({
      userId,
      role: 'farmer',
      title: 'Registration Initiated',
      message: `Your KPMS Farmer Registration was received. Your verification OTP is: ${otp}`,
      type: 'system',
      metadata: { mobile, email, fullName }
    });

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully. Please check your email and mobile for the verification OTP.',
      data: {
        userId,
        farmerId,
        mobile
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
  }
};

/**
 * OTP Verification
 */
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required.' });
    }

    const stored = pendingOTPs.get(mobile);
    if (!stored) {
      // Fallback check if user exists and is already verified or test OTP '123456'
      if (otp === '123456') {
        const user = await Users.findOne({ mobile });
        if (user) {
          await Users.findByIdAndUpdate(user._id, { isVerified: true });
          await Farmers.findByIdAndUpdate(user._id, { isVerified: true, verificationStatus: 'Approved' });
          const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
          return res.json({
            success: true,
            message: 'OTP verified successfully (Demo Mode). Account activated.',
            token,
            user: { id: user._id, name: user.name, role: user.role, mobile: user.mobile }
          });
        }
      }
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP.' });
    }

    if (stored.otp !== otp.trim() && otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP entered. Please try again.' });
    }

    // Mark user and farmer verified
    await Users.findByIdAndUpdate(stored.userId, { isVerified: true });
    await Farmers.findByIdAndUpdate(stored.userId, { isVerified: true, verificationStatus: 'Approved' });
    pendingOTPs.delete(mobile);

    const user = await Users.findById(stored.userId);
    const farmer = await Farmers.findById(stored.userId);

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    await sendNotification({
      userId: user._id,
      role: 'farmer',
      title: 'Account Activated',
      message: `Welcome to KPMS, ${user.name}! Your Farmer ID ${farmer ? farmer.farmerId : ''} is now active.`,
      type: 'system'
    });

    return res.json({
      success: true,
      message: 'Account verified and activated successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        farmerId: farmer ? farmer.farmerId : null
      }
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    return res.status(500).json({ success: false, message: 'OTP verification failed', error: err.message });
  }
};

/**
 * Universal Login (Farmer, Officer, Super Admin)
 */
const login = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide mobile/email/username and password.' });
    }

    const cleanId = String(identifier).trim();
    const cleanIdLower = cleanId.toLowerCase();

    // 1. Direct multi-field lookup
    let user = await Users.findOne({
      $or: [
        { email: cleanIdLower },
        { mobile: cleanId },
        { officerId: cleanId }
      ]
    });

    // 2. Role keyword shortcuts
    if (!user) {
      if (cleanIdLower === 'admin' || cleanIdLower === 'superadmin' || cleanIdLower === 'super admin') {
        user = await Users.findOne({ role: 'admin' });
      } else if (cleanIdLower === 'officer' || cleanIdLower === 'officer1' || cleanIdLower === 'inspector') {
        user = await Users.findOne({ role: 'officer' });
      } else if (cleanIdLower === 'officer2') {
        user = await Users.findOne({ email: 'officer2@kpms.gov.in' });
      } else if (cleanIdLower === 'farmer' || cleanIdLower === 'kisan') {
        user = await Users.findOne({ role: 'farmer' });
      }
    }

    // 3. Farmer ID lookup
    if (!user && cleanId.toUpperCase().startsWith('FARM')) {
      const farmerDoc = await Farmers.findOne({ farmerId: cleanId.toUpperCase() });
      if (farmerDoc) {
        user = await Users.findById(farmerDoc.userId || farmerDoc._id);
      }
    }

    // 4. Case-insensitive name lookup
    if (!user) {
      user = await Users.findOne({ name: { $regex: cleanId, $options: 'i' } });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User account not found.' });
    }

    // 5. Password verification (bcrypt + universal demo fallbacks)
    let isMatch = false;
    try {
      if (user.password) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    } catch (e) {
      isMatch = false;
    }

    const passLower = String(password).trim().toLowerCase();
    const validDemoPasses = [
      'admin@123', 'admin123', 'admin', 'superadmin',
      'officer@123', 'officer123', 'officer',
      'kisan@123', 'farmer@123', 'farmer123', 'kisan123', 'farmer', 'kisan',
      'password', '123456', 'demo123'
    ];

    if (!isMatch && !validDemoPasses.includes(passLower)) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET || 'kpms_sih_secure_jwt_token_2026',
      { expiresIn: '24h' }
    );

    let profileData = null;
    if (user.role === 'farmer') {
      profileData = await Farmers.findById(user._id);
    }

    // Log login action
    try {
      await AuditLogs.create({
        userId: user._id,
        userName: user.name,
        role: user.role,
        action: 'LOGIN',
        details: `User logged in from ${req.ip || '127.0.0.1'}`,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        designation: user.designation || (user.role === 'admin' ? 'Super Admin' : (user.role === 'officer' ? 'Procurement Officer' : 'Farmer')),
        officerId: user.officerId || (user.role === 'officer' ? 'OFF-BPL-101' : null),
        assignedCenterId: user.assignedCenterId || 'CTR-01',
        assignedCounter: user.assignedCounter || 'Counter 1',
        farmerId: profileData ? profileData.farmerId : (user.role === 'farmer' ? 'FARM000001' : null),
        verificationStatus: profileData ? profileData.verificationStatus : 'Approved'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
  }
};

/**
 * Get Current Logged In User Profile
 */
const getMe = async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let extra = {};
    if (user.role === 'farmer') {
      extra.farmerProfile = await Farmers.findById(user._id);
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        designation: user.designation,
        officerId: user.officerId,
        assignedCenterId: user.assignedCenterId,
        assignedCounter: user.assignedCounter,
        ...extra
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Forgot / Reset Password Handler
 */
const resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword, otp } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ success: false, message: 'Identifier and new password required' });
    }

    const user = await Users.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with these details.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await Users.findByIdAndUpdate(user._id, { password: newHash });

    return res.json({
      success: true,
      message: 'Password reset successfully! You may now login with your new credentials.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  registerFarmer,
  verifyOTP,
  login,
  getMe,
  resetPassword
};
