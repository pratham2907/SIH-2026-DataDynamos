const fs = require('fs');
const http = require('http');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('🧑‍🌾 VERIFYING REAL ROLE PHOTOS FOR REGISTRATION & LOGIN');
console.log('===============================================================');

// 1. Check role photo assets on disk
const roleFiles = ['farmer.jpg', 'officer.jpg', 'admin.jpg'];
console.log('\n[Test 1] Inspecting public/images/roles/ directory...');
roleFiles.forEach(file => {
  const filePath = path.join('public', 'images', 'roles', file);
  assert(fs.existsSync(filePath), `Role image ${file} must exist in public/images/roles/`);
  const stat = fs.statSync(filePath);
  assert(stat.size > 100000, `Role image ${file} must be a substantial real photo (> 100KB), got ${stat.size} bytes`);
  console.log(`  ✅ PASS: ${file} exists (${(stat.size / 1024).toFixed(0)} KB)`);
});

// 2. Check HTTP serving from server
const PORT = process.env.PORT || 7008;
console.log(`\n[Test 2] Verifying HTTP serving of role images at http://localhost:${PORT}/images/roles/...`);
let tested = 0;
roleFiles.forEach(file => {
  const req = http.get(`http://localhost:${PORT}/images/roles/${file}`, res => {
    assert.strictEqual(res.statusCode, 200, `Image /images/roles/${file} must return 200 OK`);
    assert(res.headers['content-type'].includes('image'), `Content-Type must be image, got ${res.headers['content-type']}`);
    console.log(`  ✅ HTTP 200 OK: /images/roles/${file}`);
    tested++;
    if (tested === roleFiles.length) {
      runCodeInspections();
    }
  });
  req.on('error', err => {
    console.error(`  ❌ Error fetching ${file}:`, err.message);
    process.exit(1);
  });
});

function runCodeInspections() {
  // 3. Check landing-page.js registration cards and login process
  console.log('\n[Test 3] Verifying landing-page.js registration & login cards...');
  const landingJs = fs.readFileSync('public/js/landing-page.js', 'utf8');

  // Registration cards check
  assert(landingJs.includes('src="/images/roles/farmer.jpg" alt="Farmer"'), 'Farmer registration card must use real photo');
  assert(landingJs.includes('src="/images/roles/officer.jpg" alt="Procurement Officer"'), 'Officer registration card must use real photo');
  assert(landingJs.includes('src="/images/roles/admin.jpg" alt="Super Admin"'), 'Admin notice must use real photo');
  console.log('  ✅ PASS: Registration cards display real photos for Farmer, Officer and Admin');

  // Login pills check
  assert(landingJs.includes('src="/images/roles/farmer.jpg" alt="Farmer" style="width:18px'), 'Farmer login pill must use real photo');
  assert(landingJs.includes('src="/images/roles/officer.jpg" alt="Officer" style="width:18px'), 'Officer login pill must use real photo');
  assert(landingJs.includes('src="/images/roles/admin.jpg" alt="Super Admin" style="width:18px'), 'Admin login pill must use real photo');
  assert(!landingJs.includes('🌾 Farmer'), 'Farmer role pill emoji must be replaced');
  assert(!landingJs.includes('👨‍💼 Officer'), 'Officer role pill emoji must be replaced');
  console.log('  ✅ PASS: Landing page login pills display real photos for Farmer, Officer and Admin');

  // 4. Check auth.js role cards and login modal
  console.log('\n[Test 4] Verifying auth.js role selection cards and login modal...');
  const authJs = fs.readFileSync('public/js/auth.js', 'utf8');

  assert(authJs.includes('src="/images/roles/farmer.jpg" alt="Farmer" style="width:100%'), 'Auth role modal farmer card must use real photo');
  assert(authJs.includes('src="/images/roles/officer.jpg" alt="Procurement Officer" style="width:100%'), 'Auth role modal officer card must use real photo');
  assert(authJs.includes('src="/images/roles/admin.jpg" alt="Super Admin" style="width:100%'), 'Auth role modal admin card must use real photo');
  assert(authJs.includes('src="/images/roles/farmer.jpg" alt="Farmer" style="width:16px'), 'Auth login modal tab must use real farmer photo');
  assert(authJs.includes('src="/images/roles/officer.jpg" alt="Officer" style="width:16px'), 'Auth login modal tab must use real officer photo');
  assert(authJs.includes('src="/images/roles/admin.jpg" alt="Super Admin" style="width:16px'), 'Auth login modal tab must use real admin photo');
  console.log('  ✅ PASS: auth.js role cards and login modal use real photos instead of emojis');

  console.log('\n===============================================================');
  console.log('🏁 ALL ROLE PHOTO & LOGIN PROCESS VERIFICATIONS PASSED (100%)');
  console.log('===============================================================');
}
