import { CDPBrowser } from '../helpers/cdp-browser.mjs';
import { TestContext, expect } from '../helpers/test-reporter.mjs';
import { TEST_ENV, sleep, waitFor } from '../helpers/test-env.mjs';

export async function runR2Suite() {
  const ctx = new TestContext('R2: Navbar Residential & Commercial Button Elevation & Mega-Menus');
  const browser = new CDPBrowser();

  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);
    await waitFor(async () => {
      const btns = await browser.querySelectorAll('.samsung-nav-tab-btn');
      return btns && btns.length >= 2;
    }, 12000, 250, 'Navbar buttons hydration');

    // Test 1: Residential & Commercial tab buttons exist
    await ctx.it('Residential and Commercial nav tab buttons exist in Header', async () => {
      const navButtons = await browser.querySelectorAll('.samsung-nav-tab-btn');
      expect(navButtons.length >= 2, 'Should have at least 2 nav tab buttons (Residential, Commercial)').toBe(true);

      const buttonTexts = navButtons.map((b) => b.textContent);
      const hasResidential = buttonTexts.some((t) => t.includes('Residential'));
      const hasCommercial = buttonTexts.some((t) => t.includes('Commercial'));
      expect(hasResidential, 'Residential nav item must exist').toBe(true);
      expect(hasCommercial, 'Commercial nav item must exist').toBe(true);
    });

    // Test 2: No box shadow on Residential & Commercial buttons
    await ctx.it('Residential and Commercial nav buttons have no box shadow or button-like elevation', async () => {
      const shadowCheck = await browser.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('.samsung-nav-tab-btn'));
          return btns.map(b => {
            const cs = window.getComputedStyle(b);
            return {
              text: b.textContent.trim(),
              boxShadow: cs.boxShadow,
              borderStyle: cs.borderStyle,
              backgroundColor: cs.backgroundColor
            };
          });
        })()
      `);

      for (const item of shadowCheck) {
        const isNone = item.boxShadow === 'none' ||
          item.boxShadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' ||
          item.boxShadow.includes('rgba(0, 0, 0, 0)');
        expect(isNone, `Nav button "${item.text}" should have box-shadow: none (was: ${item.boxShadow})`).toBe(true);
      }
    });

    // Test 3: Hover state maintains box-shadow: none
    await ctx.it('Hover state on nav buttons remains flat without box-shadow elevation', async () => {
      await browser.hover('.samsung-nav-tab-btn');
      await sleep(200);

      const hoverShadow = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.samsung-nav-tab-btn');
          const cs = window.getComputedStyle(btn);
          return cs.boxShadow;
        })()
      `);

      const isNone = hoverShadow === 'none' ||
        hoverShadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' ||
        hoverShadow.includes('rgba(0, 0, 0, 0)');
      expect(isNone, 'Hovered nav button should retain box-shadow: none').toBe(true);

      await browser.mouseLeave('.samsung-nav-tab-btn');
      await sleep(200);
    });

    // Test 4: Active indicator underline exists
    await ctx.it('Active state preserves active underline indicator', async () => {
      const hasIndicator = await browser.evaluate(`
        (() => {
          const indicators = document.querySelectorAll('.samsung-nav-tab-btn .nav-tab-indicator');
          return indicators.length >= 2;
        })()
      `);
      expect(hasIndicator, 'Nav buttons should contain .nav-tab-indicator elements').toBe(true);
    });

    // Test 5: Mega-menu opens on Residential hover/trigger
    await ctx.it('Triggering Residential nav opens Residential mega-menu with solutions', async () => {
      // Trigger Residential mega menu via hover / mouseenter on trigger wrapper
      await browser.evaluate(`
        (() => {
          const triggers = Array.from(document.querySelectorAll('.samsung-nav-tab-wrapper, .samsung-nav-tab-btn'));
          const resTrigger = triggers.find(t => t.textContent.includes('Residential'));
          if (resTrigger) {
            resTrigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            const btn = resTrigger.querySelector('button') || resTrigger;
            if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
          }
        })()
      `);
      await sleep(400);

      const megaState = await browser.evaluate(`
        (() => {
          const mega = document.querySelector('.samsung-nav-mega-container');
          if (!mega) return { exists: false };
          const cs = window.getComputedStyle(mega);
          const isVisible = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0;
          const text = mega.innerText || '';
          return {
            exists: true,
            isVisible,
            hasSoftener: text.includes('Softener') || text.includes('Water Softener') || text.includes('Filtration'),
          };
        })()
      `);

      expect(megaState.exists, 'Mega menu container .samsung-nav-mega-container should exist in DOM').toBe(true);
      expect(megaState.isVisible, 'Mega menu should be visible after triggering Residential').toBe(true);
      expect(megaState.hasSoftener, 'Residential mega menu should contain water treatment solutions').toBe(true);
    });

    // Test 6: Triggering Commercial mega-menu
    await ctx.it('Triggering Commercial nav switches to Commercial mega-menu', async () => {
      await browser.evaluate(`
        (() => {
          const triggers = Array.from(document.querySelectorAll('.samsung-nav-tab-wrapper, .samsung-nav-tab-btn'));
          const commTrigger = triggers.find(t => t.textContent.includes('Commercial'));
          if (commTrigger) {
            commTrigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            const btn = commTrigger.querySelector('button') || commTrigger;
            if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
          }
        })()
      `);
      await sleep(400);

      const commState = await browser.evaluate(`
        (() => {
          const mega = document.querySelector('.samsung-nav-mega-container');
          if (!mega) return { exists: false };
          const text = mega.innerText || '';
          return {
            exists: true,
            hasCommercialItems: text.includes('Commercial') || text.includes('Industrial') || text.includes('RO'),
          };
        })()
      `);

      expect(commState.exists, 'Mega menu container should exist').toBe(true);
      expect(commState.hasCommercialItems, 'Commercial mega menu should contain commercial items').toBe(true);
    });

    // Test 7: Navbar layout integrity without horizontal scrollbar
    await ctx.it('Overall navbar layout is intact with no horizontal page overflow', async () => {
      const layoutCheck = await browser.evaluate(`
        (() => {
          const header = document.querySelector('.site-header');
          const hasHeader = Boolean(header);
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          return {
            hasHeader,
            hasOverflow: scrollWidth > clientWidth + 2,
            scrollWidth,
            clientWidth
          };
        })()
      `);

      expect(layoutCheck.hasHeader, 'Site header .site-header must be present').toBe(true);
      expect(layoutCheck.hasOverflow, 'Navbar must not cause horizontal page overflow').toBe(false);
    });

  } finally {
    await browser.close();
  }

  return ctx.getSummary();
}
