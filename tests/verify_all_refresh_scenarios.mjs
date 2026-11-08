import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { sleep } from './helpers/test-env.mjs';

const viewports = [
  { name: 'Desktop (1440x900)', w: 1440, h: 900, isMobile: false },
  { name: 'Laptop (1024x768)', w: 1024, h: 768, isMobile: false },
  { name: 'Tablet (768x1024)', w: 768, h: 1024, isMobile: true },
  { name: 'Mobile (375x667)', w: 375, h: 667, isMobile: true },
];

async function doReload(browser) {
  await browser.send('Page.reload');
  await sleep(1500);
}

async function verifyAllScenarios() {
  console.log('='.repeat(80));
  console.log(' VERIFYING ALL 5 REFRESH & SCROLL SCENARIOS');
  console.log('='.repeat(80));

  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');

  try {
    for (const vp of viewports) {
      console.log(`\n======================================================`);
      console.log(` Viewport: ${vp.name}`);
      console.log(`======================================================`);

      await browser.setViewport(vp.w, vp.h, vp.isMobile);
      await browser.navigate('http://localhost:5173', 1500);

      // Check initial state
      const initialScroll = await browser.evaluate('window.scrollY');
      const initialHeader = await browser.evaluate(`(() => {
        const h = document.querySelector('.site-header');
        return h ? h.getBoundingClientRect().top : null;
      })()`);
      console.log(`Initial Load: scrollY=${initialScroll}, headerTop=${initialHeader}`);
      if (initialScroll !== 0 || initialHeader !== 0) {
        throw new Error(`FAIL: Initial load did not start at top! scrollY=${initialScroll}, headerTop=${initialHeader}`);
      }

      // Scenario 1: Scroll to Hero Banner (150px) -> Refresh -> Must start at top
      console.log(`\n--- Scenario 1: Scroll to Hero Banner -> Refresh ---`);
      await browser.evaluate('window.scrollTo(0, 150)');
      await sleep(300);
      const s1Before = await browser.evaluate('window.scrollY');
      console.log(`  Scrolled before refresh: scrollY = ${s1Before}`);
      await doReload(browser);
      const s1After = await browser.evaluate(`(() => ({
        scrollY: window.scrollY,
        headerTop: document.querySelector('.site-header')?.getBoundingClientRect().top,
        heroVisible: Boolean(document.querySelector('.hero-fullpage-master-section'))
      }))()`);
      console.log(`  After refresh: scrollY = ${s1After.scrollY}, headerTop = ${s1After.headerTop}, heroVisible = ${s1After.heroVisible}`);
      if (s1After.scrollY !== 0 || s1After.headerTop !== 0) {
        throw new Error(`FAIL Scenario 1: Expected scrollY===0, headerTop===0, got scrollY=${s1After.scrollY}, headerTop=${s1After.headerTop}`);
      }

      // Scenario 2: Scroll to Product Slider -> Refresh -> Must start at top
      console.log(`\n--- Scenario 2: Scroll to Product Slider -> Refresh ---`);
      const sliderY = await browser.evaluate(`(() => {
        const el = document.getElementById('water-softener-inquiry-section') || document.querySelector('.interactive-section-wrapper');
        return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 1200;
      })()`);
      await browser.evaluate(`window.scrollTo(0, ${sliderY})`);
      await sleep(300);
      const s2Before = await browser.evaluate('window.scrollY');
      console.log(`  Scrolled to Product Slider: scrollY = ${s2Before}`);
      await doReload(browser);
      const s2After = await browser.evaluate(`(() => ({
        scrollY: window.scrollY,
        headerTop: document.querySelector('.site-header')?.getBoundingClientRect().top,
        heroVisible: Boolean(document.querySelector('.hero-fullpage-master-section'))
      }))()`);
      console.log(`  After refresh: scrollY = ${s2After.scrollY}, headerTop = ${s2After.headerTop}`);
      if (s2After.scrollY !== 0 || s2After.headerTop !== 0) {
        throw new Error(`FAIL Scenario 2: Expected scrollY===0, headerTop===0, got scrollY=${s2After.scrollY}, headerTop=${s2After.headerTop}`);
      }

      // Scenario 3: Scroll to Testimonials -> Refresh -> Must start at top
      console.log(`\n--- Scenario 3: Scroll to Testimonials -> Refresh ---`);
      const testY = await browser.evaluate(`(() => {
        const el = document.querySelector('.testimonials-master-section') || document.getElementById('testimonials-section');
        return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 2200;
      })()`);
      await browser.evaluate(`window.scrollTo(0, ${testY})`);
      await sleep(300);
      const s3Before = await browser.evaluate('window.scrollY');
      console.log(`  Scrolled to Testimonials: scrollY = ${s3Before}`);
      await doReload(browser);
      const s3After = await browser.evaluate(`(() => ({
        scrollY: window.scrollY,
        headerTop: document.querySelector('.site-header')?.getBoundingClientRect().top,
        heroVisible: Boolean(document.querySelector('.hero-fullpage-master-section'))
      }))()`);
      console.log(`  After refresh: scrollY = ${s3After.scrollY}, headerTop = ${s3After.headerTop}`);
      if (s3After.scrollY !== 0 || s3After.headerTop !== 0) {
        throw new Error(`FAIL Scenario 3: Expected scrollY===0, headerTop===0, got scrollY=${s3After.scrollY}, headerTop=${s3After.headerTop}`);
      }

      // Scenario 4: Scroll to Footer -> Refresh -> Must start at top
      console.log(`\n--- Scenario 4: Scroll to Footer -> Refresh ---`);
      const footerY = await browser.evaluate(`(() => {
        const el = document.querySelector('.site-footer');
        return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 3200;
      })()`);
      await browser.evaluate(`window.scrollTo(0, ${footerY})`);
      await sleep(300);
      const s4Before = await browser.evaluate('window.scrollY');
      console.log(`  Scrolled to Footer: scrollY = ${s4Before}`);
      await doReload(browser);
      const s4After = await browser.evaluate(`(() => ({
        scrollY: window.scrollY,
        headerTop: document.querySelector('.site-header')?.getBoundingClientRect().top,
        heroVisible: Boolean(document.querySelector('.hero-fullpage-master-section'))
      }))()`);
      console.log(`  After refresh: scrollY = ${s4After.scrollY}, headerTop = ${s4After.headerTop}`);
      if (s4After.scrollY !== 0 || s4After.headerTop !== 0) {
        throw new Error(`FAIL Scenario 4: Expected scrollY===0, headerTop===0, got scrollY=${s4After.scrollY}, headerTop=${s4After.headerTop}`);
      }

      // Refresh with URL query params (?solution=Water+Softener) -> Must start at top
      console.log(`\n--- Extra: Refresh with query params (?solution=Water%20Softener) ---`);
      await browser.navigate('http://localhost:5173/?solution=Water%20Softener', 1500);
      const paramInitial = await browser.evaluate('window.scrollY');
      console.log(`  Initial load with ?solution=... : scrollY = ${paramInitial}`);
      if (paramInitial !== 0) throw new Error(`FAIL: Initial query param load not at top: ${paramInitial}`);
      await doReload(browser);
      const paramAfter = await browser.evaluate('window.scrollY');
      console.log(`  After reload with ?solution=... : scrollY = ${paramAfter}`);
      if (paramAfter !== 0) throw new Error(`FAIL: Reload with query param not at top: ${paramAfter}`);

      // Scenario 5: Navigate internally between sections -> Normal navigation must continue working
      console.log(`\n--- Scenario 5: Internal navigation & normal scrolling ---`);
      // Test scroll to slider
      await browser.evaluate(`(() => {
        const target = document.getElementById('water-softener-inquiry-section');
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'center' });
      })()`);
      await sleep(400);
      const navScrollY = await browser.evaluate('window.scrollY');
      console.log(`  Scrolled internally to section: scrollY = ${navScrollY}`);
      if (navScrollY <= 200) {
        throw new Error(`FAIL Scenario 5: Internal scroll did not move down: scrollY = ${navScrollY}`);
      }
      // Test manual scrolling up and down
      await browser.evaluate('window.scrollTo(0, 500)');
      await sleep(300);
      const manualScrollY = await browser.evaluate('window.scrollY');
      console.log(`  Manual scroll to 500px: actual scrollY = ${manualScrollY}`);
      if (Math.abs(manualScrollY - 500) > 50) {
        throw new Error(`FAIL Scenario 5: Manual scroll not functional: got ${manualScrollY}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(' ALL 5 VERIFICATION SCENARIOS PASSED ACROSS ALL VIEWPORTS!');
    console.log('='.repeat(80));
  } finally {
    await browser.close();
  }
}

verifyAllScenarios().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
