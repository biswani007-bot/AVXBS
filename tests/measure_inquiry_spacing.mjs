import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep, waitFor } from './helpers/test-env.mjs';

async function main() {
  const browser = new CDPBrowser();
  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

    await waitFor(async () => {
      return browser.evaluate(`Boolean(document.querySelector('.inquiry-promo-section'))`);
    }, 10000, 200, 'Page mount');

    const viewports = [
      { w: 1440, h: 900, name: 'Desktop 1440x900' },
      { w: 1024, h: 768, name: 'Tablet 1024x768' },
      { w: 768, h: 1024, name: 'Tablet 768x1024' },
      { w: 425, h: 800, name: 'Mobile 425x800' },
      { w: 375, h: 667, name: 'Mobile 375x667' },
    ];

    for (const vp of viewports) {
      await browser.setViewport(vp.w, vp.h, vp.w <= 768);
      await sleep(500);

      const metrics = await browser.evaluate(`
        (() => {
          const section = document.querySelector('.inquiry-promo-section');
          const container = document.querySelector('.inquiry-promo-container');
          const left = document.querySelector('.inquiry-promo-left');
          const right = document.querySelector('.inquiry-promo-right');
          const imgWrap = document.querySelector('.inquiry-promo-image-wrapper');
          const img = document.querySelector('.inquiry-promo-img');
          const textWrap = document.querySelector('.inquiry-promo-text-wrap');

          const sRect = section.getBoundingClientRect();
          const cRect = container ? container.getBoundingClientRect() : null;
          const lRect = left ? left.getBoundingClientRect() : null;
          const rRect = right ? right.getBoundingClientRect() : null;
          const imgWrapRect = imgWrap ? imgWrap.getBoundingClientRect() : null;
          const imgRect = img ? img.getBoundingClientRect() : null;
          const textWrapRect = textWrap ? textWrap.getBoundingClientRect() : null;

          const sStyle = window.getComputedStyle(section);
          const cStyle = container ? window.getComputedStyle(container) : {};
          const lStyle = left ? window.getComputedStyle(left) : {};
          const rStyle = right ? window.getComputedStyle(right) : {};
          const textWrapStyle = textWrap ? window.getComputedStyle(textWrap) : {};

          // Content top and content bottom:
          // Actual content inside the section is the left (image wrapper / img) and right (text wrapper)
          const contentTop = Math.min(imgWrapRect ? imgWrapRect.top : Infinity, textWrapRect ? textWrapRect.top : Infinity);
          const contentBottom = Math.max(imgWrapRect ? imgWrapRect.bottom : -Infinity, textWrapRect ? textWrapRect.bottom : -Infinity);

          const measuredTopSpacing = contentTop - sRect.top;
          const measuredBottomSpacing = sRect.bottom - contentBottom;

          // External gaps
          const prev = section.previousElementSibling;
          const next = section.nextElementSibling;
          const prevRect = prev ? prev.getBoundingClientRect() : null;
          const nextRect = next ? next.getBoundingClientRect() : null;
          const gapBefore = prevRect ? sRect.top - prevRect.bottom : null;
          const gapAfter = nextRect ? nextRect.top - sRect.bottom : null;

          return {
            section: {
              top: sRect.top,
              bottom: sRect.bottom,
              height: sRect.height,
              paddingTop: sStyle.paddingTop,
              paddingBottom: sStyle.paddingBottom,
              marginTop: sStyle.marginTop,
              marginBottom: sStyle.marginBottom
            },
            container: {
              paddingTop: cStyle.paddingTop,
              paddingBottom: cStyle.paddingBottom,
              marginTop: cStyle.marginTop,
              marginBottom: cStyle.marginBottom,
              gap: cStyle.gap
            },
            imgWrapRect: imgWrapRect ? { top: imgWrapRect.top, bottom: imgWrapRect.bottom, height: imgWrapRect.height } : null,
            textWrapRect: textWrapRect ? { top: textWrapRect.top, bottom: textWrapRect.bottom, height: textWrapRect.height } : null,
            contentTop,
            contentBottom,
            measuredTopSpacing: Number(measuredTopSpacing.toFixed(2)),
            measuredBottomSpacing: Number(measuredBottomSpacing.toFixed(2)),
            gapBefore: gapBefore !== null ? Number(gapBefore.toFixed(2)) : null,
            gapAfter: gapAfter !== null ? Number(gapAfter.toFixed(2)) : null
          };
        })()
      `);

      console.log(`\n=== [${vp.name}] ===`);
      console.log('Section padding:', metrics.section.paddingTop, 'top,', metrics.section.paddingBottom, 'bottom');
      console.log('Measured Top Spacing (section top -> content top):', metrics.measuredTopSpacing, 'px');
      console.log('Measured Bottom Spacing (content bottom -> section bottom):', metrics.measuredBottomSpacing, 'px');
      console.log('External Gap Before (Hero -> Inquiry):', metrics.gapBefore, 'px');
      console.log('External Gap After (Inquiry -> Secondary):', metrics.gapAfter, 'px');
      console.log('Image wrap rect:', metrics.imgWrapRect);
      console.log('Text wrap rect:', metrics.textWrapRect);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

main();
