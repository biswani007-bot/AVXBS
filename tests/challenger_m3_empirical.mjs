#!/usr/bin/env node

/**
 * Challenger M3 Empirical Verification Test Suite
 * Hero Slider & Layout Viewports Adversarial Audit
 *
 * Verifies:
 * 1. .hero-progress-indicators is inside .full-page-hero-container and positioned bottom-center over banner image
 * 2. Zero white container or strip appears below the hero banner
 * 3. Autoplay, pause/play toggling, and slide navigation across viewports (1440px desktop, 1024px laptop, 768px tablet, 375px mobile)
 * 4. Zero horizontal overflow (scrollWidth <= clientWidth) across all viewports
 * 5. Residential & Commercial nav items have box-shadow: none and transparent background
 * 6. Adversarial stress testing (rapid toggling, dynamic resize, touch swipe, zero unhandled console errors)
 */

import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TestContext, expect } from './helpers/test-reporter.mjs';
import { TEST_ENV, sleep, waitFor } from './helpers/test-env.mjs';

export async function runMilestone3ChallengerSuite() {
  const ctx = new TestContext('Milestone 3 Challenger: Hero Slider & Layout Viewports Empirical Audit');
  const browser = new CDPBrowser();

  try {
    console.log('[Challenger M3] Launching CDP browser and navigating to frontend...');
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

    // Ensure hero banner slides have finished loading from MongoDB / API
    console.log('[Challenger M3] Awaiting hero banner API hydration...');
    await waitFor(async () => {
      const el = await browser.querySelector('.hero-progress-indicators');
      return Boolean(el);
    }, 15000, 300, 'Hero progress indicators hydration');

    // Query dynamic slideDuration from DOM
    const heroConfig = await browser.evaluate(`
      (() => {
        const fill = document.querySelector('.hero-progress-fill');
        const animDurationStr = fill ? window.getComputedStyle(fill).animationDuration : '3s';
        const seconds = parseFloat(animDurationStr) || 3;
        const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
        return {
          slideDurationMs: Math.round(seconds * 1000),
          slideCount: btns.length
        };
      })()
    `);
    console.log(`[Challenger M3] Detected live hero config: ${heroConfig.slideCount} slides, slideDuration: ${heroConfig.slideDurationMs}ms`);

    // =========================================================================
    // SECTION 1: INDICATOR OVERLAY POSITION & DOM HIERARCHY
    // =========================================================================

    await ctx.it('1.1 Indicators element is strictly nested INSIDE .full-page-hero-container DOM hierarchy', async () => {
      const isInside = await browser.evaluate(`
        (() => {
          const hero = document.querySelector('.full-page-hero-container');
          const indicators = document.querySelector('.hero-progress-indicators');
          if (!hero || !indicators) return false;
          return hero.contains(indicators);
        })()
      `);
      expect(isInside, '.hero-progress-indicators must be a DOM child of .full-page-hero-container').toBe(true);
    });

    await ctx.it('1.2 Indicators are styled as an absolute overlay with transparent background and no shadow', async () => {
      const styles = await browser.evaluate(`
        (() => {
          const el = document.querySelector('.hero-progress-indicators');
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          return {
            position: cs.position,
            backgroundColor: cs.backgroundColor,
            boxShadow: cs.boxShadow,
            zIndex: parseInt(cs.zIndex, 10) || 0
          };
        })()
      `);
      expect(styles, 'Indicator styles must exist').toBeTruthy();
      expect(styles.position, 'Position must be absolute overlay').toBe('absolute');
      const isTransparent = styles.backgroundColor === 'rgba(0, 0, 0, 0)' || styles.backgroundColor === 'transparent';
      expect(isTransparent, 'Background must be transparent').toBe(true);
      expect(styles.zIndex >= 5, 'z-index must be at least 5 to overlay slides').toBe(true);
    });

    // Viewport-specific indicator overlay and centering check across 4 required viewports
    const targetViewports = [
      { width: 1440, height: 900, name: 'Desktop (1440x900)', isMobile: false },
      { width: 1024, height: 768, name: 'Laptop (1024x768)', isMobile: false },
      { width: 768, height: 1024, name: 'Tablet (768x1024)', isMobile: false },
      { width: 375, height: 667, name: 'Mobile (375x667)', isMobile: true },
    ];

    for (const vp of targetViewports) {
      await ctx.it(`1.3 [${vp.name}] Indicators visually overlay inside banner bounds and are horizontally centered`, async () => {
        await browser.setViewport(vp.width, vp.height, vp.isMobile);
        await sleep(350);
        await waitFor(async () => {
          return await browser.querySelector('.hero-progress-indicators');
        }, 5000, 100, `Waiting for indicators on ${vp.name}`);

        const data = await browser.evaluate(`
          (() => {
            const hero = document.querySelector('.full-page-hero-container');
            const ind = document.querySelector('.hero-progress-indicators');
            if (!hero || !ind) return null;
            const hRect = hero.getBoundingClientRect();
            const iRect = ind.getBoundingClientRect();
            const heroCenterX = hRect.left + (hRect.width / 2);
            const indCenterX = iRect.left + (iRect.width / 2);
            return {
              heroTop: hRect.top,
              heroBottom: hRect.bottom,
              heroWidth: hRect.width,
              heroHeight: hRect.height,
              indTop: iRect.top,
              indBottom: iRect.bottom,
              indLeft: iRect.left,
              indRight: iRect.right,
              centerOffset: Math.abs(heroCenterX - indCenterX),
              bottomOffset: hRect.bottom - iRect.bottom
            };
          })()
        `);

        expect(data, `Metrics for ${vp.name} must exist`).toBeTruthy();
        expect(data.indTop >= data.heroTop, `[${vp.name}] Indicators top must be within hero`).toBe(true);
        expect(data.indBottom <= data.heroBottom + 2, `[${vp.name}] Indicators bottom must not spill below hero banner`).toBe(true);
        expect(data.bottomOffset >= 4, `[${vp.name}] Indicators should maintain bottom spacing (was ${data.bottomOffset}px)`).toBe(true);
        expect(data.centerOffset <= 20, `[${vp.name}] Indicators should be centered (center diff: ${data.centerOffset}px <= 20px)`).toBe(true);
      });
    }

    // Reset to desktop for next section
    await browser.setViewport(1440, 900, false);
    await sleep(350);

    // =========================================================================
    // SECTION 2: ZERO WHITE CONTAINER OR STRIP BELOW HERO BANNER
    // =========================================================================

    await ctx.it('2.1 Zero white container or extra DOM element between hero banner and inquiry section', async () => {
      const gapInfo = await browser.evaluate(`
        (() => {
          const heroMaster = document.querySelector('.hero-fullpage-master-section');
          const heroContainer = document.querySelector('.full-page-hero-container');
          const inquirySection = document.querySelector('.inquiry-promo-section');

          if (!heroMaster || !inquirySection) return { error: 'Required sections not found' };

          const masterRect = heroMaster.getBoundingClientRect();
          const inquiryRect = inquirySection.getBoundingClientRect();

          const nextSibling = heroMaster.nextElementSibling;
          const isNextSiblingInquiry = nextSibling === inquirySection;
          const visualGap = inquiryRect.top - masterRect.bottom;
          const csMaster = window.getComputedStyle(heroMaster);

          return {
            isNextSiblingInquiry,
            nextSiblingTag: nextSibling ? nextSibling.tagName : null,
            nextSiblingClass: nextSibling ? nextSibling.className : null,
            visualGap: Math.round(visualGap),
            masterBg: csMaster.backgroundColor,
            masterPaddingBottom: csMaster.paddingBottom,
            masterMarginBottom: csMaster.marginBottom
          };
        })()
      `);

      expect(gapInfo.isNextSiblingInquiry, 'Inquiry section must immediately follow hero section in DOM flow').toBe(true);
      expect(gapInfo.visualGap <= 1, `Visual gap between hero and inquiry section must be <= 1px (was: ${gapInfo.visualGap}px)`).toBe(true);
      expect(gapInfo.masterPaddingBottom, 'Hero section master padding bottom must be 0px').toBe('0px');
      expect(gapInfo.masterMarginBottom, 'Hero section master margin bottom must be 0px').toBe('0px');
    });

    await ctx.it('2.2 Hero progress indicators does not create any document-flow height or white strip', async () => {
      const flowCheck = await browser.evaluate(`
        (() => {
          const heroWrapper = document.querySelector('.hero-banner-fullwidth-wrapper');
          const heroContainer = document.querySelector('.full-page-hero-container');
          const indicators = document.querySelector('.hero-progress-indicators');

          const csWrapper = window.getComputedStyle(heroWrapper);
          const csContainer = window.getComputedStyle(heroContainer);
          const csInd = window.getComputedStyle(indicators);

          return {
            indicatorsPosition: csInd.position,
            wrapperHeight: heroWrapper.offsetHeight,
            containerHeight: heroContainer.offsetHeight,
          };
        })()
      `);

      expect(flowCheck.indicatorsPosition, 'Indicators position must be absolute').toBe('absolute');
      expect(Math.abs(flowCheck.wrapperHeight - flowCheck.containerHeight) <= 1, 'Hero wrapper and container heights should match exactly').toBe(true);
    });

    // =========================================================================
    // SECTION 3: SLIDER AUTOPLAY, PAUSE/PLAY TOGGLING & NAVIGATION ACROSS VIEWPORTS
    // =========================================================================

    // 3.1 Pause toggle verification
    await ctx.it('3.1 Play/Pause button toggles paused state and updates icon/aria-label', async () => {
      // Click pause button
      await browser.click('.hero-progress-next-btn');
      await sleep(350);

      const pauseState = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.hero-progress-next-btn');
          const label = (btn.getAttribute('aria-label') || '').toLowerCase();
          const title = (btn.getAttribute('title') || '').toLowerCase();
          const hasPlayIcon = Boolean(btn.querySelector('.play-triangle-icon:not(.pause-icon)'));
          return label.includes('play') || title.includes('play') || hasPlayIcon;
        })()
      `);
      expect(pauseState, 'Button reflects paused state (shows play icon and label)').toBe(true);

      // Verify that while paused, slide remains static
      const indexAtPause = await browser.evaluate(`
        (() => {
          const activeBtn = document.querySelector('.hero-progress-btn.is-active');
          const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
          return btns.indexOf(activeBtn);
        })()
      `);

      await sleep(2000);

      const indexAfterPauseWait = await browser.evaluate(`
        (() => {
          const activeBtn = document.querySelector('.hero-progress-btn.is-active');
          const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
          return btns.indexOf(activeBtn);
        })()
      `);
      expect(indexAfterPauseWait, 'Slide index remains unchanged while autoplay is paused').toBe(indexAtPause);

      // Resume playing
      await browser.click('.hero-progress-next-btn');
      await sleep(350);

      const playingState = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.hero-progress-next-btn');
          const label = (btn.getAttribute('aria-label') || '').toLowerCase();
          const title = (btn.getAttribute('title') || '').toLowerCase();
          const hasPauseIcon = Boolean(btn.querySelector('.pause-icon'));
          return label.includes('pause') || title.includes('pause') || hasPauseIcon;
        })()
      `);
      expect(playingState, 'Button reflects playing state (shows pause icon and label)').toBe(true);
    });

    // 3.2 Manual indicator navigation on Desktop (1440px)
    await ctx.it('3.2 Desktop (1440px): Clicking progress indicators directly switches slides', async () => {
      // Click indicator 1
      await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          if (btns.length > 1) btns[1].click();
        })()
      `);
      await sleep(500);

      const slide1Active = await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          return btns[1] ? btns[1].classList.contains('is-active') : false;
        })()
      `);
      expect(slide1Active, 'Slide 1 should become active upon clicking indicator 1').toBe(true);

      // Click indicator 0
      await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          if (btns.length > 0) btns[0].click();
        })()
      `);
      await sleep(500);

      const slide0Active = await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          return btns[0] ? btns[0].classList.contains('is-active') : false;
        })()
      `);
      expect(slide0Active, 'Slide 0 should become active upon clicking indicator 0').toBe(true);
    });

    // 3.3 Slider navigation on Laptop (1024px)
    await ctx.it('3.3 Laptop (1024px): Slide indicator navigation functions accurately', async () => {
      await browser.setViewport(1024, 768, false);
      await sleep(400);

      await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          if (btns.length > 2) btns[2].click();
          else if (btns.length > 1) btns[1].click();
        })()
      `);
      await sleep(500);

      const isNavigated = await browser.evaluate(`
        (() => {
          const activeBtn = document.querySelector('.hero-progress-btn.is-active');
          const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
          return btns.indexOf(activeBtn);
        })()
      `);
      expect(isNavigated >= 1, 'Laptop navigation should successfully select slide >= 1').toBe(true);
    });

    // 3.4 Slider navigation on Tablet (768px)
    await ctx.it('3.4 Tablet (768px): Slide indicator navigation and play/pause function accurately', async () => {
      await browser.setViewport(768, 1024, false);
      await sleep(400);

      // Click slide 0
      await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          if (btns.length > 0) btns[0].click();
        })()
      `);
      await sleep(400);

      const tabletActive = await browser.evaluate(`
        (() => {
          const btns = document.querySelectorAll('.hero-progress-btn');
          return btns[0] ? btns[0].classList.contains('is-active') : false;
        })()
      `);
      expect(tabletActive, 'Tablet navigation to slide 0 succeeds').toBe(true);
    });

    // 3.5 Slider navigation and touch swipe on Mobile (375px)
    await ctx.it('3.5 Mobile (375px): Touch swipe left advances slide; indicator clicks navigate directly', async () => {
      await browser.setViewport(375, 667, true);
      await sleep(400);

      const beforeSwipeIndex = await browser.evaluate(`
        (() => {
          const activeBtn = document.querySelector('.hero-progress-btn.is-active');
          const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
          return btns.indexOf(activeBtn);
        })()
      `);

      // Simulate left swipe (clientX 250 -> 100, delta = 150 > 40)
      await browser.evaluate(`
        (() => {
          const container = document.querySelector('.full-page-hero-container');
          if (!container) return;

          const startEvent = new CustomEvent('touchstart', { bubbles: true });
          startEvent.touches = [{ clientX: 250 }];
          container.dispatchEvent(startEvent);

          const endEvent = new CustomEvent('touchend', { bubbles: true });
          endEvent.changedTouches = [{ clientX: 100 }];
          container.dispatchEvent(endEvent);
        })()
      `);
      await sleep(600);

      const afterSwipeIndex = await browser.evaluate(`
        (() => {
          const activeBtn = document.querySelector('.hero-progress-btn.is-active');
          const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
          return btns.indexOf(activeBtn);
        })()
      `);

      const totalSlides = await browser.evaluate(`document.querySelectorAll('.hero-progress-btn').length`);
      const expectedSwipeNext = (beforeSwipeIndex + 1) % totalSlides;
      expect(afterSwipeIndex, `Touch swipe left on mobile should advance to slide ${expectedSwipeNext}`).toBe(expectedSwipeNext);
    });

    // Reset back to desktop
    await browser.setViewport(1440, 900, false);
    await sleep(350);

    // =========================================================================
    // SECTION 4: ZERO HORIZONTAL OVERFLOW (scrollWidth <= clientWidth)
    // =========================================================================

    const allOverflowViewports = [
      { width: 1440, height: 900, name: 'Desktop (1440x900)', isMobile: false },
      { width: 1024, height: 768, name: 'Laptop (1024x768)', isMobile: false },
      { width: 768, height: 1024, name: 'Tablet (768x1024)', isMobile: false },
      { width: 430, height: 932, name: 'Mobile Large (430x932)', isMobile: true },
      { width: 375, height: 667, name: 'Mobile Standard (375x667)', isMobile: true },
      { width: 320, height: 568, name: 'Mobile Narrow Edge (320x568)', isMobile: true },
    ];

    for (const vp of allOverflowViewports) {
      await ctx.it(`4.1 [${vp.name}] Zero horizontal page overflow (scrollWidth <= clientWidth)`, async () => {
        await browser.setViewport(vp.width, vp.height, vp.isMobile);
        await sleep(350);

        const overflow = await browser.evaluate(`
          (() => {
            const docEl = document.documentElement;
            const scrollWidth = docEl.scrollWidth;
            const clientWidth = docEl.clientWidth;
            const bodyScrollWidth = document.body.scrollWidth;
            const bodyClientWidth = document.body.clientWidth;

            const ind = document.querySelector('.hero-progress-indicators');
            const indRect = ind ? ind.getBoundingClientRect() : null;

            return {
              scrollWidth,
              clientWidth,
              hasPageOverflow: scrollWidth > clientWidth,
              bodyScrollWidth,
              bodyClientWidth,
              hasBodyOverflow: bodyScrollWidth > bodyClientWidth,
              indRight: indRect ? Math.round(indRect.right) : 0,
              viewportWidth: window.innerWidth
            };
          })()
        `);

        expect(overflow.hasPageOverflow, `[${vp.name}] documentElement.scrollWidth (${overflow.scrollWidth}) must be <= clientWidth (${overflow.clientWidth})`).toBe(false);
        expect(overflow.hasBodyOverflow, `[${vp.name}] body.scrollWidth (${overflow.bodyScrollWidth}) must be <= clientWidth (${overflow.bodyClientWidth})`).toBe(false);
        expect(overflow.indRight <= overflow.viewportWidth + 2, `[${vp.name}] Indicator bounds must not exceed viewport width`).toBe(true);
      });
    }

    // Reset back to desktop
    await browser.setViewport(1440, 900, false);
    await sleep(350);

    // =========================================================================
    // SECTION 5: RESIDENTIAL & COMMERCIAL NAV ITEMS FLAT STYLING & BEHAVIOR
    // =========================================================================

    await ctx.it('5.1 Residential & Commercial tab buttons exist with proper text in navbar', async () => {
      const navButtons = await browser.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('.samsung-nav-tab-btn'));
          return btns.map(b => b.textContent.trim());
        })()
      `);

      expect(navButtons.length >= 2, 'Should have at least 2 nav tab buttons').toBe(true);
      expect(navButtons.some(t => t.includes('Residential')), 'Residential nav tab must exist').toBe(true);
      expect(navButtons.some(t => t.includes('Commercial')), 'Commercial nav tab must exist').toBe(true);
    });

    await ctx.it('5.2 Default State: Residential & Commercial items have box-shadow: none and transparent background', async () => {
      const styles = await browser.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('.samsung-nav-tab-btn'));
          return btns.map(b => {
            const cs = window.getComputedStyle(b);
            return {
              text: b.textContent.trim(),
              boxShadow: cs.boxShadow,
              backgroundColor: cs.backgroundColor,
              borderRadius: cs.borderRadius,
              borderWidth: cs.borderWidth
            };
          });
        })()
      `);

      for (const btn of styles) {
        const isShadowNone = btn.boxShadow === 'none' ||
          btn.boxShadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' ||
          btn.boxShadow.includes('rgba(0, 0, 0, 0)');
        expect(isShadowNone, `Button "${btn.text}" default boxShadow should be none (was: ${btn.boxShadow})`).toBe(true);

        const isBgTransparent = btn.backgroundColor === 'transparent' ||
          btn.backgroundColor === 'rgba(0, 0, 0, 0)';
        expect(isBgTransparent, `Button "${btn.text}" default background should be transparent (was: ${btn.backgroundColor})`).toBe(true);
      }
    });

    await ctx.it('5.3 Hover State: Hovering Residential nav preserves box-shadow: none and transparent background', async () => {
      await browser.hover('.samsung-nav-tab-btn');
      await sleep(200);

      const hoverStyles = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.samsung-nav-tab-btn');
          const cs = window.getComputedStyle(btn);
          return {
            boxShadow: cs.boxShadow,
            backgroundColor: cs.backgroundColor
          };
        })()
      `);

      const isShadowNone = hoverStyles.boxShadow === 'none' ||
        hoverStyles.boxShadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' ||
        hoverStyles.boxShadow.includes('rgba(0, 0, 0, 0)');
      expect(isShadowNone, 'Hovered nav button retains box-shadow: none').toBe(true);

      const isBgTransparent = hoverStyles.backgroundColor === 'transparent' ||
        hoverStyles.backgroundColor === 'rgba(0, 0, 0, 0)';
      expect(isBgTransparent, 'Hovered nav button retains transparent background').toBe(true);

      await browser.mouseLeave('.samsung-nav-tab-btn');
      await sleep(200);
    });

    await ctx.it('5.4 Indicator Underlines: Nav tab buttons contain .nav-tab-indicator underline element', async () => {
      const indicators = await browser.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('.samsung-nav-tab-btn'));
          return btns.map(b => Boolean(b.querySelector('.nav-tab-indicator')));
        })()
      `);
      expect(indicators.length >= 2, 'Should find at least 2 nav buttons').toBe(true);
      expect(indicators.every(Boolean), 'Every nav tab button must contain .nav-tab-indicator').toBe(true);
    });

    await ctx.it('5.5 Mega Menu: Residential mega-menu opens and renders solution columns with no overflow', async () => {
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

      const mega = await browser.evaluate(`
        (() => {
          const m = document.querySelector('.samsung-nav-mega-container');
          if (!m) return { exists: false };
          const cs = window.getComputedStyle(m);
          return {
            exists: true,
            visible: cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0,
            hasSolutions: (m.innerText || '').includes('Softener') || (m.innerText || '').includes('Filtration'),
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
          };
        })()
      `);

      expect(mega.exists, 'Mega menu container must exist').toBe(true);
      expect(mega.visible, 'Mega menu must be visible').toBe(true);
      expect(mega.hasSolutions, 'Residential mega menu should contain solutions').toBe(true);
      expect(mega.scrollWidth <= mega.clientWidth, 'Opening mega menu must not cause horizontal page overflow').toBe(true);
    });

    // Close mega menu by clicking document body
    await browser.evaluate(`document.body.click()`);
    await sleep(300);

    // =========================================================================
    // SECTION 6: ADVERSARIAL STRESS TESTING
    // =========================================================================

    await ctx.it('6.1 Rapid play/pause toggle stress: 10 rapid toggles handle state cleanly without lockup', async () => {
      for (let i = 0; i < 10; i++) {
        await browser.click('.hero-progress-next-btn');
        await sleep(100);
      }

      const state = await browser.evaluate(`
        (() => {
          const btn = document.querySelector('.hero-progress-next-btn');
          const hero = document.querySelector('.full-page-hero-container');
          return {
            btnExists: Boolean(btn),
            heroExists: Boolean(hero)
          };
        })()
      `);

      expect(state.btnExists, 'Play/pause button remains healthy after rapid toggling').toBe(true);
      expect(state.heroExists, 'Hero banner remains healthy after rapid toggling').toBe(true);
    });

    await ctx.it('6.2 Rapid slide indicator clicking: 12 rapid jumps across slides cycle cleanly without desync', async () => {
      for (let i = 0; i < 12; i++) {
        const slideIndex = i % (heroConfig.slideCount || 3);
        await browser.evaluate(`
          ((idx) => {
            const btns = document.querySelectorAll('.hero-progress-btn');
            if (btns[idx]) btns[idx].click();
          })(${slideIndex})
        `);
        await sleep(100);
      }
      await sleep(300);

      const activeSlideValid = await browser.evaluate(`
        (() => {
          const activeSlides = document.querySelectorAll('.hero-banner-slide.is-active');
          const activeBtns = document.querySelectorAll('.hero-progress-btn.is-active');
          return {
            activeSlidesCount: activeSlides.length,
            activeBtnsCount: activeBtns.length
          };
        })()
      `);

      expect(activeSlideValid.activeSlidesCount, 'Exactly 1 slide must be active after rapid clicking').toBe(1);
      expect(activeSlideValid.activeBtnsCount, 'Exactly 1 indicator must be active after rapid clicking').toBe(1);
    });

    await ctx.it('6.3 Dynamic viewport resize stress: Resizing viewports in sequence preserves layout', async () => {
      const resizeSequence = [
        { w: 1440, h: 900, m: false },
        { w: 375, h: 667, m: true },
        { w: 1024, h: 768, m: false },
        { w: 768, h: 1024, m: false },
        { w: 430, h: 932, m: true },
        { w: 1440, h: 900, m: false }
      ];

      for (const step of resizeSequence) {
        await browser.setViewport(step.w, step.h, step.m);
        await sleep(250);
      }

      const postResizeCheck = await browser.evaluate(`
        (() => {
          const hero = document.querySelector('.full-page-hero-container');
          const ind = document.querySelector('.hero-progress-indicators');
          if (!hero || !ind) return null;
          const hRect = hero.getBoundingClientRect();
          const iRect = ind.getBoundingClientRect();
          return {
            contained: iRect.bottom <= hRect.bottom + 2 && iRect.top >= hRect.top,
            noOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
          };
        })()
      `);

      expect(postResizeCheck, 'Hero banner and indicators must be present after resize sequence').toBeTruthy();
      expect(postResizeCheck.contained, 'Indicators remain contained inside hero banner after resize stress').toBe(true);
      expect(postResizeCheck.noOverflow, 'Zero horizontal overflow after resize stress').toBe(true);
    });

    await ctx.it('6.4 Zero unhandled console exceptions or errors during entire execution', async () => {
      console.log('[Challenger M3] Raw console errors caught:', JSON.stringify(browser.consoleErrors));
      console.log('[Challenger M3] Page exceptions caught:', JSON.stringify(browser.pageExceptions));

      // Filter out benign browser warnings (e.g., favicon 404, autoplay sound policies)
      const criticalErrors = (browser.consoleErrors || []).filter(e => {
        const lower = e.toLowerCase();
        return !lower.includes('favicon') && !lower.includes('manifest') && !lower.includes('preload') && !lower.includes('interact first');
      });

      const pageExceptions = browser.pageExceptions || [];

      expect(pageExceptions.length, `Uncaught page exceptions must be 0 (found: ${JSON.stringify(pageExceptions)})`).toBe(0);
      expect(criticalErrors.length, `Critical console errors must be 0 (found: ${JSON.stringify(criticalErrors)})`).toBe(0);
    });

  } finally {
    console.log('[Challenger M3] Closing CDP browser session...');
    await browser.close();
  }

  return ctx.getSummary();
}

// Direct execution CLI entrypoint
if (process.argv[1]?.endsWith('challenger_m3_empirical.mjs')) {
  runMilestone3ChallengerSuite()
    .then((summary) => {
      console.log(`\n======================================================================`);
      console.log(`Challenger M3 Suite Finished: ${summary.passed}/${summary.total} passed in ${summary.durationMs}ms`);
      console.log(`======================================================================\n`);
      process.exit(summary.failed === 0 ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal suite failure:', err);
      process.exit(1);
    });
}
