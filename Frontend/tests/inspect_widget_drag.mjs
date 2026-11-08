import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testWidgetDrag() {
  const tempDir = path.join(os.tmpdir(), `chrome-wdg-${Date.now()}`);
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
  await wait(3000);

  const viewports = [1920, 1440, 1280, 1024, 768, 430, 375];
  const results = {};

  for (const w of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 800,
      deviceScaleFactor: 1,
      mobile: w <= 768
    });
    await wait(300);

    const check = await evalJs(`(() => {
      const widget = document.querySelector('.floating-support-chat');
      if (!widget) return { found: false };

      const avatarBox = widget.querySelector('.avatar-widget-interactive-box');
      if (!avatarBox) return { found: true, avatarFound: false };

      const initialRect = widget.getBoundingClientRect();
      const initialClientWidth = document.documentElement.clientWidth;

      // Dispatch mousedown
      const down = new MouseEvent('mousedown', {
        clientX: initialRect.left + 20,
        clientY: initialRect.top + 20,
        bubbles: true,
        cancelable: true
      });
      avatarBox.dispatchEvent(down);

      // Drag +3000px right
      const move = new MouseEvent('mousemove', {
        clientX: initialRect.left + 3000,
        clientY: initialRect.top + 20,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(move);

      // Dispatch mouseup
      const up = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(up);

      const draggedRect = widget.getBoundingClientRect();
      const finalClientWidth = document.documentElement.clientWidth;
      const avatarBtn = widget.querySelector('.chat-avatar-btn');
      const avatarRect = avatarBtn ? avatarBtn.getBoundingClientRect() : draggedRect;

      const rightEdge = avatarRect.right;
      const marginFromRight = finalClientWidth - rightEdge;
      const withinBounds = rightEdge <= finalClientWidth && marginFromRight >= 0;

      return {
        clientWidth: finalClientWidth,
        initialRight: Math.round(initialRect.right),
        draggedAvatarRight: Math.round(rightEdge),
        marginFromRight: Math.round(marginFromRight),
        withinBounds
      };
    })()`);
    results[w] = check;
  }

  try { ws.close(); } catch(e){}
  try { chromeProcess.kill(); } catch(e){}
  await wait(500);
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

  console.log(JSON.stringify(results, null, 2));
}

testWidgetDrag().catch(console.error);
