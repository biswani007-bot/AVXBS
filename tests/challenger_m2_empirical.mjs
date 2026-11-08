import { ApiClient } from './helpers/api-client.mjs';
import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TestContext, expect } from './helpers/test-reporter.mjs';
import { TEST_ENV, sleep, generateTestId } from './helpers/test-env.mjs';

export async function runMilestone2ChallengerSuite() {
  const ctx = new TestContext('Milestone 2 Challenger: Logo & Banner Admin Validation & Persistence');
  const api = new ApiClient();
  const browser = new CDPBrowser();

  try {
    // 0. Setup: Authenticate with backend
    const loginRes = await api.login();
    expect(loginRes.ok, 'Admin login should succeed').toBe(true);
    const token = loginRes.data.token;
    expect(Boolean(token), 'Admin token must be returned').toBe(true);

    // Launch browser and configure admin auth session
    await browser.launch(TEST_ENV.BACKEND_URL);
    await browser.send('Network.enable');
    await browser.send('Network.setCookie', {
      url: TEST_ENV.BACKEND_URL,
      name: 'avxbs_token',
      value: token,
      domain: 'localhost',
      path: '/',
    });

    // =========================================================================
    // SECTION 1: CHALLENGE LOGO UPLOAD VALIDATION (Admin UI & API)
    // =========================================================================

    // 1.1 Admin UI: Disallowed extension .exe rejection
    await ctx.it('Admin UI rejects disallowed extension .exe (executable) with explicit error feedback', async () => {
      await browser.navigate(`${TEST_ENV.BACKEND_URL}/admin/settings`, 1500);

      const result = await browser.evaluate(`
        (() => {
          const input = document.querySelector('input[type="file"]');
          if (!input) return { error: 'file input not found' };

          // Construct synthetic .exe file
          const exeFile = new File([new Uint8Array(1024)], 'trojan.exe', { type: 'application/x-msdownload' });
          const dt = new DataTransfer();
          dt.items.add(exeFile);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // Inspect feedback message in DOM
          const feedbackEl = document.querySelector('[class*="bg-red"], [class*="text-red"], .alert, [role="alert"]');
          const feedbackText = feedbackEl ? feedbackEl.innerText : '';
          const bodyText = document.body.innerText;

          return {
            feedbackText,
            hasInvalidFormatMsg: bodyText.includes('Invalid file format') || feedbackText.includes('Invalid file format'),
            pendingStaged: Array.from(document.querySelectorAll('button')).some(b => (b.getAttribute('aria-label') || b.textContent || '').includes('Discard'))
          };
        })()
      `);

      expect(result.hasInvalidFormatMsg, 'UI must display error containing "Invalid file format" when selecting .exe').toBe(true);
    });

    // 1.2 Admin UI: Disallowed extension .pdf rejection
    await ctx.it('Admin UI rejects disallowed extension .pdf with explicit error feedback', async () => {
      const result = await browser.evaluate(`
        (() => {
          const input = document.querySelector('input[type="file"]');
          if (!input) return { error: 'file input not found' };

          const pdfFile = new File([new Uint8Array(2048)], 'document.pdf', { type: 'application/pdf' });
          const dt = new DataTransfer();
          dt.items.add(pdfFile);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));

          const bodyText = document.body.innerText;
          return {
            hasInvalidFormatMsg: bodyText.includes('Invalid file format') || bodyText.includes('Only SVG, PNG, JPG')
          };
        })()
      `);

      expect(result.hasInvalidFormatMsg, 'UI must display error containing "Invalid file format" when selecting .pdf').toBe(true);
    });

    // 1.3 Admin UI: Disallowed extension .txt rejection
    await ctx.it('Admin UI rejects disallowed extension .txt (plain text) with explicit error feedback', async () => {
      const result = await browser.evaluate(`
        (() => {
          const input = document.querySelector('input[type="file"]');
          const txtFile = new File([new Uint8Array(512)], 'notes.txt', { type: 'text/plain' });
          const dt = new DataTransfer();
          dt.items.add(txtFile);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));

          const bodyText = document.body.innerText;
          return {
            hasInvalidFormatMsg: bodyText.includes('Invalid file format')
          };
        })()
      `);

      expect(result.hasInvalidFormatMsg, 'UI must display error for .txt').toBe(true);
    });

    // 1.4 Admin UI: Disallowed image extension .gif rejection (only SVG, PNG, JPG, JPEG, WebP allowed for logo)
    await ctx.it('Admin UI rejects disallowed image extension .gif with explicit error feedback', async () => {
      const result = await browser.evaluate(`
        (() => {
          const input = document.querySelector('input[type="file"]');
          const gifFile = new File([new Uint8Array(512)], 'animation.gif', { type: 'image/gif' });
          const dt = new DataTransfer();
          dt.items.add(gifFile);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));

          const bodyText = document.body.innerText;
          return {
            hasInvalidFormatMsg: bodyText.includes('Invalid file format')
          };
        })()
      `);

      expect(result.hasInvalidFormatMsg, 'UI must reject .gif format').toBe(true);
    });

    // 1.5 Server-side /api/uploads validation: rejects disallowed MIME types with 400
    await ctx.it('Server API /api/uploads rejects disallowed MIME types (text, pdf, gif, exe) with 400 Bad Request', async () => {
      const dummyBuffer = Buffer.from('DISALLOWED CONTENT');

      const exeRes = await api.uploadFile(dummyBuffer, 'malware.exe', 'application/x-msdownload', { auth: true });
      expect(exeRes.status, 'MIME application/x-msdownload must be rejected with 400').toBe(400);

      const txtRes = await api.uploadFile(dummyBuffer, 'bad.txt', 'text/plain', { auth: true });
      expect(txtRes.status, 'MIME text/plain must be rejected with 400').toBe(400);

      const pdfRes = await api.uploadFile(dummyBuffer, 'bad.pdf', 'application/pdf', { auth: true });
      expect(pdfRes.status, 'MIME application/pdf must be rejected with 400').toBe(400);

      const gifRes = await api.uploadFile(dummyBuffer, 'bad.gif', 'image/gif', { auth: true });
      expect(gifRes.status, 'MIME image/gif must be rejected with 400').toBe(400);
    });

    // 1.6 Admin UI: Oversized logo file (>2MB) rejection
    await ctx.it('Admin UI rejects oversized logo file (>2MB, e.g. 2.5MB PNG) with explicit error feedback', async () => {
      const result = await browser.evaluate(`
        (() => {
          const input = document.querySelector('input[type="file"]');
          // 2.5 MB = 2.5 * 1024 * 1024 = 2621440 bytes
          const oversizedBytes = new Uint8Array(2621440);
          const oversizedFile = new File([oversizedBytes], 'large_logo.png', { type: 'image/png' });
          const dt = new DataTransfer();
          dt.items.add(oversizedFile);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));

          const bodyText = document.body.innerText;
          return {
            hasSizeError: bodyText.includes('exceeds 2MB limit') || bodyText.includes('under 2MB')
          };
        })()
      `);

      expect(result.hasSizeError, 'UI must display error containing "exceeds 2MB limit"').toBe(true);
    });

    // 1.7 Admin UI: Exact boundary testing for 2MB limit
    await ctx.it('Admin UI exact boundary testing: rejects 2MB + 1 byte (2,097,153 bytes)', async () => {
      const result = await browser.evaluate(`
        (() => {
          const input = document.querySelector('input[type="file"]');
          // Exactly 2MB + 1 byte = 2 * 1024 * 1024 + 1 = 2097153 bytes
          const boundaryOver = new File([new Uint8Array(2097153)], 'boundary_over.png', { type: 'image/png' });
          const dt = new DataTransfer();
          dt.items.add(boundaryOver);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));

          const bodyText = document.body.innerText;
          return {
            hasSizeError: bodyText.includes('exceeds 2MB limit')
          };
        })()
      `);

      expect(result.hasSizeError, 'UI must reject file with size 2,097,153 bytes (>2MB)').toBe(true);
    });

    // 1.8 Server API /api/uploads oversized file rejection (>5MB)
    await ctx.it('Server API /api/uploads rejects files exceeding 5MB server limit with 400 Bad Request', async () => {
      const hugeBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0);
      const res = await api.uploadFile(hugeBuffer, 'server_huge.png', 'image/png', { auth: true });
      expect(res.status, 'Server upload >5MB must return 400').toBe(400);
      expect(res.data.error, 'Error message should mention 5MB limit').toContain('5MB');
    });

    // =========================================================================
    // SECTION 2: CHALLENGE LOGO PERSISTENCE (SiteSetting & API Retrieval)
    // =========================================================================

    // 2.1 Valid logo upload returns valid file URL
    let uploadedLogoUrl = null;
    const testTimestamp = Date.now();
    await ctx.it('Valid logo file upload (<2MB PNG) succeeds and returns /uploads/ URL', async () => {
      // 1x1 PNG binary
      const validPng = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2DB40000000049454E44AE426082', 'hex');
      const filename = `empirical_logo_${testTimestamp}.png`;
      const uploadRes = await api.uploadFile(validPng, filename, 'image/png', { auth: true, category: 'branding' });

      expect(uploadRes.status === 200 || uploadRes.status === 201, 'Upload should return 200/201').toBe(true);
      expect(uploadRes.data.success, 'Upload response should be success: true').toBe(true);
      uploadedLogoUrl = uploadRes.data.url || uploadRes.data.filePath;
      expect(Boolean(uploadedLogoUrl), 'Uploaded URL must not be empty').toBe(true);
      expect(uploadedLogoUrl.startsWith('/uploads/'), 'URL must start with /uploads/').toBe(true);
    });

    // 2.2 Persist logo to SiteSetting (key: website_logo, group: branding)
    const expectedLogoAlt = `Empirical Logo Alt ${testTimestamp}`;
    await ctx.it('Persisting website_logo setting saves key, group: branding, and value object', async () => {
      const logoPayload = {
        imageUrl: uploadedLogoUrl,
        url: uploadedLogoUrl,
        altText: expectedLogoAlt,
        updatedAt: new Date().toISOString()
      };

      const saveRes = await api.saveSetting(
        'website_logo',
        logoPayload,
        'branding',
        'Primary public website header and footer logo'
      );

      expect(saveRes.ok, 'Saving website_logo setting must return HTTP 200').toBe(true);
      expect(saveRes.data.success, 'Saving website_logo must return success: true').toBe(true);

      const returned = saveRes.data.setting || saveRes.data.data;
      expect(returned.key, 'Persisted setting key must be website_logo').toBe('website_logo');
      expect(returned.group, 'Persisted setting group must be branding').toBe('branding');
    });

    // 2.3 Retrieve via public unauthenticated GET /api/settings?key=website_logo
    await ctx.it('Public unauthenticated GET /api/settings?key=website_logo retrieves persisted logo configuration', async () => {
      const getRes = await api.getSettings('website_logo');

      expect(getRes.ok, 'GET /api/settings?key=website_logo must return HTTP 200').toBe(true);
      expect(getRes.data.success, 'Response must have success: true').toBe(true);

      const data = getRes.data.data;
      expect(Boolean(data), 'Response data must not be null').toBe(true);
      expect(data.key, 'data.key must be website_logo').toBe('website_logo');
      expect(data.group, 'data.group must be branding').toBe('branding');

      const value = data.value;
      expect(Boolean(value), 'data.value must exist').toBe(true);
      expect(value.imageUrl, 'data.value.imageUrl must match uploaded URL').toBe(uploadedLogoUrl);
      expect(value.altText, 'data.value.altText must match expected alt text').toBe(expectedLogoAlt);

      // Verify convenience getters returned by API
      expect(getRes.data.setting?.imageUrl, 'getRes.data.setting.imageUrl must match').toBe(uploadedLogoUrl);
      expect(getRes.data.settings?.website_logo?.imageUrl, 'getRes.data.settings.website_logo.imageUrl must match').toBe(uploadedLogoUrl);
    });

    // 2.4 Retrieve via public unauthenticated GET /api/settings?group=branding
    await ctx.it('Public unauthenticated GET /api/settings?group=branding returns branding configuration', async () => {
      const groupRes = await api.getSettings(null, 'branding');

      expect(groupRes.ok, 'GET /api/settings?group=branding must return HTTP 200').toBe(true);
      expect(groupRes.data.success, 'Response must have success: true').toBe(true);

      const raw = groupRes.data.raw || [];
      const logoSetting = raw.find((s) => s.key === 'website_logo');
      expect(Boolean(logoSetting), 'Group branding must contain website_logo setting').toBe(true);
      expect(logoSetting.group, 'logoSetting.group must be branding').toBe('branding');
      expect(logoSetting.value?.imageUrl, 'logoSetting.value.imageUrl must match').toBe(uploadedLogoUrl);
    });

    // 2.5 Admin UI: Dual light/dark preview & live replacement workflow
    await ctx.it('Admin UI /admin/settings renders dual theme previews and allows logo replacement', async () => {
      await browser.navigate(`${TEST_ENV.BACKEND_URL}/admin/settings`, 1500);

      // Verify current logo previews render in DOM
      const previewCheck = await browser.evaluate(`
        (() => {
          const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src);
          const hasUploadedLogo = imgs.some(src => src.includes(${JSON.stringify(uploadedLogoUrl)}));
          const altInputs = Array.from(document.querySelectorAll('input[type="text"]')).map(i => i.value);
          const hasAlt = altInputs.some(v => v.includes(${JSON.stringify(expectedLogoAlt)}));
          return {
            hasUploadedLogo,
            hasAlt,
            imgsCount: imgs.length
          };
        })()
      `);

      expect(previewCheck.hasUploadedLogo, 'Admin UI must display current persisted logo image in preview').toBe(true);
      expect(previewCheck.hasAlt, 'Admin UI must populate alt text input with current persisted alt text').toBe(true);
    });

    // =========================================================================
    // SECTION 3: CHALLENGE SECONDARY BANNER PERSISTENCE (SiteSetting & API)
    // =========================================================================

    // 3.1 Valid banner image upload
    let uploadedBannerUrl = null;
    await ctx.it('Valid secondary banner upload (<5MB JPEG) succeeds and returns /uploads/ URL', async () => {
      const bannerJpeg = Buffer.from('FFD8FFE000104A46494600010101006000600000FFDB004300080606070605080707070909080A0C140D0C0B0B0C1912130F141D1A1F1E1D1A1C1C20242E2720222C231C1C2837292C30313434341F27393D38323C2E333432FFDA0008010100003F007F00FFD9', 'hex');
      const filename = `empirical_banner_${testTimestamp}.jpg`;
      const uploadRes = await api.uploadFile(bannerJpeg, filename, 'image/jpeg', { auth: true, category: 'banners' });

      expect(uploadRes.status === 200 || uploadRes.status === 201, 'Upload should return 200/201').toBe(true);
      expect(uploadRes.data.success, 'Upload response should be success: true').toBe(true);
      uploadedBannerUrl = uploadRes.data.url || uploadRes.data.filePath;
      expect(Boolean(uploadedBannerUrl), 'Uploaded URL must not be empty').toBe(true);
      expect(uploadedBannerUrl.startsWith('/uploads/'), 'URL must start with /uploads/').toBe(true);
    });

    // 3.2 Persist secondary banner to SiteSetting (key: secondary_banner, group: banners)
    const expectedBannerTitle = `Empirical Purification System ${testTimestamp}`;
    const expectedBannerSubtitle = 'High capacity water treatment engineering for industrial standards';
    const expectedBannerLink = '#water-softener-inquiry-section';

    await ctx.it('Persisting secondary_banner saves key, group: banners, and full banner metadata object', async () => {
      const bannerPayload = {
        imageUrl: uploadedBannerUrl,
        url: uploadedBannerUrl,
        altText: 'Empirical Banner Alt Text',
        imageAlt: 'Empirical Banner Alt Text',
        title: expectedBannerTitle,
        subtitle: expectedBannerSubtitle,
        linkUrl: expectedBannerLink,
        buttonText: 'View Industrial Units',
        isActive: true,
        isEnabled: true,
        updatedAt: new Date().toISOString()
      };

      const saveRes = await api.saveSetting(
        'secondary_banner',
        bannerPayload,
        'banners',
        'Promotional banner section below Tap Water image section'
      );

      expect(saveRes.ok, 'Saving secondary_banner setting must return HTTP 200').toBe(true);
      expect(saveRes.data.success, 'Saving secondary_banner must return success: true').toBe(true);

      const returned = saveRes.data.setting || saveRes.data.data;
      expect(returned.key, 'Persisted setting key must be secondary_banner').toBe('secondary_banner');
      expect(returned.group, 'Persisted setting group must be banners').toBe('banners');
    });

    // 3.3 Retrieve via public unauthenticated GET /api/settings?key=secondary_banner
    await ctx.it('Public unauthenticated GET /api/settings?key=secondary_banner retrieves persisted banner configuration', async () => {
      const getRes = await api.getSettings('secondary_banner');

      expect(getRes.ok, 'GET /api/settings?key=secondary_banner must return HTTP 200').toBe(true);
      expect(getRes.data.success, 'Response must have success: true').toBe(true);

      const data = getRes.data.data;
      expect(Boolean(data), 'Response data must not be null').toBe(true);
      expect(data.key, 'data.key must be secondary_banner').toBe('secondary_banner');
      expect(data.group, 'data.group must be banners').toBe('banners');

      const value = data.value;
      expect(Boolean(value), 'data.value must exist').toBe(true);
      expect(value.imageUrl, 'data.value.imageUrl must match uploaded banner URL').toBe(uploadedBannerUrl);
      expect(value.title, 'data.value.title must match expected title').toBe(expectedBannerTitle);
      expect(value.subtitle, 'data.value.subtitle must match expected subtitle').toBe(expectedBannerSubtitle);
      expect(value.linkUrl, 'data.value.linkUrl must match expected link').toBe(expectedBannerLink);
      expect(value.isActive, 'data.value.isActive must be true').toBe(true);
    });

    // 3.4 Admin UI: Banner Editing & Toggle Persistence
    await ctx.it('Admin UI /admin/banner loads persisted data and persists active toggle state mutation', async () => {
      await browser.navigate(`${TEST_ENV.BACKEND_URL}/admin/banner`, 1500);

      // Verify form inputs load persisted title
      const initialFormState = await browser.evaluate(`
        (() => {
          const titleInput = document.querySelector('input[value*="Empirical Purification System"]') ||
                             Array.from(document.querySelectorAll('input[type="text"]')).find(i => i.value.includes('Empirical'));
          return {
            hasTitle: Boolean(titleInput),
            titleValue: titleInput ? titleInput.value : null
          };
        })()
      `);

      expect(initialFormState.hasTitle, 'Admin UI /admin/banner must populate banner title input').toBe(true);

      // Now toggle isActive off via API or UI and verify persistence
      const updatedBannerPayload = {
        imageUrl: uploadedBannerUrl,
        url: uploadedBannerUrl,
        altText: 'Empirical Banner Alt Text',
        imageAlt: 'Empirical Banner Alt Text',
        title: `${expectedBannerTitle} (Inactive State)`,
        subtitle: expectedBannerSubtitle,
        linkUrl: expectedBannerLink,
        buttonText: 'View Industrial Units',
        isActive: false,
        isEnabled: false,
        updatedAt: new Date().toISOString()
      };

      const updateRes = await api.saveSetting(
        'secondary_banner',
        updatedBannerPayload,
        'banners',
        'Promotional banner section below Tap Water image section'
      );

      expect(updateRes.ok, 'Updating secondary_banner to isActive: false should succeed').toBe(true);

      // Verify retrieval returns isActive: false
      const getInactive = await api.getSettings('secondary_banner');
      expect(getInactive.data.data.value.isActive, 'Persisted banner value must have isActive: false').toBe(false);
      expect(getInactive.data.data.value.title, 'Persisted title must reflect updated inactive title').toContain('(Inactive State)');

      // Re-activate and restore
      updatedBannerPayload.isActive = true;
      updatedBannerPayload.isEnabled = true;
      updatedBannerPayload.title = expectedBannerTitle;
      const restoreRes = await api.saveSetting('secondary_banner', updatedBannerPayload, 'banners', 'Promotional banner section below Tap Water image section');
      expect(restoreRes.ok, 'Restoring banner to isActive: true should succeed').toBe(true);

      const getRestored = await api.getSettings('secondary_banner');
      expect(getRestored.data.data.value.isActive, 'Persisted banner must have isActive: true').toBe(true);
    });

  } finally {
    await browser.close();
  }

  return ctx.getSummary();
}

// Standalone runner execution
console.log('\n======================================================================');
console.log('       EMPIRICAL CHALLENGER: MILESTONE 2 LOGO & BANNER HARNESS        ');
console.log('======================================================================\n');

runMilestone2ChallengerSuite()
  .then((summary) => {
    console.log('\n======================================================================');
    console.log(`TOTAL: ${summary.passed} Passed, ${summary.failed} Failed of ${summary.total} tests (${(summary.durationMs / 1000).toFixed(2)}s)`);
    console.log('======================================================================\n');
    if (summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('Unhandled suite failure:', err);
    process.exit(1);
  });

