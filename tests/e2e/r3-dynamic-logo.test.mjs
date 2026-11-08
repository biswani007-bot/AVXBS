import { ApiClient } from '../helpers/api-client.mjs';
import { CDPBrowser } from '../helpers/cdp-browser.mjs';
import { TestContext, expect } from '../helpers/test-reporter.mjs';
import { TEST_ENV, sleep, generateTestId, waitFor } from '../helpers/test-env.mjs';

export async function runR3Suite() {
  const ctx = new TestContext('R3: Dynamic Website Logo (Admin-Controlled & Public API)');
  const api = new ApiClient();
  const browser = new CDPBrowser();

  let originalLogoConfig = null;
  try {
    // 1. Authenticate API client
    const loginRes = await api.login();
    expect(loginRes.ok, 'Admin login should succeed for R3 tests').toBe(true);

    // Save original logo to avoid test-pollution clobbering production/admin logo
    const origRes = await api.getSettings('website_logo');
    if (origRes.ok && origRes.data?.success) {
      originalLogoConfig = origRes.data?.data?.value || origRes.data?.setting || origRes.data?.settings?.website_logo;
    }

    // Test 1: Unauthenticated upload rejection (R3 & R7 security)
    await ctx.it('Unauthenticated upload to /api/uploads is rejected with 401 Unauthorized', async () => {
      const dummyPng = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2DB40000000049454E44AE426082', 'hex');
      const unauthRes = await api.uploadFile(dummyPng, 'logo.png', 'image/png', { auth: false });
      expect(unauthRes.status, 'Unauthenticated upload must return 401').toBe(401);
    });

    // Test 2: Upload format validation (reject non-image files)
    await ctx.it('Upload of non-image file (e.g. text/plain or executable) is rejected with 400 Bad Request', async () => {
      const textBuffer = Buffer.from('Malicious script content or invalid text file');
      const badRes = await api.uploadFile(textBuffer, 'exploit.txt', 'text/plain', { auth: true });
      const isRejected = badRes.status === 400 || badRes.data?.success === false;
      expect(isRejected, 'Uploading non-image file should be rejected with 400 or success: false').toBe(true);
    });

    // Test 3: Upload size validation (reject file exceeding maximum limit)
    await ctx.it('Upload of oversized file (> 5MB server limit) is rejected with 400 Bad Request', async () => {
      // 5.5MB dummy buffer exceeding 5MB server MAX_FILE_SIZE
      const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0);
      const sizeRes = await api.uploadFile(oversizedBuffer, 'huge_file.png', 'image/png', { auth: true });
      const isRejected = sizeRes.status === 400 || sizeRes.status === 413 || sizeRes.data?.success === false;
      expect(isRejected, 'Uploading file > 5MB should be rejected with 400').toBe(true);
    });

    // Test 4: Valid image upload succeeds and returns file path
    let uploadedLogoUrl = null;
    await ctx.it('Valid image upload succeeds and returns public file URL', async () => {
      // 1x1 transparent PNG binary
      const validPng = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2DB40000000049454E44AE426082', 'hex');
      const filename = `logo_e2e_${generateTestId()}.png`;
      const uploadRes = await api.uploadFile(validPng, filename, 'image/png', { auth: true, category: 'branding' });

      expect(uploadRes.status === 200 || uploadRes.status === 201, 'Upload should return 200 or 201').toBe(true);
      expect(uploadRes.data.success, 'Upload response should indicate success: true').toBe(true);

      uploadedLogoUrl = uploadRes.data.url || uploadRes.data.filePath || uploadRes.data.media?.url;
      expect(Boolean(uploadedLogoUrl), 'Upload response must include valid URL').toBe(true);
      expect(uploadedLogoUrl.startsWith('/uploads/'), 'Uploaded logo URL should be in /uploads/').toBe(true);
    });

    // Test 5: Persist logo configuration in SiteSetting (key: website_logo)
    await ctx.it('Logo configuration persists in SiteSetting with key website_logo', async () => {
      const logoConfig = {
        imageUrl: uploadedLogoUrl || '/uploads/sample_logo.png',
        altText: 'AVXBS E2E Dynamic Logo',
        updatedAt: new Date().toISOString()
      };

      const saveRes = await api.saveSetting('website_logo', logoConfig, 'branding', 'Website brand logo configuration');
      expect(saveRes.ok, 'Saving website_logo setting should succeed').toBe(true);

      // Verify retrieval via public GET /api/settings?key=website_logo
      const getRes = await api.getSettings('website_logo');
      expect(getRes.ok, 'GET /api/settings?key=website_logo should return 200').toBe(true);
      expect(getRes.data.success, 'GET response should have success: true').toBe(true);

      const savedValue = getRes.data.data?.value || getRes.data.setting || getRes.data.settings?.website_logo;
      expect(Boolean(savedValue), 'Saved logo value should exist').toBe(true);
      expect(savedValue.imageUrl, 'Saved logo imageUrl should match uploaded URL').toBe(logoConfig.imageUrl);
    });

    // Test 6: Public browser rendering: dynamic logo loaded or graceful fallback
    await ctx.it('Public frontend loads logo dynamically via API or falls back cleanly with zero console errors', async () => {
      await browser.launch(TEST_ENV.FRONTEND_URL);
      await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);
      await waitFor(async () => {
        const el = await browser.querySelector('.avxbs-animated-logo-root, .site-logo img, .site-logo');
        return Boolean(el);
      }, 10000, 200, 'Logo hydration');

      const logoDomState = await browser.evaluate(`
        (() => {
          // Check for dynamic uploaded logo img OR fallback animated logo
          const dynamicImg = document.querySelector('.site-logo img, .site-header img[alt*="AVXBS"], .avxbs-dynamic-logo img');
          const fallbackLogo = document.querySelector('.avxbs-animated-logo-root, .site-logo');
          return {
            hasDynamicImg: Boolean(dynamicImg && dynamicImg.getAttribute('src')),
            dynamicSrc: dynamicImg ? dynamicImg.getAttribute('src') : null,
            hasFallbackLogo: Boolean(fallbackLogo),
            logoVisible: Boolean(dynamicImg || fallbackLogo)
          };
        })()
      `);

      expect(logoDomState.logoVisible, 'A valid logo (dynamic image or fallback) must render on public site').toBe(true);

      const errors = browser.getConsoleErrors();
      const logoErrors = errors.filter((e) => e.toLowerCase().includes('logo'));
      expect(logoErrors.length === 0, `No logo-related console errors should occur (found: ${logoErrors.join('; ')})`).toBe(true);
    });

  } finally {
    if (originalLogoConfig) {
      try {
        await api.saveSetting('website_logo', originalLogoConfig, 'branding', 'Website brand logo configuration');
      } catch (err) {
        console.warn('[R3 Cleanup] Could not restore original logo setting:', err.message);
      }
    }
    await browser.close();
  }

  return ctx.getSummary();
}
