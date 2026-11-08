import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep, waitFor } from './helpers/test-env.mjs';

async function main() {
  const browser = new CDPBrowser();
  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);

    await waitFor(async () => {
      return browser.evaluate(`Boolean(document.querySelector('.full-page-hero-container') && document.querySelector('.secondary-banner-section'))`);
    }, 10000, 200, 'React App mounting');

    const viewports = [
      { w: 1440, h: 900, name: '1440px desktop' },
      { w: 768, h: 1024, name: '768px tablet' },
      { w: 375, h: 667, name: '375px mobile (667h)' },
      { w: 375, h: 812, name: '375px mobile (812h)' }
    ];

    for (const vp of viewports) {
      await browser.setViewport(vp.w, vp.h, vp.w <= 768);
      await sleep(500);

      const metrics = await browser.evaluate(`
        (() => {
          const hero = document.querySelector('.full-page-hero-container');
          const sec = document.querySelector('.secondary-banner-section, .secondary-banner-root');
          if (!hero || !sec) {
            return { error: 'elements missing', hero: Boolean(hero), sec: Boolean(sec) };
          }
          const heroH = hero.getBoundingClientRect().height;
          const secH = sec.getBoundingClientRect().height;
          return {
            heroH,
            secH,
            ratio: secH / heroH
          };
        })()
      `);

      console.log(`[${vp.name}] Viewport: ${vp.w}x${vp.h} -> Hero Height: ${metrics.heroH.toFixed(2)}px | Secondary Banner Height: ${metrics.secH.toFixed(2)}px | Ratio: ${(metrics.ratio * 100).toFixed(2)}% (${metrics.ratio.toFixed(4)})`);
    }
  } catch (err) {
    console.error('Measurement failed:', err);
  } finally {
    await browser.close();
  }
}

main();
