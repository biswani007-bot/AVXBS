import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function run() {
  const b = new CDPBrowser();
  await b.launch('http://localhost:5173');
  await b.setViewport(768, 1024, true);
  await b.navigate('http://localhost:5173', 2000);

  async function tap(selector) {
    const rect = await b.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    })()`);
    await b.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: rect.x, y: rect.y }]
    });
    await new Promise(r => setTimeout(r, 60));
    await b.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await new Promise(r => setTimeout(r, 350));
  }

  // 1. Tap Residential -> should open
  await tap('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  const resOpen = await b.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  const isResText = await b.evaluate(`document.querySelector('.samsung-nav-mega-surface')?.textContent?.includes('Residential Highlights')`);
  console.log('1. Tap Residential -> Open:', resOpen, 'Is Residential content:', isResText);

  // 2. Tap Commercial -> should switch to Commercial
  await tap('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
  const commOpen = await b.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  const isCommText = await b.evaluate(`document.querySelector('.samsung-nav-mega-surface')?.textContent?.includes('Commercial Highlights')`);
  console.log('2. Tap Commercial -> Open:', commOpen, 'Is Commercial content:', isCommText);

  // 3. Tap Commercial again -> should close
  await tap('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
  const closedAfterToggle = await b.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  console.log('3. Tap Commercial again -> Is closed:', !closedAfterToggle);

  // 4. Tap Residential -> open again
  await tap('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  const reOpened = await b.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  console.log('4. Tap Residential -> Reopened:', reOpened);

  // 5. Tap Residential again -> close
  await tap('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  const reClosed = await b.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  console.log('5. Tap Residential again -> Closed:', !reClosed);

  await b.close();
  console.log('Touch tap test sequence completed successfully!');
}

run().catch(console.error);
