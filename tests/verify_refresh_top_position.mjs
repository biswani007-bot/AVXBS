import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function verifyViewport(browser, name, width, height, isMobile) {
  console.log(`\n======================================================`);
  console.log(` Testing: ${name} (${width}x${height}, isMobile=${isMobile})`);
  console.log(`======================================================`);

  await browser.setViewport(width, height, isMobile);
  await browser.navigate('http://localhost:5173', 1500);

  // 1. Initial State Check
  const initial = await browser.evaluate(`
    (() => {
      const header = document.querySelector('.site-header');
      const r = header ? header.getBoundingClientRect() : null;
      return {
        top: r ? r.top : null,
        height: r ? r.height : null,
        scrollY: window.scrollY
      };
    })()
  `);
  console.log(`  Initial Load: top=${initial.top}px, height=${initial.height}px, scrollY=${initial.scrollY}px`);
  if (initial.top !== 0 || initial.scrollY !== 0) {
    throw new Error(`FAIL: Initial header top is ${initial.top}, scrollY is ${initial.scrollY} (expected 0)`);
  }

  // 2. Perform 5 consecutive reloads
  for (let run = 1; run <= 5; run++) {
    await browser.send('Page.reload');

    // Sample across early, middle, and fully settled times (fonts, logo, API data)
    for (const delay of [50, 150, 300, 600, 1200, 2000]) {
      await new Promise(r => setTimeout(r, delay));
      const sample = await browser.evaluate(`
        (() => {
          const header = document.querySelector('.site-header');
          if (!header) return { rendered: false };
          const r = header.getBoundingClientRect();
          return {
            rendered: true,
            top: r.top,
            height: r.height,
            scrollY: window.scrollY,
            fontsLoaded: document.fonts.status === 'loaded',
            megaMenuOpen: Boolean(document.querySelector('.samsung-nav-mega-surface'))
          };
        })()
      `);

      if (sample.rendered) {
        if (sample.top !== 0 || sample.scrollY !== 0) {
          throw new Error(`FAIL at run ${run}, delay ${delay}ms: header top shifted to ${sample.top}px, scrollY=${sample.scrollY}px!`);
        }
        if (sample.megaMenuOpen) {
          throw new Error(`FAIL at run ${run}, delay ${delay}ms: mega menu opened unexpectedly!`);
        }
      }
    }
    console.log(`  Refresh Run ${run}: PASS - navbar remained strictly at top: 0, height=${initial.height}px, megaMenu=closed.`);
  }
}

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');

  try {
    await verifyViewport(browser, 'Desktop', 1440, 900, false);
    await verifyViewport(browser, 'Laptop', 1024, 768, false);
    await verifyViewport(browser, 'Tablet', 768, 1024, true);
    await verifyViewport(browser, 'Mobile 425', 425, 800, true);
    await verifyViewport(browser, 'Mobile 375', 375, 667, true);

    console.log('\n======================================================');
    console.log(' ALL VIEWPORTS PASSED: NAVBAR MAINTAINS TOP: 0 ON REFRESH');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
