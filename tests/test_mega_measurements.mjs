import { CDPBrowser } from './helpers/cdp-browser.mjs';
import fs from 'fs';

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.navigate('http://localhost:5173', 2000);

  const viewports = [
    { name: 'Desktop', w: 1440, h: 900, isMobile: false },
    { name: 'Laptop', w: 1024, h: 768, isMobile: false },
    { name: 'Tablet', w: 768, h: 1024, isMobile: true },
    { name: 'Mobile', w: 375, h: 667, isMobile: true },
  ];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`Testing Viewport: ${vp.name} (${vp.w}x${vp.h})`);
    console.log(`======================================================`);

    await browser.setViewport(vp.w, vp.h, vp.isMobile);
    await new Promise(r => setTimeout(r, 500));

    // Navbar measurements
    const navMetrics = await browser.evaluate(`(() => {
      const header = document.querySelector('.site-header');
      const logo = document.querySelector('.header-logo-link');
      const primaryNav = document.querySelector('.header-primary-nav');
      const resBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
      const commBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
      const search = document.querySelector('.navbar-search-container');
      const searchToggle = document.querySelector('.navbar-search-mobile-toggle-btn');
      const hamburger = document.querySelector('.header-menu-btn');
      
      const rHeader = header ? header.getBoundingClientRect() : null;
      const rLogo = logo ? logo.getBoundingClientRect() : null;
      const rRes = resBtn ? resBtn.getBoundingClientRect() : null;
      const rComm = commBtn ? commBtn.getBoundingClientRect() : null;
      const rSearch = search ? search.getBoundingClientRect() : null;
      const rHamburger = hamburger ? hamburger.getBoundingClientRect() : null;

      const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;

      return {
        headerHeight: rHeader ? Math.round(rHeader.height) : 0,
        logo: rLogo ? { w: Math.round(rLogo.width), h: Math.round(rLogo.height), left: Math.round(rLogo.left) } : null,
        resVisible: resBtn ? window.getComputedStyle(resBtn).display !== 'none' && rRes.width > 0 : false,
        commVisible: commBtn ? window.getComputedStyle(commBtn).display !== 'none' && rComm.width > 0 : false,
        searchVisible: search ? window.getComputedStyle(search).display !== 'none' && rSearch.width > 0 : false,
        searchToggleVisible: searchToggle ? window.getComputedStyle(searchToggle).display !== 'none' : false,
        hamburgerRight: rHamburger ? Math.round(window.innerWidth - rHamburger.right) : 0,
        hasOverflow,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: window.innerWidth
      };
    })()`);

    console.log('Navbar metrics:', JSON.stringify(navMetrics, null, 2));

    if (vp.w >= 768) {
      // Trigger Residential mega menu
      console.log('Triggering Residential mega menu...');
      if (vp.isMobile) {
        // Tap on tablet
        await browser.evaluate(`(() => {
          const btn = document.querySelector('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
          if (btn) btn.click();
        })()`);
      } else {
        // Hover on desktop/laptop
        await browser.hover('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
      }
      await new Promise(r => setTimeout(r, 600));

      const megaMetrics = await browser.evaluate(`(() => {
        const container = document.querySelector('.samsung-nav-mega-container');
        const surface = document.querySelector('.samsung-nav-mega-surface');
        const inner = document.querySelector('.samsung-nav-mega-inner');
        const grid = document.querySelector('.samsung-highlights-grid');
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const solGrid = document.querySelector('.samsung-solution-cards-grid');
        const solCards = Array.from(document.querySelectorAll('.samsung-solution-card'));
        
        const rContainer = container ? container.getBoundingClientRect() : null;
        const rSurface = surface ? surface.getBoundingClientRect() : null;
        
        const cardMetrics = cards.map((c, i) => {
          const r = c.getBoundingClientRect();
          const imgBox = c.querySelector('.samsung-highlight-img-box');
          const rImg = imgBox ? imgBox.getBoundingClientRect() : null;
          const title = c.querySelector('.samsung-highlight-name')?.textContent?.trim();
          return {
            index: i,
            title,
            cardW: Math.round(r.width),
            cardH: Math.round(r.height),
            cardAspect: (r.width / r.height).toFixed(3),
            imgW: rImg ? Math.round(rImg.width) : 0,
            imgH: rImg ? Math.round(rImg.height) : 0,
            imgAspect: rImg ? (rImg.width / rImg.height).toFixed(3) : 0
          };
        });

        // Check columns and rows of highlight cards
        const cardTops = [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().top)))].sort((a,b) => a - b);
        const cardLefts = [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().left)))].sort((a,b) => a - b);

        const csInner = inner ? window.getComputedStyle(inner) : null;

        return {
          isOpen: Boolean(container && surface),
          containerTop: rContainer ? Math.round(rContainer.top) : 0,
          containerHeight: rContainer ? Math.round(rContainer.height) : 0,
          containerWidth: rContainer ? Math.round(rContainer.width) : 0,
          expectedHeight: window.innerHeight - (document.querySelector('.site-header')?.offsetHeight || 0),
          surfaceHeight: rSurface ? Math.round(rSurface.height) : 0,
          flexDirection: csInner ? csInner.flexDirection : '',
          highlightsCount: cards.length,
          columnsCount: cardLefts.length,
          rowsCount: cardTops.length,
          solCardsCount: solCards.length,
          firstTwoCards: cardMetrics.slice(0, 2),
          allCardsSquare: cardMetrics.every(c => Math.abs(c.cardW - c.cardH) <= 1),
          allImgsSquare: cardMetrics.every(c => Math.abs(c.imgW - c.imgH) <= 1),
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
        };
      })()`);

      console.log('Mega menu metrics:', JSON.stringify(megaMetrics, null, 2));

      // Close menu
      await browser.evaluate(`(() => {
        const btn = document.querySelector('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
        if (btn && btn.getAttribute('aria-expanded') === 'true') btn.click();
        const backdrop = document.querySelector('.samsung-nav-backdrop');
        if (backdrop) backdrop.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      })()`);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  await browser.close();
}

main().catch(console.error);
