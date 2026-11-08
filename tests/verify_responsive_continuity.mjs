import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep } from './helpers/test-env.mjs';

const REQUIRED_VIEWPORTS = [
  { name: '1440x900 (Desktop)', w: 1440, h: 900, category: 'Desktop' },
  { name: '1024x768 (iPad Landscape)', w: 1024, h: 768, category: 'Tablet Landscape' },
  { name: '768x1024 (iPad Portrait)', w: 768, h: 1024, category: 'Tablet Portrait' },
  { name: '768x900 (Tablet Intermediate)', w: 768, h: 900, category: 'Tablet' },
  { name: '430x932 (iPhone 14/15/16 Pro Max)', w: 430, h: 932, category: 'Mobile Large' },
  { name: '412x915 (Samsung Galaxy S20/Pixel)', w: 412, h: 915, category: 'Mobile Medium' },
  { name: '375x667 (iPhone SE/8/7)', w: 375, h: 667, category: 'Mobile Standard' },
  { name: '320x568 (iPhone 5/SE1)', w: 320, h: 568, category: 'Mobile Small' },
];

const BOUNDARY_VIEWPORTS = [
  { name: '1025x800 (Desktop lower boundary)', w: 1025, h: 800, category: 'Boundary' },
  { name: '1024x800 (Tablet upper boundary)', w: 1024, h: 800, category: 'Boundary' },
  { name: '769x1024 (Tablet portrait +1px)', w: 769, h: 1024, category: 'Boundary' },
  { name: '768x1024 (Tablet 768px breakpoint)', w: 768, h: 1024, category: 'Boundary' },
  { name: '601x900 (Tablet lower boundary)', w: 601, h: 900, category: 'Boundary' },
  { name: '600x900 (Mobile upper boundary)', w: 600, h: 900, category: 'Boundary' },
  { name: '599x900 (Mobile below 600px)', w: 599, h: 900, category: 'Boundary' },
];

async function measureViewportSet(browser, viewports, label) {
  console.log(`\n========================================================================`);
  console.log(`EVALUATING: ${label}`);
  console.log(`========================================================================`);

  const results = [];

  for (const vp of viewports) {
    await browser.setViewport(vp.w, vp.h, vp.w <= 768);
    await sleep(400);

    const m = await browser.evaluate(`
      (() => {
        const hero = document.querySelector('.full-page-hero-container');
        const sec = document.querySelector('.secondary-banner-section, .secondary-banner-root');
        const tapWater = document.querySelector('.inquiry-promo-section');
        const docEl = document.documentElement;
        const body = document.body;

        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const innerWidth = window.innerWidth;
        const hasHOverflow = scrollWidth > (innerWidth + 1);

        if (!hero || !sec) {
          return { error: 'elements not found', hasHOverflow, scrollWidth, innerWidth };
        }

        const hRect = hero.getBoundingClientRect();
        const sRect = sec.getBoundingClientRect();
        const tapRect = tapWater ? tapWater.getBoundingClientRect() : null;

        const content = sec.querySelector('.secondary-banner-content');
        const cRect = content ? content.getBoundingClientRect() : null;

        // Content overflow check inside banner
        const contentOverflowY = cRect ? (cRect.bottom > sRect.bottom || cRect.top < sRect.top) : false;
        const contentOverflowX = cRect ? (cRect.right > sRect.right || cRect.left < sRect.left) : false;

        const ratio = hRect.height > 0 ? (sRect.height / hRect.height) : 0;

        return {
          heroH: hRect.height,
          secH: sRect.height,
          ratio,
          tapWaterH: tapRect ? tapRect.height : 0,
          scrollWidth,
          innerWidth,
          hasHOverflow,
          overflowDelta: Math.max(0, scrollWidth - innerWidth),
          contentOverflowY,
          contentOverflowX,
          contentHeight: cRect ? cRect.height : 0,
          contentWidth: cRect ? cRect.width : 0
        };
      })()
    `);

    const ratioPct = (m.ratio * 100).toFixed(2);
    const passRatio = m.ratio >= 0.75 && m.ratio <= 0.85;
    const passOverflow = !m.hasHOverflow;
    const overallPass = passRatio && passOverflow;

    results.push({
      ...vp,
      ...m,
      passRatio,
      passOverflow,
      overallPass
    });

    const statusTag = overallPass ? 'PASS' : 'FAIL';
    console.log(
      `[${statusTag.padEnd(4)}] ${vp.name.padEnd(35)} | Hero: ${m.heroH.toFixed(2)}px | Sec: ${m.secH.toFixed(2)}px | Ratio: ${ratioPct}% | H-Overflow: ${m.hasHOverflow ? `YES (+${m.overflowDelta}px)` : 'NO'}`
    );
  }

  return results;
}

async function run() {
  const browser = new CDPBrowser();
  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

    // 1. Measure Current As-Is Codebase
    const currentRequired = await measureViewportSet(browser, REQUIRED_VIEWPORTS, 'Current As-Is Codebase (Required Viewports)');
    const currentBoundaries = await measureViewportSet(browser, BOUNDARY_VIEWPORTS, 'Current As-Is Codebase (Boundary Viewports)');

    // 2. Inject proposed fix (aligning secondary banner mobile breakpoint to 600px)
    await browser.evaluate(`
      (() => {
        let el = document.getElementById('explorer-breakpoint-alignment');
        if (!el) {
          el = document.createElement('style');
          el.id = 'explorer-breakpoint-alignment';
          document.head.appendChild(el);
        }
        // When @media (max-width: 768px) is changed to @media (max-width: 600px):
        // 1) Between 601px and 768px, secondary-banner uses the @media (max-width: 1024px) clamp rules:
        //    height: clamp(336px, 41.6vh, 464px);
        //    max-height: calc((100vh - var(--site-header-height)) * 0.8);
        //    max-height: calc((100dvh - var(--site-header-height)) * 0.8);
        // 2) The mobile layout overrides (180deg gradient, flex-end, 100% width) now apply only at <= 600px.
        el.textContent = \`
          @media (min-width: 601px) and (max-width: 768px) {
            .secondary-banner-section {
              height: clamp(336px, 41.6vh, 464px) !important;
              max-height: calc((100vh - var(--site-header-height)) * 0.8) !important;
              max-height: calc((100dvh - var(--site-header-height)) * 0.8) !important;
            }
            .secondary-banner-gradient-overlay {
              background: linear-gradient(
                90deg,
                rgba(5, 8, 17, 0.84) 0%,
                rgba(5, 8, 17, 0.58) 45%,
                rgba(5, 8, 17, 0.22) 100%
              ) !important;
            }
            .secondary-banner-content-container {
              padding: 0 clamp(20px, 4vw, 56px) !important;
              align-items: center !important;
            }
            .secondary-banner-content {
              max-width: 640px !important;
              gap: 14px !important;
            }
            .secondary-banner-cta-btn {
              padding: 12px 26px !important;
              font-size: 0.96rem !important;
            }
          }
        \`;
      })()
    `);

    // 3. Measure Proposed Aligned Codebase
    const fixedRequired = await measureViewportSet(browser, REQUIRED_VIEWPORTS, 'Proposed Aligned Codebase (Breakpoint = 600px) - Required Viewports');
    const fixedBoundaries = await measureViewportSet(browser, BOUNDARY_VIEWPORTS, 'Proposed Aligned Codebase (Breakpoint = 600px) - Boundary Viewports');

    return {
      currentRequired,
      currentBoundaries,
      fixedRequired,
      fixedBoundaries
    };
  } finally {
    await browser.close();
  }
}

run().then(data => {
  console.log('\n[Measurement Complete] All audits captured successfully.');
}).catch(console.error);
