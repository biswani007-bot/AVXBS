import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.navigate('http://localhost:5173', 1500);
  
  for (const [w, h, name] of [[1440, 900, 'Desktop'], [1024, 768, 'Laptop'], [768, 1024, 'Tablet'], [375, 667, 'Mobile']]) {
    await browser.setViewport(w, h, w <= 768);
    await new Promise(r => setTimeout(r, 400));
    const navState = await browser.evaluate(`(() => {
      const primaryNav = document.querySelector('.header-primary-nav');
      const searchBox = document.querySelector('.navbar-search-container');
      const searchToggle = document.querySelector('.navbar-search-mobile-toggle-btn');
      const csNav = primaryNav ? window.getComputedStyle(primaryNav) : null;
      const csSearch = searchBox ? window.getComputedStyle(searchBox) : null;
      const csToggle = searchToggle ? window.getComputedStyle(searchToggle) : null;
      const drawerItems = Array.from(document.querySelectorAll('.drawer-nav-group')).map(g => {
        const text = g.textContent.trim().split('\\n')[0];
        const disp = window.getComputedStyle(g).display;
        return { text, disp };
      });
      return {
        primaryNavDisplay: csNav ? csNav.display : 'none',
        searchBoxDisplay: csSearch ? csSearch.display : 'none',
        searchToggleDisplay: csToggle ? csToggle.display : 'none',
        drawerItems
      };
    })()`);
    console.log(name, `${w}x${h}:`, JSON.stringify(navState, null, 2));
  }
  await browser.close();
}

main().catch(console.error);
