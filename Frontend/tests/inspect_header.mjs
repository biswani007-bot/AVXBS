import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function inspectHeader() {
  const tempDir = path.join(os.tmpdir(), `chrome-hdr-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--window-size=1440,900',
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) break;
    } catch (e) {}
    await wait(150);
  }

  const res = await fetch('http://127.0.0.1:9222/json/list');
  const list = await res.json();
  const pageTarget = list.find((t) => t.type === 'page' && t.url.includes('5173'));

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => { ws.onopen = resolve; });

  let idCounter = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = idCounter++;
    pending.set(id, { resolve });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result ? r.result.value : null;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await wait(2500);

  const viewports = [1440, 1280, 1024];
  const results = {};

  for (const w of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await wait(300);

    const data = await evalJs(`(() => {
      const header = document.querySelector('.site-header');
      const hRect = header.getBoundingClientRect();

      const logo = document.querySelector('.header-logo-link');
      const lRect = logo ? logo.getBoundingClientRect() : null;

      const tabs = Array.from(document.querySelectorAll('.samsung-nav-tab-btn')).map(t => {
        const r = t.getBoundingClientRect();
        return { text: t.innerText.trim(), top: r.top, height: r.height, centerY: r.top + r.height / 2 };
      });

      const searchWrapper = document.querySelector('.navbar-search-wrapper');
      const sRect = searchWrapper ? searchWrapper.getBoundingClientRect() : null;

      const menuBtn = document.querySelector('.header-menu-btn');
      const mRect = menuBtn ? menuBtn.getBoundingClientRect() : null;

      const searchInput = document.querySelector('.navbar-search-input');
      const siRect = searchInput ? searchInput.getBoundingClientRect() : null;

      return {
        header: { top: hRect.top, height: hRect.height, bottom: hRect.bottom },
        logo: lRect ? { top: lRect.top, height: lRect.height, centerY: lRect.top + lRect.height / 2 } : null,
        tabs,
        searchWrapper: sRect ? { top: sRect.top, height: sRect.height, centerY: sRect.top + sRect.height / 2 } : null,
        searchInput: siRect ? { top: siRect.top, height: siRect.height, centerY: siRect.top + siRect.height / 2 } : null,
        menuBtn: mRect ? { top: mRect.top, height: mRect.height, centerY: mRect.top + mRect.height / 2 } : null
      };
    })()`);
    results[w] = data;
  }

  try { ws.close(); } catch(e){}
  try { chromeProcess.kill(); } catch(e){}
  await wait(500);
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  console.log(JSON.stringify(results, null, 2));
}

inspectHeader().catch(console.error);
