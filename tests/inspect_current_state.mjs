import { CDPBrowser } from './helpers/cdp-browser.mjs';

function toObj(r) {
  if (!r) return null;
  return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
}

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.setViewport(1440, 900);
  await browser.navigate('http://localhost:5173', 2000);

  console.log('\n--- 1. NAVBAR & LOGO INSPECTION ---');
  const navbarState = await browser.evaluate(`
    (() => {
      const header = document.querySelector('.site-header');
      const logoLink = document.querySelector('.header-logo-link');
      const dynamicLogo = document.querySelector('.avxbs-dynamic-logo');
      const dynamicImg = document.querySelector('.avxbs-dynamic-logo-img');
      const nav = document.querySelector('.header-primary-nav');
      const resBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
      const commBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
      const hamburger = document.querySelector('.header-menu-btn');
      const toObj = r => r ? { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) } : null;

      const rHeader = header.getBoundingClientRect();
      const rLogo = logoLink.getBoundingClientRect();
      const rImg = dynamicImg.getBoundingClientRect();
      const headerCenterY = rHeader.top + (rHeader.height / 2);
      const logoCenterY = rLogo.top + (rLogo.height / 2);

      return {
        header: toObj(rHeader),
        logoLink: toObj(rLogo),
        dynamicLogo: toObj(dynamicLogo?.getBoundingClientRect()),
        img: toObj(rImg),
        imgNaturalW: dynamicImg?.naturalWidth,
        imgNaturalH: dynamicImg?.naturalHeight,
        logoCenterOffset: Math.abs(logoCenterY - headerCenterY),
        nav: toObj(nav?.getBoundingClientRect()),
        resBtn: toObj(resBtn?.getBoundingClientRect()),
        commBtn: toObj(commBtn?.getBoundingClientRect()),
        gapBetweenOptions: Math.round(commBtn.getBoundingClientRect().left - resBtn.getBoundingClientRect().right),
        gapBetweenLogoAndNav: Math.round(nav.getBoundingClientRect().left - logoLink.getBoundingClientRect().right),
        hamburger: toObj(hamburger?.getBoundingClientRect()),
        gapFromRightEdge: Math.round(window.innerWidth - hamburger.getBoundingClientRect().right)
      };
    })()
  `);
  console.log('Navbar state:', JSON.stringify(navbarState, null, 2));

  console.log('\n--- 2. RESIDENTIAL MEGA MENU INSPECTION ---');
  await browser.hover('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  await new Promise(r => setTimeout(r, 400));

  const resMenu = await browser.evaluate(`
    (() => {
      const surface = document.querySelector('.samsung-nav-mega-surface');
      const inner = document.querySelector('.samsung-nav-mega-inner');
      const grid = document.querySelector('.samsung-highlights-grid');
      const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
      const solGrid = document.querySelector('.samsung-solution-cards-grid');
      const solCards = Array.from(document.querySelectorAll('.samsung-solution-card'));
      const toObj = r => r ? { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) } : null;

      const rSurface = surface.getBoundingClientRect();
      const cardRects = cards.map(c => toObj(c.getBoundingClientRect()));
      const cardTitles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());

      // Check distinct columns (left coordinates) and distinct rows (top coordinates)
      const distinctLefts = [...new Set(cardRects.map(c => c.left))].sort((a,b) => a - b);
      const distinctTops = [...new Set(cardRects.map(c => c.top))].sort((a,b) => a - b);

      // Col 1 cards vs Col 2 cards
      const col1Cards = cards.filter(c => Math.abs(c.getBoundingClientRect().left - distinctLefts[0]) < 5);
      const col2Cards = cards.filter(c => Math.abs(c.getBoundingClientRect().left - distinctLefts[1]) < 5);

      return {
        surfaceHeight: Math.round(rSurface.height),
        surfaceVhRatio: (rSurface.height / window.innerHeight).toFixed(2),
        inner: toObj(inner.getBoundingClientRect()),
        grid: toObj(grid.getBoundingClientRect()),
        cardsCount: cards.length,
        columnsCount: distinctLefts.length,
        rowsCount: distinctTops.length,
        col1Count: col1Cards.length,
        col2Count: col2Cards.length,
        col1Titles: col1Cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim()),
        col2Titles: col2Cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim()),
        allTitles: cardTitles,
        solGrid: toObj(solGrid.getBoundingClientRect()),
        solCardsCount: solCards.length,
      };
    })()
  `);
  console.log('Residential menu state:', JSON.stringify(resMenu, null, 2));

  console.log('\n--- 3. COMMERCIAL MEGA MENU SWITCH INSPECTION ---');
  await browser.hover('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
  await new Promise(r => setTimeout(r, 400));

  const commMenu = await browser.evaluate(`
    (() => {
      const surface = document.querySelector('.samsung-nav-mega-surface');
      const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
      const solCards = Array.from(document.querySelectorAll('.samsung-solution-card'));
      const toObj = r => r ? { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) } : null;

      const rSurface = surface.getBoundingClientRect();
      const cardRects = cards.map(c => toObj(c.getBoundingClientRect()));
      const distinctLefts = [...new Set(cardRects.map(c => c.left))].sort((a,b) => a - b);
      const distinctTops = [...new Set(cardRects.map(c => c.top))].sort((a,b) => a - b);

      const col1Cards = cards.filter(c => Math.abs(c.getBoundingClientRect().left - distinctLefts[0]) < 5);
      const col2Cards = cards.filter(c => Math.abs(c.getBoundingClientRect().left - distinctLefts[1]) < 5);

      return {
        surfaceHeight: Math.round(rSurface.height),
        surfaceVhRatio: (rSurface.height / window.innerHeight).toFixed(2),
        cardsCount: cards.length,
        columnsCount: distinctLefts.length,
        rowsCount: distinctTops.length,
        col1Count: col1Cards.length,
        col2Count: col2Cards.length,
        col1Titles: col1Cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim()),
        col2Titles: col2Cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim()),
        solCardsCount: solCards.length
      };
    })()
  `);
  console.log('Commercial menu state:', JSON.stringify(commMenu, null, 2));

  console.log('\n--- 4. HOVER CLOSE INSPECTION ---');
  await browser.hover('.samsung-nav-backdrop');
  await new Promise(r => setTimeout(r, 400));
  const closed = await browser.evaluate(`!Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  console.log('Menu closed after leaving:', closed);

  await browser.close();
}

main().catch(console.error);
