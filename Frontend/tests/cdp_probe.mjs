import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startChrome() {
  const tempDir = path.join(os.tmpdir(), `chrome-cdp-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  // Wait for CDP to be ready
  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch (e) {
      // wait
    }
    await wait(200);
  }

  if (!version) {
    chromeProcess.kill();
    throw new Error('Chrome did not start CDP in time');
  }

  console.log('Chrome CDP ready:', version.Browser);

  // Find page target
  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const list = await res.json();
      pageTarget = list.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) break;
    } catch (e) {}
    await wait(200);
  }

  if (!pageTarget) {
    chromeProcess.kill();
    throw new Error('No page target found');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`JS error: ${res.exceptionDetails.text} / ${JSON.stringify(res.exceptionDetails.exception)}`);
    }
    return res.result ? res.result.value : undefined;
  };

  return {
    chromeProcess,
    ws,
    send,
    evalJs,
    close: async () => {
      try { ws.close(); } catch (e) {}
      chromeProcess.kill();
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    }
  };
}

async function main() {
  const client = await startChrome();
  try {
    console.log('Enabling Page & Runtime...');
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await wait(2000); // let page load & hydrate

    const pageTitle = await client.evalJs('document.title');
    console.log('Page title:', pageTitle);

    const header = await client.evalJs(`(() => {
      const h = document.querySelector('.site-header');
      if (!h) return null;
      const s = window.getComputedStyle(h);
      const r = h.getBoundingClientRect();
      return {
        height: r.height,
        boxShadow: s.boxShadow,
        backgroundColor: s.backgroundColor,
        padding: s.padding
      };
    })()`);
    console.log('Header audit:', header);

  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Probe failed:', err);
  process.exit(1);
});
