import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { sleep } from './helpers/test-env.mjs';

async function testMobile() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  try {
    await browser.setViewport(375, 667, true);
    await browser.navigate('http://localhost:5173', 1500);

    console.log('Initial scrollY:', await browser.evaluate('window.scrollY'));
    await browser.evaluate('window.scrollTo(0, 150)');
    await sleep(300);
    console.log('Scrolled to 150:', await browser.evaluate('window.scrollY'));

    // Check history.scrollRestoration
    console.log('history.scrollRestoration:', await browser.evaluate('history.scrollRestoration'));

    await browser.send('Page.reload');
    
    // Check scrollY over time
    for (let t of [50, 150, 300, 500, 800, 1200, 2000]) {
      await sleep(150);
      const y = await browser.evaluate('window.scrollY');
      const readyState = await browser.evaluate('document.readyState');
      console.log(`t=${t}ms: scrollY=${y}, readyState=${readyState}`);
    }

  } finally {
    await browser.close();
  }
}

testMobile().catch(console.error);

