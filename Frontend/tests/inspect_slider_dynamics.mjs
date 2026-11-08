import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSliderDynamics() {
  const tempDir = path.join(os.tmpdir(), `chrome-dyn-${Date.now()}`);
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
  await wait(3000); // hydration

  console.log('--- Testing R4 Arrow Absences ---');
  const arrowCheck = await evalJs(`(() => {
    const arrows = document.querySelectorAll('.hero-nav-arrow, .arrow-prev, .arrow-next');
    return {
      count: arrows.length,
      arrowElements: Array.from(arrows).map(a => ({
        tag: a.tagName,
        className: a.className,
        display: window.getComputedStyle(a).display
      }))
    };
  })()`);
  console.log('Arrow check:', arrowCheck);

  console.log('--- Testing R4 Relocated Controls Layout & Color Tokens ---');
  const layoutCheck = await evalJs(`(() => {
    const heroBanner = document.querySelector('.full-page-hero-container');
    const indicators = document.querySelector('.hero-progress-indicators');
    const heroRect = heroBanner.getBoundingClientRect();
    const indRect = indicators.getBoundingClientRect();
    const indStyle = window.getComputedStyle(indicators);

    const tracks = Array.from(indicators.querySelectorAll('.hero-progress-track')).map(t => {
      const s = window.getComputedStyle(t);
      return {
        width: s.width,
        height: s.height,
        backgroundColor: s.backgroundColor
      };
    });

    const toggleBtn = indicators.querySelector('.hero-progress-next-btn');
    const btnStyle = toggleBtn ? window.getComputedStyle(toggleBtn) : null;
    const svgIcon = toggleBtn ? toggleBtn.querySelector('svg') : null;
    const svgStyle = svgIcon ? window.getComputedStyle(svgIcon) : null;

    return {
      heroBottom: heroRect.bottom,
      indicatorsTop: indRect.top,
      isBelowBanner: indRect.top >= heroRect.bottom - 1,
      position: indStyle.position,
      bottom: indStyle.bottom,
      backgroundColor: indStyle.backgroundColor,
      tracks,
      buttonColor: btnStyle ? btnStyle.color : null,
      iconColor: svgStyle ? (svgStyle.color || svgStyle.fill) : null
    };
  })()`);
  console.log('Layout & Color Tokens:', layoutCheck);

  console.log('--- Testing R4 Slide Dot Manual Navigation ---');
  const dotNavCheck = await evalJs(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
    const getActive = () => btns.findIndex(b => b.classList.contains('is-active'));

    const initialActive = getActive();

    // Click dot 0
    btns[0].click();
    await wait(600);
    const activeAfterDot0 = getActive();

    // Click dot 1 if available
    if (btns.length > 1) {
      btns[1].click();
      await wait(600);
    }
    const activeAfterDot1 = getActive();

    // Click dot 2 if available
    if (btns.length > 2) {
      btns[2].click();
      await wait(600);
    }
    const activeAfterDot2 = getActive();

    return {
      totalDots: btns.length,
      initialActive,
      activeAfterDot0,
      activeAfterDot1,
      activeAfterDot2
    };
  })()`);
  console.log('Dot navigation:', dotNavCheck);

  console.log('--- Testing R4 Play/Pause Toggle ---');
  const toggleCheck = await evalJs(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const toggleBtn = document.querySelector('.hero-progress-next-btn');
    if (!toggleBtn) return { error: 'Toggle button not found' };

    const initialAria = toggleBtn.getAttribute('aria-label');
    const initialIsPause = !!toggleBtn.querySelector('.pause-icon');

    // Click to pause
    toggleBtn.click();
    await wait(400);

    const pausedAria = toggleBtn.getAttribute('aria-label');
    const pausedIsPlayTriangle = !!toggleBtn.querySelector('.play-triangle-icon:not(.pause-icon)');

    // Click to resume
    toggleBtn.click();
    await wait(400);

    const resumedAria = toggleBtn.getAttribute('aria-label');
    const resumedIsPause = !!toggleBtn.querySelector('.pause-icon');

    return {
      initialAria,
      initialIsPause,
      pausedAria,
      pausedIsPlayTriangle,
      resumedAria,
      resumedIsPause,
      pauseToggleSuccessful: pausedIsPlayTriangle && resumedIsPause
    };
  })()`);
  console.log('Play/Pause Toggle:', toggleCheck);

  console.log('--- Testing R4 Autoplay Progression (Waiting 13s for 12s slide cycle) ---');
  const autoplayCheck = await evalJs(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
    const getActive = () => btns.findIndex(b => b.classList.contains('is-active'));

    // Set to dot 0
    btns[0].click();
    await wait(600);
    const startIdx = getActive();

    // Wait 13000ms (database slideDuration is 12000ms)
    await wait(13000);
    const endIdx = getActive();

    return {
      startIdx,
      endIdx,
      advanced: endIdx !== startIdx
    };
  })()`);
  console.log('Autoplay Progression:', autoplayCheck);

  try { ws.close(); } catch(e){}
  try { chromeProcess.kill(); } catch(e){}
  await wait(500);
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
}

testSliderDynamics().catch(console.error);
