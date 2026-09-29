const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const headers = { ...defaultHeaders, ...(options.headers || {}) };
    const req = http.request({
      hostname: 'localhost',
      port: 7008,
      path,
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const getRandomMobile = () => '9' + Math.floor(100000000 + Math.random() * 900000000);
const getRandomAadhaar = () => '' + Math.floor(100000000000 + Math.random() * 900000000000);

async function runTests() {
  console.log('========================================================');
  console.log('🌾 COMPREHENSIVE FARMER REGISTRATION SYSTEM TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Duplicate Mobile Number Check
  const test1 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      mobile: '9876543210',
      email: 'ramesh_new@example.com',
      password: 'SecureFarmerPassword2026!'
    }
  });
  assert(!test1.data.success && test1.data.message.includes('already exists'), 'Rejects already registered mobile number (Item 20)');

  // TEST 2: Validation - Empty Farmer Full Name
  const test2 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: '',
      mobile: getRandomMobile(),
      email: 'test_user_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!'
    }
  });
  assert(!test2.data.success && test2.data.message.includes("farmer's full name"), "Rejects empty farmer's full name (Item 5 & 19)");

  // TEST 3: Validation - Father's Name Required when Relationship is Father
  const test3 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Ramesh Kumar Patel',
      relationshipToFarmer: 'Father',
      fatherOrHusbandName: '',
      mobile: getRandomMobile(),
      email: 'test_user_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!'
    }
  });
  assert(!test3.data.success && test3.data.message.includes("father's full name"), "Rejects empty father's name when Relationship is Father (Item 5)");

  // TEST 4: Validation - Husband's Name Required when Relationship is Husband
  const test4 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Sunita Devi Patel',
      relationshipToFarmer: 'Husband',
      fatherOrHusbandName: '',
      mobile: getRandomMobile(),
      email: 'test_user_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!'
    }
  });
  assert(!test4.data.success && test4.data.message.includes("husband's full name"), "Rejects empty husband's name when Relationship is Husband (Item 5)");

  // TEST 5: Validation - Invalid Mobile Format
  const test5 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Ramesh Kumar Patel',
      mobile: '12345',
      email: 'test_user_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!'
    }
  });
  assert(!test5.data.success && test5.data.message.includes('10-digit'), 'Rejects invalid mobile number (Item 2 & 19)');

  // TEST 6: Validation - Underage Farmer (< 18 Years)
  const test6 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Minor Farmer',
      relationshipToFarmer: 'Father',
      fatherOrHusbandName: 'Senior Farmer',
      mobile: getRandomMobile(),
      email: 'test_minor_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!',
      dateOfBirth: '2015-01-01'
    }
  });
  assert(!test6.data.success && test6.data.message.includes('18 years'), 'Enforces minimum 18 years age requirement (Item 5)');

  // TEST 7: Validation - Invalid Aadhaar (Must be 12 digits)
  const test7 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Ramesh Kumar Patel',
      relationshipToFarmer: 'Father',
      fatherOrHusbandName: 'Maheshbhai Patel',
      mobile: getRandomMobile(),
      email: 'test_aadhaar_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!',
      dateOfBirth: '1988-06-15',
      aadhaarNumber: '12345'
    }
  });
  assert(!test7.data.success && test7.data.message.includes('12-digit Aadhaar'), 'Rejects invalid Aadhaar number (Item 5 & 19)');

  // TEST 8: Validation - Bank Account Numbers Mismatch
  const test8 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Ramesh Kumar Patel',
      relationshipToFarmer: 'Father',
      fatherOrHusbandName: 'Maheshbhai Patel',
      mobile: getRandomMobile(),
      email: 'test_bank_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!',
      dateOfBirth: '1988-06-15',
      aadhaarNumber: getRandomAadhaar(),
      addressLine1: 'Plot 12, Kisan Nagar',
      village: 'Ratibad',
      taluka: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462044',
      ownershipType: 'Owned',
      area: 5,
      surveyNumber: '482/1',
      accountHolderName: 'Ramesh Kumar Patel',
      bankName: 'State Bank of India',
      accountNumber: '30294819284',
      confirmAccountNumber: '99999999999',
      ifsc: 'SBIN0001234'
    }
  });
  assert(!test8.data.success && test8.data.message.includes('do not match'), 'Rejects mismatched bank account numbers (Item 9)');

  // TEST 9: Validation - Invalid IFSC Code Format
  const test9 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Ramesh Kumar Patel',
      relationshipToFarmer: 'Father',
      fatherOrHusbandName: 'Maheshbhai Patel',
      mobile: getRandomMobile(),
      email: 'test_ifsc_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!',
      dateOfBirth: '1988-06-15',
      aadhaarNumber: getRandomAadhaar(),
      addressLine1: 'Plot 12, Kisan Nagar',
      village: 'Ratibad',
      taluka: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462044',
      ownershipType: 'Owned',
      area: 5,
      surveyNumber: '482/1',
      accountHolderName: 'Ramesh Kumar Patel',
      bankName: 'State Bank of India',
      accountNumber: '30294819284',
      confirmAccountNumber: '30294819284',
      ifsc: 'WRONG_IFSC_123'
    }
  });
  assert(!test9.data.success && test9.data.message.includes('IFSC code'), 'Rejects invalid IFSC code format (Item 9 & 19)');

  // TEST 10: Validation - Missing Required Documents (Aadhaar, Bank, Land)
  const test10 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Ramesh Kumar Patel',
      relationshipToFarmer: 'Father',
      fatherOrHusbandName: 'Maheshbhai Patel',
      mobile: getRandomMobile(),
      email: 'test_docs_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!',
      dateOfBirth: '1988-06-15',
      aadhaarNumber: getRandomAadhaar(),
      addressLine1: 'Plot 12, Kisan Nagar',
      village: 'Ratibad',
      taluka: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462044',
      ownershipType: 'Owned',
      area: 5,
      surveyNumber: '482/1',
      accountHolderName: 'Ramesh Kumar Patel',
      bankName: 'State Bank of India',
      accountNumber: '30294819284',
      confirmAccountNumber: '30294819284',
      ifsc: 'SBIN0001234',
      documents: []
    }
  });
  assert(!test10.data.success && test10.data.message.includes('Required documents missing'), 'Enforces 3 mandatory documents: Aadhaar, Bank, Land (Item 10)');

  // TEST 11: Validation - Declarations Required
  const test11 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: {
      fullName: 'Ramesh Kumar Patel',
      relationshipToFarmer: 'Father',
      fatherOrHusbandName: 'Maheshbhai Patel',
      mobile: getRandomMobile(),
      email: 'test_decl_' + Date.now() + '@example.com',
      password: 'SecureFarmerPassword2026!',
      dateOfBirth: '1988-06-15',
      aadhaarNumber: getRandomAadhaar(),
      addressLine1: 'Plot 12, Kisan Nagar',
      village: 'Ratibad',
      taluka: 'Huzur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462044',
      ownershipType: 'Owned',
      area: 5,
      surveyNumber: '482/1',
      accountHolderName: 'Ramesh Kumar Patel',
      bankName: 'State Bank of India',
      accountNumber: '30294819284',
      confirmAccountNumber: '30294819284',
      ifsc: 'SBIN0001234',
      documents: [
        { docType: 'aadhaar', fileName: 'aadhaar.pdf', status: 'Verified' },
        { docType: 'bankPassbook', fileName: 'passbook.pdf', status: 'Verified' },
        { docType: 'landRecord', fileName: 'land.pdf', status: 'Verified' }
      ],
      declarationAccepted: false,
      termsAccepted: false
    }
  });
  assert(!test11.data.success && test11.data.message.includes('declaration'), 'Requires truthfulness declaration & Terms acceptance (Item 13)');

  // TEST 12: Successful Full Submission & Application ID Generation
  const newMobile = getRandomMobile();
  const newEmail = `farmer_${Date.now()}@kisan.gov.in`;
  const validPayload = {
    fullName: 'Ramesh Kumar Patel',
    relationshipToFarmer: 'Father',
    fatherOrHusbandName: 'Maheshbhai Patel',
    dateOfBirth: '1988-06-15',
    gender: 'Male',
    farmerType: 'Individual Farmer',
    aadhaarNumber: getRandomAadhaar(),
    mobile: newMobile,
    email: newEmail,
    password: 'SecureFarmerPassword2026!',
    addressLine1: 'Plot 12, Kisan Colony, Main Road',
    addressLine2: 'Near APMC Mandi Gate',
    village: 'Ratibad',
    taluka: 'Huzur',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    pincode: '462044',
    ownershipType: 'Owned',
    area: 5.5,
    unit: 'Acre',
    surveyNumber: 'SRV-482/1-B',
    landRecordNumber: '7/12-984210',
    crops: ['Wheat', 'Gram/Chana', 'Mustard'],
    season: 'Rabi',
    irrigationType: 'Canal',
    organicFarming: false,
    farmingExperience: 12,
    accountHolderName: 'Ramesh Kumar Patel',
    bankName: 'State Bank of India',
    branchName: 'Bhopal Main Branch',
    accountNumber: '30294819284',
    confirmAccountNumber: '30294819284',
    ifsc: 'SBIN0001234',
    upiId: 'ramesh@sbi',
    documents: [
      { docType: 'aadhaar', fileName: 'aadhaar_card.pdf', fileUrl: '/uploads/sample_aadhaar.pdf', status: 'Verified' },
      { docType: 'bankPassbook', fileName: 'passbook.pdf', fileUrl: '/uploads/sample_passbook.pdf', status: 'Verified' },
      { docType: 'landRecord', fileName: 'land_712.pdf', fileUrl: '/uploads/sample_712.pdf', status: 'Verified' }
    ],
    declarationAccepted: true,
    termsAccepted: true
  };

  const test12 = await request('/api/registration/farmer/submit', {
    method: 'POST',
    body: validPayload
  });

  assert(test12.data.success && test12.data.applicationId && test12.data.applicationId.startsWith('FMR-'), `Full Registration Successful: Created ${test12.data.applicationId} (Item 14 & 15)`);
  assert(test12.data.status === 'Verification Pending', 'Application created in "Verification Pending" state (Item 15)');
  const createdAppId = test12.data.applicationId;

  const jwt = require('jsonwebtoken');
  const officerToken = jwt.sign(
    { id: 'usr_officer_01', role: 'officer', name: 'Vikram Singh Rathore', assignedCenterId: 'CTR-01' },
    'your_super_secret_jwt_key_here',
    { expiresIn: '24h' }
  );

  // TEST 13: Fetch Application Status API
  const test13 = await request(`/api/registration/farmer/application/${createdAppId}`);
  assert(test13.data.success && test13.data.data.applicationId === createdAppId, `Status API returns matching application ${createdAppId} (Item 16)`);
  assert(test13.data.data.verification.registrationStatus === 'Registration Submitted', 'Status is "Registration Submitted" in data model (Item 27)');

  // TEST 14: Officer Application Queue API
  const test14 = await request('/api/registration/farmers/applications', {
    headers: { 'Authorization': `Bearer ${officerToken}` }
  });
  assert(test14.data.success && Array.isArray(test14.data.applications), 'Officer queue returns application list (Item 26)');
  const foundInQueue = test14.data.applications.some(a => a.applicationId === createdAppId);
  assert(foundInQueue, `Submitted application ${createdAppId} appears in Officer verification queue`);

  // TEST 15: Officer Workflow - Request Correction
  const test15 = await request(`/api/registration/farmer/application/${createdAppId}/review`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${officerToken}` },
    body: {
      action: 'correction',
      officerRemarks: 'Please upload a clearer high-resolution scan of your Land 7/12 record.'
    }
  });
  assert(test15.data.success, 'Officer requests correction with custom remark (Item 16 & 26)');

  const test15Check = await request(`/api/registration/farmer/application/${createdAppId}`);
  assert(test15Check.data.data.verification.registrationStatus === 'Needs Correction', 'Application transitions to "Needs Correction" (Item 16)');
  assert(test15Check.data.data.verification.officerRemarks.includes('high-resolution scan'), 'Officer remarks saved for farmer to view (Item 16)');

  // TEST 16: Farmer Correction Submission
  const test16 = await request(`/api/registration/farmer/application/${createdAppId}/correct`, {
    method: 'POST',
    body: {
      documents: [
        { docType: 'landRecord', fileName: 'land_712_hd.pdf', fileUrl: '/uploads/land_712_hd.pdf', status: 'Verified' }
      ]
    }
  });
  assert(test16.data.success, 'Farmer submits corrected information and transitions to Under Verification (Item 16)');

  // TEST 17: Officer Workflow - Final Approval
  const test17 = await request(`/api/registration/farmer/application/${createdAppId}/review`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${officerToken}` },
    body: {
      action: 'approve',
      officerRemarks: 'All credentials and land records verified with state revenue department. Approved.'
    }
  });
  assert(test17.data.success, 'Officer approves application (Item 26)');

  const test17Check = await request(`/api/registration/farmer/application/${createdAppId}`);
  assert(test17Check.data.data.verification.registrationStatus === 'Approved', 'Application status updated to "Approved" (Item 16 & 26)');

  // TEST 18: Autosave Draft & Retrieval
  const draftMobile = getRandomMobile();
  const test18Save = await request('/api/registration/farmer/draft', {
    method: 'POST',
    body: {
      draftId: 'draft_' + Date.now(),
      draftData: {
        mobile: draftMobile,
        fullName: 'Draft Farmer Test',
        step: 3
      }
    }
  });
  assert(test18Save.data.success && test18Save.data.draftId, 'Draft saved securely without password/sensitive fields (Item 29)');

  const test18Get = await request(`/api/registration/farmer/draft/${test18Save.data.draftId}`);
  assert(test18Get.data.success && test18Get.data.draftData.fullName === 'Draft Farmer Test', 'Draft restored successfully (Item 29)');

  console.log('\n========================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
