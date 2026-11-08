import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep } from './helpers/test-env.mjs';

async function main() {
  const browser = new CDPBrowser();
  try {
    await browser.launch('about:blank');
    await browser.setViewport(1440, 900);
    await browser.send('Page.enable');
    await browser.send('Runtime.enable');

    console.log('Navigating to frontend...');
    await browser.send('Page.navigate', { url: TEST_ENV.FRONTEND_URL });

    const snapshots = [];
    const times = [500, 750, 1000, 1250, 1500, 2000, 2500, 3000];

    for (const t of times) {
      await sleep(250);
      const s = await browser.evaluate(`(() => {
        const getBox = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
            marginTop: cs.marginTop,
            marginRight: cs.marginRight,
            paddingLeft: cs.paddingLeft,
            paddingRight: cs.paddingRight,
            fontSize: cs.fontSize
          };
        };

        const header = document.querySelector('.site-header');
        const container = document.querySelector('.header-container');
        const logoLink = document.querySelector('.header-logo-link');
        const logo = document.querySelector('.header-logo-img, .site-logo');
        const logoImg = document.querySelector('.header-logo-img img, .site-logo img, .logo-letters');
        const primaryNav = document.querySelector('.header-primary-nav');
        const rightGroup = document.querySelector('.header-right-group');
        const search = document.querySelector('.navbar-search-container');
        const hamburger = document.querySelector('.header-menu-btn');

        return {
          time: Math.round(performance.now()),
          header: getBox(header),
          container: getBox(container),
          logoLink: getBox(logoLink),
          logo: getBox(logo),
          logoImg: getBox(logoImg),
          primaryNav: getBox(primaryNav),
          rightGroup: getBox(rightGroup),
          search: getBox(search),
          hamburger: getBox(hamburger),
          logoClasses: logo ? logo.className : null,
          logoImgSrc: logoImg ? logoImg.getAttribute('src') : null,
          isDynamic: Boolean(document.querySelector('.avxbs-dynamic-logo'))
        };
      })()`);
      snapshots.push(s);
    }

    snapshots.forEach((s, idx) => {
      console.log(`\n--- Snap ${idx + 1} at ${s.time}ms (dynamic=${s.isDynamic}, logo=${s.logoImgSrc}) ---`);
      if (s.header) {
        console.log(`Header: h=${s.header.h}, pad=[${s.header.paddingLeft}, ${s.header.paddingRight}]`);
        console.log(`Container: w=${s.container.w}, x=${s.container.x}`);
        console.log(`Logo: x=${s.logo.x}, y=${s.logo.y}, w=${s.logo.w}, h=${s.logo.h}`);
        console.log(`LogoImg: w=${s.logoImg?.w}, h=${s.logoImg?.h}`);
        console.log(`RightGroup: x=${s.rightGroup.x}, y=${s.rightGroup.y}, w=${s.rightGroup.w}, h=${s.rightGroup.h}`);
        console.log(`Search: x=${s.search.x}, y=${s.search.y}, w=${s.search.w}, h=${s.search.h}`);
        console.log(`Hamburger: x=${s.hamburger.x}, y=${s.hamburger.y}, w=${s.hamburger.w}, h=${s.hamburger.h}`);
      } else {
        console.log('Not yet rendered');
      }
    });

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
