import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { sleep } from './helpers/test-env.mjs';

async function testLaptop() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  try {
    await browser.setViewport(1024, 768, false);
    await browser.navigate('http://localhost:5173/?solution=Water%20Softener', 1000);
    await browser.send('Page.reload');
    await sleep(1000);

    const readyState = await browser.evaluate('document.readyState');
    console.log('readyState after reload 1000ms:', readyState);

    const hasTarget = await browser.evaluate('Boolean(document.getElementById("water-softener-inquiry-section"))');
    console.log('hasTarget:', hasTarget);

    await browser.evaluate(`(() => {
      const target = document.getElementById('water-softener-inquiry-section');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    })()`);

    await sleep(800);
    const navScrollY = await browser.evaluate('window.scrollY');
    console.log('navScrollY after 800ms:', navScrollY);

  } finally {
    await browser.close();
  }
}

testLaptop().catch(console.error);
