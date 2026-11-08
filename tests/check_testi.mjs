import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function checkSec() {
  const b = new CDPBrowser();
  await b.launch('http://localhost:5173');
  await b.navigate('http://localhost:5173', 2000);
  const dom = await b.evaluate(`
    (() => {
      const sec = document.querySelector('#testimonials-section');
      return {
        hasSec: Boolean(sec),
        html: sec?.innerHTML
      };
    })()
  `);
  console.log(dom);
  await b.close();
}

checkSec();
