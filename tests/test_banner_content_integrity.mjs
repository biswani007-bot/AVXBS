import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep } from './helpers/test-env.mjs';

async function checkBannerContentIntegrity() {
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

    const testViewports = [
      { name: 'iPad Portrait 768x1024', w: 768, h: 1024 },
      { name: 'iPad Intermediate 768x900', w: 768, h: 900 },
      { name: 'Tablet 700x900', w: 700, h: 900 },
      { name: 'Tablet Boundary 601x900', w: 601, h: 900 },
      { name: 'Mobile Boundary 600x900', w: 600, h: 900 },
      { name: 'Mobile 430x932', w: 430, h: 932 },
      { name: 'Mobile 375x667', w: 375, h: 667 },
      { name: 'Mobile 320x568', w: 320, h: 568 },
    ];

    for (const vp of testViewports) {
      await browser.setViewport(vp.w, vp.h, vp.w <= 768);
      await sleep(300);

      const audit = await browser.evaluate(`
        (() => {
          const sec = document.querySelector('.secondary-banner-section');
          const hero = document.querySelector('.full-page-hero-container');
          const content = document.querySelector('.secondary-banner-content');
          const title = document.querySelector('.secondary-banner-title');
          const subtitle = document.querySelector('.secondary-banner-subtitle');
          const btn = document.querySelector('.secondary-banner-cta-btn');
          const img = document.querySelector('.secondary-banner-media');

          const sR = sec.getBoundingClientRect();
          const hR = hero.getBoundingClientRect();
          const cR = content ? content.getBoundingClientRect() : null;
          const tR = title ? title.getBoundingClientRect() : null;
          const bR = btn ? btn.getBoundingClientRect() : null;

          // Check if content overflows sec vertically
          const verticalOverflow = cR ? (cR.bottom > sR.bottom || cR.top < sR.top) : false;
          // Check if content overflows sec horizontally
          const horizontalOverflow = cR ? (cR.right > sR.right || cR.left < sR.left) : false;

          return {
            heroHeight: hR.height,
            secHeight: sR.height,
            ratio: sR.height / hR.height,
            contentHeight: cR ? cR.height : 0,
            contentWidth: cR ? cR.width : 0,
            secWidth: sR.width,
            verticalOverflow,
            horizontalOverflow,
            titleFontSize: title ? window.getComputedStyle(title).fontSize : '',
            subtitleFontSize: subtitle ? window.getComputedStyle(subtitle).fontSize : '',
            imgLoaded: img ? (img.complete && img.naturalWidth > 0) : false,
            imgNatural: img ? \`\${img.naturalWidth}x\${img.naturalHeight}\` : 'none'
          };
        })()
      `);

      console.log(`\n--- [${vp.name}] ---`);
      console.log(`Hero: ${audit.heroHeight.toFixed(2)}px | Secondary: ${audit.secHeight.toFixed(2)}px | Ratio: ${(audit.ratio * 100).toFixed(2)}%`);
      console.log(`Content Size: ${audit.contentWidth.toFixed(1)}w x ${audit.contentHeight.toFixed(1)}h | Section Size: ${audit.secWidth.toFixed(1)}w x ${audit.secHeight.toFixed(1)}h`);
      console.log(`Vertical Overflow: ${audit.verticalOverflow ? 'YES (FAIL)' : 'NO (CLEAN)'}`);
      console.log(`Horizontal Overflow: ${audit.horizontalOverflow ? 'YES (FAIL)' : 'NO (CLEAN)'}`);
      console.log(`Title Font: ${audit.titleFontSize} | Image: ${audit.imgNatural} (loaded: ${audit.imgLoaded})`);
    }
  } finally {
    await browser.close();
  }
}

checkBannerContentIntegrity().catch(console.error);
