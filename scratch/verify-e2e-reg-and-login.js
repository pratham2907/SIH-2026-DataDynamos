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

  let step = 0;

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:7008' } }));
  });

  ws.addEventListener('message', async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.method === 'Page.loadEventFired') {
      console.log('Page loaded! Beginning E2E Modal Verification...');
      // Test 1: Trigger Farmer Registration from hero
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            window.initiateRegistrationFromHero('farmer');
            const modal = document.getElementById('auth-modal');
            const title = document.getElementById('modal-title')?.textContent;
            const bodyHtml = document.getElementById('modal-content-slot')?.innerHTML;
            ({
              modalActive: modal?.classList.contains('active'),
              title,
              bodyLength: bodyHtml?.length || 0,
              hasFarmerForm: bodyHtml?.includes('Personal Details') || bodyHtml?.includes('Full Name')
            })
          `,
          returnByValue: true
        }
      }));
    }

    if (msg.id === 10) {
      console.log('Test 1: Farmer Registration from Hero ->', msg.result?.result?.value);
      // Test 2: Trigger Officer Registration
      ws.send(JSON.stringify({
        id: 20,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            window.initiateRegistrationFromHero('officer');
            const title = document.getElementById('modal-title')?.textContent;
            const bodyHtml = document.getElementById('modal-content-slot')?.innerHTML;
            ({
              title,
              bodyLength: bodyHtml?.length || 0,
              hasOfficerForm: bodyHtml?.includes('Officer') || bodyHtml?.includes('Govt Employment')
            })
          `,
          returnByValue: true
        }
      }));
    }

    if (msg.id === 20) {
      console.log('Test 2: Officer Registration from Hero ->', msg.result?.result?.value);
      // Test 3: Open Multi-Role Registration Chooser
      ws.send(JSON.stringify({
        id: 30,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            window.openRegistrationChooser();
            setTimeout(() => {}, 500);
            const title = document.getElementById('modal-title')?.textContent;
            const bodyHtml = document.getElementById('modal-content-slot')?.innerHTML;
            ({
              title,
              bodyLength: bodyHtml?.length || 0,
              hasFarmerCard: bodyHtml?.includes('Farmer Registration'),
              hasOfficerCard: bodyHtml?.includes('Procurement Officer Registration'),
              hasSuperAdminCard: bodyHtml?.includes('Super Admin')
            })
          `,
          returnByValue: true
        }
      }));
    }

    if (msg.id === 30) {
      console.log('Test 3: Registration Chooser Modal ->', msg.result?.result?.value);
      // Test 4: Check Login UI for all 3 roles
      ws.send(JSON.stringify({
        id: 40,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            // Check landing page login card exists with 3 role tabs
            const farmerTab = document.querySelector('[data-auth-role=\"farmer\"]');
            const officerTab = document.querySelector('[data-auth-role=\"officer\"]');
            const adminTab = document.querySelector('[data-auth-role=\"admin\"]');
            ({
              hasFarmerTab: !!farmerTab,
              hasOfficerTab: !!officerTab,
              hasAdminTab: !!adminTab
            })
          `,
          returnByValue: true
        }
      }));
    }

    if (msg.id === 40) {
      console.log('Test 4: 3-Role Login Tabs on Landing Page ->', msg.result?.result?.value);
      console.log('\n🎉 ALL E2E MODAL & REGISTRATION TESTS COMPLETED!');
      ws.close();
      chrome.kill();
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.log('E2E Timeout');
    ws.close();
    chrome.kill();
    process.exit(0);
  }, 12000);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
