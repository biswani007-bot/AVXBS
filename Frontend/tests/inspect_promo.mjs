import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function inspectPromo() {
  const tempDir = path.join(os.tmpdir(), `chrome-prm-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
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

  const viewports = [375, 430, 600, 768, 1024, 1280, 1440, 1920];
  const results = {};

  for (const w of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: w <= 768
    });
    await wait(300);

    const data = await evalJs(`(() => {
      const section = document.querySelector('.inquiry-promo-section');
      const container = document.querySelector('.inquiry-promo-container');
      const leftCol = document.querySelector('.inquiry-promo-left');
      const imgWrapper = document.querySelector('.inquiry-promo-image-wrapper');
      const img = document.querySelector('.inquiry-promo-img');

      if (!section || !container || !leftCol || !imgWrapper) return null;

      const secRect = section.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const leftRect = leftCol.getBoundingClientRect();
      const wrapRect = imgWrapper.getBoundingClientRect();
      const imgRect = img ? img.getBoundingClientRect() : null;

      const compWrap = window.getComputedStyle(imgWrapper);
      const compImg = img ? window.getComputedStyle(img) : null;

      return {
        sectionLeft: secRect.left,
        containerLeft: contRect.left,
        leftColLeft: leftRect.left,
        leftColMarginLeft: window.getComputedStyle(leftCol).marginLeft,
        leftColTransform: window.getComputedStyle(leftCol).transform,
        wrapWidth: wrapRect.width,
        wrapHeight: wrapRect.height,
        aspectRatio: wrapRect.width / wrapRect.height,
        aspectRatioCSS: compWrap.aspectRatio,
        maxHeightCSS: compWrap.maxHeight,
        transformOriginCSS: compWrap.transformOrigin,
        imgWidth: imgRect ? imgRect.width : null,
        imgHeight: imgRect ? imgRect.height : null,
        imgObjectFit: compImg ? compImg.objectFit : null
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

inspectPromo().catch(console.error);
