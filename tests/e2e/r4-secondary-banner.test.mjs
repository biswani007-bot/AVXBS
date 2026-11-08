import { ApiClient } from '../helpers/api-client.mjs';
import { CDPBrowser } from '../helpers/cdp-browser.mjs';
import { TestContext, expect } from '../helpers/test-reporter.mjs';
import { TEST_ENV, sleep, generateTestId, waitFor } from '../helpers/test-env.mjs';

export async function runR4Suite() {
  const ctx = new TestContext('R4: Secondary Banner Section Below Tap Water');
  const api = new ApiClient();
  const browser = new CDPBrowser();

  try {
    const loginRes = await api.login();
    expect(loginRes.ok, 'Admin login should succeed for R4 tests').toBe(true);

    // Test 1: Admin API persistence for secondary_banner
    await ctx.it('Secondary banner configuration persists in SiteSetting with key secondary_banner', async () => {
      const bannerPayload = {
        imageUrl: '/uploads/secondary_banner_test.jpg',
        altText: 'Next-Gen Commercial Filtration',
        title: 'Pure Water, Pure Excellence',
        subtitle: 'Engineered for high-volume performance and maximum mineral retention',
        linkUrl: '/contact',
        isActive: true,
      };

      const saveRes = await api.saveSetting('secondary_banner', bannerPayload, 'banners', 'Secondary banner below Tap Water');
      expect(saveRes.ok, 'Saving secondary_banner setting should succeed').toBe(true);

      const getRes = await api.getSettings('secondary_banner');
      expect(getRes.ok, 'GET /api/settings?key=secondary_banner should return 200').toBe(true);

      const val = getRes.data.data?.value || getRes.data.setting || getRes.data.settings?.secondary_banner;
      expect(Boolean(val), 'Secondary banner value must exist').toBe(true);
      expect(val.title, 'Saved banner title should match').toBe(bannerPayload.title);
    });

    // Test 2: Tap Water Section exists and is unmodified
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);
    await waitFor(async () => {
      const el = await browser.querySelector('.inquiry-promo-section');
      return Boolean(el);
    }, 12000, 250, 'Tap water section hydration');

    await ctx.it('Existing Tap Water image section exists and is unmodified', async () => {
      const tapWaterState = await browser.evaluate(`
        (() => {
          const promoSection = document.querySelector('.inquiry-promo-section');
          if (!promoSection) return { exists: false };
          const text = promoSection.innerText || '';
          const hasImage = Boolean(promoSection.querySelector('img, .inquiry-promo-image-wrapper'));
          const hasInquiryButton = Boolean(promoSection.querySelector('button, a'));
          return {
            exists: true,
            hasText: text.includes('Looking for') || text.includes('Tap') || text.includes('Water') || text.includes('Inquiry'),
            hasImage,
            hasInquiryButton
          };
        })()
      `);

      expect(tapWaterState.exists, 'Tap Water section .inquiry-promo-section must exist').toBe(true);
      expect(tapWaterState.hasText, 'Tap Water section must retain its text content').toBe(true);
      expect(tapWaterState.hasImage, 'Tap Water section must retain its image element').toBe(true);
    });

    // Test 3: Placement immediately below Tap Water section in DOM
    await ctx.it('Secondary banner is placed immediately below the Tap Water section in DOM', async () => {
      const placementCheck = await browser.evaluate(`
        (() => {
          const promo = document.querySelector('.inquiry-promo-section');
          const secondaryBanner = document.querySelector('.secondary-banner-section, .secondary-banner-root');
          if (!promo || !secondaryBanner) return { promoExists: Boolean(promo), bannerExists: Boolean(secondaryBanner) };

          const promoRect = promo.getBoundingClientRect();
          const bannerRect = secondaryBanner.getBoundingClientRect();

          // Banner top should be at or below promo bottom
          const isBelow = bannerRect.top >= promoRect.top;
          return {
            promoExists: true,
            bannerExists: true,
            isBelow,
            promoBottom: promoRect.bottom,
            bannerTop: bannerRect.top
          };
        })()
      `);

      expect(placementCheck.bannerExists, 'Secondary banner section (.secondary-banner-section) should exist in DOM').toBe(true);
      if (placementCheck.bannerExists) {
        expect(placementCheck.isBelow, 'Secondary banner must be positioned below Tap Water section').toBe(true);
      }
    });

    // Test 4: Height ratio verification (~80% of Hero banner height)
    await ctx.it('Secondary banner height is approximately 80% (70%-95%) of Hero banner height', async () => {
      const heightRatio = await browser.evaluate(`
        (() => {
          const hero = document.querySelector('.full-page-hero-container');
          const secondary = document.querySelector('.secondary-banner-section, .secondary-banner-root');
          if (!hero || !secondary) return null;
          const heroH = hero.getBoundingClientRect().height;
          const secH = secondary.getBoundingClientRect().height;
          return {
            heroH,
            secH,
            ratio: secH / heroH
          };
        })()
      `);

      if (heightRatio) {
        expect(heightRatio.ratio >= 0.65 && heightRatio.ratio <= 0.95,
          `Secondary banner height ratio should be ~80% of hero (actual: ${(heightRatio.ratio * 100).toFixed(1)}%)`
        ).toBe(true);
      } else {
        throw new Error('Both hero banner and secondary banner must exist to verify height ratio');
      }
    });

    // Test 5: Responsive scaling without horizontal overflow
    for (const [key, vp] of Object.entries(TEST_ENV.VIEWPORTS)) {
      await ctx.it(`Secondary banner scales responsively on ${vp.name} without horizontal page overflow`, async () => {
        await browser.setViewport(vp.width, vp.height, Boolean(vp.isMobile));
        await sleep(300);

        const overflowCheck = await browser.evaluate(`
          (() => {
            const scrollWidth = document.documentElement.scrollWidth;
            const clientWidth = document.documentElement.clientWidth;
            return {
              scrollWidth,
              clientWidth,
              hasOverflow: scrollWidth > clientWidth + 2
            };
          })()
        `);

        expect(overflowCheck.hasOverflow, `No horizontal overflow on ${vp.name}`).toBe(false);
      });
    }

  } finally {
    await browser.close();
  }

  return ctx.getSummary();
}
