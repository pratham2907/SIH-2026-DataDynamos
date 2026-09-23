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

  console.log('Target pages:', list.length);
  const page = list.find(p => p.type === 'page');
  if (!page) {
    console.log('No page target found');
    chrome.kill();
    return;
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.addEventListener('open', () => {
    console.log('Connected to CDP');
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:7008' } }));
  });

  ws.addEventListener('message', async (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    } else if (msg.method === 'Page.loadEventFired') {
      console.log('Page loaded! Evaluating window.startRegistrationFlow and window.openRegistrationChooser...');
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify({
            startRegistrationFlow: typeof window.startRegistrationFlow,
            openRegistrationChooser: typeof window.openRegistrationChooser,
            initiateRegistrationFromHero: typeof window.initiateRegistrationFromHero
          })`
        }
      }));
    } else if (msg.id === 10) {
      console.log('Evaluation Result:', msg.result?.result?.value);
      ws.close();
      chrome.kill();
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.log('Timeout reached');
    ws.close();
    chrome.kill();
    process.exit(0);
  }, 10000);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
