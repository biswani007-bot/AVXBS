import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep, waitFor } from './helpers/test-env.mjs';

async function verifyNavbar() {
  const browser = new CDPBrowser();
  let hasFailure = false;

  try {
    console.log('\n======================================================');
    console.log('   AVXBS STRICT NAVBAR LAYOUT & ZERO CLS VERIFICATION');
    console.log('======================================================\n');

    await browser.launch(TEST_ENV.FRONTEND_URL);

    // Populate initial cache
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);

    // 1. Multiple Refresh Tests - Verify 0 Layout Shift
    console.log('[Test 1: Multiple Page Refreshes & Zero Layout Shift]');
    for (let i = 1; i <= 3; i++) {
      console.log(`  Refresh run ${i}...`);
      await browser.navigate(TEST_ENV.FRONTEND_URL, 0);

      // Measure at early paint (approx 150ms)
      await sleep(150);
      const early = await browser.evaluate(`
        (() => {
          const logo = document.querySelector('.header-logo-link');
          const header = document.querySelector('.site-header');
          const hamburger = document.querySelector('.header-menu-btn');
          const rLogo = logo?.getBoundingClientRect();
          const rHeader = header?.getBoundingClientRect();
          const rHamburger = hamburger?.getBoundingClientRect();
          return {
            logoW: Math.round(rLogo?.width || 0),
            logoH: Math.round(rLogo?.height || 0),
            logoL: Math.round(rLogo?.left || 0),
            headerH: Math.round(rHeader?.height || 0),
            hamburgerR: Math.round(rHamburger?.right || 0)
          };
        })()
      `);

      // Wait until fully settled (1200ms)
      await sleep(1050);
      const settled = await browser.evaluate(`
        (() => {
          const logo = document.querySelector('.header-logo-link');
          const header = document.querySelector('.site-header');
          const hamburger = document.querySelector('.header-menu-btn');
          const rLogo = logo?.getBoundingClientRect();
          const rHeader = header?.getBoundingClientRect();
          const rHamburger = hamburger?.getBoundingClientRect();
          return {
            logoW: Math.round(rLogo?.width || 0),
            logoH: Math.round(rLogo?.height || 0),
            logoL: Math.round(rLogo?.left || 0),
            headerH: Math.round(rHeader?.height || 0),
            hamburgerR: Math.round(rHamburger?.right || 0)
          };
        })()
      `);

      const wDiff = Math.abs(early.logoW - settled.logoW);
      const hDiff = Math.abs(early.logoH - settled.logoH);
      const lDiff = Math.abs(early.logoL - settled.logoL);
      const hamDiff = Math.abs(early.hamburgerR - settled.hamburgerR);

      console.log(`    Run ${i}: early logo=${early.logoW}x${early.logoH} left=${early.logoL} | settled logo=${settled.logoW}x${settled.logoH} left=${settled.logoL}`);
      if (wDiff > 1 || hDiff > 1 || lDiff > 1 || hamDiff > 1) {
        console.error(`    FAIL: Layout shift detected on run ${i} (wDiff=${wDiff}, hDiff=${hDiff}, lDiff=${lDiff}, hamDiff=${hamDiff})`);
        hasFailure = true;
      } else {
        console.log(`    PASS: Run ${i} strictly identical from first visible render.`);
      }
    }

    // 2. Viewport Geometry & Vertical Centering: Desktop (1440x900)
    console.log('\n[Test 2: Desktop 1440x900 Viewport Geometry]');
    await browser.setViewport(1440, 900, false);
    await sleep(300);

    const desktopGeom = await browser.evaluate(`
      (() => {
        const header = document.querySelector('.site-header');
        const container = document.querySelector('.header-container');
        const logo = document.querySelector('.header-logo-link');
        const search = document.querySelector('.navbar-search-container');
        const hamburger = document.querySelector('.header-menu-btn');
        const nav = document.querySelector('.header-primary-nav');

        const rHeader = header.getBoundingClientRect();
        const rLogo = logo.getBoundingClientRect();
        const rSearch = search.getBoundingClientRect();
        const rHamburger = hamburger.getBoundingClientRect();

        const headerCenterY = rHeader.top + (rHeader.height / 2);
        const logoCenterY = rLogo.top + (rLogo.height / 2);
        const searchCenterY = rSearch.top + (rSearch.height / 2);
        const hamburgerCenterY = rHamburger.top + (rHamburger.height / 2);

        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;

        return {
          headerH: Math.round(rHeader.height),
          logoW: Math.round(rLogo.width),
          logoH: Math.round(rLogo.height),
          logoLeft: Math.round(rLogo.left),
          hamburgerRight: Math.round(rHamburger.right),
          gapFromRightEdge: Math.round(window.innerWidth - rHamburger.right),
          searchRight: Math.round(rSearch.right),
          gapBetweenSearchAndHamburger: Math.round(rHamburger.left - rSearch.right),
          headerCenterY,
          logoCenterOffset: Math.abs(logoCenterY - headerCenterY),
          searchCenterOffset: Math.abs(searchCenterY - headerCenterY),
          hamburgerCenterOffset: Math.abs(hamburgerCenterY - headerCenterY),
          hasOverflow
        };
      })()
    `);

    console.log('  Logo dimensions:', desktopGeom.logoW + 'x' + desktopGeom.logoH, '(expected >= 130x65):', (desktopGeom.logoW >= 130 && desktopGeom.logoH >= 65) ? 'PASS' : 'FAIL');
    console.log('  Logo left edge position:', desktopGeom.logoLeft + 'px (expected <= 28px):', desktopGeom.logoLeft <= 28 ? 'PASS' : 'FAIL');
    console.log('  Hamburger right gap from viewport edge:', desktopGeom.gapFromRightEdge + 'px (expected between 20px and 45px):', (desktopGeom.gapFromRightEdge >= 20 && desktopGeom.gapFromRightEdge <= 45) ? 'PASS' : 'FAIL');
    console.log('  Gap between search bar and hamburger:', desktopGeom.gapBetweenSearchAndHamburger + 'px (expected ~16px):', Math.abs(desktopGeom.gapBetweenSearchAndHamburger - 16) <= 2 ? 'PASS' : 'FAIL');
    console.log('  Vertical Centering offsets: logo=' + desktopGeom.logoCenterOffset.toFixed(1) + 'px, search=' + desktopGeom.searchCenterOffset.toFixed(1) + 'px, hamburger=' + desktopGeom.hamburgerCenterOffset.toFixed(1) + 'px:', (desktopGeom.logoCenterOffset <= 2 && desktopGeom.searchCenterOffset <= 2 && desktopGeom.hamburgerCenterOffset <= 2) ? 'PASS' : 'FAIL');
    console.log('  Horizontal page overflow:', desktopGeom.hasOverflow ? 'FAIL (overflow detected)' : 'PASS (no overflow)');

    if (desktopGeom.logoW < 130 || desktopGeom.logoH < 65 || desktopGeom.logoLeft > 28 || desktopGeom.gapFromRightEdge > 45 || desktopGeom.hasOverflow) {
      hasFailure = true;
    }

    // 3. Viewport Geometry: Ultra-Wide (1920x1080)
    console.log('\n[Test 3: Ultra-Wide 1920x1080 Viewport]');
    await browser.setViewport(1920, 1080, false);
    await sleep(300);

    const wideGeom = await browser.evaluate(`
      (() => {
        const logo = document.querySelector('.header-logo-link');
        const hamburger = document.querySelector('.header-menu-btn');
        const rLogo = logo.getBoundingClientRect();
        const rHamburger = hamburger.getBoundingClientRect();
        const gapFromRightEdge = Math.round(window.innerWidth - rHamburger.right);
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        return {
          logoLeft: Math.round(rLogo.left),
          gapFromRightEdge,
          hasOverflow
        };
      })()
    `);

    console.log('  Logo left edge on 1920px:', wideGeom.logoLeft + 'px (expected <= 28px):', wideGeom.logoLeft <= 28 ? 'PASS' : 'FAIL');
    console.log('  Hamburger right gap on 1920px:', wideGeom.gapFromRightEdge + 'px (expected <= 45px):', wideGeom.gapFromRightEdge <= 45 ? 'PASS' : 'FAIL');
    console.log('  Horizontal overflow on 1920px:', wideGeom.hasOverflow ? 'FAIL' : 'PASS');

    if (wideGeom.logoLeft > 28 || wideGeom.gapFromRightEdge > 45 || wideGeom.hasOverflow) {
      hasFailure = true;
    }

    // 4. Viewport Geometry: Laptop (1024x768)
    console.log('\n[Test 4: Laptop 1024x768 Viewport]');
    await browser.setViewport(1024, 768, false);
    await sleep(300);

    const laptopGeom = await browser.evaluate(`
      (() => {
        const header = document.querySelector('.site-header');
        const logo = document.querySelector('.header-logo-link');
        const hamburger = document.querySelector('.header-menu-btn');
        const rLogo = logo.getBoundingClientRect();
        const rHamburger = hamburger.getBoundingClientRect();
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        return {
          headerH: header.offsetHeight,
          logoW: Math.round(rLogo.width),
          logoH: Math.round(rLogo.height),
          logoLeft: Math.round(rLogo.left),
          gapFromRightEdge: Math.round(window.innerWidth - rHamburger.right),
          hasOverflow
        };
      })()
    `);

    console.log('  Laptop header height:', laptopGeom.headerH + 'px, logo: ' + laptopGeom.logoW + 'x' + laptopGeom.logoH);
    console.log('  Laptop logo left:', laptopGeom.logoLeft + 'px, right gap:', laptopGeom.gapFromRightEdge + 'px');
    console.log('  Laptop horizontal overflow:', laptopGeom.hasOverflow ? 'FAIL' : 'PASS');
    if (laptopGeom.hasOverflow) hasFailure = true;

    // 5. Viewport Geometry: Tablet (768x1024)
    console.log('\n[Test 5: Tablet 768x1024 Viewport]');
    await browser.setViewport(768, 1024, true);
    await sleep(300);

    const tabletGeom = await browser.evaluate(`
      (() => {
        const header = document.querySelector('.site-header');
        const logo = document.querySelector('.header-logo-link');
        const hamburger = document.querySelector('.header-menu-btn');
        const searchBtn = document.querySelector('.navbar-search-mobile-toggle-btn');
        const rLogo = logo.getBoundingClientRect();
        const rHamburger = hamburger.getBoundingClientRect();
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        return {
          headerH: header.offsetHeight,
          logoW: Math.round(rLogo.width),
          logoH: Math.round(rLogo.height),
          logoLeft: Math.round(rLogo.left),
          searchBtnVisible: searchBtn ? window.getComputedStyle(searchBtn).display !== 'none' : false,
          gapFromRightEdge: Math.round(window.innerWidth - rHamburger.right),
          hasOverflow
        };
      })()
    `);

    console.log('  Tablet header height:', tabletGeom.headerH + 'px, logo: ' + tabletGeom.logoW + 'x' + tabletGeom.logoH);
    console.log('  Tablet search icon visible:', tabletGeom.searchBtnVisible ? 'PASS' : 'FAIL');
    console.log('  Tablet right gap:', tabletGeom.gapFromRightEdge + 'px');
    console.log('  Tablet horizontal overflow:', tabletGeom.hasOverflow ? 'FAIL' : 'PASS');
    if (!tabletGeom.searchBtnVisible || tabletGeom.hasOverflow) hasFailure = true;

    // 6. Viewport Geometry: Mobile (375x667)
    console.log('\n[Test 6: Mobile 375x667 Viewport]');
    await browser.setViewport(375, 667, true);
    await sleep(300);

    const mobileGeom = await browser.evaluate(`
      (() => {
        const header = document.querySelector('.site-header');
        const logo = document.querySelector('.header-logo-link');
        const hamburger = document.querySelector('.header-menu-btn');
        const searchBtn = document.querySelector('.navbar-search-mobile-toggle-btn');
        const rLogo = logo.getBoundingClientRect();
        const rHamburger = hamburger.getBoundingClientRect();
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        return {
          headerH: header.offsetHeight,
          logoW: Math.round(rLogo.width),
          logoH: Math.round(rLogo.height),
          logoLeft: Math.round(rLogo.left),
          searchBtnVisible: searchBtn ? window.getComputedStyle(searchBtn).display !== 'none' : false,
          gapFromRightEdge: Math.round(window.innerWidth - rHamburger.right),
          hasOverflow
        };
      })()
    `);

    console.log('  Mobile header height:', mobileGeom.headerH + 'px, logo: ' + mobileGeom.logoW + 'x' + mobileGeom.logoH);
    console.log('  Mobile search icon visible:', mobileGeom.searchBtnVisible ? 'PASS' : 'FAIL');
    console.log('  Mobile right gap:', mobileGeom.gapFromRightEdge + 'px');
    console.log('  Mobile horizontal overflow:', mobileGeom.hasOverflow ? 'FAIL' : 'PASS');
    if (!mobileGeom.searchBtnVisible || mobileGeom.hasOverflow) hasFailure = true;

    // 7. Interactive Features Preservation: Search & Drawer
    console.log('\n[Test 7: Search & Drawer Interactive Preservation]');
    await browser.setViewport(1440, 900, false);
    await sleep(300);

    // Search bar typing and dropdown
    await browser.evaluate(`
      (() => {
        const input = document.querySelector('.navbar-search-input');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'Water');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('focus', { bubbles: true }));
        }
      })()
    `);
    await sleep(700);

    const searchState = await browser.evaluate(`
      (() => {
        const dropdown = document.querySelector('.navbar-search-dropdown-menu');
        const isVisible = dropdown && window.getComputedStyle(dropdown).display !== 'none';
        return { isVisible };
      })()
    `);
    console.log('  Search results dropdown renders on query:', searchState.isVisible ? 'PASS' : 'FAIL');
    if (!searchState.isVisible) hasFailure = true;

    // Toggle hamburger drawer
    await browser.evaluate(`
      document.querySelector('.header-menu-btn')?.click()
    `);
    await sleep(400);

    const drawerState = await browser.evaluate(`
      (() => {
        const drawer = document.querySelector('.nav-drawer, .site-header.drawer-active');
        return { isOpen: Boolean(drawer) };
      })()
    `);
    console.log('  Hamburger opens navigation drawer:', drawerState.isOpen ? 'PASS' : 'FAIL');
    if (!drawerState.isOpen) hasFailure = true;

    // Close drawer
    await browser.evaluate(`
      document.querySelector('.header-menu-btn')?.click()
    `);
    await sleep(300);

  } catch (err) {
    console.error('Fatal Verification Error:', err);
    hasFailure = true;
  } finally {
    await browser.close();
    if (hasFailure) {
      console.error('\nNavbar strict verification FAILED.');
      process.exit(1);
    } else {
      console.log('\nAll Navbar layout and CLS requirements PASSED.');
    }
  }
}

verifyNavbar();
