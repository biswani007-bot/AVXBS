import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep } from './helpers/test-env.mjs';

async function main() {
  const b = new CDPBrowser();
  try {
    await b.launch(TEST_ENV.FRONTEND_URL);
    await b.navigate(TEST_ENV.FRONTEND_URL, 2000);
    await b.setViewport(375, 667, true);
    await sleep(1000);
    const res = await b.evaluate(`
      (() => {
        const sec = document.querySelector('.secondary-banner-section');
        return {
          className: sec ? sec.className : 'null',
          innerHTML: sec ? sec.innerHTML.slice(0, 300) : 'null'
        };
      })()
    `);
    console.log('Result at 375x667:', res);
  } finally {
    await b.close();
  }
}

main().catch(console.error);
