import { CDPBrowser } from '../helpers/cdp-browser.mjs';
import { TestContext, expect } from '../helpers/test-reporter.mjs';
import { TEST_ENV, sleep, waitFor } from '../helpers/test-env.mjs';

export async function runR1Suite() {
  const ctx = new TestContext('R1: Hero Slider Indicators & Controls');
  const browser = new CDPBrowser();

  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);
    await waitFor(async () => {
      const el = await browser.querySelector('.hero-progress-indicators');
      return Boolean(el);
    }, 12000, 250, 'Hero progress indicators hydration');

    // Test 1: FullPageHeroBanner container and progress indicators presence
    await ctx.it('Hero banner container and progress indicators exist in DOM', async () => {
      const hero = await browser.querySelector('.full-page-hero-container');
      expect(hero, 'Hero banner container .full-page-hero-container should exist').toBeTruthy();

      const indicators = await browser.querySelector('.hero-progress-indicators');
      expect(indicators, 'Hero indicators .hero-progress-indicators should exist').toBeTruthy();
    });

    // Test 2: Indicators must be nested INSIDE .full-page-hero-container (Samsung style overlay)
    await ctx.it('Indicators element is positioned INSIDE the hero banner container DOM hierarchy', async () => {
      const isInside = await browser.evaluate(`
        (() => {
          const hero = document.querySelector('.full-page-hero-container');
          const indicators = document.querySelector('.hero-progress-indicators');
          if (!hero || !indicators) return false;
          return hero.contains(indicators);
        })()
      `);
      expect(isInside, 'Indicators .hero-progress-indicators must be nested INSIDE .full-page-hero-container').toBe(true);
    });

    // Test 3: Indicators visual overlay placement inside banner bounds
    await ctx.it('Indicators visually overlay inside hero banner bounds without spilling into area below', async () => {
      const heroRect = await browser.getBoundingClientRect('.full-page-hero-container');
      const indicatorsRect = await browser.getBoundingClientRect('.hero-progress-indicators');
      expect(heroRect, 'Hero rect must exist').toBeTruthy();
      expect(indicatorsRect, 'Indicators rect must exist').toBeTruthy();

      // Top of indicators must be below top of hero
      expect(indicatorsRect.top >= heroRect.top, 'Indicators top must be within hero banner').toBe(true);
      // Bottom of indicators must be on or before bottom of hero banner
      expect(indicatorsRect.bottom <= heroRect.bottom + 2, 'Indicators must not extend into area below banner').toBe(true);
    });

    // Test 4: Bottom-Center horizontal alignment
    await ctx.it('Indicators are horizontally centered at the bottom of the hero banner', async () => {
      const heroRect = await browser.getBoundingClientRect('.full-page-hero-container');
      const indicatorsRect = await browser.getBoundingClientRect('.hero-progress-indicators');
      const heroCenterX = heroRect.left + heroRect.width / 2;
      const indCenterX = indicatorsRect.left + indicatorsRect.width / 2;
      const diff = Math.abs(heroCenterX - indCenterX);
      expect(diff <= 20, `Indicators should be centered (center diff: ${diff}px <= 20px)`).toBe(true);
    });

    // Test 5: Elimination of white strip below banner
    await ctx.it('No white strip or document-flow block below hero banner housing indicators', async () => {
      const indicatorsBg = await browser.getComputedStyle('.hero-progress-indicators', 'background-color');
      const indicatorsPosition = await browser.getComputedStyle('.hero-progress-indicators', 'position');

      // Indicators should be absolute overlay, not relative block pushing content down with white background
      expect(indicatorsPosition, 'Indicators should have position: absolute').toBe('absolute');
      // Background must not be opaque white (#ffffff or rgb(255, 255, 255))
      const isWhiteBg = indicatorsBg === 'rgb(255, 255, 255)' || indicatorsBg === '#ffffff';
      expect(isWhiteBg, 'Indicators must not have opaque white background below banner').toBe(false);
    });

    // Test 6: Responsive scaling across desktop, laptop, tablet, mobile viewports
    for (const [key, vp] of Object.entries(TEST_ENV.VIEWPORTS)) {
      await ctx.it(`Responsive scaling on ${vp.name}: indicators remain inside banner without horizontal overflow`, async () => {
        await browser.setViewport(vp.width, vp.height, Boolean(vp.isMobile));
        await sleep(300);

        const heroRect = await browser.getBoundingClientRect('.full-page-hero-container');
        const indicatorsRect = await browser.getBoundingClientRect('.hero-progress-indicators');

        expect(heroRect, `Hero container on ${vp.name} must exist`).toBeTruthy();
        expect(indicatorsRect, `Indicators on ${vp.name} must exist`).toBeTruthy();

        // Must remain inside hero banner vertically
        expect(
          indicatorsRect.bottom <= heroRect.bottom + 4,
          `Indicators on ${vp.name} must not extend below hero banner`
        ).toBe(true);

        // Must not cause horizontal overflow
        expect(
          indicatorsRect.right <= vp.width + 5,
          `Indicators on ${vp.name} must not overflow viewport width (${indicatorsRect.right} <= ${vp.width})`
        ).toBe(true);
      });
    }

    // Reset back to standard desktop viewport
    await browser.setViewport(1440, 900, false);
    await sleep(300);

    // Test 7: Autoplay and Pause/Play toggle control
    await ctx.it('Samsung-style pause/play toggle button controls slide autoplay', async () => {
      const playPauseBtn = await browser.querySelector('.hero-progress-next-btn');
      expect(playPauseBtn, 'Play/pause button .hero-progress-next-btn should exist').toBeTruthy();

      const getButtonState = async () => {
        return browser.evaluate(`
          (() => {
            const btn = document.querySelector('.hero-progress-next-btn');
            if (!btn) return 'unknown';
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            const title = (btn.getAttribute('title') || '').toLowerCase();
            const hasPauseIcon = Boolean(btn.querySelector('.pause-icon'));
            const isPlaying = label.includes('pause') || title.includes('pause') || hasPauseIcon;
            return isPlaying ? 'playing' : 'paused';
          })()
        `);
      };

      const state1 = await getButtonState();

      // Click to toggle
      await browser.click('.hero-progress-next-btn');
      await sleep(400);
      const state2 = await getButtonState();
      expect(state2 !== state1, `Button should toggle state on click (from ${state1} to opposite)`).toBe(true);

      // Click again to toggle back
      await browser.click('.hero-progress-next-btn');
      await sleep(400);
      const state3 = await getButtonState();
      expect(state3 === state1, `Button should toggle back to initial state (${state1})`).toBe(true);
    });

    // Test 8: Manual slide navigation via indicator button click
    await ctx.it('Clicking progress indicator button directly navigates to the selected slide', async () => {
      const progressButtons = await browser.querySelectorAll('.hero-progress-btn');
      if (progressButtons.length > 1) {
        // Click second indicator
        await browser.evaluate(`
          (() => {
            const btns = document.querySelectorAll('.hero-progress-btn');
            if (btns.length > 1) btns[1].click();
          })()
        `);
        await sleep(500);

        const isSlide2Active = await browser.evaluate(`
          (() => {
            const btns = document.querySelectorAll('.hero-progress-btn');
            return btns[1] ? (btns[1].classList.contains('is-active') || btns[1].getAttribute('aria-selected') === 'true') : false;
          })()
        `);
        expect(isSlide2Active, 'Second slide indicator should become active upon click').toBe(true);
      }
    });

  } finally {
    await browser.close();
  }

  return ctx.getSummary();
}
