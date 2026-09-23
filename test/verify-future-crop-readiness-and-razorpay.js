const fs = require('fs');
const path = require('path');

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('🌾 VERIFYING FUTURE CROP READINESS & RAZORPAY RELOCATION');
console.log('================================================================\n');

// 1. Verify Razorpay Relocation
console.log('--- 1. RAZORPAY RELOCATION VERIFICATION ---');
const paymentJs = fs.readFileSync(path.join(__dirname, '../public/js/payment-portal.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, '../public/js/admin-portal.js'), 'utf8');

assert(!paymentJs.includes('Test Razorpay Checkout'), 'Razorpay test checkout button REMOVED from farmer payments portal');
assert(adminJs.includes('Test Razorpay Checkout'), 'Razorpay test checkout button ADDED to superadmin portal');
assert(adminJs.includes('testRazorpaySuperadminCheckout'), 'Superadmin has dedicated testRazorpaySuperadminCheckout function');

// 2. Verify Farmer Portal Conditional Readiness Tab & Widget
console.log('\n--- 2. CONDITIONAL READINESS TAB & WIDGET IN FARMER PORTAL ---');
const farmerJs = fs.readFileSync(path.join(__dirname, '../public/js/farmer-portal.js'), 'utf8');

assert(farmerJs.includes('hasPlannedFutureCrop'), 'getFarmerSidebar checks hasPlannedFutureCrop');
assert(farmerJs.includes('sidebar-crop-readiness-tab'), 'Includes sidebar-crop-readiness-tab ID');
assert(farmerJs.includes('id="harvest-readiness-widget"'), 'Includes harvest-readiness-widget');
assert(farmerJs.includes('${hasPlannedFutureCrop ? `'), 'Widget 7 is conditionally rendered when future crop is planned');
assert(farmerJs.includes('${plannedCropName} Readiness Verification'), 'Displays dynamic planned crop name in readiness widget and sidebar');

// 3. Verify 18 Crops Available in Smart Mandi Next Crop Planning
console.log('\n--- 3. SMART MANDI NEXT CROP PLANNING (ALL 18 CROPS) ---');
const smartBookingJs = fs.readFileSync(path.join(__dirname, '../public/js/smart-booking.js'), 'utf8');

const cropsToCheck = [
  'Wheat', 'Paddy / Rice', 'Mustard', 'Gram (Chana)', 'Maize', 'Soyabean',
  'Tomato', 'Potato', 'Onion', 'Green Peas', 'Cauliflower', 'Leafy vegetables',
  'Banana', 'Apple', 'Mango', 'Orange',
  'Groundnut', 'Cotton'
];

let allCropsPresent = true;
for (const crop of cropsToCheck) {
  if (!smartBookingJs.includes(`'${crop}'`)) {
    allCropsPresent = false;
    break;
  }
}
assert(allCropsPresent, 'All 18 crops, fruits, and vegetables are present in Smart Mandi future crop selection');
assert(smartBookingJs.includes('kpms_farmer_has_future_crop'), 'Smart Mandi sets future crop flag in localStorage upon saving');
assert(smartBookingJs.includes('kpms_future_crop_name'), 'Smart Mandi sets planned crop name in localStorage upon saving');

// 4. Verify Farmer Controller Backend Support
console.log('\n--- 4. BACKEND FARMER CONTROLLER FUTURE CROP PLAN ---');
const farmerControllerJs = fs.readFileSync(path.join(__dirname, '../src/controllers/farmerController.js'), 'utf8');

assert(farmerControllerJs.includes('CropForecasts'), 'farmerController imports and queries CropForecasts');
assert(farmerControllerJs.includes('hasFutureCropPlan'), 'farmerController sends hasFutureCropPlan flag');
assert(farmerControllerJs.includes('futureCropPlan'), 'farmerController sends active futureCropPlan data');

console.log('\n================================================================');
console.log(`🎉 SUMMARY: ${passed} / ${total} CHECKS PASSED SUCCESSFULLY!`);
console.log('================================================================');
