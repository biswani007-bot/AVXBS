import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { ApiClient } from './helpers/api-client.mjs';
import { TestContext, expect } from './helpers/test-reporter.mjs';
import { TEST_ENV, sleep, waitFor } from './helpers/test-env.mjs';
import fs from 'fs';
import path from 'path';

export async function runMilestone3_2ChallengerSuite() {
  const ctx = new TestContext('Milestone 3.2 Challenger: Banner Sizing, Logo Fallback & Form Elimination');
  const api = new ApiClient();
  const browser = new CDPBrowser();

  const empiricalFindings = {
    bannerRatio: {},
    tapWaterDiffs: null,
    logoFallback: {},
    formElimination: {},
    carouselCycling: {}
  };

  try {
    await browser.launch(TEST_ENV.FRONTEND_URL);

    // Install deterministic fetch mock controller on new document once
    await browser.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        (() => {
          const origFetch = window.fetch;
          window.fetch = async function(...args) {
            const mockMode = window.sessionStorage.getItem('logoMockMode') || 'normal';
            const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
            if (url.includes('/api/settings') && url.includes('website_logo')) {
              if (mockMode === 'null') {
                return new Response(JSON.stringify({
                  success: true,
                  data: null,
                  setting: null,
                  settings: { website_logo: null }
                }), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              if (mockMode === '500') {
                return new Response(JSON.stringify({
                  success: false,
                  error: 'Simulated 500 Database Connection Timeout'
                }), {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              if (mockMode === 'brokenImg') {
                return new Response(JSON.stringify({
                  success: true,
                  data: {
                    key: 'website_logo',
                    value: {
                      imageUrl: '/uploads/non_existent_corrupted_404_logo.png',
                      altText: 'Broken Dynamic Logo'
                    }
                  }
                }), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
            }
            return origFetch.apply(this, args);
          };
        })();
      `
    });

    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);

    // Wait until React components mount
    await waitFor(async () => {
      return browser.evaluate(`Boolean(document.querySelector('.full-page-hero-container') && document.querySelector('.secondary-banner-section'))`);
    }, 10000, 200, 'React App mounting');

    // =========================================================================
    // SECTION 1: SECONDARY BANNER HEIGHT RATIO ACROSS VIEWPORTS
    // =========================================================================
    const testViewports = [
      { w: 1440, h: 900, name: '1440px Desktop' },
      { w: 768, h: 1024, name: '768px Tablet (1024h)' },
      { w: 768, h: 900, name: '768px Tablet (900h)' },
      { w: 375, h: 667, name: '375px Mobile (667h)' },
      { w: 375, h: 812, name: '375px Mobile (812h)' }
    ];

    for (const vp of testViewports) {
      await ctx.it(`Banner height ratio on ${vp.name} (${vp.w}x${vp.h}) should be ~80% (0.75 - 0.85)`, async () => {
        await browser.setViewport(vp.w, vp.h, vp.w <= 768);
        await sleep(400);

        await waitFor(async () => {
          return browser.evaluate(`Boolean(document.querySelector('.full-page-hero-container') && document.querySelector('.secondary-banner-section'))`);
        }, 5000, 100, `Viewport ${vp.name} DOM elements`);

        const metrics = await browser.evaluate(`
          (() => {
            const hero = document.querySelector('.full-page-hero-container');
            const sec = document.querySelector('.secondary-banner-section, .secondary-banner-root');
            if (!hero || !sec) {
              return { error: 'elements not found', hasHero: Boolean(hero), hasSec: Boolean(sec) };
            }
            const heroRect = hero.getBoundingClientRect();
            const secRect = sec.getBoundingClientRect();
            return {
              heroHeight: heroRect.height,
              secHeight: secRect.height,
              ratio: secRect.height / heroRect.height
            };
          })()
        `);

        if (metrics.error) {
          throw new Error(`DOM elements missing: hero=${metrics.hasHero}, sec=${metrics.hasSec}`);
        }

        empiricalFindings.bannerRatio[vp.name] = {
          viewport: `${vp.w}x${vp.h}`,
          heroHeight: Number(metrics.heroHeight.toFixed(2)),
          secondaryBannerHeight: Number(metrics.secHeight.toFixed(2)),
          ratio: Number(metrics.ratio.toFixed(4)),
          percentage: `${(metrics.ratio * 100).toFixed(2)}%`,
          inTargetRange: metrics.ratio >= 0.75 && metrics.ratio <= 0.85
        };

        const inRange = metrics.ratio >= 0.75 && metrics.ratio <= 0.85;
        expect(inRange).toBe(
          true,
          `Secondary banner height ratio on ${vp.name} must be between 0.75 and 0.85 (got ${metrics.ratio.toFixed(4)} = ${(metrics.ratio * 100).toFixed(2)}%; Hero=${metrics.heroHeight.toFixed(1)}px, Sec=${metrics.secHeight.toFixed(1)}px)`
        );
      });
    }

    // =========================================================================
    // SECTION 2: TAP WATER SECTION UNMODIFIED & INTEGRITY CHECK
    // =========================================================================
    await ctx.it('Frontend/src/components/hero/InquiryPromoBanner.jsx matches original source byte-for-byte with 0 diffs', async () => {
      const currentPath = path.resolve('Frontend/src/components/hero/InquiryPromoBanner.jsx');
      const originalPath = path.resolve('D:/New folder/New folder/AVXBS/AVXBS REACT/src/components/hero/InquiryPromoBanner.jsx');

      expect(fs.existsSync(currentPath)).toBe(true, 'InquiryPromoBanner.jsx exists in Frontend');
      expect(fs.existsSync(originalPath)).toBe(true, 'InquiryPromoBanner.jsx exists in original AVXBS REACT');

      const currentContent = fs.readFileSync(currentPath, 'utf8');
      const originalContent = fs.readFileSync(originalPath, 'utf8');

      const isIdentical = currentContent === originalContent;
      empiricalFindings.tapWaterDiffs = {
        currentLength: currentContent.length,
        originalLength: originalContent.length,
        isIdentical,
        diffBytes: Math.abs(currentContent.length - originalContent.length)
      };

      expect(isIdentical).toBe(true, 'InquiryPromoBanner.jsx must have 0 diffs vs original');
    });

    await ctx.it('Tap Water section renders correctly in public DOM with all original text and SVG decoration', async () => {
      await browser.setViewport(1440, 900, false);
      const tapWaterDom = await browser.evaluate(`
        (() => {
          const section = document.querySelector('.inquiry-promo-section');
          if (!section) return { exists: false };
          const img = section.querySelector('.inquiry-promo-img');
          const titleH2 = section.querySelector('h2.inquiry-line-main');
          const underlineSvg = section.querySelector('.curved-blue-underline');
          const fullText = section.innerText || '';

          return {
            exists: true,
            hasImg: Boolean(img),
            hasTitleH2: Boolean(titleH2),
            hasUnderlineSvg: Boolean(underlineSvg),
            containsLead: fullText.includes('Now') && fullText.includes('Just'),
            containsInquiry: fullText.includes('Put Your') && fullText.includes('Inquiry'),
            containsSolution: fullText.includes('And Get the') && fullText.includes('Solution.'),
            containsDoorstep: fullText.includes('At') && fullText.includes('Door step')
          };
        })()
      `);

      expect(tapWaterDom.exists).toBe(true, 'InquiryPromoBanner section (.inquiry-promo-section) exists in DOM');
      expect(tapWaterDom.hasImg).toBe(true, 'Tap Water section contains faucet image');
      expect(tapWaterDom.hasUnderlineSvg).toBe(true, 'Tap Water section contains curved blue SVG underline');
      expect(tapWaterDom.containsLead && tapWaterDom.containsInquiry && tapWaterDom.containsSolution && tapWaterDom.containsDoorstep)
        .toBe(true, 'Tap Water section contains all 4 branding text lines');
    });

    // =========================================================================
    // SECTION 3: DYNAMIC LOGO FALLBACK TO BUILT-IN ANIMATED LOGO
    // =========================================================================

    // Test 3.1: Logo fallback when settings API returns null
    await ctx.it('Dynamic logo falls back to built-in animated AVXBS logo when logo API returns null/unconfigured', async () => {
      await browser.evaluate(`window.sessionStorage.setItem('logoMockMode', 'null');`);
      await browser.navigate(TEST_ENV.FRONTEND_URL, 1200);

      await waitFor(async () => {
        return browser.evaluate(`Boolean(document.querySelector('.avxbs-animated-logo-root'))`);
      }, 5000, 100, 'Fallback animated logo render');

      const nullFallbackAudit = await browser.evaluate(`
        (() => {
          const animatedRoot = document.querySelector('.avxbs-animated-logo-root');
          const dynamicImg = document.querySelector('.avxbs-dynamic-logo img');
          const lettersImg = document.querySelector('.avxbs-animated-logo-root .logo-letters');
          const bar1 = document.querySelector('.avxbs-animated-logo-root .bar-1-wrapper');
          const bar2 = document.querySelector('.avxbs-animated-logo-root .bar-2-wrapper');

          return {
            hasAnimatedRoot: Boolean(animatedRoot),
            hasDynamicImg: Boolean(dynamicImg),
            hasLettersImg: Boolean(lettersImg),
            hasBar1: Boolean(bar1),
            hasBar2: Boolean(bar2)
          };
        })()
      `);

      empiricalFindings.logoFallback.nullResponse = nullFallbackAudit;
      expect(nullFallbackAudit.hasAnimatedRoot).toBe(true, 'Built-in animated logo root must render when logo API returns null');
      expect(nullFallbackAudit.hasLettersImg).toBe(true, 'Letters layer avxbs-letters.png must render in fallback');
      expect(nullFallbackAudit.hasBar1 && nullFallbackAudit.hasBar2).toBe(true, 'Gradient bars must render in fallback');
      expect(nullFallbackAudit.hasDynamicImg).toBe(false, 'Dynamic img must not be rendered when unconfigured');
    });

    // Test 3.2: Logo fallback when settings API returns HTTP 500 error
    await ctx.it('Dynamic logo falls back to built-in animated AVXBS logo when logo API returns 500 server error', async () => {
      await browser.evaluate(`window.sessionStorage.setItem('logoMockMode', '500');`);
      await browser.navigate(TEST_ENV.FRONTEND_URL, 1200);

      await waitFor(async () => {
        return browser.evaluate(`Boolean(document.querySelector('.avxbs-animated-logo-root'))`);
      }, 5000, 100, 'Fallback animated logo render on 500');

      const errorFallbackAudit = await browser.evaluate(`
        (() => {
          const animatedRoot = document.querySelector('.avxbs-animated-logo-root');
          const lettersImg = document.querySelector('.avxbs-animated-logo-root .logo-letters');
          const dynamicImg = document.querySelector('.avxbs-dynamic-logo img');

          return {
            hasAnimatedRoot: Boolean(animatedRoot),
            hasLettersImg: Boolean(lettersImg),
            hasDynamicImg: Boolean(dynamicImg)
          };
        })()
      `);

      empiricalFindings.logoFallback.error500Response = errorFallbackAudit;
      expect(errorFallbackAudit.hasAnimatedRoot).toBe(true, 'Built-in animated logo root must render when logo API returns 500');
      expect(errorFallbackAudit.hasLettersImg).toBe(true, 'Letters layer must render in fallback');
      expect(errorFallbackAudit.hasDynamicImg).toBe(false, 'Dynamic img must not render on API error');
    });

    // Test 3.3: Logo fallback when image URL 404s (image load error)
    await ctx.it('Dynamic logo falls back to built-in animated AVXBS logo when uploaded image 404s', async () => {
      await browser.evaluate(`window.sessionStorage.setItem('logoMockMode', 'brokenImg');`);
      await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);

      await waitFor(async () => {
        return browser.evaluate(`Boolean(document.querySelector('.avxbs-animated-logo-root'))`);
      }, 5000, 100, 'Fallback animated logo render on 404 image');

      const imgErrorFallbackAudit = await browser.evaluate(`
        (() => {
          const animatedRoot = document.querySelector('.avxbs-animated-logo-root');
          const lettersImg = document.querySelector('.avxbs-animated-logo-root .logo-letters');
          return {
            hasAnimatedRoot: Boolean(animatedRoot),
            hasLettersImg: Boolean(lettersImg)
          };
        })()
      `);

      empiricalFindings.logoFallback.brokenImgResponse = imgErrorFallbackAudit;
      expect(imgErrorFallbackAudit.hasAnimatedRoot).toBe(true, 'Built-in animated logo root must render when logo image fails to load');
      expect(imgErrorFallbackAudit.hasLettersImg).toBe(true, 'Letters layer must render on image 404 fallback');
    });

    // Reset logo mock mode back to normal
    await browser.evaluate(`window.sessionStorage.setItem('logoMockMode', 'normal');`);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1200);

    // =========================================================================
    // SECTION 4: CUSTOMER VOICE FORM ELIMINATION AUDIT
    // =========================================================================
    await ctx.it('Strict audit: verify no <form>, #fb-name, #fb-email, #fb-message in the public DOM', async () => {
      const domAudit = await browser.evaluate(`
        (() => {
          // Check for forbidden IDs
          const fbName = document.querySelector('#fb-name');
          const fbEmail = document.querySelector('#fb-email');
          const fbMessage = document.querySelector('#fb-message');

          // Check for all form elements in public homepage main content
          const forms = Array.from(document.querySelectorAll('main form, #testimonials-section form, .testimonials-container form'));

          // Check for customer feedback inputs
          const customerNameInput = document.querySelector('input[name="customerName"], #customerName');
          const feedbackInput = document.querySelector('textarea[name="feedback"], #feedback');
          const submissionContainer = document.querySelector('.feedback-submission-section, #feedback-submission-section, .feedback-form');

          // Check headings for "Share Your Experience"
          const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent.trim());
          const shareExperienceHeading = allHeadings.find(h => h.toLowerCase().includes('share your experience'));

          return {
            hasFbName: Boolean(fbName),
            hasFbEmail: Boolean(fbEmail),
            hasFbMessage: Boolean(fbMessage),
            formCountInMain: forms.length,
            hasCustomerNameInput: Boolean(customerNameInput),
            hasFeedbackInput: Boolean(feedbackInput),
            hasSubmissionContainer: Boolean(submissionContainer),
            shareExperienceHeading: shareExperienceHeading || null
          };
        })()
      `);

      empiricalFindings.formElimination = domAudit;

      expect(domAudit.hasFbName).toBe(false, '#fb-name must NOT exist in public DOM');
      expect(domAudit.hasFbEmail).toBe(false, '#fb-email must NOT exist in public DOM');
      expect(domAudit.hasFbMessage).toBe(false, '#fb-message must NOT exist in public DOM');
      expect(domAudit.formCountInMain).toBe(0, 'No <form> elements inside main content or testimonials section');
      expect(domAudit.hasCustomerNameInput).toBe(false, 'Customer name input must NOT exist');
      expect(domAudit.hasFeedbackInput).toBe(false, 'Feedback textarea must NOT exist');
      expect(domAudit.hasSubmissionContainer).toBe(false, 'Feedback submission section container must NOT exist');
      expect(Boolean(domAudit.shareExperienceHeading)).toBe(false, '"Share Your Experience" heading must NOT exist');
    });

    // =========================================================================
    // SECTION 5: TESTIMONIALS CAROUSEL RENDERING AND CYCLING
    // =========================================================================
    // Wait until reviews finish loading and card is rendered
    await waitFor(async () => {
      return browser.evaluate(`Boolean(document.querySelector('#testimonials-section .featured-testimonial-card'))`);
    }, 8000, 200, 'Testimonials card rendering');

    await ctx.it('Testimonials section renders active reviews from database', async () => {
      const carouselState = await browser.evaluate(`
        (() => {
          const section = document.querySelector('#testimonials-section');
          if (!section) return { exists: false };

          const card = section.querySelector('.featured-testimonial-card');
          const authorName = card ? card.querySelector('.author-name')?.textContent?.trim() : null;
          const feedback = card ? card.querySelector('.featured-feedback-text')?.textContent?.trim() : null;
          const stars = card ? card.querySelectorAll('.featured-rating-stars .star-icon.is-filled').length : 0;
          const dots = Array.from(section.querySelectorAll('.carousel-dot'));
          const nextBtn = section.querySelector('.carousel-btn.btn-next');
          const prevBtn = section.querySelector('.carousel-btn.btn-prev');

          return {
            exists: true,
            hasCard: Boolean(card),
            authorName,
            feedback,
            stars,
            dotsCount: dots.length,
            hasNextBtn: Boolean(nextBtn),
            hasPrevBtn: Boolean(prevBtn)
          };
        })()
      `);

      empiricalFindings.carouselCycling.initialState = carouselState;
      expect(carouselState.exists).toBe(true, 'Testimonials section #testimonials-section must exist');
      expect(carouselState.hasCard).toBe(true, 'Featured testimonial card must be rendered');
      expect(Boolean(carouselState.authorName)).toBe(true, 'Author name must be present in active review');
      expect(Boolean(carouselState.feedback)).toBe(true, 'Feedback text must be present in active review');
      expect(carouselState.stars >= 1).toBe(true, 'Star rating must be rendered');
      expect(carouselState.dotsCount > 1).toBe(true, 'Carousel must have multiple slide dots');
    });

    await ctx.it('Clicking Next button successfully advances carousel to the next testimonial', async () => {
      const initialAuthor = await browser.evaluate(`
        document.querySelector('.featured-testimonial-card .author-name')?.textContent?.trim()
      `);

      // Click Next button
      await browser.evaluate(`
        (() => {
          const nextBtn = document.querySelector('.carousel-btn.btn-next');
          if (nextBtn) nextBtn.click();
        })()
      `);

      // Wait for shuffle animation (550ms + buffer)
      await sleep(700);

      const afterNextAuthor = await browser.evaluate(`
        document.querySelector('.featured-testimonial-card .author-name')?.textContent?.trim()
      `);

      const activeDotIndex = await browser.evaluate(`
        Array.from(document.querySelectorAll('.carousel-dot')).findIndex(d => d.classList.contains('active'))
      `);

      empiricalFindings.carouselCycling.afterNext = {
        initialAuthor,
        afterNextAuthor,
        activeDotIndex,
        changed: initialAuthor !== afterNextAuthor
      };

      expect(afterNextAuthor !== initialAuthor).toBe(true, `Author must change on Next click (before: "${initialAuthor}", after: "${afterNextAuthor}")`);
      expect(activeDotIndex >= 1).toBe(true, 'Active dot index should be >= 1 after Next click');
    });

    await ctx.it('Clicking Prev button successfully cycles back to the previous testimonial', async () => {
      const authorBeforePrev = await browser.evaluate(`
        document.querySelector('.featured-testimonial-card .author-name')?.textContent?.trim()
      `);

      // Click Prev button
      await browser.evaluate(`
        (() => {
          const prevBtn = document.querySelector('.carousel-btn.btn-prev');
          if (prevBtn) prevBtn.click();
        })()
      `);

      // Wait for shuffle animation
      await sleep(700);

      const authorAfterPrev = await browser.evaluate(`
        document.querySelector('.featured-testimonial-card .author-name')?.textContent?.trim()
      `);

      empiricalFindings.carouselCycling.afterPrev = {
        authorBeforePrev,
        authorAfterPrev,
        changed: authorBeforePrev !== authorAfterPrev
      };

      expect(authorAfterPrev !== authorBeforePrev).toBe(true, `Author must change on Prev click (before: "${authorBeforePrev}", after: "${authorAfterPrev}")`);
    });

    await ctx.it('Clicking direct dot indicator cycles to that specific testimonial', async () => {
      // Click dot 0
      await browser.evaluate(`
        (() => {
          const dots = document.querySelectorAll('.carousel-dot');
          if (dots[0]) dots[0].click();
        })()
      `);

      await sleep(700);

      const dot0Active = await browser.evaluate(`
        (() => {
          const dots = document.querySelectorAll('.carousel-dot');
          return dots[0] ? dots[0].classList.contains('active') : false;
        })()
      `);

      expect(dot0Active).toBe(true, 'Dot 0 should be active after clicking dot 0');
    });

  } finally {
    await browser.close();
  }

  return {
    summary: ctx.getSummary(),
    findings: empiricalFindings
  };
}

// Direct CLI runner
if (process.argv[1]?.endsWith('challenger_m3_2_empirical.mjs')) {
  runMilestone3_2ChallengerSuite()
    .then(({ summary, findings }) => {
      console.log('\n================ EMPIRICAL FINDINGS ================');
      console.log(JSON.stringify(findings, null, 2));
      console.log('\n================ TEST SUMMARY ================');
      console.log(`Passed: ${summary.passed}, Failed: ${summary.failed}, Total: ${summary.total}`);
      if (summary.failed > 0) {
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      console.error('Empirical Challenger Runner Fatal Error:', err);
      process.exit(1);
    });
}
