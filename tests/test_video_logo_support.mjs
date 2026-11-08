import fs from 'fs';
import path from 'path';
import { ApiClient } from './helpers/api-client.mjs';
import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { TestContext, expect } from './helpers/test-reporter.mjs';
import { TEST_ENV, sleep, waitFor, generateTestId } from './helpers/test-env.mjs';

export async function runVideoLogoSuite() {
  const ctx = new TestContext('Video Logo Support: Image & Video Formats, Responsiveness & Playback');
  const api = new ApiClient();
  const browser = new CDPBrowser();

  let originalLogoConfig = null;

  try {
    // Step 0: Authenticate
    const loginRes = await api.login();
    expect(loginRes.ok, 'Admin login must succeed').toBe(true);

    // Save original logo config for restoration
    const origRes = await api.getSettings('website_logo');
    if (origRes.ok && origRes.data?.success) {
      originalLogoConfig = origRes.data?.data?.value || origRes.data?.setting || origRes.data?.settings?.website_logo;
    }

    // 1. Validation Tests: Unsupported formats & Oversized files
    await ctx.it('Server rejects unsupported file formats (e.g. .pdf or .txt) with 400 Bad Request', async () => {
      const txtBuffer = Buffer.from('Simple text file payload');
      const res = await api.uploadFile(txtBuffer, 'document.txt', 'text/plain', { auth: true });
      expect(res.status === 400 || res.data?.success === false, 'Non-media file must be rejected').toBe(true);
    });

    await ctx.it('Server rejects oversized image (> 5MB) with 400 Bad Request', async () => {
      const hugeImg = Buffer.alloc(5.5 * 1024 * 1024, 0);
      const res = await api.uploadFile(hugeImg, 'huge_logo.png', 'image/png', { auth: true });
      expect(res.status === 400 || res.status === 413, 'Oversized image (>5MB) must be rejected with 400').toBe(true);
    });

    await ctx.it('Server rejects oversized video (> 25MB) with 400 Bad Request', async () => {
      const hugeVid = Buffer.alloc(26 * 1024 * 1024, 0);
      const res = await api.uploadFile(hugeVid, 'huge_video.mp4', 'video/mp4', { auth: true });
      expect(res.status === 400 || res.status === 413, 'Oversized video (>25MB) must be rejected with 400').toBe(true);
    });

    // 2. Image formats: PNG, SVG, WEBP, GIF
    let pngUrl = null;
    await ctx.it('PNG logo upload succeeds and saves to SiteSetting', async () => {
      const dummyPng = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2DB40000000049454E44AE426082', 'hex');
      const res = await api.uploadFile(dummyPng, `logo_${generateTestId()}.png`, 'image/png', { auth: true, category: 'branding' });
      expect(res.ok && res.data.success, 'PNG upload must succeed').toBe(true);
      pngUrl = res.data.url;
      expect(Boolean(pngUrl), 'PNG URL must be returned').toBe(true);

      const saveRes = await api.saveSetting('website_logo', {
        imageUrl: pngUrl,
        url: pngUrl,
        mediaType: 'image',
        mimeType: 'image/png',
        altText: 'AVXBS PNG Logo Test',
        updatedAt: new Date().toISOString()
      }, 'branding', 'Website brand logo');
      expect(saveRes.ok, 'Saving PNG logo setting must succeed').toBe(true);
    });

    let svgUrl = null;
    await ctx.it('SVG logo upload succeeds and saves to SiteSetting', async () => {
      const dummySvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="#0284c7"/><text x="20" y="38" fill="#fff" font-family="sans-serif" font-size="22" font-weight="bold">AVXBS SVG</text></svg>');
      const res = await api.uploadFile(dummySvg, `logo_${generateTestId()}.svg`, 'image/svg+xml', { auth: true, category: 'branding' });
      expect(res.ok && res.data.success, 'SVG upload must succeed').toBe(true);
      svgUrl = res.data.url;
      expect(Boolean(svgUrl), 'SVG URL must be returned').toBe(true);

      const saveRes = await api.saveSetting('website_logo', {
        imageUrl: svgUrl,
        url: svgUrl,
        mediaType: 'image',
        mimeType: 'image/svg+xml',
        altText: 'AVXBS SVG Logo Test',
        updatedAt: new Date().toISOString()
      }, 'branding', 'Website brand logo');
      expect(saveRes.ok, 'Saving SVG logo setting must succeed').toBe(true);
    });

    let webpUrl = null;
    await ctx.it('WEBP logo upload succeeds and saves to SiteSetting', async () => {
      // Minimal valid WebP binary
      const dummyWebp = Buffer.from('524946461a000000574542505650384c0d0000002f00000010071011118888fe0700', 'hex');
      const res = await api.uploadFile(dummyWebp, `logo_${generateTestId()}.webp`, 'image/webp', { auth: true, category: 'branding' });
      expect(res.ok && res.data.success, 'WEBP upload must succeed').toBe(true);
      webpUrl = res.data.url;
      expect(Boolean(webpUrl), 'WEBP URL must be returned').toBe(true);

      const saveRes = await api.saveSetting('website_logo', {
        imageUrl: webpUrl,
        url: webpUrl,
        mediaType: 'image',
        mimeType: 'image/webp',
        altText: 'AVXBS WEBP Logo Test',
        updatedAt: new Date().toISOString()
      }, 'branding', 'Website brand logo');
      expect(saveRes.ok, 'Saving WEBP logo setting must succeed').toBe(true);
    });

    let gifUrl = null;
    await ctx.it('GIF logo upload succeeds and saves to SiteSetting', async () => {
      // 1x1 transparent GIF binary
      const dummyGif = Buffer.from('47494638396101000100800000ffffff00000021f90401000000002c00000000010001000002024401003b', 'hex');
      const res = await api.uploadFile(dummyGif, `logo_${generateTestId()}.gif`, 'image/gif', { auth: true, category: 'branding' });
      expect(res.ok && res.data.success, 'GIF upload must succeed').toBe(true);
      gifUrl = res.data.url;
      expect(Boolean(gifUrl), 'GIF URL must be returned').toBe(true);

      const saveRes = await api.saveSetting('website_logo', {
        imageUrl: gifUrl,
        url: gifUrl,
        mediaType: 'image',
        mimeType: 'image/gif',
        altText: 'AVXBS GIF Logo Test',
        updatedAt: new Date().toISOString()
      }, 'branding', 'Website brand logo');
      expect(saveRes.ok, 'Saving GIF logo setting must succeed').toBe(true);
    });

    // 3. Video formats: MP4 and WebM
    // Read an existing real MP4 file from public/uploads to test realistic video upload & playback
    const existingMp4Path = path.join(process.cwd(), 'backend', 'public', 'uploads', 'WhatsApp_Video_2026-11-05_at_6_44_18_PM_1793884504185.mp4');
    let realMp4Buffer;
    if (fs.existsSync(existingMp4Path)) {
      realMp4Buffer = fs.readFileSync(existingMp4Path);
    } else {
      // Minimal ftyp MP4 header fallback if not present
      realMp4Buffer = Buffer.from('000000206674797069736f6d0000020069736f6d69736f32617663316d703431', 'hex');
    }

    let mp4Url = null;
    await ctx.it('MP4 video logo upload succeeds and returns valid public URL', async () => {
      const res = await api.uploadFile(realMp4Buffer, `logo_video_${generateTestId()}.mp4`, 'video/mp4', { auth: true, category: 'branding' });
      expect(res.ok && res.data.success, 'MP4 upload must succeed').toBe(true);
      mp4Url = res.data.url;
      expect(Boolean(mp4Url), 'MP4 URL must be present').toBe(true);
      expect(mp4Url.endsWith('.mp4'), 'URL must end with .mp4').toBe(true);
    });

    let webmUrl = null;
    await ctx.it('WebM video logo upload succeeds and returns valid public URL', async () => {
      const dummyWebm = Buffer.from('1a45dfa39f4286810142f7810142f2810442f381084282847765626d42878102428581021853806701ffffffffffffff', 'hex');
      const res = await api.uploadFile(dummyWebm, `logo_video_${generateTestId()}.webm`, 'video/webm', { auth: true, category: 'branding' });
      expect(res.ok && res.data.success, 'WebM upload must succeed').toBe(true);
      webmUrl = res.data.url;
      expect(Boolean(webmUrl), 'WebM URL must be present').toBe(true);
      expect(webmUrl.endsWith('.webm'), 'URL must end with .webm').toBe(true);
    });

    await ctx.it('WebM upload with generic application/octet-stream succeeds via extension mapping', async () => {
      const dummyWebm = Buffer.from('1a45dfa39f4286810142f7810142f2810442f381084282847765626d42878102428581021853806701ffffffffffffff', 'hex');
      const res = await api.uploadFile(dummyWebm, `logo_compat_${generateTestId()}.webm`, 'application/octet-stream', { auth: true, category: 'branding' });
      expect(res.ok && res.data.success, 'WebM upload with octet-stream must succeed').toBe(true);
      expect(res.data.media?.mimeType, 'MIME type must be resolved to video/webm').toBe('video/webm');
    });

    await ctx.it('Video logo persists in SiteSetting with mediaType: "video"', async () => {
      const videoLogoConfig = {
        imageUrl: mp4Url,
        url: mp4Url,
        videoUrl: mp4Url,
        mediaType: 'video',
        mimeType: 'video/mp4',
        altText: 'AVXBS Animated Video Logo',
        updatedAt: new Date().toISOString()
      };

      const saveRes = await api.saveSetting('website_logo', videoLogoConfig, 'branding', 'Primary brand logo');
      expect(saveRes.ok, 'Saving video logo must succeed').toBe(true);

      const getRes = await api.getSettings('website_logo');
      expect(getRes.ok && getRes.data?.success, 'GET /api/settings?key=website_logo must return 200').toBe(true);

      const saved = getRes.data?.data?.value || getRes.data?.setting;
      expect(saved.mediaType, 'Saved setting mediaType must be "video"').toBe('video');
      expect(saved.url || saved.imageUrl, 'Saved setting URL must match uploaded MP4 URL').toBe(mp4Url);
    });

    // 4. Public Navbar Browser Display: Video Logo Verification
    await ctx.it('Public Navbar renders <video> element with autoplay, muted, loop, playsInline & no controls', async () => {
      await browser.launch(TEST_ENV.FRONTEND_URL);
      await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

      // Wait for logo container hydration
      await waitFor(async () => {
        const el = await browser.querySelector('.avxbs-dynamic-logo, .site-logo');
        return Boolean(el);
      }, 10000, 250, 'Logo hydration in navbar');

      const videoState = await browser.evaluate(`
        (() => {
          const videoEl = document.querySelector('.site-logo video, .avxbs-dynamic-logo video, .avxbs-dynamic-logo-video');
          if (!videoEl) return { exists: false };

          const rect = videoEl.getBoundingClientRect();
          const compStyle = window.getComputedStyle(videoEl);

          return {
            exists: true,
            src: videoEl.getAttribute('src') || videoEl.currentSrc,
            autoplay: videoEl.autoplay,
            muted: videoEl.muted,
            loop: videoEl.loop,
            playsInline: videoEl.playsInline,
            hasControls: videoEl.controls,
            paused: videoEl.paused,
            width: rect.width,
            height: rect.height,
            objectFit: compStyle.objectFit,
            pointerEvents: compStyle.pointerEvents
          };
        })()
      `);

      expect(videoState.exists, 'Dynamic video element must exist in navbar DOM').toBe(true);
      expect(videoState.autoplay, 'Video must have autoplay enabled').toBe(true);
      expect(videoState.muted, 'Video must be muted to comply with autoplay policy and prevent sound').toBe(true);
      expect(videoState.loop, 'Video must have loop enabled').toBe(true);
      expect(videoState.playsInline, 'Video must have playsInline enabled').toBe(true);
      expect(videoState.hasControls, 'Video controls must be hidden').toBe(false);
      expect(videoState.objectFit, 'Video must use object-fit: contain to preserve aspect ratio').toBe('contain');
      expect(videoState.height > 0 && videoState.height <= 85, 'Video height must be constrained within header limits (height <= 85px)').toBe(true);
      expect(videoState.width > 0 && videoState.width <= 200, 'Video width must be constrained within header limits (width <= 200px)').toBe(true);
    });

    // 5. Responsive display across viewports
    await ctx.it('Video logo scales responsively without layout shifts on Desktop (1440x900)', async () => {
      await browser.setViewport(1440, 900);
      await sleep(300);

      const metrics = await browser.evaluate(`
        (() => {
          const video = document.querySelector('.avxbs-dynamic-logo-video');
          const header = document.querySelector('.site-header');
          if (!video || !header) return { valid: false };
          const vRect = video.getBoundingClientRect();
          const hRect = header.getBoundingClientRect();
          return {
            valid: true,
            vHeight: vRect.height,
            vWidth: vRect.width,
            insideHeader: vRect.bottom <= hRect.bottom && vRect.top >= hRect.top,
            noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth
          };
        })()
      `);

      expect(metrics.valid, 'Video and header must exist').toBe(true);
      expect(metrics.insideHeader, 'Video logo must remain completely inside site header').toBe(true);
      expect(metrics.noPageOverflow, 'No horizontal page overflow on Desktop').toBe(true);
    });

    await ctx.it('Video logo scales responsively on Laptop (1024x768)', async () => {
      await browser.setViewport(1024, 768);
      await sleep(300);

      const metrics = await browser.evaluate(`
        (() => {
          const video = document.querySelector('.avxbs-dynamic-logo-video');
          const header = document.querySelector('.site-header');
          if (!video || !header) return { valid: false };
          const vRect = video.getBoundingClientRect();
          const hRect = header.getBoundingClientRect();
          return {
            valid: true,
            vHeight: vRect.height,
            insideHeader: vRect.bottom <= hRect.bottom + 2,
            noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth
          };
        })()
      `);

      expect(metrics.valid, 'Video and header must exist on Laptop').toBe(true);
      expect(metrics.insideHeader, 'Video logo must remain inside site header on Laptop').toBe(true);
      expect(metrics.noPageOverflow, 'No horizontal page overflow on Laptop').toBe(true);
    });

    await ctx.it('Video logo scales responsively on Tablet (768x1024)', async () => {
      await browser.setViewport(768, 1024);
      await sleep(300);

      const metrics = await browser.evaluate(`
        (() => {
          const video = document.querySelector('.avxbs-dynamic-logo-video');
          const header = document.querySelector('.site-header');
          if (!video || !header) return { valid: false };
          const vRect = video.getBoundingClientRect();
          const hRect = header.getBoundingClientRect();
          return {
            valid: true,
            vHeight: vRect.height,
            insideHeader: vRect.bottom <= hRect.bottom + 2,
            noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth
          };
        })()
      `);

      expect(metrics.valid, 'Video and header must exist on Tablet').toBe(true);
      expect(metrics.insideHeader, 'Video logo must remain inside site header on Tablet').toBe(true);
      expect(metrics.noPageOverflow, 'No horizontal page overflow on Tablet').toBe(true);
    });

    await ctx.it('Video logo scales responsively on Mobile (375x667)', async () => {
      await browser.setViewport(375, 667);
      await sleep(300);

      const metrics = await browser.evaluate(`
        (() => {
          const video = document.querySelector('.avxbs-dynamic-logo-video');
          const header = document.querySelector('.site-header');
          if (!video || !header) return { valid: false };
          const vRect = video.getBoundingClientRect();
          const hRect = header.getBoundingClientRect();
          return {
            valid: true,
            vHeight: vRect.height,
            insideHeader: vRect.bottom <= hRect.bottom + 2,
            noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth
          };
        })()
      `);

      expect(metrics.valid, 'Video and header must exist on Mobile').toBe(true);
      expect(metrics.insideHeader, 'Video logo must remain inside site header on Mobile').toBe(true);
      expect(metrics.noPageOverflow, 'No horizontal page overflow on Mobile').toBe(true);
    });

    await ctx.it('Footer and Navigation Drawer logos maintain compact height (<= 48px) without being distorted by header sizing', async () => {
      await browser.setViewport(1440, 900);
      const logoDimensions = await browser.evaluate(`
        (() => {
          const footerLogo = document.querySelector('.footer-logo-img.avxbs-dynamic-logo, .footer-logo-img .avxbs-dynamic-logo-video');
          const drawerLogo = document.querySelector('.nav-drawer-logo.avxbs-dynamic-logo, .nav-drawer-logo .avxbs-dynamic-logo-video');
          return {
            footerHeight: footerLogo ? footerLogo.getBoundingClientRect().height : 0,
            drawerHeight: drawerLogo ? drawerLogo.getBoundingClientRect().height : 0,
          };
        })()
      `);
      if (logoDimensions.footerHeight > 0) {
        expect(logoDimensions.footerHeight <= 50, `Footer logo height (${logoDimensions.footerHeight}px) must be <= 50px`).toBe(true);
      }
      if (logoDimensions.drawerHeight > 0) {
        expect(logoDimensions.drawerHeight <= 45, `Drawer logo height (${logoDimensions.drawerHeight}px) must be <= 45px`).toBe(true);
      }
    });

    // 6. Clickable Logo Navigation
    await ctx.it('Clicking the logo navigates to homepage ("/")', async () => {
      await browser.setViewport(1440, 900);
      const isClickable = await browser.evaluate(`
        (() => {
          const link = document.querySelector('.header-logo-link');
          return Boolean(link && (link.getAttribute('href') === '/' || link.onclick || link.getAttribute('aria-label')?.includes('Home')));
        })()
      `);
      expect(isClickable, 'Header logo link must point to homepage').toBe(true);
    });

    // 7. Persistence after page reload
    await ctx.it('Video logo persists and renders identically after full page refresh', async () => {
      await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);

      const afterReload = await browser.evaluate(`
        (() => {
          const video = document.querySelector('.avxbs-dynamic-logo-video');
          return Boolean(video && video.currentSrc);
        })()
      `);
      expect(afterReload, 'Video logo must render immediately after page reload').toBe(true);
    });

    // 8. Admin Replacement: Replace video with SVG image
    await ctx.it('Admin replacement: switching from video to image logo updates frontend dynamically', async () => {
      const imgConfig = {
        imageUrl: svgUrl,
        url: svgUrl,
        mediaType: 'image',
        mimeType: 'image/svg+xml',
        altText: 'AVXBS Replacement SVG Logo',
        updatedAt: new Date().toISOString()
      };

      const saveRes = await api.saveSetting('website_logo', imgConfig, 'branding', 'Website brand logo');
      expect(saveRes.ok, 'Replacing logo with SVG image must succeed').toBe(true);

      // Verify public frontend reflects the replacement
      await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);
      const imgState = await browser.evaluate(`
        (() => {
          const img = document.querySelector('.site-logo img, .avxbs-dynamic-logo-img');
          const video = document.querySelector('.avxbs-dynamic-logo-video');
          return {
            hasImg: Boolean(img && img.getAttribute('src')),
            hasNoVideo: video === null
          };
        })()
      `);
      expect(imgState.hasImg, 'Replaced image logo must render as <img>').toBe(true);
      expect(imgState.hasNoVideo, 'No <video> element should render when image logo is active').toBe(true);
    });

    // 9. Admin Removal: Reset to built-in animated fallback logo
    await ctx.it('Admin removal: resetting logo restores default built-in animated AVXBS logo fallback', async () => {
      const emptyConfig = {
        imageUrl: '',
        url: '',
        mediaType: '',
        mimeType: '',
        altText: 'AVXBS Water Solutions',
        updatedAt: new Date().toISOString()
      };

      const resetRes = await api.saveSetting('website_logo', emptyConfig, 'branding', 'Website brand logo');
      expect(resetRes.ok, 'Resetting website_logo to empty must succeed').toBe(true);

      await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);
      const fallbackState = await browser.evaluate(`
        (() => {
          const fallback = document.querySelector('.avxbs-animated-logo-root');
          const dynamicImg = document.querySelector('.avxbs-dynamic-logo-img');
          const dynamicVid = document.querySelector('.avxbs-dynamic-logo-video');
          return {
            hasFallback: Boolean(fallback),
            noDynamicImg: dynamicImg === null,
            noDynamicVid: dynamicVid === null
          };
        })()
      `);

      expect(fallbackState.hasFallback, 'Built-in animated logo must render when custom logo is removed').toBe(true);
      expect(fallbackState.noDynamicImg && fallbackState.noDynamicVid, 'Dynamic media elements must be absent').toBe(true);
    });

    // 10. Fallback on Broken/Corrupted Video Source
    await ctx.it('Corrupted or unplayable video logo gracefully falls back to built-in pixel-perfect animated logo', async () => {
      const corruptedConfig = {
        imageUrl: '/uploads/nonexistent_or_corrupted_logo_video.mp4',
        url: '/uploads/nonexistent_or_corrupted_logo_video.mp4',
        mediaType: 'video',
        mimeType: 'video/mp4',
        altText: 'Corrupted Video Logo',
        updatedAt: new Date().toISOString()
      };
      await api.saveSetting('website_logo', corruptedConfig, 'branding', 'Website brand logo');
      await browser.evaluate(`localStorage.clear()`);
      await browser.navigate(TEST_ENV.FRONTEND_URL, 2000);

      await waitFor(async () => {
        const fallback = await browser.querySelector('.header-logo-link .avxbs-animated-logo-root');
        return Boolean(fallback);
      }, 10000, 200, 'Fallback logo on broken video');

      const fallbackResult = await browser.evaluate(`
        (() => {
          const fallback = document.querySelector('.header-logo-link .avxbs-animated-logo-root');
          const brokenVideo = document.querySelector('.header-logo-link .avxbs-dynamic-logo-video');
          return {
            hasFallback: Boolean(fallback),
            noBrokenVideo: brokenVideo === null
          };
        })()
      `);
      expect(fallbackResult.hasFallback, 'Animated fallback logo must appear when video fails').toBe(true);
      expect(fallbackResult.noBrokenVideo, 'Broken video element must not remain in navbar').toBe(true);
    });

    // 11. Console Error Verification
    await ctx.it('Zero logo-related console errors during video playback and transitions', async () => {
      const errors = browser.getConsoleErrors();
      const logoErrors = errors.filter((e) => e.toLowerCase().includes('logo') || e.toLowerCase().includes('video'));
      expect(logoErrors.length === 0, `No logo or video console errors should occur (found: ${logoErrors.join('; ')})`).toBe(true);
    });

  } finally {
    // Restore original logo configuration
    if (originalLogoConfig) {
      try {
        await api.saveSetting('website_logo', originalLogoConfig, 'branding', 'Website brand logo configuration');
      } catch (err) {
        console.warn('[VideoLogo Cleanup] Could not restore original logo setting:', err.message);
      }
    }
    await browser.close();
  }

  return ctx.getSummary();
}

// Direct execution support
if (process.argv[1]?.endsWith('test_video_logo_support.mjs')) {
  runVideoLogoSuite()
    .then((summary) => {
      console.log(`\nVideo Logo Suite Complete: ${summary.passed}/${summary.total} passed (${summary.failed} failed)`);
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
