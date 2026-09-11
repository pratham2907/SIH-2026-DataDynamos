const http = require('http');
const assert = require('assert');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://localhost:7008' + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 MSG91 REAL OTP GATEWAY TEST SUITE');
  console.log('====================================================');

  // Test 1: Config endpoint
  console.log('\n1. Testing GET /api/auth/msg91/config...');
  const configRes = await makeRequest('GET', '/api/auth/msg91/config');
  assert.strictEqual(configRes.status, 200, 'Config endpoint should return 200');
  assert.strictEqual(configRes.data.success, true, 'Config success should be true');
  assert.strictEqual(configRes.data.widgetId, '3669676d316f323335383235', 'widgetId must match configured widget');
  assert.strictEqual(configRes.data.tokenAuth, '568684TJ6Q4Cu9Q6a9ec1f4P1', 'tokenAuth must match configured token');
  console.log('✅ Config returned valid MSG91 credentials:');
  console.log('   Widget ID:', configRes.data.widgetId);
  console.log('   Token Auth:', configRes.data.tokenAuth.substring(0, 8) + '...');

  // Test 2: Token verification without token (should fail 400)
  console.log('\n2. Testing POST /api/auth/msg91/verify-token (missing token validation)...');
  const emptyRes = await makeRequest('POST', '/api/auth/msg91/verify-token', {});
  assert.strictEqual(emptyRes.status, 400, 'Missing token should return 400');
  assert.strictEqual(emptyRes.data.success, false, 'Success should be false');
  console.log('✅ Correctly rejected empty payload:', emptyRes.data.message);

  // Test 3: Token verification with simulated token
  console.log('\n3. Testing POST /api/auth/msg91/verify-token with phone authentication...');
  const verifyRes = await makeRequest('POST', '/api/auth/msg91/verify-token', {
    token: 'msg91_verified_token_sample_abc123',
    mobile: '9876543210',
    context: 'unit_test'
  });
  assert.strictEqual(verifyRes.status, 200, 'Verification endpoint should return 200');
  assert.strictEqual(verifyRes.data.success, true, 'Verification success should be true');
  assert.strictEqual(verifyRes.data.verified, true, 'Phone should be marked verified');
  assert.strictEqual(verifyRes.data.mobile, '9876543210', 'Phone number returned correctly');
  console.log('✅ Phone authenticated successfully:');
  console.log('   Message:', verifyRes.data.message);

  // Test 4: Verify client script is served with proper content
  console.log('\n4. Testing GET /js/msg91-service.js...');
  const scriptRes = await makeRequest('GET', '/js/msg91-service.js?v=1.1.0');
  assert.strictEqual(scriptRes.status, 200, 'Script should be served with 200');
  assert(scriptRes.raw.includes('KPMS_MSG91'), 'Script must define KPMS_MSG91');
  assert(scriptRes.raw.includes('triggerMsg91OTP'), 'Script must define triggerMsg91OTP');
  assert(scriptRes.raw.includes('openMsg91TesterModal'), 'Script must define openMsg91TesterModal');
  console.log('✅ Client service script contains all required exports and widget hooks.');

  console.log('\n====================================================');
  console.log('🎉 ALL MSG91 INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
