import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep } from './helpers/test-env.mjs';

const viewports = [
  { name: '1440x900', w: 1440, h: 900 },
  { name: '1024x768', w: 1024, h: 768 },
  { name: '768x1024', w: 768, h: 1024 },
  { name: '768x900', w: 768, h: 900 },
  { name: '430x932', w: 430, h: 932 },
  { name: '412x915', w: 412, h: 915 },
  { name: '375x667', w: 375, h: 667 },
  { name: '320x568', w: 320, h: 568 },
];

async function checkElements() {
  const browser = new CDPBrowser();
  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

    // Apply the 600px breakpoint simulation
    await browser.evaluate(`
      (() => {
        let el = document.getElementById('explorer-fix-simulation');
        if (!el) {
          el = document.createElement('style');
          el.id = 'explorer-fix-simulation';
          document.head.appendChild(el);
        }
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

    for (const vp of viewports) {
      await browser.setViewport(vp.w, vp.h, vp.w <= 768);
      await sleep(350);

      const res = await browser.evaluate(`
        (() => {
          const docW = document.documentElement.clientWidth;
          const scrollW = document.documentElement.scrollWidth;
          const bodyScrollW = document.body.scrollWidth;
          const innerW = window.innerWidth;

          // Check main container and sections
          const sections = document.querySelectorAll('header, main > *, footer');
          const sectionMetrics = [];
          for (const s of sections) {
            const r = s.getBoundingClientRect();
            sectionMetrics.push({
              tag: s.tagName.toLowerCase(),
              cls: s.className ? s.className.split(' ')[0] : '',
              width: r.width,
              left: r.left,
              right: r.right,
              overflows: r.right > innerW + 1
            });
          }

          return {
            docW,
            scrollW,
            bodyScrollW,
            innerW,
            hasDocHScroll: scrollW > innerW,
            hasBodyHScroll: bodyScrollW > innerW,
            overflowingSections: sectionMetrics.filter(s => s.overflows)
          };
        })()
      `);

      console.log(`[${vp.name}] InnerWidth: ${res.innerW} | ScrollWidth: ${res.scrollW} | BodyScrollW: ${res.bodyScrollW} | OverflowSections: ${res.overflowingSections.length}`);
      if (res.overflowingSections.length > 0) {
        console.log(`  Overflow details:`, res.overflowingSections);
      }
    }
  } finally {
    await browser.close();
  }
}

checkElements().catch(console.error);
