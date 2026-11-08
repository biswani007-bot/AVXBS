import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep, waitFor } from './helpers/test-env.mjs';

async function main() {
  const browser = new CDPBrowser();
  let hasFailure = false;
  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

    await waitFor(async () => {
      return browser.evaluate(`Boolean(document.querySelector('.full-page-hero-container') && document.querySelector('.site-footer'))`);
    }, 10000, 200, 'Page mount');

    const viewports = [
      { w: 1440, h: 900, name: 'Desktop 1440x900' },
      { w: 1024, h: 768, name: 'Tablet 1024x768' },
      { w: 768, h: 1024, name: 'Tablet 768x1024' },
      { w: 425, h: 800, name: 'Mobile 425x800' },
      { w: 375, h: 667, name: 'Mobile 375x667' },
    ];

    for (const vp of viewports) {
      const isMobileOrTablet = vp.w <= 1024;
      await browser.setViewport(vp.w, vp.h, vp.w <= 768);
      await sleep(400);

      const metrics = await browser.evaluate(`
        (() => {
          const container = document.querySelector('.homepage-content');
          const children = Array.from(container.children).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && el.offsetHeight > 0;
          });
          const footer = document.querySelector('.site-footer');
          if (footer && footer.offsetHeight > 0) {
            children.push(footer);
          }
          const transitions = [];
          for (let i = 0; i < children.length - 1; i++) {
            const a = children[i];
            const b = children[i + 1];
            const rA = a.getBoundingClientRect();
            const rB = b.getBoundingClientRect();
            const aName = a.className ? a.className.split(' ')[0] : a.tagName;
            const bName = b.className ? b.className.split(' ')[0] : b.tagName;
            transitions.push({
              transition: aName + ' -> ' + bName,
              gapPx: Number((rB.top - rA.bottom).toFixed(2)),
            });
          }
          return transitions;
        })()
      `);

      console.log('\n[' + vp.name + ']');
      for (const t of metrics) {
        const isHeroToInquiry = 
          t.transition === 'hero-fullpage-master-section -> inquiry-promo-section';
        const isInquiryToSecondary = 
          t.transition === 'inquiry-promo-section -> secondary-banner-section';
        const expectedGap = isHeroToInquiry ? 4 : (isInquiryToSecondary ? 8 : (isMobileOrTablet ? 15 : 19));
        const pass = Math.abs(t.gapPx - expectedGap) <= 1.0;
        if (!pass) hasFailure = true;
        console.log('  ' + (pass ? 'PASS' : 'FAIL') + ' ' + t.transition + ': ' + t.gapPx + 'px (expected ' + expectedGap + 'px)');
      }
      
      const inquiryPadding = await browser.evaluate(`
        (() => {
          const section = document.querySelector('.inquiry-promo-section');
          if (!section) return null;
          const s = window.getComputedStyle(section);
          return { top: s.paddingTop, bottom: s.paddingBottom };
        })()
      `);
      if (inquiryPadding) {
        const expectedPadding = isMobileOrTablet ? '8px' : '19px';
        const padPass = inquiryPadding.top === expectedPadding && inquiryPadding.bottom === expectedPadding;
        if (!padPass) hasFailure = true;
        console.log('  ' + (padPass ? 'PASS' : 'FAIL') + ' inquiry-promo-section internal padding: ' + inquiryPadding.top + ' top, ' + inquiryPadding.bottom + ' bottom (expected ' + expectedPadding + ' top, ' + expectedPadding + ' bottom)');
      } else {
        hasFailure = true;
        console.log('  FAIL inquiry-promo-section not found');
      }
    }
  } catch (err) {
    console.error('Error:', err);
    hasFailure = true;
  } finally {
    await browser.close();
    if (hasFailure) {
      console.error('\nOne or more section gap assertions FAILED.');
      process.exit(1);
    } else {
      console.log('\nAll section gap and padding assertions PASSED.');
    }
  }
}

main();
