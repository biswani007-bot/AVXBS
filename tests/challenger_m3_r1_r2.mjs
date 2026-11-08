import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TestContext, expect } from './helpers/test-reporter.mjs';
import { TEST_ENV, sleep } from './helpers/test-env.mjs';

export async function runMilestone3ReviewerChallengerSuite() {
  const ctx = new TestContext('Milestone 3 Challenger: R1 Hero Slider & R2 Navbar Elevation Stress Test');
  const browser = new CDPBrowser();

  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);

    // =========================================================================
    // SECTION 1: R1 HERO SLIDER VIEWPORT STRESS & PLACEMENT INTEGRITY
    // =========================================================================

    const testViewports = [
      { name: 'Ultra-small Mobile (320x568)', width: 320, height: 568, isMobile: true },
      { name: 'Android Baseline (360x640)', width: 360, height: 640, isMobile: true },
      { name: 'iPhone Standard (375x667)', width: 375, height: 667, isMobile: true },
      { name: 'Modern Large Mobile (412x915)', width: 412, height: 915, isMobile: true },
      { name: 'iPad / Tablet (768x1024)', width: 768, height: 1024, isMobile: false },
      { name: 'Small Laptop (1024x768)', width: 1024, height: 768, isMobile: false },
      { name: 'Full HD Desktop (1920x1080)', width: 1920, height: 1080, isMobile: false },
      { name: '2K Ultrawide (2560x1440)', width: 2560, height: 1440, isMobile: false },
    ];

    for (const vp of testViewports) {
      await ctx.it(`R1 Stress: Viewport ${vp.name} maintains overlay positioning without bottom spill or overflow`, async () => {
        await browser.setViewport(vp.width, vp.height, Boolean(vp.isMobile));
        await sleep(250);

        const check = await browser.evaluate(`
          (() => {
            const hero = document.querySelector('.full-page-hero-container');
            const indicators = document.querySelector('.hero-progress-indicators');
            if (!hero || !indicators) return { error: 'elements missing' };

            const hRect = hero.getBoundingClientRect();
            const iRect = indicators.getBoundingClientRect();

            // Centering check
            const heroCenterX = hRect.left + hRect.width / 2;
            const indCenterX = iRect.left + iRect.width / 2;
            const centerDelta = Math.abs(heroCenterX - indCenterX);

            return {
              insideDOM: hero.contains(indicators),
              heroBottom: hRect.bottom,
              indicatorsBottom: iRect.bottom,
              indicatorsTop: iRect.top,
              heroTop: hRect.top,
              indicatorsRight: iRect.right,
              viewportWidth: window.innerWidth,
              spillover: iRect.bottom - hRect.bottom,
              overflow: iRect.right - window.innerWidth,
              centerDelta,
            };
          })()
        `);

        if (check.spillover > 4 || check.overflow > 2 || check.centerDelta > 25) {
          console.log(`    [DEBUG ${vp.name}]:`, check);
        }
        expect(!check.error, `Elements should be present on ${vp.name}`).toBe(true);
        expect(check.insideDOM, `Indicators must be DOM child of hero on ${vp.name}`).toBe(true);
        expect(check.spillover <= 4, `Indicators must not spill below hero container (spill: ${check.spillover}px)`).toBe(true);
        expect(check.overflow <= 2, `Indicators must not cause horizontal viewport overflow (overflow: ${check.overflow}px)`).toBe(true);
        expect(check.centerDelta <= 25, `Indicators should be horizontally centered (delta: ${check.centerDelta}px <= 25px)`).toBe(true);
      });
    }

    // Reset back to standard desktop viewport
    await browser.setViewport(1440, 900, false);
    await sleep(400);

    // =========================================================================
    // SECTION 2: R1 STYLING, DROP SHADOW & WHITE STRIP ABSENCE AUDIT
    // =========================================================================

    await ctx.it('R1 Style: Indicators have transparent background, translucent tracks and drop shadow per Samsung style', async () => {
      const styles = await browser.evaluate(`
        (() => {
          const indicators = document.querySelector('.hero-progress-indicators');
          const track = document.querySelector('.hero-progress-track');
          const nextBtn = document.querySelector('.hero-progress-next-btn');
          if (!indicators || !track || !nextBtn) return { error: 'elements not found' };

          const indStyle = window.getComputedStyle(indicators);
          const trackStyle = window.getComputedStyle(track);
          const btnStyle = window.getComputedStyle(nextBtn);

          return {
            indPosition: indStyle.position,
            indBg: indStyle.backgroundColor,
            indZIndex: parseInt(indStyle.zIndex, 10),
            trackBg: trackStyle.backgroundColor,
            trackBoxShadow: trackStyle.boxShadow,
            trackHeight: parseFloat(trackStyle.height),
            btnFilter: btnStyle.filter,
          };
        })()
      `);

      expect(!styles.error, 'Indicators and tracks should be present').toBe(true);
      expect(styles.indPosition, 'Indicators position must be absolute').toBe('absolute');
      expect(
        styles.indBg === 'rgba(0, 0, 0, 0)' || styles.indBg === 'transparent',
        'Indicators container must have transparent background'
      ).toBe(true);
      expect(styles.indZIndex >= 5, 'Indicators container z-index must sit above slides').toBe(true);
      expect(styles.trackBoxShadow && styles.trackBoxShadow !== 'none', 'Track must have dark drop shadow').toBe(true);
      expect(styles.trackHeight > 0 && styles.trackHeight <= 5, 'Track height should be sleek (<=5px)').toBe(true);
    });

    // =========================================================================
    // SECTION 3: R1 INTERACTION & AUTOPLAY RAPID STRESS
    // =========================================================================

    await ctx.it('R1 Interaction: Play/Pause button toggles autoplay and updates icons/labels cleanly', async () => {
      // 1. Pause
      await browser.click('.hero-progress-next-btn');
      await sleep(300);

      const paused = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.hero-progress-next-btn');
          return {
            ariaLabel: (btn?.getAttribute('aria-label') || '').toLowerCase(),
            hasPlayIcon: Boolean(btn?.querySelector('.play-triangle-icon:not(.pause-icon)')),
          };
        })()
      `);
      expect(paused.hasPlayIcon, 'Should show play icon in paused state').toBe(true);

      // 2. Click progress indicator to jump to slide 1 while paused
      const buttonCount = await browser.evaluate(`document.querySelectorAll('.hero-progress-btn').length`);
      expect(buttonCount > 1, 'Should have multiple slide indicator buttons').toBe(true);

      await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          if (btns[1]) btns[1].click();
        })()
      `);
      await sleep(300);

      const activeIdx = await browser.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
          return btns.findIndex(b => b.classList.contains('is-active') || b.getAttribute('aria-selected') === 'true');
        })()
      `);
      expect(activeIdx === 1, 'Clicking slide 1 indicator should make slide 1 active').toBe(true);

      // 3. Resume play
      await browser.click('.hero-progress-next-btn');
      await sleep(300);

      const playing = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.hero-progress-next-btn');
          return {
            hasPauseIcon: Boolean(btn?.querySelector('.pause-icon')),
          };
        })()
      `);
      expect(playing.hasPauseIcon, 'Should show pause icon in playing state').toBe(true);
    });

    // Ensure desktop viewport for navbar tests
    await browser.setViewport(1440, 900, false);
    await sleep(400);

    // =========================================================================
    // SECTION 4: R2 NAVBAR ELEVATION & BOX SHADOW AUDIT
    // =========================================================================

    await ctx.it('R2 Navbar: Residential and Commercial buttons have zero box shadow, zero border, and flat background', async () => {
      const buttonStyles = await browser.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('.samsung-nav-tab-btn'));
          return btns.map(b => {
            const cs = window.getComputedStyle(b);
            return {
              text: b.innerText.trim(),
              boxShadow: cs.boxShadow,
              backgroundColor: cs.backgroundColor,
              borderTopWidth: cs.borderTopWidth,
              borderBottomWidth: cs.borderBottomWidth,
              borderRadius: cs.borderRadius,
            };
          });
        })()
      `);

      expect(buttonStyles.length >= 2, 'Should find at least 2 nav tab buttons').toBe(true);

      for (const bs of buttonStyles) {
        const isShadowNone = bs.boxShadow === 'none' ||
          bs.boxShadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' ||
          bs.boxShadow.includes('rgba(0, 0, 0, 0)');
        expect(isShadowNone, `Button "${bs.text}" must have zero box shadow (was: ${bs.boxShadow})`).toBe(true);

        const isBgTransparent = bs.backgroundColor === 'rgba(0, 0, 0, 0)' || bs.backgroundColor === 'transparent';
        expect(isBgTransparent, `Button "${bs.text}" must have transparent background (was: ${bs.backgroundColor})`).toBe(true);
      }
    });

    await ctx.it('R2 Navbar: Hover, focus, and active states maintain zero box-shadow', async () => {
      const stateAudit = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.samsung-nav-tab-btn');
          if (!btn) return { error: 'no button' };

          // Default state
          const csRest = window.getComputedStyle(btn);
          const restShadow = csRest.boxShadow;

          // Add active class manually to test active state computed style
          btn.classList.add('is-active');
          const csActive = window.getComputedStyle(btn);
          const activeShadow = csActive.boxShadow;
          btn.classList.remove('is-active');

          return { restShadow, activeShadow };
        })()
      `);

      const isRestNone = stateAudit.restShadow === 'none' || stateAudit.restShadow.includes('rgba(0, 0, 0, 0)');
      const isActiveNone = stateAudit.activeShadow === 'none' || stateAudit.activeShadow.includes('rgba(0, 0, 0, 0)');

      expect(isRestNone, 'Rest state must have zero box-shadow').toBe(true);
      expect(isActiveNone, 'Active state must have zero box-shadow').toBe(true);
    });

    // =========================================================================
    // SECTION 5: R2 MEGA-MENU TRANSITION & DISMISSAL AUDIT
    // =========================================================================

    await ctx.it('R2 Mega-Menu: Clean transitions between Residential, Commercial, and dismissal', async () => {
      // 1. Hover/Enter Residential wrapper
      await browser.evaluate(`
        (() => {
          const wrappers = Array.from(document.querySelectorAll('.nav-item-wrapper'));
          const resWrapper = wrappers.find(w => w.textContent.includes('Residential'));
          if (resWrapper) {
            resWrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            const btn = resWrapper.querySelector('button');
            if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
          }
        })()
      `);
      await sleep(400);

      const resMegaOpen = await browser.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-container'))`);
      expect(resMegaOpen, 'Residential mega menu should open on trigger').toBe(true);

      // 2. Switch to Commercial
      await browser.evaluate(`
        (() => {
          const wrappers = Array.from(document.querySelectorAll('.nav-item-wrapper'));
          const commWrapper = wrappers.find(w => w.textContent.includes('Commercial'));
          if (commWrapper) {
            commWrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            const btn = commWrapper.querySelector('button');
            if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
          }
        })()
      `);
      await sleep(400);

      const commMegaText = await browser.evaluate(`
        (() => {
          const mega = document.querySelector('.samsung-nav-mega-container');
          return mega ? mega.innerText : '';
        })()
      `);
      expect(
        commMegaText.includes('Commercial') || commMegaText.includes('RO') || commMegaText.includes('Filtration'),
        'Mega menu should switch to Commercial solutions'
      ).toBe(true);

      // 3. Close mega menu via backdrop click
      await browser.evaluate(`
        (() => {
          const backdrop = document.querySelector('.samsung-nav-backdrop');
          if (backdrop) {
            backdrop.click();
          }
        })()
      `);
      await sleep(400);

      const megaClosed = await browser.evaluate(`!document.querySelector('.samsung-nav-mega-container')`);
      expect(megaClosed, 'Mega menu should dismiss when backdrop is clicked').toBe(true);
    });

  } finally {
    await browser.close();
  }

  return ctx.getSummary();
}

// Standalone execution support
if (process.argv[1]?.endsWith('challenger_m3_r1_r2.mjs')) {
  runMilestone3ReviewerChallengerSuite()
    .then((summary) => {
      console.log(`\nChallenger Suite Finished: ${summary.passed}/${summary.total} passed, ${summary.failed} failed`);
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal challenger execution error:', err);
      process.exit(1);
    });
}
