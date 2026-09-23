const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\Het\\.gemini\\antigravity-ide\\brain\\fd35cd55-7ebf-4b98-b986-17a0573fbe8d';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

function postJson(urlPath, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 7008,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ text: data }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('Obtaining tokens for Farmer, Officer, Admin...');
  const farmerLogin = await postJson('/api/auth/login', { mobile: '9876543210', role: 'farmer' });
  const farmerVerify = await postJson('/api/auth/verify-otp', { mobile: '9876543210', otp: '123456' });
  const farmerToken = farmerVerify.token;
  const farmerUser = farmerVerify.user;

  const officerLogin = await postJson('/api/auth/login', { mobile: '9876543211', role: 'officer' });
  const officerVerify = await postJson('/api/auth/verify-otp', { mobile: '9876543211', otp: '123456' });
  const officerToken = officerVerify.token;
  const officerUser = officerVerify.user;

  const adminLogin = await postJson('/api/auth/login', { mobile: '9876543212', role: 'admin' });
  const adminVerify = await postJson('/api/auth/verify-otp', { mobile: '9876543212', otp: '123456' });
  const adminToken = adminVerify.token;
  const adminUser = adminVerify.user;

  console.log('Connecting to Chrome CDP...');
  const newTab = await getJson('http://127.0.0.1:9222/json/new?http://localhost:7008');
  const client = new CDPClient(newTab.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // 1. Farmer Portal Screenshot
  console.log('Rendering Farmer Portal...');
  await client.evaluate(`
    localStorage.setItem('kpms_token', '${farmerToken}');
    localStorage.setItem('kpms_user', '${JSON.stringify(farmerUser).replace(/'/g, "\\'")}');
    routeTo('#farmer-dashboard');
  `);
  await new Promise(r => setTimeout(r, 2000));
  await client.evaluate(`
    const el = document.getElementById('harvest-readiness-widget');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.screenshot(path.join(ARTIFACTS_DIR, 'farmer_readiness_aligned.png'));

  // 2. Officer Portal Screenshot
  console.log('Rendering Officer Portal...');
  await client.evaluate(`
    localStorage.setItem('kpms_token', '${officerToken}');
    localStorage.setItem('kpms_user', '${JSON.stringify(officerUser).replace(/'/g, "\\'")}');
    loadOfficerDashboard();
  `);
  await new Promise(r => setTimeout(r, 2000));
  await client.evaluate(`
    const el = document.getElementById('officer-readiness-widget');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.screenshot(path.join(ARTIFACTS_DIR, 'officer_readiness_aligned.png'));

  // 3. Admin Portal Screenshot
  console.log('Rendering Super Admin Portal...');
  await client.evaluate(`
    localStorage.setItem('kpms_token', '${adminToken}');
    localStorage.setItem('kpms_user', '${JSON.stringify(adminUser).replace(/'/g, "\\'")}');
    loadAdminDashboard();
  `);
  await new Promise(r => setTimeout(r, 2000));
  await client.evaluate(`
    const el = document.getElementById('admin-readiness-widget');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.screenshot(path.join(ARTIFACTS_DIR, 'admin_readiness_aligned.png'));

  client.close();
  console.log('All 3 portal screenshots successfully captured!');
}

run().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
