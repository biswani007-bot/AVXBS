import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testNonRegression() {
  const tempDir = path.join(os.tmpdir(), `chrome-nr-${Date.now()}`);
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
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push({
        type: data.params.type,
        args: data.params.args.map(a => a.value || a.description)
      });
    }
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

  console.log('--- 1. Testing Mega Menu Hover ---');
  const megaMenuTest = await evalJs(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const resTab = document.querySelectorAll('.samsung-nav-tab-btn')[0];
    if (!resTab) return { error: 'Nav tab not found' };

    // trigger mouseenter
    const event = new MouseEvent('mouseenter', { bubbles: true });
    resTab.dispatchEvent(event);
    await wait(300);

    const megaPanel = document.querySelector('.samsung-mega-menu-panel') || document.querySelector('.mega-menu-panel');
    const isVisible = megaPanel ? window.getComputedStyle(megaPanel).display !== 'none' : false;

    // trigger mouseleave to close
    const leaveEvent = new MouseEvent('mouseleave', { bubbles: true });
    document.querySelector('.site-header').dispatchEvent(leaveEvent);
    await wait(300);

    return {
      tabFound: true,
      megaPanelFound: !!megaPanel,
      isVisible
    };
  })()`);
  console.log('Mega menu test:', megaMenuTest);

  console.log('--- 2. Testing Search Bar Input & Dropdown ---');
  const searchTest = await evalJs(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const searchInput = document.querySelector('.navbar-search-input');
    if (!searchInput) return { error: 'Search input not found' };

    searchInput.focus();
    searchInput.value = 'Water';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(800); // debounce

    const dropdown = document.querySelector('.navbar-search-dropdown-menu');
    const isDropdownVisible = dropdown ? window.getComputedStyle(dropdown).display !== 'none' : false;

    // Clear search
    const clearBtn = document.querySelector('.navbar-search-clear-btn');
    if (clearBtn) clearBtn.click();
    await wait(300);

    return {
      searchInputFound: true,
      dropdownOpened: isDropdownVisible
    };
  })()`);
  console.log('Search test:', searchTest);

  console.log('--- 3. Testing Mobile Hamburger Navigation Drawer ---');
  // Set viewport to mobile 375px
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await wait(400);

  const drawerTest = await evalJs(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const menuBtn = document.querySelector('.header-menu-btn');
    if (!menuBtn) return { error: 'Menu button not found' };

    // Click menu button to open drawer
    menuBtn.click();
    await wait(500);

    const drawer = document.querySelector('.navigation-drawer-panel') || document.querySelector('.mobile-nav-drawer') || document.querySelector('.header-menu-btn.is-open');
    const isOpen = menuBtn.classList.contains('is-open');

    // Click menu button again to close
    menuBtn.click();
    await wait(500);
    const isClosed = !menuBtn.classList.contains('is-open');

    return {
      menuBtnFound: true,
      openedSuccessfully: isOpen,
      closedSuccessfully: isClosed
    };
  })()`);
  console.log('Hamburger drawer test:', drawerTest);

  console.log('--- 4. Checking Console Errors & Exceptions ---');
  const errors = consoleMessages.filter(m => m.type === 'error');
  console.log(`Total console messages: ${consoleMessages.length}, Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', JSON.stringify(errors, null, 2));
  }

  try { ws.close(); } catch(e){}
  try { chromeProcess.kill(); } catch(e){}
  await wait(500);
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
}

testNonRegression().catch(console.error);
