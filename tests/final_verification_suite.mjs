import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { ApiClient } from './helpers/api-client.mjs';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('==================================================================');
  console.log('AVXBS: Navbar Logo, Alignment & Mega Menu Final Verification Suite');
  console.log('==================================================================\n');

  // 1. Direct DB & Storage Check
  console.log('[SECTION 1 & 2: Database Persistence & Storage Location Verification]');
  const api = new ApiClient();
  const getRes = await api.getSettings('website_logo');
  const dbData = getRes.data?.data;
  const dbValue = dbData?.value || getRes.data?.setting;
  console.log('  Database Query Result (key: website_logo):', JSON.stringify({
    _id: dbData?._id,
    key: dbData?.key,
    group: dbData?.group,
    value: dbValue
  }, null, 2));

  const logoUrl = dbValue?.imageUrl || dbValue?.url;
  console.log(`  Stored logo URL: ${logoUrl}`);

  // Check actual file storage on server
  const relativeFilePath = logoUrl.replace(/^\//, '').replace(/\//g, path.sep);
  const fullDiskPath = path.join(process.cwd(), 'backend', 'public', relativeFilePath);
  const fileExistsOnDisk = fs.existsSync(fullDiskPath);
  let fileStats = null;
  if (fileExistsOnDisk) {
    fileStats = fs.statSync(fullDiskPath);
  }
  console.log(`  Target disk path: ${fullDiskPath}`);
  console.log(`  File exists on server storage: ${fileExistsOnDisk ? 'PASS (Exists)' : 'FAIL (Missing)'}`);
  if (fileStats) {
    console.log(`  File size: ${fileStats.size} bytes`);
  }

  // 2. Browser Verification across viewports: 1440px, 1024px, 768px, 375px
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');

  const viewports = [
    { name: 'Desktop', width: 1440, height: 900, isMobile: false },
    { name: 'Laptop', width: 1024, height: 768, isMobile: false },
    { name: 'Tablet', width: 768, height: 1024, isMobile: true },
    { name: 'Mobile', width: 375, height: 667, isMobile: true }
  ];

  for (const vp of viewports) {
    console.log(`\n[VIEWPORT TEST: ${vp.name} (${vp.width}x${vp.height})]`);
    await browser.setViewport(vp.width, vp.height, vp.isMobile);
    await browser.navigate('http://localhost:5173', 1500);

    const vpMetrics = await browser.evaluate(`
      (() => {
        const header = document.querySelector('.site-header');
        const logoLink = document.querySelector('.header-logo-link');
        const img = document.querySelector('.site-logo img');
        const nav = document.querySelector('.header-primary-nav');
        const resBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
        const commBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
        const hamburger = document.querySelector('.header-menu-btn');
        const searchBtn = document.querySelector('.navbar-search-mobile-toggle-btn');
        const toObj = r => r ? { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) } : null;

        const rHeader = header?.getBoundingClientRect();
        const rLogo = logoLink?.getBoundingClientRect();
        const rImg = img?.getBoundingClientRect();
        const headerCenterY = rHeader ? rHeader.top + (rHeader.height / 2) : 0;
        const logoCenterY = rLogo ? rLogo.top + (rLogo.height / 2) : 0;
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;

        return {
          headerH: rHeader ? Math.round(rHeader.height) : 0,
          logoW: rLogo ? Math.round(rLogo.width) : 0,
          logoH: rLogo ? Math.round(rLogo.height) : 0,
          logoLeft: rLogo ? Math.round(rLogo.left) : 0,
          logoImgW: rImg ? Math.round(rImg.width) : 0,
          logoImgH: rImg ? Math.round(rImg.height) : 0,
          logoNaturalW: img ? img.naturalWidth : 0,
          logoNaturalH: img ? img.naturalHeight : 0,
          logoImgSrc: img ? img.getAttribute('src') : null,
          logoCenterOffset: Math.abs(logoCenterY - headerCenterY),
          navVisible: nav ? window.getComputedStyle(nav).display !== 'none' : false,
          navLeft: nav ? Math.round(nav.getBoundingClientRect().left) : 0,
          navTop: nav ? Math.round(nav.getBoundingClientRect().top) : 0,
          resBtnTop: resBtn ? Math.round(resBtn.getBoundingClientRect().top) : 0,
          resBtnH: resBtn ? Math.round(resBtn.getBoundingClientRect().height) : 0,
          gapBetweenNavItems: (resBtn && commBtn) ? Math.round(commBtn.getBoundingClientRect().left - resBtn.getBoundingClientRect().right) : null,
          hasOverflow
        };
      })()
    `);

    console.log(`  Header height: ${vpMetrics.headerH}px`);
    console.log(`  Logo link reserved: ${vpMetrics.logoW}x${vpMetrics.logoH}px, Left: ${vpMetrics.logoLeft}px`);
    console.log(`  Rendered logo img: ${vpMetrics.logoImgW}x${vpMetrics.logoImgH}px (natural: ${vpMetrics.logoNaturalW}x${vpMetrics.logoNaturalH})`);
    console.log(`  Logo vertical center offset: ${vpMetrics.logoCenterOffset.toFixed(1)}px (Centered: ${vpMetrics.logoCenterOffset <= 2 ? 'PASS' : 'FAIL'})`);
    console.log(`  Logo src: ${vpMetrics.logoImgSrc}`);
    console.log(`  Horizontal overflow: ${vpMetrics.hasOverflow ? 'FAIL (overflow detected)' : 'PASS (no overflow)'}`);

    if (vp.width >= 1024) {
      console.log(`  Nav items visible: ${vpMetrics.navVisible}`);
      console.log(`  Nav left edge: ${vpMetrics.navLeft}px, Nav top: ${vpMetrics.navTop}px, Res btn top: ${vpMetrics.resBtnTop}px`);
      console.log(`  Gap between Residential and Commercial: ${vpMetrics.gapBetweenNavItems}px`);

      // Test hover open
      await browser.hover('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
      await new Promise(r => setTimeout(r, 400));

      const menuMetrics = await browser.evaluate(`
        (() => {
          const surface = document.querySelector('.samsung-nav-mega-surface');
          const grid = document.querySelector('.samsung-highlights-grid');
          const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
          const solGrid = document.querySelector('.samsung-solution-cards-grid');
          const solCards = Array.from(document.querySelectorAll('.samsung-solution-card'));
          const toObj = r => r ? { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) } : null;

          const rSurface = surface ? surface.getBoundingClientRect() : null;
          const cardRects = cards.map(c => toObj(c.getBoundingClientRect()));
          const distinctLefts = [...new Set(cardRects.map(c => c.left))].sort((a,b) => a - b);
          const distinctTops = [...new Set(cardRects.map(c => c.top))].sort((a,b) => a - b);
          const col1Cards = cards.filter(c => Math.abs(c.getBoundingClientRect().left - distinctLefts[0]) < 5);
          const col2Cards = cards.filter(c => Math.abs(c.getBoundingClientRect().left - distinctLefts[1]) < 5);

          return {
            isOpen: Boolean(surface),
            surfaceHeight: rSurface ? Math.round(rSurface.height) : 0,
            surfaceVhRatio: rSurface ? (rSurface.height / window.innerHeight).toFixed(2) : '0',
            cardsCount: cards.length,
            columnsCount: distinctLefts.length,
            rowsCount: distinctTops.length,
            col1Count: col1Cards.length,
            col2Count: col2Cards.length,
            col1Titles: col1Cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim()),
            col2Titles: col2Cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim()),
            solCardsCount: solCards.length,
            solGridW: solGrid ? Math.round(solGrid.getBoundingClientRect().width) : 0,
            highlightsGridW: grid ? Math.round(grid.getBoundingClientRect().width) : 0
          };
        })()
      `);

      console.log(`  Mega menu open on hover: ${menuMetrics.isOpen ? 'PASS' : 'FAIL'}`);
      console.log(`  Mega menu surface height: ${menuMetrics.surfaceHeight}px (${Math.round(menuMetrics.surfaceVhRatio * 100)}vh of viewport)`);
      console.log(`  Highlights layout: ${menuMetrics.columnsCount} columns × ${menuMetrics.rowsCount} rows (expected 2x4): ${menuMetrics.columnsCount === 2 && menuMetrics.rowsCount === 4 ? 'PASS' : 'FAIL'}`);
      console.log(`  Column 1 (${menuMetrics.col1Count} cards): ${menuMetrics.col1Titles.join(', ')}`);
      console.log(`  Column 2 (${menuMetrics.col2Count} cards): ${menuMetrics.col2Titles.join(', ')}`);
      console.log(`  Horizontal space balance: Highlights width=${menuMetrics.highlightsGridW}px, Solutions width=${menuMetrics.solGridW}px`);

      // Hover switch to Commercial
      await browser.hover('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
      await new Promise(r => setTimeout(r, 400));
      const commSwitch = await browser.evaluate(`
        (() => {
          const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
          const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
          const isComm = titles.some(t => t.includes('Commercial') || t.includes('Industrial'));
          return { isComm, titles: titles.slice(0, 4) };
        })()
      `);
      console.log(`  Instant switch to Commercial: ${commSwitch.isComm ? 'PASS' : 'FAIL'} (Titles: ${commSwitch.titles.join(', ')})`);

      // Close on pointer leave
      await browser.hover('.samsung-nav-backdrop');
      await new Promise(r => setTimeout(r, 400));
      const isClosed = await browser.evaluate(`!Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
      console.log(`  Closed on pointer exit: ${isClosed ? 'PASS' : 'FAIL'}`);
    }
  }

  await browser.close();
  console.log('\n==================================================================');
  console.log('FINAL VERIFICATION COMPLETED');
  console.log('==================================================================');
}

main().catch(console.error);
