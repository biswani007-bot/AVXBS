import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function testComprehensive() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');

  const viewports = [
    { name: 'Desktop (1440x900)', w: 1440, h: 900, isMobile: false, expectedH: 94 },
    { name: 'Laptop (1024x768)', w: 1024, h: 768, isMobile: false, expectedH: 76 },
    { name: 'Tablet (768x1024)', w: 768, h: 1024, isMobile: true, expectedH: 76 },
    { name: 'Mobile 425 (425x800)', w: 425, h: 800, isMobile: true, expectedH: 56 },
    { name: 'Mobile 375 (375x667)', w: 375, h: 667, isMobile: true, expectedH: 56 },
  ];

  console.log('='.repeat(80));
  console.log(' COMPREHENSIVE NAVBAR VERIFICATION (REFRESH, ASSET LOAD, STICKY SCROLL)');
  console.log('='.repeat(80));

  for (const vp of viewports) {
    console.log(`\nTesting ${vp.name}...`);
    await browser.setViewport(vp.w, vp.h, vp.isMobile);
    await browser.navigate('http://localhost:5173', 1500);

    // 1. Initial State Check
    const initial = await browser.evaluate(`(() => {
      const header = document.querySelector('.site-header');
      const r = header ? header.getBoundingClientRect() : null;
      return {
        top: r ? r.top : null,
        height: r ? r.height : null,
        scrollY: window.scrollY,
        megaMenuOpen: Boolean(document.querySelector('.samsung-nav-mega-surface'))
      };
    })()`);
    console.log(`  Initial Load: top=${initial.top}px, height=${initial.height}px (expected ${vp.expectedH}px), megaMenu=${initial.megaMenuOpen}`);
    if (initial.top !== 0) throw new Error(`FAIL: Initial header top is ${initial.top} (expected 0)`);
    if (initial.height !== vp.expectedH) throw new Error(`FAIL: Header height ${initial.height} != ${vp.expectedH}`);
    if (initial.megaMenuOpen) throw new Error(`FAIL: Mega menu opened on initial load`);

    // 2. Sticky Scroll Verification
    for (const scrollTarget of [200, 600, 1200]) {
      await browser.evaluate(`window.scrollTo(0, ${scrollTarget})`);
      const scrolled = await browser.evaluate(`(() => {
        const header = document.querySelector('.site-header');
        const r = header ? header.getBoundingClientRect() : null;
        return {
          scrollY: window.scrollY,
          top: r ? r.top : null,
          height: r ? r.height : null
        };
      })()`);
      console.log(`  Scrolled to ${scrollTarget}px: actual scrollY=${scrolled.scrollY}px, header top=${scrolled.top}px (sticky!)`);
      if (scrolled.top !== 0) {
        throw new Error(`FAIL: Sticky scroll broken at scrollY=${scrollTarget}, header top is ${scrolled.top}px`);
      }
    }
    // Return to top
    await browser.evaluate(`window.scrollTo(0, 0)`);

    // 3. Repeated Refreshes across early and settled asset loading times
    for (let run = 1; run <= 3; run++) {
      await browser.send('Page.reload');

      for (const delay of [50, 150, 300, 600, 1200, 2000]) {
        await new Promise(r => setTimeout(r, delay));
        const sample = await browser.evaluate(`(() => {
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
        })()`);

        if (sample.rendered) {
          if (sample.top !== 0) {
            throw new Error(`FAIL at run ${run}, delay ${delay}ms: header top shifted to ${sample.top}px!`);
          }
          if (sample.height !== vp.expectedH) {
            throw new Error(`FAIL at run ${run}, delay ${delay}ms: height changed to ${sample.height}px!`);
          }
          if (sample.megaMenuOpen) {
            throw new Error(`FAIL at run ${run}, delay ${delay}ms: mega menu opened unexpectedly!`);
          }
        }
      }
      console.log(`  Refresh Run ${run}: PASS - navbar remained strictly at top: 0, height=${vp.expectedH}px, megaMenu=closed.`);
    }

    // 4. Refresh while scrolled test (to verify sticky behaviour during refresh)
    await browser.evaluate(`window.scrollTo(0, 500)`);
    await browser.send('Page.reload');
    await new Promise(r => setTimeout(r, 1000));
    const scrolledReload = await browser.evaluate(`(() => {
      const header = document.querySelector('.site-header');
      const r = header ? header.getBoundingClientRect() : null;
      return {
        scrollY: window.scrollY,
        top: r ? r.top : null,
        height: r ? r.height : null
      };
    })()`);
    console.log(`  Refresh while scrolled: scrollY=${scrolledReload.scrollY}px, header top=${scrolledReload.top}px -> PASS`);
    if (scrolledReload.top !== 0) {
      throw new Error(`FAIL: Header top shifted to ${scrolledReload.top}px after refresh while scrolled!`);
    }

    // Return to top
    await browser.evaluate(`window.scrollTo(0, 0)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(' ALL COMPREHENSIVE TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(80));
  await browser.close();
}

testComprehensive().catch(err => {
  console.error(err);
  process.exit(1);
});
