const bcrypt = require('bcryptjs');
const {
  Users, Farmers, Farms, Crops, Centers, Slots, Bookings, Queues,
  Procurements, Payments, Inventory, Notifications, Announcements,
  SystemSettings, Holidays
} = require('../models/dbStore');
const { generateQRCode } = require('./qrService');

const seedDemoData = async (force = false) => {
  try {
    const existingUsers = await Users.countDocuments();
    if (existingUsers > 0 && !force) {
      console.log('✨ Database already seeded with demo records.');
      return;
    }

    console.log('🌱 Seeding realistic KPMS Demo dataset for Smart India Hackathon...');

    // Clear existing
    await Users.deleteMany({});
    await Farmers.deleteMany({});
    await Farms.deleteMany({});
    await Crops.deleteMany({});
    await Centers.deleteMany({});
    await Slots.deleteMany({});
    await Bookings.deleteMany({});
    await Queues.deleteMany({});
    await Procurements.deleteMany({});
    await Payments.deleteMany({});
    await Inventory.deleteMany({});
    await Notifications.deleteMany({});
    await Announcements.deleteMany({});
    await SystemSettings.deleteMany({});
    await Holidays.deleteMany({});

    const passwordHash = await bcrypt.hash('Kisan@123', 10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const officerPasswordHash = await bcrypt.hash('Officer@123', 10);

    // 1. Super Admin Account
    await Users.create({
      _id: 'usr_admin_01',
      name: 'Dr. Rajesh Verma (IAS)',
      email: 'admin@kpms.gov.in',
      mobile: '9800000001',
      password: adminPasswordHash,
      role: 'admin',
      designation: 'Joint Secretary (Procurement & DBT)',
      isVerified: true
    });

    // 2. Procurement Centers
    const centers = [
      {
        centerId: 'CTR-01',
        name: 'APMC Central Mandi Bhopal',
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        taluka: 'Huzur',
        village: 'Karond Mandi Complex',
        fullAddress: 'Gate No. 3, APMC Yard, Karond, Bhopal, MP - 462038',
        latitude: 23.2599,
        longitude: 77.4126,
        maxDailyCapacity: 300,
        maxHourlyCapacity: 30,
        countersCount: 4,
        slotDurationMinutes: 30,
        openingTime: '08:00 AM',
        closingTime: '06:00 PM',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        isActive: true,
        currentCrowdLevel: 'Medium'
      },
      {
        centerId: 'CTR-02',
        name: 'Karnal Grain Procurement Mandi',
        state: 'Haryana',
        district: 'Karnal',
        taluka: 'Karnal',
        village: 'GT Road Grain Yard',
        fullAddress: 'New Anaj Mandi, GT Road, Karnal, Haryana - 132001',
        latitude: 29.6857,
        longitude: 76.9905,
        maxDailyCapacity: 450,
        maxHourlyCapacity: 45,
        countersCount: 5,
        slotDurationMinutes: 30,
        openingTime: '08:30 AM',
        closingTime: '06:30 PM',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        isActive: true,
        currentCrowdLevel: 'High'
      },
      {
        centerId: 'CTR-03',
        name: 'Nashik Krishi Utpanna Bazar',
        state: 'Maharashtra',
        district: 'Nashik',
        taluka: 'Nashik',
        village: 'Dindori Road Yard',
        fullAddress: 'Market Yard Complex, Panchavati, Nashik - 422003',
        latitude: 19.9975,
        longitude: 73.7898,
        maxDailyCapacity: 280,
        maxHourlyCapacity: 25,
        countersCount: 3,
        slotDurationMinutes: 30,
        openingTime: '08:00 AM',
        closingTime: '05:30 PM',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        isActive: true,
        currentCrowdLevel: 'Low'
      },
      {
        centerId: 'CTR-04',
        name: 'Guntur Agri Procurement Terminal',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        taluka: 'Guntur Rural',
        village: 'Autonagar Terminal',
        fullAddress: 'Spices & Grain Complex, Ring Road, Guntur - 522004',
        latitude: 16.3067,
        longitude: 80.4365,
        maxDailyCapacity: 350,
        maxHourlyCapacity: 35,
        countersCount: 4,
        slotDurationMinutes: 30,
        openingTime: '08:00 AM',
        closingTime: '06:00 PM',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        isActive: true,
        currentCrowdLevel: 'Low'
      }
    ];
    await Centers.insertMany(centers);

    // 3. Officers
    await Users.create({
      _id: 'usr_officer_01',
      name: 'Vikram Singh Rathore',
      email: 'officer@kpms.gov.in',
      mobile: '9800000002',
      password: officerPasswordHash,
      role: 'officer',
      officerId: 'OFF-BPL-101',
      designation: 'Senior Procurement Inspector',
      assignedCenterId: 'CTR-01',
      assignedCounter: 'Counter 1',
      shift: 'Morning (08:00 AM - 02:00 PM)',
      isVerified: true
    });

    await Users.create({
      _id: 'usr_officer_02',
      name: 'Pooja Deshmukh',
      email: 'officer2@kpms.gov.in',
      mobile: '9800000003',
      password: officerPasswordHash,
      role: 'officer',
      officerId: 'OFF-BPL-102',
      designation: 'Weighbridge & Quality Officer',
      assignedCenterId: 'CTR-01',
      assignedCounter: 'Counter 2',
      shift: 'Morning (08:00 AM - 02:00 PM)',
      isVerified: true
    });

    // 4. Farmers & KYC
    const farmerUsers = [
      {
        userId: 'usr_farmer_01',
        farmerId: 'FARM000001',
        name: 'Ramesh Patel',
        fatherName: 'Harilal Patel',
        email: 'ramesh@farmer.in',
        mobile: '9876543210',
        aadhaarNumber: '382947193021',
        dob: '1982-06-15',
        gender: 'Male',
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        taluka: 'Huzur',
        village: 'Ratibad',
        address: 'House 42, Kisan Basti, Ratibad, Bhopal',
        pinCode: '462044',
        bankName: 'State Bank of India',
        branch: 'Bhopal Main Branch',
        ifscCode: 'SBIN0001234',
        accountNumber: '30294819284',
        accountHolderName: 'Ramesh Patel',
        totalLandArea: 8.5,
        landOwnershipType: 'Owned',
        primaryCrop: 'Wheat (Sharbati)',
        estimatedQuantity: 65,
        preferredCenterId: 'CTR-01',
        isVerified: true,
        verificationStatus: 'Approved'
      },
      {
        userId: 'usr_farmer_02',
        farmerId: 'FARM000002',
        name: 'Suresh Kumar Sharma',
        fatherName: 'Radheshyam Sharma',
        email: 'suresh@farmer.in',
        mobile: '9876543211',
        aadhaarNumber: '839201948291',
        dob: '1976-11-20',
        gender: 'Male',
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        taluka: 'Berasia',
        village: 'Gunga',
        address: 'Ward 3, Village Gunga, Berasia, Bhopal',
        pinCode: '463106',
        bankName: 'Bank of Baroda',
        branch: 'Berasia Road',
        ifscCode: 'BARB0BERASI',
        accountNumber: '9482019284729',
        accountHolderName: 'Suresh Kumar Sharma',
        totalLandArea: 12.0,
        landOwnershipType: 'Owned',
        primaryCrop: 'Gram (Chana)',
        estimatedQuantity: 90,
        preferredCenterId: 'CTR-01',
        isVerified: true,
        verificationStatus: 'Approved'
      },
      {
        userId: 'usr_farmer_03',
        farmerId: 'FARM000003',
        name: 'Anita Devi Chouhan',
        fatherName: 'Mahinder Chouhan',
        email: 'anita@farmer.in',
        mobile: '9876543212',
        aadhaarNumber: '928371940293',
        dob: '1988-03-08',
        gender: 'Female',
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        taluka: 'Huzur',
        village: 'Khajuri Kalan',
        address: 'Farm Plot 18, Khajuri Kalan, Bhopal',
        pinCode: '462022',
        bankName: 'Punjab National Bank',
        branch: 'MP Nagar Bhopal',
        ifscCode: 'PUNB0123400',
        accountNumber: '4829103948201',
        accountHolderName: 'Anita Devi Chouhan',
        totalLandArea: 6.0,
        landOwnershipType: 'Owned',
        primaryCrop: 'Mustard (Sarson)',
        estimatedQuantity: 45,
        preferredCenterId: 'CTR-01',
        isVerified: true,
        verificationStatus: 'Approved',
        isPriorityCategory: true,
        priorityReason: 'Women Farmer'
      }
    ];

    for (const f of farmerUsers) {
      await Users.create({
        _id: f.userId,
        name: f.name,
        email: f.email,
        mobile: f.mobile,
        password: passwordHash,
        role: 'farmer',
        isVerified: true
      });

      await Farmers.create({
        _id: f.userId,
        userId: f.userId,
        farmerId: f.farmerId,
        fullName: f.name,
        fatherName: f.fatherName,
        email: f.email,
        mobile: f.mobile,
        aadhaarNumber: f.aadhaarNumber,
        dob: f.dob,
        gender: f.gender,
        state: f.state,
        district: f.district,
        taluka: f.taluka,
        village: f.village,
        address: f.address,
        pinCode: f.pinCode,
        bankName: f.bankName,
        branch: f.branch,
        ifscCode: f.ifscCode,
        accountNumber: f.accountNumber,
        accountHolderName: f.accountHolderName,
        totalLandArea: f.totalLandArea,
        landOwnershipType: f.landOwnershipType,
        primaryCrop: f.primaryCrop,
        estimatedQuantity: f.estimatedQuantity,
        preferredCenterId: f.preferredCenterId,
        isVerified: true,
        verificationStatus: 'Approved',
        isPriorityCategory: !!f.isPriorityCategory,
        priorityReason: f.priorityReason || '',
        documents: [
          { docType: 'Aadhaar Card', fileUrl: '/uploads/sample_aadhaar.pdf', status: 'Approved', uploadDate: '2026-08-10' },
          { docType: 'Land Record 7/12', fileUrl: '/uploads/sample_land_record.pdf', status: 'Approved', uploadDate: '2026-08-10' },
          { docType: 'Bank Passbook', fileUrl: '/uploads/sample_passbook.pdf', status: 'Approved', uploadDate: '2026-08-10' }
        ]
      });

      // Add Farms
      await Farms.create({
        farmerId: f.farmerId,
        farmName: `${f.name}'s North Acre`,
        surveyNumber: 'SRV-894/2',
        area: f.totalLandArea,
        village: f.village,
        crop: f.primaryCrop,
        estimatedQuantity: f.estimatedQuantity,
        procurementCenter: f.preferredCenterId
      });

      // Add Registered Crops
      await Crops.create({
        farmerId: f.farmerId,
        cropName: f.primaryCrop,
        season: 'Rabi 2025-26',
        quantity: f.estimatedQuantity,
        expectedHarvestDate: '2026-08-25',
        supportPrice: 2275,
        status: 'Active'
      });
    }

    const todayDate = new Date().toISOString().split('T')[0];

    // 5. Bookings
    const b1QR = await generateQRCode({
      bookingNumber: 'BKG-2026-001',
      farmerId: 'FARM000001',
      centerId: 'CTR-01',
      date: todayDate,
      timeSlot: '09:00 AM - 09:30 AM',
      crop: 'Wheat (Sharbati)',
      quantity: 50
    });

    const b2QR = await generateQRCode({
      bookingNumber: 'BKG-2026-002',
      farmerId: 'FARM000002',
      centerId: 'CTR-01',
      date: todayDate,
      timeSlot: '09:30 AM - 10:00 AM',
      crop: 'Gram (Chana)',
      quantity: 80
    });

    const b3QR = await generateQRCode({
      bookingNumber: 'BKG-2026-003',
      farmerId: 'FARM000003',
      centerId: 'CTR-01',
      date: todayDate,
      timeSlot: '10:00 AM - 10:30 AM',
      crop: 'Mustard (Sarson)',
      quantity: 40
    });

    const booking1 = await Bookings.create({
      _id: 'bkg_001',
      bookingNumber: 'BKG-2026-001',
      farmerId: 'FARM000001',
      userId: 'usr_farmer_01',
      centerId: 'CTR-01',
      cropName: 'Wheat (Sharbati)',
      quantity: 50,
      date: todayDate,
      timeSlot: '09:00 AM - 09:30 AM',
      vehicleNumber: 'MP-04-HE-4920',
      status: 'Processing',
      qrCodeDataUrl: b1QR,
      timeline: [
        { stage: 'Booked', timestamp: '2026-08-20T10:00:00Z', done: true },
        { stage: 'Confirmed', timestamp: '2026-08-20T10:00:05Z', done: true },
        { stage: 'Checked In', timestamp: `${todayDate}T08:50:00Z`, done: true },
        { stage: 'Quality Inspection', timestamp: `${todayDate}T09:05:00Z`, done: true },
        { stage: 'Weight Verification', timestamp: `${todayDate}T09:15:00Z`, done: true },
        { stage: 'Procurement Complete', timestamp: null, done: false },
        { stage: 'Payment Completed', timestamp: null, done: false }
      ]
    });

    const booking2 = await Bookings.create({
      _id: 'bkg_002',
      bookingNumber: 'BKG-2026-002',
      farmerId: 'FARM000002',
      userId: 'usr_farmer_02',
      centerId: 'CTR-01',
      cropName: 'Gram (Chana)',
      quantity: 80,
      date: todayDate,
      timeSlot: '09:30 AM - 10:00 AM',
      vehicleNumber: 'MP-04-AB-1102',
      status: 'Waiting',
      qrCodeDataUrl: b2QR,
      timeline: [
        { stage: 'Booked', timestamp: '2026-08-20T11:30:00Z', done: true },
        { stage: 'Confirmed', timestamp: '2026-08-20T11:30:05Z', done: true },
        { stage: 'Checked In', timestamp: `${todayDate}T09:10:00Z`, done: true },
        { stage: 'Quality Inspection', timestamp: null, done: false }
      ]
    });

    const booking3 = await Bookings.create({
      _id: 'bkg_003',
      bookingNumber: 'BKG-2026-003',
      farmerId: 'FARM000003',
      userId: 'usr_farmer_03',
      centerId: 'CTR-01',
      cropName: 'Mustard (Sarson)',
      quantity: 40,
      date: todayDate,
      timeSlot: '10:00 AM - 10:30 AM',
      vehicleNumber: 'MP-04-KL-9921',
      status: 'Confirmed',
      qrCodeDataUrl: b3QR,
      timeline: [
        { stage: 'Booked', timestamp: '2026-08-20T12:00:00Z', done: true },
        { stage: 'Confirmed', timestamp: '2026-08-20T12:00:05Z', done: true }
      ]
    });

    // 6. Live Queues
    await Queues.create({
      tokenNumber: 'A001',
      bookingId: 'bkg_001',
      bookingNumber: 'BKG-2026-001',
      farmerId: 'FARM000001',
      farmerName: 'Ramesh Patel',
      centerId: 'CTR-01',
      counterNumber: 'Counter 1',
      officerId: 'OFF-BPL-101',
      status: 'processing',
      checkInTime: `${todayDate}T08:50:00Z`,
      calledTime: `${todayDate}T09:00:00Z`,
      isPriority: false,
      cropName: 'Wheat (Sharbati)',
      quantity: 50
    });

    await Queues.create({
      tokenNumber: 'A002',
      bookingId: 'bkg_002',
      bookingNumber: 'BKG-2026-002',
      farmerId: 'FARM000002',
      farmerName: 'Suresh Kumar Sharma',
      centerId: 'CTR-01',
      counterNumber: 'Counter 1',
      officerId: 'OFF-BPL-101',
      status: 'waiting',
      checkInTime: `${todayDate}T09:10:00Z`,
      isPriority: false,
      cropName: 'Gram (Chana)',
      quantity: 80
    });

    // 7. Completed Past Procurement & Payment for realistic charts
    const proc1 = await Procurements.create({
      procurementId: 'PROC-2026-901',
      bookingId: 'bkg_past_01',
      farmerId: 'FARM000001',
      farmerName: 'Ramesh Patel',
      centerId: 'CTR-01',
      officerId: 'OFF-BPL-101',
      cropName: 'Wheat (Sharbati)',
      grade: 'A',
      moisturePercentage: 11.2,
      foreignMaterial: 0.4,
      brokenGrain: 1.1,
      grossWeight: 52.5,
      tareWeight: 2.5,
      netWeight: 50.0,
      acceptedQuantity: 50.0,
      rejectedQuantity: 0.0,
      msp: 2275,
      bonus: 2500,
      deductions: 0,
      totalAmount: 116250,
      status: 'Accepted',
      receiptNumber: 'RCP-2026-081',
      date: todayDate,
      officerSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text x="10" y="25" font-family="cursive" font-size="18" fill="%230E2A47">V. S. Rathore</text></svg>'
    });

    await Payments.create({
      paymentId: 'PAY-2026-701',
      transactionId: 'TXN-DBT-9840219',
      utrNumber: 'SBIN002938472918',
      receiptNumber: 'RCP-2026-081',
      farmerId: 'FARM000001',
      farmerName: 'Ramesh Patel',
      procurementId: 'PROC-2026-901',
      centerId: 'CTR-01',
      acceptedQuantity: 50,
      msp: 2275,
      bonus: 2500,
      deductions: 0,
      amount: 116250,
      bankName: 'State Bank of India',
      accountNumber: '30294819284',
      ifscCode: 'SBIN0001234',
      status: 'Completed',
      createdDate: todayDate,
      paymentDate: todayDate,
      timeline: [
        { stage: 'Requested', timestamp: `${todayDate}T09:30:00Z`, done: true },
        { stage: 'Verified', timestamp: `${todayDate}T09:45:00Z`, done: true },
        { stage: 'Approved', timestamp: `${todayDate}T10:00:00Z`, done: true },
        { stage: 'Released', timestamp: `${todayDate}T10:15:00Z`, done: true },
        { stage: 'Completed', timestamp: `${todayDate}T10:30:00Z`, done: true }
      ]
    });

    // 8. Warehouse Inventory
    await Inventory.insertMany([
      { centerId: 'CTR-01', cropName: 'Wheat (Sharbati)', totalStockQuintals: 1450, warehouseCapacity: 5000, acceptedToday: 50, rejectedToday: 0 },
      { centerId: 'CTR-01', cropName: 'Gram (Chana)', totalStockQuintals: 820, warehouseCapacity: 3000, acceptedToday: 0, rejectedToday: 0 },
      { centerId: 'CTR-01', cropName: 'Mustard (Sarson)', totalStockQuintals: 610, warehouseCapacity: 2500, acceptedToday: 0, rejectedToday: 0 },
      { centerId: 'CTR-02', cropName: 'Paddy (Common)', totalStockQuintals: 3200, warehouseCapacity: 8000, acceptedToday: 210, rejectedToday: 5 }
    ]);

    // 9. Announcements
    await Announcements.insertMany([
      {
        title: 'Extended Evening Weighbridge Hours Today',
        message: 'APMC Bhopal Mandi Counter 1 & 2 will operate until 07:30 PM today to accommodate heavy Rabi arrivals.',
        target: 'all',
        centerId: 'CTR-01',
        category: 'Operation',
        priority: 'Medium',
        date: todayDate
      },
      {
        title: 'Moisture Adherence Guidelines for Rabi 2025-26',
        message: 'Farmers are advised to sun-dry grain properly. Wheat produce with moisture below 12.0% is eligible for immediate Grade A bonus payment.',
        target: 'farmers',
        centerId: 'all',
        category: 'Quality Advisory',
        priority: 'High',
        date: todayDate
      }
    ]);

    // 10. Notifications
    await Notifications.insertMany([
      {
        userId: 'usr_farmer_01',
        role: 'farmer',
        title: 'Payment Credited via DBT',
        message: '₹1,16,250 has been credited to your SBI A/C ending in 9284. UTR: SBIN002938472918.',
        type: 'payment',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        userId: 'usr_farmer_01',
        role: 'farmer',
        title: 'Queue Token Active: A001',
        message: 'Your token A001 is currently called at Counter 1. Please proceed to the inspection bay.',
        type: 'queue',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);

    console.log('✅ KPMS Realistic Demo Dataset successfully initialized with demo credentials!');
  } catch (err) {
    console.error('Demo seed error:', err);
  }
};

module.exports = {
  seedDemoData
};
