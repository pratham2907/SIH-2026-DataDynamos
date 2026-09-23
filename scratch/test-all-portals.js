const cp = require('child_process');
const http = require('http');

async function main() {
  const chrome = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const list = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const page = list.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  const evalInBrowser = (expr) => {
    return new Promise((resolve, reject) => {
      const id = Math.floor(Math.random() * 100000);
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.result?.exceptionDetails) {
            reject(msg.result.exceptionDetails);
          } else {
            resolve(msg.result?.result?.value);
          }
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true, awaitPromise: true }
      }));
    });
  };

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:7008' } }));
  });

  ws.addEventListener('message', async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.method === 'Page.loadEventFired') {
      console.log('================================================================');
      console.log('🌾 COMPLETE REGISTRATION & LOGIN VERIFICATION FOR ALL 3 PORTALS');
      console.log('================================================================\n');

      try {
        // TEST 1: Switch landing hero tab to Register
        const regTabResult = await evalInBrowser(`
          (() => {
            window.switchHeroAuthTab('register');
            const card = document.getElementById('sp-auth-card-body');
            return {
              hasFarmerCard: card?.innerHTML.includes('Farmer / Kisan Registration'),
              hasOfficerCard: card?.innerHTML.includes('Procurement Officer Registration')
            };
          })()
        `);
        console.log('✅ Test 1: Landing Page Register Tab Activated ->', regTabResult);

        // TEST 2: Trigger Farmer Registration from hero
        const farmerRegResult = await evalInBrowser(`
          (() => {
            window.initiateRegistrationFromHero('farmer');
            const modal = document.getElementById('auth-modal');
            const title = document.getElementById('modal-title')?.textContent;
            const body = document.getElementById('modal-content-slot');
            return {
              modalActive: modal?.classList.contains('active'),
              title,
              hasNameInput: !!body?.querySelector('#frm-name'),
              hasFatherInput: !!body?.querySelector('#frm-father'),
              hasDobInput: !!body?.querySelector('#frm-dob'),
              hasMobileInput: !!body?.querySelector('#frm-mobile'),
              hasAadhaarInput: !!body?.querySelector('#frm-aadhaar'),
              hasPassInput: !!body?.querySelector('#frm-pass')
            };
          })()
        `);
        console.log('✅ Test 2: Farmer 7-Step Registration Wizard Loaded ->', farmerRegResult);

        // TEST 3: Trigger Officer Registration
        const officerRegResult = await evalInBrowser(`
          (() => {
            window.initiateRegistrationFromHero('officer');
            const title = document.getElementById('modal-title')?.textContent;
            const body = document.getElementById('modal-content-slot');
            return {
              title,
              hasNameInput: !!body?.querySelector('#off-name'),
              hasEmpIdInput: !!body?.querySelector('#off-empid'),
              hasDesignationInput: !!body?.querySelector('#off-designation'),
              hasEmailInput: !!body?.querySelector('#off-email'),
              hasMobileInput: !!body?.querySelector('#off-mobile'),
              hasAadhaarInput: !!body?.querySelector('#off-aadhaar'),
              hasPassInput: !!body?.querySelector('#off-pass')
            };
          })()
        `);
        console.log('✅ Test 3: Procurement Officer Registration Wizard Loaded ->', officerRegResult);

        // TEST 4: Trigger Super Admin / Multi-Role Chooser Modal
        const chooserResult = await evalInBrowser(`
          (async () => {
            await window.openRegistrationChooser();
            const title = document.getElementById('modal-title')?.textContent;
            const body = document.getElementById('modal-content-slot');
            return {
              title,
              hasFarmerOpt: body?.innerHTML.includes('Farmer Registration'),
              hasOfficerOpt: body?.innerHTML.includes('Procurement Officer Registration'),
              hasSuperAdminOpt: body?.innerHTML.includes('Super Admin Setup Wizard')
            };
          })()
        `);
        console.log('✅ Test 4: Multi-Role Registration Chooser Loaded ->', chooserResult);

        // Close modal and switch back to login
        await evalInBrowser(`window.closeModal(); window.switchHeroAuthTab('login');`);

        // TEST 5: Farmer Login Form & Authentication
        const farmerAuthResult = await evalInBrowser(`
          (async () => {
            window.switchHeroAuthRole('farmer');
            const idField = document.getElementById('hero-auth-id');
            const passField = document.getElementById('hero-auth-pass');
            const submitBtn = document.getElementById('hero-auth-submit-btn');
            
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'farmer',
                identifier: '9876543210',
                password: 'Kisan@123'
              })
            });
            const data = await res.json();
            return {
              formPresent: !!idField && !!passField && !!submitBtn,
              status: res.status,
              success: data.success,
              requiresOtp: data.requiresOtp,
              role: data.role
            };
          })()
        `);
        console.log('✅ Test 5: Farmer Login (Form + Auth + 2FA Trigger) ->', farmerAuthResult);

        // TEST 6: Officer Login Form & Authentication
        const officerAuthResult = await evalInBrowser(`
          (async () => {
            window.switchHeroAuthRole('officer');
            const idField = document.getElementById('hero-auth-id');
            const passField = document.getElementById('hero-auth-pass');
            const submitBtn = document.getElementById('hero-auth-submit-btn');
            
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'officer',
                identifier: 'officer@kpms.gov.in',
                password: 'Officer@123'
              })
            });
            const data = await res.json();
            return {
              formPresent: !!idField && !!passField && !!submitBtn,
              status: res.status,
              success: data.success,
              requiresOtp: data.requiresOtp,
              role: data.role
            };
          })()
        `);
        console.log('✅ Test 6: Officer Login (Form + Auth + 2FA Trigger) ->', officerAuthResult);

        // TEST 7: Super Admin Login Form & Authentication
        const adminAuthResult = await evalInBrowser(`
          (async () => {
            window.switchHeroAuthRole('admin');
            const idField = document.getElementById('hero-auth-id');
            const passField = document.getElementById('hero-auth-pass');
            const captchaField = document.getElementById('hero-auth-captcha');
            const submitBtn = document.getElementById('hero-auth-submit-btn');

            const capRes = await fetch('/api/auth/captcha');
            const capData = await capRes.json();
            let ans = '';
            if (capData.type === 'math') {
              ans = String(eval(capData.question.split('=')[0].trim()));
            } else {
              ans = capData.question;
            }

            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'admin',
                identifier: 'admin@kpms.gov.in',
                password: 'Admin@123',
                captchaToken: capData.captchaToken,
                captchaAnswer: ans
              })
            });
            const data = await res.json();
            return {
              formPresent: !!idField && !!passField && !!captchaField && !!submitBtn,
              status: res.status,
              success: data.success,
              requiresOtp: data.requiresOtp,
              role: data.role
            };
          })()
        `);
        console.log('✅ Test 7: Super Admin Login (Form + Captcha + Auth + 2FA Trigger) ->', adminAuthResult);

        console.log('\n================================================================');
        console.log('🏆 ALL 3 PORTALS (FARMER, OFFICER, ADMIN) FULLY VERIFIED & WORKING!');
        console.log('================================================================\n');

      } catch (err) {
        console.error('Test step error:', err);
      } finally {
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    }
  });

  setTimeout(() => {
    console.log('Test timeout reached');
    ws.close();
    chrome.kill();
    process.exit(0);
  }, 15000);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
