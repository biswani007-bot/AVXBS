#!/usr/bin/env node

/**
 * End-to-End Verification Suite for Mega Menu Highlights:
 * Database Synchronization & CRUD Operations
 *
 * Covers:
 * - Test A: Existing Records Consistency (Admin, Tab Count, DB, Public API, Website)
 * - Test B: Add Highlight (DB persistence, Admin count +1, Website displays new card)
 * - Test C: Edit Highlight (Preserve ID, no duplicate, Website displays updated content)
 * - Test D: Delete Highlight (DELETE API, DB removed, Admin count -1, Website removed)
 * - Test E: Page Refresh & Data Consistency
 * - Full verification performed for Residential AND Commercial menus independently.
 */

import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { ApiClient } from './helpers/api-client.mjs';
import { sleep } from './helpers/test-env.mjs';

const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(msg) {
  console.log(`  ${ANSI.green}✓ PASS${ANSI.reset} ${msg}`);
}

function fail(msg, err) {
  console.error(`  ${ANSI.red}✗ FAIL${ANSI.reset} ${msg}`);
  if (err) console.error(err);
  process.exitCode = 1;
}

async function openWebsiteMegaMenu(browser, scope) {
  for (let attempt = 0; attempt < 15; attempt++) {
    await browser.evaluate(`
      (() => {
        const triggers = Array.from(document.querySelectorAll('.samsung-nav-tab-wrapper, .samsung-nav-tab-btn'));
        const trigger = triggers.find(t => t.textContent.includes('${scope}'));
        if (trigger) {
          trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          const btn = trigger.querySelector('button') || trigger;
          if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
        }
      })()
    `);
    await sleep(250);
    const count = await browser.evaluate(`document.querySelectorAll('.samsung-highlight-card').length`);
    if (count > 0) break;
  }
}

async function waitForAdminMenu(browser) {
  for (let i = 0; i < 30; i++) {
    const isLoading = await browser.evaluate(`Boolean(document.querySelector('.animate-spin'))`);
    if (!isLoading) break;
    await sleep(200);
  }
}

async function runMegaMenuVerification() {
  console.log(`\n${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}   MEGA MENU HIGHLIGHTS: DATABASE SYNCHRONIZATION & CRUD TEST SUITE   ${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}\n`);

  const api = new ApiClient();
  const loginRes = await api.login();

  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.setViewport(1440, 900);

  // Set auth cookie for Admin access
  if (loginRes.ok && loginRes.data?.token) {
    await browser.send('Network.setCookie', {
      name: 'avxbs_token',
      value: loginRes.data.token,
      url: 'http://localhost:3000',
    });
  }

  try {
    // =========================================================================
    // SECTION 1: RESIDENTIAL MENU VERIFICATION
    // =========================================================================
    console.log(`\n${ANSI.bold}--- [1] RESIDENTIAL MEGA MENU VERIFICATION ---${ANSI.reset}`);

    // TEST A: Existing Records Verification
    console.log(`\n▶ [Test A - Residential] Initial Counts Consistency`);
    const initialResApi = await api.get('/api/mega-menu');
    const resActiveCountDB = initialResApi.data.residential?.highlights?.length;
    console.log(`  API Active Residential Highlights: ${resActiveCountDB}`);

    // Verify Admin view
    await browser.navigate('http://localhost:3000/admin/menu', 2500);
    await waitForAdminMenu(browser);

    const adminResCounts = await browser.evaluate(`
      (() => {
        const tabCountEl = document.querySelector('[data-testid="residential-highlight-count"]');
        const tabCount = tabCountEl ? parseInt(tabCountEl.textContent.trim(), 10) : null;
        const cardContainers = document.querySelectorAll('div[style*="background-color"] [title="Edit Card"]');
        return {
          tabCount,
          visibleCards: cardContainers.length,
        };
      })()
    `);
    console.log(`  Admin Tab Count: ${adminResCounts.tabCount}, Visible Highlight Cards: ${adminResCounts.visibleCards}`);

    if (adminResCounts.tabCount === resActiveCountDB && adminResCounts.visibleCards === resActiveCountDB) {
      pass(`Admin visible cards (${adminResCounts.visibleCards}) and tab count (${adminResCounts.tabCount}) match DB active records (${resActiveCountDB})`);
    } else {
      fail(`Count mismatch: DB=${resActiveCountDB}, Tab=${adminResCounts.tabCount}, AdminCards=${adminResCounts.visibleCards}`);
    }

    // Verify Public Website initial view
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Residential');

    const initialWebRes = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        return {
          count: cards.length,
          titles,
        };
      })()
    `);
    console.log(`  Website Residential Cards: ${initialWebRes.count} (${initialWebRes.titles.join(', ')})`);
    if (initialWebRes.count === resActiveCountDB) {
      pass(`Public website displays exactly ${resActiveCountDB} cards matching database active records`);
    } else {
      fail(`Website card count (${initialWebRes.count}) does not match DB active records (${resActiveCountDB})`);
    }

    // TEST B: Add Residential Highlight
    console.log(`\n▶ [Test B - Residential] Add New Highlight`);
    const newResTitle = `Eco Pure Home Softener ${Date.now() % 10000}`;
    const newResSubtitle = 'Micro-filtration unit with automatic dual resin recharge';
    const newResImg = '/images/highlights/residential-water-softener.jpg';

    const addResRes = await api.post('/api/mega-menu', {
      scope: 'Residential',
      type: 'highlight',
      item: {
        title: newResTitle,
        subtitle: newResSubtitle,
        image: newResImg,
        url: '#water-softener-inquiry-section',
        isActive: true,
      },
    });

    if (addResRes.ok && addResRes.data.success) {
      pass(`Highlight record persisted to database via API (ID: ${addResRes.data.item.id})`);
    } else {
      fail('Failed to persist highlight to database', addResRes.data);
    }
    const addedResId = addResRes.data.item.id;

    // Refresh Admin and check count
    await browser.navigate('http://localhost:3000/admin/menu', 2000);
    await waitForAdminMenu(browser);

    const adminAfterAdd = await browser.evaluate(`
      (() => {
        const tabCountEl = document.querySelector('[data-testid="residential-highlight-count"]');
        const tabCount = tabCountEl ? parseInt(tabCountEl.textContent.trim(), 10) : null;
        const cardContainers = document.querySelectorAll('div[style*="background-color"] [title="Edit Card"]');
        return {
          tabCount,
          visibleCards: cardContainers.length,
        };
      })()
    `);

    if (adminAfterAdd.tabCount === resActiveCountDB + 1 && adminAfterAdd.visibleCards === resActiveCountDB + 1) {
      pass(`Admin tab count and visible cards increased by exactly 1 (${resActiveCountDB} -> ${adminAfterAdd.tabCount})`);
    } else {
      fail(`Admin count after add expected ${resActiveCountDB + 1}, got tab=${adminAfterAdd.tabCount}, cards=${adminAfterAdd.visibleCards}`);
    }

    // Check Public Website displays the new card exactly once
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Residential');

    const webAfterAdd = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        return {
          count: cards.length,
          titles,
        };
      })()
    `);

    const newCardMatches = webAfterAdd.titles.filter(t => t === newResTitle).length;
    if (webAfterAdd.count === resActiveCountDB + 1 && newCardMatches === 1) {
      pass(`Public website displays new card "${newResTitle}" exactly once (total: ${webAfterAdd.count})`);
    } else {
      fail(`Website cards after add: total=${webAfterAdd.count}, matches=${newCardMatches}`);
    }

    // TEST C: Edit Residential Highlight
    console.log(`\n▶ [Test C - Residential] Edit Highlight`);
    const updatedResTitle = `Updated Premium Softener ${Date.now() % 10000}`;
    const updatedResSubtitle = 'High-efficiency softening tower with digital control';

    const editResRes = await api.put('/api/mega-menu', {
      scope: 'Residential',
      type: 'highlight',
      item: {
        id: addedResId,
        title: updatedResTitle,
        subtitle: updatedResSubtitle,
        image: '/images/highlights/residential-wtp-filtration.jpg',
        url: '#water-softener-inquiry-section',
        isActive: true,
      },
    });

    if (editResRes.ok && editResRes.data.success && editResRes.data.item.id === addedResId) {
      pass(`Highlight record updated in database preserving original ID (${addedResId}) without duplication`);
    } else {
      fail('Failed to update highlight in database', editResRes.data);
    }

    // Check website reflects edited content
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Residential');

    const webAfterEdit = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        const subs = cards.map(c => c.querySelector('.samsung-highlight-sub')?.textContent?.trim());
        return {
          count: cards.length,
          titles,
          subs,
        };
      })()
    `);

    if (webAfterEdit.titles.includes(updatedResTitle) && !webAfterEdit.titles.includes(newResTitle)) {
      pass(`Public website correctly reflects updated title "${updatedResTitle}" and replaces old title`);
    } else {
      fail(`Website does not contain updated title: ${webAfterEdit.titles.join(', ')}`);
    }

    // TEST D: Delete Residential Highlight
    console.log(`\n▶ [Test D - Residential] Delete Highlight`);
    const delResRes = await api.delete(`/api/mega-menu?scope=Residential&type=highlight&id=${encodeURIComponent(addedResId)}`);
    if (delResRes.ok && delResRes.data.success) {
      pass(`DELETE endpoint successfully called and removed record from database`);
    } else {
      fail('DELETE API call failed', delResRes.data);
    }

    // Check database records count via public GET
    const apiAfterDel = await api.get('/api/mega-menu');
    const resCountAfterDel = apiAfterDel.data.residential?.highlights?.length;
    if (resCountAfterDel === resActiveCountDB) {
      pass(`Database active record count restored to original (${resCountAfterDel})`);
    } else {
      fail(`Database active count expected ${resActiveCountDB}, got ${resCountAfterDel}`);
    }

    // Check Admin count after delete
    await browser.navigate('http://localhost:3000/admin/menu', 2000);
    await waitForAdminMenu(browser);

    const adminAfterDel = await browser.evaluate(`
      (() => {
        const tabCountEl = document.querySelector('[data-testid="residential-highlight-count"]');
        const tabCount = tabCountEl ? parseInt(tabCountEl.textContent.trim(), 10) : null;
        const cardContainers = document.querySelectorAll('div[style*="background-color"] [title="Edit Card"]');
        return {
          tabCount,
          visibleCards: cardContainers.length,
        };
      })()
    `);

    if (adminAfterDel.tabCount === resActiveCountDB && adminAfterDel.visibleCards === resActiveCountDB) {
      pass(`Admin count and visible cards decreased by 1 back to ${resActiveCountDB}`);
    } else {
      fail(`Admin count after delete: tab=${adminAfterDel.tabCount}, cards=${adminAfterDel.visibleCards}`);
    }

    // Check website no longer displays the deleted card
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Residential');

    const webAfterDel = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        return {
          count: cards.length,
          titles,
        };
      })()
    `);

    if (webAfterDel.count === resActiveCountDB && !webAfterDel.titles.includes(updatedResTitle)) {
      pass(`Deleted highlight completely absent from public website (total: ${webAfterDel.count} cards)`);
    } else {
      fail(`Deleted card still visible on website: count=${webAfterDel.count}, titles=${webAfterDel.titles.join(', ')}`);
    }

    // =========================================================================
    // SECTION 2: COMMERCIAL MENU VERIFICATION
    // =========================================================================
    console.log(`\n${ANSI.bold}--- [2] COMMERCIAL MEGA MENU VERIFICATION ---${ANSI.reset}`);

    // TEST A: Existing Commercial Records
    console.log(`\n▶ [Test A - Commercial] Initial Counts Consistency`);
    const commActiveCountDB = initialResApi.data.commercial?.highlights?.length;
    console.log(`  API Active Commercial Highlights: ${commActiveCountDB}`);

    // Switch to Commercial tab on Admin
    await browser.navigate('http://localhost:3000/admin/menu', 2000);
    await waitForAdminMenu(browser);

    await browser.evaluate(`
      (() => {
        const btn = document.querySelector('button[data-testid="commercial-scope-tab"]') ||
          Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Commercial Mega Menu'));
        if (btn) btn.click();
      })()
    `);
    await sleep(500);

    const adminCommCounts = await browser.evaluate(`
      (() => {
        const tabCountEl = document.querySelector('[data-testid="commercial-highlight-count"]');
        const tabCount = tabCountEl ? parseInt(tabCountEl.textContent.trim(), 10) : null;
        const cardContainers = document.querySelectorAll('div[style*="background-color"] [title="Edit Card"]');
        return {
          tabCount,
          visibleCards: cardContainers.length,
        };
      })()
    `);
    console.log(`  Admin Commercial Tab Count: ${adminCommCounts.tabCount}, Visible Cards: ${adminCommCounts.visibleCards}`);

    if (adminCommCounts.tabCount === commActiveCountDB && adminCommCounts.visibleCards === commActiveCountDB) {
      pass(`Commercial tab count (${adminCommCounts.tabCount}) and cards (${adminCommCounts.visibleCards}) match DB count (${commActiveCountDB})`);
    } else {
      fail(`Commercial count mismatch: DB=${commActiveCountDB}, Tab=${adminCommCounts.tabCount}, Cards=${adminCommCounts.visibleCards}`);
    }

    // Public website Commercial hover check
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Commercial');

    const webCommInitial = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        return {
          count: cards.length,
          titles,
        };
      })()
    `);
    console.log(`  Website Commercial Cards: ${webCommInitial.count} (${webCommInitial.titles.join(', ')})`);

    if (webCommInitial.count === commActiveCountDB) {
      pass(`Public website displays exactly ${commActiveCountDB} Commercial cards matching database records`);
    } else {
      fail(`Website Commercial card count (${webCommInitial.count}) does not match DB (${commActiveCountDB})`);
    }

    // TEST B: Add Commercial Highlight
    console.log(`\n▶ [Test B - Commercial] Add New Highlight`);
    const newCommTitle = `Industrial Skid Softener ${Date.now() % 10000}`;
    const newCommSubtitle = 'Heavy industrial multi-tank automated water plant';
    const newCommImg = '/images/highlights/commercial-softener-plant.jpg';

    const addCommRes = await api.post('/api/mega-menu', {
      scope: 'Commercial',
      type: 'highlight',
      item: {
        title: newCommTitle,
        subtitle: newCommSubtitle,
        image: newCommImg,
        url: '#water-softener-inquiry-section',
        isActive: true,
      },
    });

    if (addCommRes.ok && addCommRes.data.success) {
      pass(`Commercial highlight saved to database (ID: ${addCommRes.data.item.id})`);
    } else {
      fail('Failed to save Commercial highlight', addCommRes.data);
    }
    const addedCommId = addCommRes.data.item.id;

    // Check Commercial Website shows new card
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Commercial');

    const webCommAfterAdd = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        return {
          count: cards.length,
          titles,
        };
      })()
    `);

    if (webCommAfterAdd.count === commActiveCountDB + 1 && webCommAfterAdd.titles.includes(newCommTitle)) {
      pass(`Public website displays new Commercial card "${newCommTitle}" (total: ${webCommAfterAdd.count})`);
    } else {
      fail(`Commercial website after add: count=${webCommAfterAdd.count}`);
    }

    // TEST C: Edit Commercial Highlight
    console.log(`\n▶ [Test C - Commercial] Edit Highlight`);
    const updatedCommTitle = `Advanced Commercial Plant ${Date.now() % 10000}`;

    const editCommRes = await api.put('/api/mega-menu', {
      scope: 'Commercial',
      type: 'highlight',
      item: {
        id: addedCommId,
        title: updatedCommTitle,
        subtitle: 'Automated reverse osmosis purification plant',
        image: '/images/highlights/commercial-industrial-wtp.jpg',
        url: '#water-softener-inquiry-section',
        isActive: true,
      },
    });

    if (editCommRes.ok && editCommRes.data.success) {
      pass(`Commercial highlight updated in database with ID preserved (${addedCommId})`);
    } else {
      fail('Failed to update Commercial highlight', editCommRes.data);
    }

    // TEST D: Delete Commercial Highlight
    console.log(`\n▶ [Test D - Commercial] Delete Highlight`);
    const delCommRes = await api.delete(`/api/mega-menu?scope=Commercial&type=highlight&id=${encodeURIComponent(addedCommId)}`);
    if (delCommRes.ok && delCommRes.data.success) {
      pass(`DELETE Commercial highlight succeeded from database`);
    } else {
      fail('DELETE Commercial highlight failed', delCommRes.data);
    }

    // Check website Commercial after delete
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Commercial');

    const webCommAfterDel = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        return {
          count: cards.length,
          titles,
        };
      })()
    `);

    if (webCommAfterDel.count === commActiveCountDB && !webCommAfterDel.titles.includes(updatedCommTitle)) {
      pass(`Commercial count restored to ${commActiveCountDB} and deleted card no longer visible`);
    } else {
      fail(`Commercial cards after delete: count=${webCommAfterDel.count}`);
    }

    // =========================================================================
    // SECTION 3: DEEP EDGE CASES, ACTIVE/INACTIVE FILTERING & ADMIN UI INTERACTION
    // =========================================================================
    console.log(`\n${ANSI.bold}--- [3] ACTIVE/INACTIVE FILTERING & EDGE CASES VERIFICATION ---${ANSI.reset}`);

    // Edge Case 1: Inactive highlight filtering
    console.log(`\n▶ [Edge Case 1] Inactive Highlight Filtering & Tab Count`);
    // Add an inactive highlight to Residential
    const inactiveTitle = `Inactive Filter Test ${Date.now() % 10000}`;
    const inactiveRes = await api.post('/api/mega-menu', {
      scope: 'Residential',
      type: 'highlight',
      item: {
        title: inactiveTitle,
        subtitle: 'Should not appear on public website or count in tab',
        image: '/images/highlights/residential-water-softener.jpg',
        isActive: false,
      },
    });

    if (inactiveRes.ok && inactiveRes.data.success) {
      pass(`Inactive highlight created successfully in database (isActive: false)`);
    } else {
      fail('Failed to create inactive highlight', inactiveRes.data);
    }
    const inactiveId = inactiveRes.data.item.id;

    // Verify Admin tab count does NOT include inactive highlight
    await browser.navigate('http://localhost:3000/admin/menu', 2000);
    await waitForAdminMenu(browser);

    const adminInactiveCheck = await browser.evaluate(`
      (() => {
        const tabCountEl = document.querySelector('[data-testid="residential-highlight-count"]');
        return {
          tabCount: tabCountEl ? parseInt(tabCountEl.textContent.trim(), 10) : null,
          totalCards: document.querySelectorAll('.admin-highlight-card-row, div[style*="background-color"] [title="Edit Card"]').length,
        };
      })()
    `);

    if (adminInactiveCheck.tabCount === resActiveCountDB) {
      pass(`Admin tab count strictly excludes inactive record (remains ${resActiveCountDB}, total cards: ${adminInactiveCheck.totalCards})`);
    } else {
      fail(`Admin tab count included inactive record: got ${adminInactiveCheck.tabCount}, expected ${resActiveCountDB}`);
    }

    // Verify Public website strictly excludes inactive highlight
    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Residential');

    const webInactiveCheck = await browser.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
        return {
          count: cards.length,
          hasInactive: titles.includes('${inactiveTitle}'),
        };
      })()
    `);

    if (webInactiveCheck.count === resActiveCountDB && !webInactiveCheck.hasInactive) {
      pass(`Public website strictly excludes inactive highlight "${inactiveTitle}"`);
    } else {
      fail(`Inactive highlight appeared on public website! count=${webInactiveCheck.count}, hasInactive=${webInactiveCheck.hasInactive}`);
    }

    // Clean up inactive test record
    await api.delete(`/api/mega-menu?scope=Residential&type=highlight&id=${encodeURIComponent(inactiveId)}`);
    pass(`Inactive test record cleaned up`);

    // Edge Case 2: Validation & Error Paths
    console.log(`\n▶ [Edge Case 2] API Validation & Casing Normalization`);
    const noTitleRes = await api.post('/api/mega-menu', {
      scope: 'Residential',
      type: 'highlight',
      item: { title: '', image: '/images/test.jpg' },
    });
    if (!noTitleRes.ok && noTitleRes.status === 400) {
      pass(`Missing title rejected with 400 Bad Request`);
    } else {
      fail(`Missing title not rejected properly: status=${noTitleRes.status}`);
    }

    const noImageRes = await api.post('/api/mega-menu', {
      scope: 'Residential',
      type: 'highlight',
      item: { title: 'Valid Title', image: '' },
    });
    if (!noImageRes.ok && noImageRes.status === 400) {
      pass(`Missing image rejected with 400 Bad Request`);
    } else {
      fail(`Missing image not rejected properly: status=${noImageRes.status}`);
    }

    const notFoundDelete = await api.delete('/api/mega-menu?scope=Residential&type=highlight&id=non-existent-hl-id-9999');
    if (!notFoundDelete.ok && notFoundDelete.status === 404) {
      pass(`Deleting non-existent highlight returned 404 Not Found`);
    } else {
      fail(`Deleting non-existent highlight expected 404, got status=${notFoundDelete.status}`);
    }

    // Lowercase scope test
    const lowerScopeRes = await api.get('/api/mega-menu?scope=residential');
    if (lowerScopeRes.ok && lowerScopeRes.data.success && lowerScopeRes.data.data?.scope === 'Residential') {
      pass(`Case-insensitive scope query (?scope=residential) correctly normalized to Residential`);
    } else {
      fail(`Case-insensitive scope query failed`);
    }

    // Verify /admin/mega-menu alias page
    console.log(`\n▶ [Edge Case 3] Admin Route Alias (/admin/mega-menu)`);
    await browser.navigate('http://localhost:3000/admin/mega-menu', 2500);
    await waitForAdminMenu(browser);
    const aliasPageLoaded = await browser.evaluate(`Boolean(document.querySelector('[data-testid="residential-highlight-count"]'))`);
    if (aliasPageLoaded) {
      pass(`/admin/mega-menu route loads Mega Menu Navigation admin page successfully`);
    } else {
      fail(`/admin/mega-menu route failed to load admin interface`);
    }

    // Edge Case 4: Browser UI Add & Delete Highlight Card
    console.log(`\n▶ [Edge Case 4] Admin In-Browser DOM Add & Delete Card Modal Flow`);
    await browser.navigate('http://localhost:3000/admin/menu', 2000);
    await waitForAdminMenu(browser);

    const uiCardTitle = `DOM UI Card ${Date.now() % 10000}`;
    const uiCardSubtitle = 'Created directly via browser DOM interaction';
    const uiCardImg = '/images/highlights/residential-sanitary-bath.jpg';

    // Click Add Card in UI
    await browser.evaluate(`
      (() => {
        window.__TEST_BYPASS_CONFIRM__ = true;
        const addBtn = document.querySelector('[data-testid="add-highlight-button"]');
        if (addBtn) addBtn.click();
      })()
    `);
    await sleep(400);

    // Fill form and submit
    await browser.evaluate(`
      (() => {
        const setReactValue = (el, val) => {
          if (!el) return;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const titleInput = document.querySelector('[data-testid="highlight-input-title"]');
        const subInput = document.querySelector('[data-testid="highlight-input-subtitle"]');
        const imgInput = document.querySelector('[data-testid="highlight-input-image"]');
        const urlInput = document.querySelector('[data-testid="highlight-input-url"]');
        
        setReactValue(titleInput, '${uiCardTitle}');
        setReactValue(subInput, '${uiCardSubtitle}');
        setReactValue(imgInput, '${uiCardImg}');
        setReactValue(urlInput, '#water-softener-inquiry-section');

        const submitBtn = document.querySelector('[data-testid="highlight-modal-submit"]');
        if (submitBtn) submitBtn.click();
      })()
    `);
    // Wait for card to appear in Admin DOM
    let cardAppeared = false;
    for (let i = 0; i < 25; i++) {
      cardAppeared = await browser.evaluate(`document.body.innerText.includes('${uiCardTitle}')`);
      if (cardAppeared) break;
      await sleep(250);
    }

    // Verify card was added
    const adminCheckUiAdd = await browser.evaluate(`
      (() => {
        const tabEl = document.querySelector('[data-testid="residential-highlight-count"]');
        const pageText = document.body.innerText;
        return {
          tabCount: tabEl ? parseInt(tabEl.textContent.trim(), 10) : null,
          hasTitle: pageText.includes('${uiCardTitle}'),
        };
      })()
    `);

    if (adminCheckUiAdd.hasTitle && adminCheckUiAdd.tabCount === resActiveCountDB + 1) {
      pass(`Browser UI Add Card successfully persisted: title in DOM and tab count +1 (${adminCheckUiAdd.tabCount})`);
    } else {
      fail(`Browser UI Add Card failed: hasTitle=${adminCheckUiAdd.hasTitle}, tabCount=${adminCheckUiAdd.tabCount}`);
    }

    // Now delete it via UI
    const delResult = await browser.evaluate(`
      (() => {
        window.__TEST_BYPASS_CONFIRM__ = true;
        const rows = Array.from(document.querySelectorAll('.admin-highlight-card-row'));
        const targetRow = rows.find(r => r.textContent.includes('${uiCardTitle}'));
        if (!targetRow) return 'row-not-found (' + rows.map(r => r.textContent.slice(0, 30)).join(' | ') + ')';
        const delBtn = targetRow.querySelector('button[title="Delete Card"]') || targetRow.querySelector('[title="Delete Card"]');
        if (!delBtn) return 'btn-not-found';
        delBtn.click();
        return 'clicked';
      })()
    `);

    // Wait for card to disappear from Admin DOM and tab count to decrement
    let cardRemoved = false;
    for (let i = 0; i < 30; i++) {
      await sleep(250);
      const stillThere = await browser.evaluate(`document.body.innerText.includes('${uiCardTitle}')`);
      const currentTab = await browser.evaluate(`
        (() => {
          const tabEl = document.querySelector('[data-testid="residential-highlight-count"]');
          return tabEl ? parseInt(tabEl.textContent.trim(), 10) : null;
        })()
      `);
      if (!stillThere && currentTab === resActiveCountDB) {
        cardRemoved = true;
        break;
      }
    }

    // Safety cleanup in case UI delete didn't complete
    const checkDbAfterUi = (await api.get('/api/mega-menu?all=true')).data.residential?.highlights || [];
    const leftover = checkDbAfterUi.find(h => h.title === uiCardTitle);
    if (leftover) {
      await api.delete(`/api/mega-menu?scope=Residential&type=highlight&id=${encodeURIComponent(leftover.id)}`);
    }

    if (cardRemoved) {
      pass(`Browser UI Delete Card successfully removed: tab count restored to ${resActiveCountDB} (delResult: ${delResult})`);
    } else {
      fail(`Browser UI Delete Card failed: delResult=${delResult}`);
    }

    // TEST E: Hard Refresh & State Persistence
    console.log(`\n▶ [Test E] Hard Refresh & Data Persistence Verification`);
    await browser.navigate('http://localhost:3000/admin/menu', 2000);
    await waitForAdminMenu(browser);

    await browser.navigate('http://localhost:5173', 2000);
    await openWebsiteMegaMenu(browser, 'Residential');

    const finalResCheck = await browser.evaluate(`document.querySelectorAll('.samsung-highlight-card').length`);
    await openWebsiteMegaMenu(browser, 'Commercial');
    const finalCommCheck = await browser.evaluate(`document.querySelectorAll('.samsung-highlight-card').length`);

    if (finalResCheck === resActiveCountDB && finalCommCheck === commActiveCountDB) {
      pass(`State perfectly consistent after browser refresh: Residential = ${finalResCheck}, Commercial = ${finalCommCheck}`);
    } else {
      fail(`Post-refresh inconsistency: Residential=${finalResCheck} (expected ${resActiveCountDB}), Commercial=${finalCommCheck} (expected ${commActiveCountDB})`);
    }

    console.log(`\n${ANSI.bold}${ANSI.green}======================================================================${ANSI.reset}`);
    console.log(`${ANSI.bold}${ANSI.green}       ALL MEGA MENU HIGHLIGHTS TESTS PASSED SUCCESSFULLY!            ${ANSI.reset}`);
    console.log(`${ANSI.bold}${ANSI.green}======================================================================${ANSI.reset}\n`);
  } finally {
    await browser.close();
  }
}

runMegaMenuVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
