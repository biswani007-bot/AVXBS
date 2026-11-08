import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TEST_ENV, sleep, waitFor } from './helpers/test-env.mjs';

async function verifyTestimonialsRedesign() {
  const browser = new CDPBrowser();
  let hasFailure = false;

  try {
    console.log('\n======================================================');
    console.log('   TESTIMONIALS 5-CARD CAROUSEL REDESIGN VERIFICATION');
    console.log('======================================================\n');

    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

    await waitFor(async () => {
      return browser.evaluate(`Boolean(document.querySelector('#testimonials-section .testimonials-cards-frame'))`);
    }, 12000, 200, 'Testimonials 5-Card Stage hydration');

    // 1. Desktop 1440x900 Verification
    console.log('[Viewport: Desktop 1440x900]');
    await browser.setViewport(1440, 900, false);
    await sleep(500);

    const desktopMetrics = await browser.evaluate(`
      (() => {
        const section = document.querySelector('#testimonials-section');
        const frame = section.querySelector('.testimonials-cards-frame');
        const allCards = Array.from(frame.querySelectorAll('.testimonial-card'));
        const visibleCards = allCards.filter(c => {
          const s = window.getComputedStyle(c);
          return s.display !== 'none' && s.visibility !== 'hidden' && c.offsetWidth > 0;
        });

        const farLeftCard = frame.querySelector('.card-far-left');
        const leftCard = frame.querySelector('.card-left');
        const centerCard = frame.querySelector('.card-center');
        const rightCard = frame.querySelector('.card-right');
        const farRightCard = frame.querySelector('.card-far-right');

        const rFarLeft = farLeftCard ? farLeftCard.getBoundingClientRect() : null;
        const rLeft = leftCard ? leftCard.getBoundingClientRect() : null;
        const rCenter = centerCard ? centerCard.getBoundingClientRect() : null;
        const rRight = rightCard ? rightCard.getBoundingClientRect() : null;
        const rFarRight = farRightCard ? farRightCard.getBoundingClientRect() : null;

        const sFarLeft = farLeftCard ? window.getComputedStyle(farLeftCard) : {};
        const sLeft = leftCard ? window.getComputedStyle(leftCard) : {};
        const sCenter = centerCard ? window.getComputedStyle(centerCard) : {};
        const sRight = rightCard ? window.getComputedStyle(rightCard) : {};
        const sFarRight = farRightCard ? window.getComputedStyle(farRightCard) : {};

        const reactionBubble = centerCard ? centerCard.querySelector('.card-floating-reaction') : null;
        const spheres = Array.from(section.querySelectorAll('.stage-pearl-sphere'));

        // Zero social icons
        const socialIconsCount = section.querySelectorAll('.card-social-icons, .social-pill').length;

        // Zero indicator dots / carousel bar
        const indicatorElementsCount = section.querySelectorAll('.testimonials-carousel-bar, .carousel-btn, .carousel-dot, .carousel-dots-group').length;

        // Check horizontal overflow
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth + 1;

        const sideBySideOrder = Boolean(
          rFarLeft && rLeft && rCenter && rRight && rFarRight &&
          rFarLeft.right <= rLeft.left + 5 &&
          rLeft.right <= rCenter.left + 5 &&
          rCenter.right <= rRight.left + 5 &&
          rRight.right <= rFarRight.left + 5
        );

        const outerBlurred = Boolean(
          (sFarLeft.filter && sFarLeft.filter.includes('blur')) &&
          (sFarRight.filter && sFarRight.filter.includes('blur'))
        );

        const outerFaded = Boolean(
          parseFloat(sFarLeft.opacity) <= 0.65 &&
          parseFloat(sFarRight.opacity) <= 0.65
        );

        const centerProminent = Boolean(
          rCenter && rLeft &&
          rCenter.height >= rLeft.height &&
          rCenter.width >= rLeft.width &&
          parseFloat(sCenter.opacity) >= 0.98
        );

        return {
          totalCards: allCards.length,
          visibleCardsCount: visibleCards.length,
          hasFarLeft: Boolean(farLeftCard),
          hasLeft: Boolean(leftCard),
          hasCenter: Boolean(centerCard),
          hasRight: Boolean(rightCard),
          hasFarRight: Boolean(farRightCard),
          centerWidth: rCenter ? rCenter.width : 0,
          centerHeight: rCenter ? rCenter.height : 0,
          sideBySideOrder,
          centerProminent,
          outerBlurred,
          outerFaded,
          farLeftFilter: sFarLeft.filter || '',
          farRightFilter: sFarRight.filter || '',
          farLeftOpacity: sFarLeft.opacity || '',
          socialIconsCount,
          indicatorElementsCount,
          hasReactionBubble: Boolean(reactionBubble),
          spheresCount: spheres.length,
          hasOverflow
        };
      })()
    `);

    console.log('  Visible cards count on Desktop:', desktopMetrics.visibleCardsCount, '(expected 5)');
    console.log('  5-Card side-by-side ordering:', desktopMetrics.sideBySideOrder ? 'PASS' : 'FAIL');
    console.log('  Center card prominent (' + Math.round(desktopMetrics.centerWidth) + 'x' + Math.round(desktopMetrics.centerHeight) + '):', desktopMetrics.centerProminent ? 'PASS' : 'FAIL');
    console.log('  Outer cards blurred (filter: ' + desktopMetrics.farLeftFilter + '):', desktopMetrics.outerBlurred ? 'PASS' : 'FAIL');
    console.log('  Outer cards faded (opacity: ' + desktopMetrics.farLeftOpacity + '):', desktopMetrics.outerFaded ? 'PASS' : 'FAIL');
    console.log('  Zero social action buttons/icons:', desktopMetrics.socialIconsCount === 0 ? 'PASS (0 found)' : `FAIL (${desktopMetrics.socialIconsCount} found)`);
    console.log('  Zero indicator dots / bar:', desktopMetrics.indicatorElementsCount === 0 ? 'PASS (0 found)' : `FAIL (${desktopMetrics.indicatorElementsCount} found)`);
    console.log('  Floating heart reaction bubble on center card:', desktopMetrics.hasReactionBubble ? 'PASS' : 'FAIL');
    console.log('  Horizontal overflow on Desktop:', desktopMetrics.hasOverflow ? 'FAIL (overflow detected)' : 'PASS (no overflow)');

    if (
      desktopMetrics.visibleCardsCount !== 5 ||
      !desktopMetrics.sideBySideOrder ||
      !desktopMetrics.centerProminent ||
      !desktopMetrics.outerBlurred ||
      !desktopMetrics.outerFaded ||
      desktopMetrics.socialIconsCount !== 0 ||
      desktopMetrics.indicatorElementsCount !== 0 ||
      desktopMetrics.hasOverflow
    ) {
      hasFailure = true;
    }

    // 2. Laptop 1024x768 Verification
    console.log('\n[Viewport: Laptop 1024x768]');
    await browser.setViewport(1024, 768, false);
    await sleep(500);

    const laptopMetrics = await browser.evaluate(`
      (() => {
        const frame = document.querySelector('.testimonials-cards-frame');
        const visibleCards = Array.from(frame.querySelectorAll('.testimonial-card')).filter(c => {
          const s = window.getComputedStyle(c);
          return s.display !== 'none' && s.visibility !== 'hidden' && c.offsetWidth > 0;
        });
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        return {
          visibleCardsCount: visibleCards.length,
          hasOverflow
        };
      })()
    `);

    console.log('  Visible cards count on Laptop:', laptopMetrics.visibleCardsCount, '(expected 5)');
    console.log('  Horizontal overflow on Laptop:', laptopMetrics.hasOverflow ? 'FAIL' : 'PASS');

    if (laptopMetrics.visibleCardsCount !== 5 || laptopMetrics.hasOverflow) {
      hasFailure = true;
    }

    // 3. Tablet 768x1024 Verification
    console.log('\n[Viewport: Tablet 768x1024]');
    await browser.setViewport(768, 1024, true);
    await sleep(500);

    const tabletMetrics = await browser.evaluate(`
      (() => {
        const frame = document.querySelector('.testimonials-cards-frame');
        const visibleCards = Array.from(frame.querySelectorAll('.testimonial-card')).filter(c => {
          const s = window.getComputedStyle(c);
          return s.display !== 'none' && s.visibility !== 'hidden' && c.offsetWidth > 0;
        });
        const farLeft = frame.querySelector('.card-far-left');
        const farRight = frame.querySelector('.card-far-right');
        const left = frame.querySelector('.card-left');
        const center = frame.querySelector('.card-center');
        const right = frame.querySelector('.card-right');

        const sFarLeft = farLeft ? window.getComputedStyle(farLeft) : {};
        const sFarRight = farRight ? window.getComputedStyle(farRight) : {};
        const sLeft = left ? window.getComputedStyle(left) : {};
        const sCenter = center ? window.getComputedStyle(center) : {};
        const sRight = right ? window.getComputedStyle(right) : {};

        const outerHidden = sFarLeft.display === 'none' && sFarRight.display === 'none';
        const innerVisible = sLeft.display !== 'none' && sCenter.display !== 'none' && sRight.display !== 'none';
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;

        return {
          visibleCardsCount: visibleCards.length,
          outerHidden,
          innerVisible,
          hasOverflow
        };
      })()
    `);

    console.log('  Visible cards count on Tablet:', tabletMetrics.visibleCardsCount, '(expected 3)');
    console.log('  Outer blurred cards hidden on Tablet:', tabletMetrics.outerHidden ? 'PASS' : 'FAIL');
    console.log('  Side cards + Center card visible on Tablet:', tabletMetrics.innerVisible ? 'PASS' : 'FAIL');
    console.log('  Horizontal overflow on Tablet:', tabletMetrics.hasOverflow ? 'FAIL' : 'PASS');

    if (tabletMetrics.visibleCardsCount !== 3 || !tabletMetrics.outerHidden || !tabletMetrics.innerVisible || tabletMetrics.hasOverflow) {
      hasFailure = true;
    }

    // 4. Mobile 375x667 Verification
    console.log('\n[Viewport: Mobile 375x667]');
    await browser.setViewport(375, 667, true);
    await sleep(500);

    const mobileMetrics = await browser.evaluate(`
      (() => {
        const frame = document.querySelector('.testimonials-cards-frame');
        const visibleCards = Array.from(frame.querySelectorAll('.testimonial-card')).filter(c => {
          const s = window.getComputedStyle(c);
          return s.display !== 'none' && s.visibility !== 'hidden' && c.offsetWidth > 0;
        });
        const center = frame.querySelector('.card-center');
        const sCenter = center ? window.getComputedStyle(center) : {};
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        return {
          visibleCardsCount: visibleCards.length,
          centerVisible: sCenter.display !== 'none',
          hasOverflow
        };
      })()
    `);

    console.log('  Visible cards count on Mobile:', mobileMetrics.visibleCardsCount, '(expected 1)');
    console.log('  Center card visible on Mobile:', mobileMetrics.centerVisible ? 'PASS' : 'FAIL');
    console.log('  Horizontal overflow on Mobile:', mobileMetrics.hasOverflow ? 'FAIL' : 'PASS');

    if (mobileMetrics.visibleCardsCount !== 1 || !mobileMetrics.centerVisible || mobileMetrics.hasOverflow) {
      hasFailure = true;
    }

    // 5. Interactive Navigation & Click Handlers (Desktop 1440x900)
    console.log('\n[Interactive Navigation & Click Rotation]');
    await browser.setViewport(1440, 900, false);
    await sleep(400);

    const author0 = await browser.evaluate(`
      document.querySelector('.card-center .author-name')?.textContent?.trim()
    `);

    // Click Right card to advance next (clockwise)
    await browser.evaluate(`
      document.querySelector('.card-right')?.click()
    `);
    await sleep(600);

    const author1 = await browser.evaluate(`
      document.querySelector('.card-center .author-name')?.textContent?.trim()
    `);
    console.log('  Clicking Right Card: author advanced from "' + author0 + '" to "' + author1 + '":', author0 !== author1 ? 'PASS' : 'FAIL');
    if (author0 === author1) hasFailure = true;

    // Click Left Card to shift back (counter-clockwise)
    await browser.evaluate(`
      document.querySelector('.card-left')?.click()
    `);
    await sleep(600);

    const authorBack = await browser.evaluate(`
      document.querySelector('.card-center .author-name')?.textContent?.trim()
    `);
    console.log('  Clicking Left Card: author shifted back to "' + authorBack + '":', authorBack === author0 ? 'PASS' : 'FAIL');
    if (authorBack !== author0) hasFailure = true;

    // Click Far-Right card to advance next (clockwise)
    await browser.evaluate(`
      document.querySelector('.card-far-right')?.click()
    `);
    await sleep(600);

    const authorFarRight = await browser.evaluate(`
      document.querySelector('.card-center .author-name')?.textContent?.trim()
    `);
    console.log('  Clicking Far-Right Card: author advanced to "' + authorFarRight + '":', authorFarRight !== author0 ? 'PASS' : 'FAIL');
    if (authorFarRight === author0) hasFailure = true;

    // Click Far-Left card to go back
    await browser.evaluate(`
      document.querySelector('.card-far-left')?.click()
    `);
    await sleep(600);

    const authorFarLeft = await browser.evaluate(`
      document.querySelector('.card-center .author-name')?.textContent?.trim()
    `);
    console.log('  Clicking Far-Left Card: author shifted back to "' + authorFarLeft + '":', authorFarLeft === author0 ? 'PASS' : 'FAIL');
    if (authorFarLeft !== author0) hasFailure = true;

    // 6. Automatic Clockwise Rotation Verification
    console.log('\n[Automatic Clockwise Rotation]');
    // Move mouse away to ensure no hover pause
    await browser.evaluate(`
      const stage = document.querySelector('.testimonials-stage-wrapper');
      if (stage) stage.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    `);

    const preAutoAuthor = await browser.evaluate(`
      document.querySelector('.card-center .author-name')?.textContent?.trim()
    `);
    console.log('  Current center author before autoplay wait:', preAutoAuthor);
    console.log('  Waiting 5.5 seconds for autoplay clockwise advance (interval: 4.5s)...');
    await sleep(5500);

    const postAutoAuthor = await browser.evaluate(`
      document.querySelector('.card-center .author-name')?.textContent?.trim()
    `);
    console.log('  Center author after 5s autoplay:', postAutoAuthor);
    const autoPassed = Boolean(preAutoAuthor && postAutoAuthor && preAutoAuthor !== postAutoAuthor);
    console.log('  Autoplay clockwise advance verified:', autoPassed ? 'PASS' : 'FAIL');
    if (!autoPassed) hasFailure = true;

  } catch (err) {
    console.error('Fatal Test Error:', err);
    hasFailure = true;
  } finally {
    await browser.close();
    if (hasFailure) {
      console.error('\nTestimonials 5-card carousel redesign verification FAILED.');
      process.exit(1);
    } else {
      console.log('\nAll Testimonials 5-card carousel requirements and assertions PASSED.');
    }
  }
}

verifyTestimonialsRedesign();