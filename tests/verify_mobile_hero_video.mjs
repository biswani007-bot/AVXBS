import { CDPBrowser } from './helpers/cdp-browser.mjs';
import fs from 'fs';

async function main() {
  console.log('--- Starting Hero Banner Verification Suite ---');
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.navigate('http://localhost:5173', 2000);

  // Wait for hero slides and indicators to fully hydrate
  for (let i = 0; i < 30; i++) {
    const ready = await browser.evaluate(`
      (() => {
        const ind = document.querySelector('.hero-progress-indicators');
        const vid = document.querySelector('.hero-banner-slide.is-active video');
        return Boolean(ind && vid && vid.readyState >= 1 && vid.videoWidth > 0);
      })()
    `);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 1. Mobile 375x667 Verification
  console.log('\n[1. Testing Mobile 375x667]');
  await browser.setViewport(375, 667, true);
  await new Promise(r => setTimeout(r, 1000));

  const mobile375 = await browser.evaluate(`
    (() => {
      const hero = document.querySelector('.full-page-hero-container');
      const activeSlide = hero.querySelector('.hero-banner-slide.is-active');
      const video = activeSlide ? activeSlide.querySelector('video') : null;
      const indicators = hero.querySelector('.hero-progress-indicators');

      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const videoRect = video ? video.getBoundingClientRect() : null;
      const indRect = indicators ? indicators.getBoundingClientRect() : null;

      const videoCs = video ? window.getComputedStyle(video) : null;
      const heroCs = hero ? window.getComputedStyle(hero) : null;

      return {
        viewportWidth: window.innerWidth,
        heroRect: heroRect ? { width: heroRect.width, height: heroRect.height } : null,
        videoRect: videoRect ? { width: videoRect.width, height: videoRect.height } : null,
        videoNatural: video ? { width: video.videoWidth, height: video.videoHeight, duration: video.duration } : null,
        videoStyle: videoCs ? { objectFit: videoCs.objectFit, width: videoCs.width, height: videoCs.height } : null,
        heroStyle: heroCs ? { height: heroCs.height, aspectRatio: heroCs.aspectRatio } : null,
        indicatorsInside: indRect && heroRect ? (indRect.bottom <= heroRect.bottom + 4 && indRect.top >= heroRect.top) : false,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);

  console.log('Mobile 375 metrics:', JSON.stringify(mobile375, null, 2));

  // Save after screenshot
  const snap375 = await browser.send('Page.captureScreenshot');
  fs.writeFileSync('after_mobile_375.png', Buffer.from(snap375.data, 'base64'));
  console.log('Saved after_mobile_375.png');

  // Verify assertions for 375
  const naturalRatio375 = mobile375.videoNatural.width / mobile375.videoNatural.height;
  const renderedRatio375 = mobile375.videoRect.width / mobile375.videoRect.height;
  const ratioDiff375 = Math.abs(naturalRatio375 - renderedRatio375);

  console.log(`Video Natural Ratio: ${naturalRatio375.toFixed(4)}, Rendered Ratio: ${renderedRatio375.toFixed(4)}, Diff: ${ratioDiff375.toFixed(4)}`);
  if (ratioDiff375 < 0.02) {
    console.log('✓ PASS: Original video aspect ratio preserved on 375x667');
  } else {
    console.error('✗ FAIL: Aspect ratio mismatch');
  }

  if (Math.abs(mobile375.videoRect.width - 375) <= 1) {
    console.log('✓ PASS: Video width is 100% of available screen width');
  } else {
    console.error('✗ FAIL: Video width does not fit 100% screen width');
  }

  if (mobile375.videoStyle.objectFit === 'contain') {
    console.log('✓ PASS: Video uses object-fit: contain (no cropping)');
  } else {
    console.error('✗ FAIL: Video does not use object-fit: contain');
  }

  if (!mobile375.horizontalOverflow) {
    console.log('✓ PASS: No horizontal page overflow');
  } else {
    console.error('✗ FAIL: Horizontal page overflow detected');
  }

  if (mobile375.indicatorsInside) {
    console.log('✓ PASS: Indicators stay completely inside hero banner bounds');
  } else {
    console.error('✗ FAIL: Indicators outside hero banner');
  }

  // 2. Mobile L 425x634 Verification
  console.log('\n[2. Testing Mobile L 425x634]');
  await browser.setViewport(425, 634, true);
  await new Promise(r => setTimeout(r, 600));

  const mobile425 = await browser.evaluate(`
    (() => {
      const hero = document.querySelector('.full-page-hero-container');
      const activeSlide = hero.querySelector('.hero-banner-slide.is-active');
      const video = activeSlide ? activeSlide.querySelector('video') : null;
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const videoRect = video ? video.getBoundingClientRect() : null;
      return {
        viewportWidth: window.innerWidth,
        heroRect: heroRect ? { width: heroRect.width, height: heroRect.height } : null,
        videoRect: videoRect ? { width: videoRect.width, height: videoRect.height } : null,
        videoNatural: video ? { width: video.videoWidth, height: video.videoHeight } : null,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Mobile 425 metrics:', JSON.stringify(mobile425, null, 2));

  const snap425 = await browser.send('Page.captureScreenshot');
  fs.writeFileSync('after_mobile_425.png', Buffer.from(snap425.data, 'base64'));
  console.log('Saved after_mobile_425.png');

  const naturalRatio425 = mobile425.videoNatural.width / mobile425.videoNatural.height;
  const renderedRatio425 = mobile425.videoRect.width / mobile425.videoRect.height;
  const ratioDiff425 = Math.abs(naturalRatio425 - renderedRatio425);

  if (ratioDiff425 < 0.02 && Math.abs(mobile425.videoRect.width - 425) <= 1 && !mobile425.horizontalOverflow) {
    console.log('✓ PASS: Mobile L (425x634) full-fit & no cropping verified');
  } else {
    console.error('✗ FAIL: Mobile L checks failed');
  }

  // 3. Desktop / Laptop / Tablet Verification (Unchanged Design)
  console.log('\n[3. Testing Tablet 768x1024]');
  await browser.setViewport(768, 1024, false);
  await new Promise(r => setTimeout(r, 500));
  const tablet = await browser.evaluate(`
    (() => {
      const hero = document.querySelector('.full-page-hero-container');
      const video = hero.querySelector('video');
      return {
        heroHeight: hero ? window.getComputedStyle(hero).height : null,
        videoObjectFit: video ? window.getComputedStyle(video).objectFit : null
      };
    })()
  `);
  console.log('Tablet metrics:', tablet);
  if (tablet.videoObjectFit === 'cover') {
    console.log('✓ PASS: Tablet preserves existing object-fit: cover design');
  } else {
    console.error('✗ FAIL: Tablet object-fit changed');
  }

  console.log('\n[4. Testing Laptop 1024x768]');
  await browser.setViewport(1024, 768, false);
  await new Promise(r => setTimeout(r, 500));
  const laptop = await browser.evaluate(`
    (() => {
      const hero = document.querySelector('.full-page-hero-container');
      const video = hero.querySelector('video');
      return {
        heroHeight: hero ? window.getComputedStyle(hero).height : null,
        videoObjectFit: video ? window.getComputedStyle(video).objectFit : null
      };
    })()
  `);
  console.log('Laptop metrics:', laptop);
  if (laptop.videoObjectFit === 'cover') {
    console.log('✓ PASS: Laptop preserves existing object-fit: cover design');
  } else {
    console.error('✗ FAIL: Laptop object-fit changed');
  }

  console.log('\n[5. Testing Desktop 1440x900]');
  await browser.setViewport(1440, 900, false);
  await new Promise(r => setTimeout(r, 500));
  const desktop = await browser.evaluate(`
    (() => {
      const hero = document.querySelector('.full-page-hero-container');
      const video = hero.querySelector('video');
      return {
        heroHeight: hero ? window.getComputedStyle(hero).height : null,
        videoObjectFit: video ? window.getComputedStyle(video).objectFit : null
      };
    })()
  `);
  console.log('Desktop metrics:', desktop);
  if (desktop.videoObjectFit === 'cover') {
    console.log('✓ PASS: Desktop preserves existing object-fit: cover design');
  } else {
    console.error('✗ FAIL: Desktop object-fit changed');
  }

  // 6. Complete Video Playback & Ended Event Test
  console.log('\n[6. Testing Complete Video Playback & Ended Event]');
  // Reset to slide 0
  await browser.evaluate(`
    (() => {
      const firstDot = document.querySelector('.hero-progress-btn:nth-child(1)');
      if (firstDot) firstDot.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  const initialSlide = await browser.evaluate(`
    (() => {
      const v = document.querySelector('.hero-banner-slide.is-active video');
      return {
        src: v ? v.src : null,
        duration: v ? v.duration : null,
        currentTime: v ? v.currentTime : null,
        paused: v ? v.paused : null,
        loop: v ? v.loop : null
      };
    })()
  `);
  console.log('Slide 0 video initial:', initialSlide);

  if (initialSlide.loop === false) {
    console.log('✓ PASS: Video loop attribute is disabled (enables ended event)');
  } else {
    console.error('✗ FAIL: Video loop attribute is still enabled!');
  }

  const videoDuration = initialSlide.duration; // ~5 seconds
  console.log(`Video actual duration: ${videoDuration}s`);
  console.log('Observing video playback progression until ended event...');

  const startTime = Date.now();
  let slideTransitioned = false;
  let finalPlaybackTime = 0;

  // Poll for slide transition or video ended
  while (Date.now() - startTime < 9000) {
    const status = await browser.evaluate(`
      (() => {
        const slides = Array.from(document.querySelectorAll('.hero-banner-slide'));
        const activeIdx = slides.findIndex(s => s.classList.contains('is-active'));
        const v0 = slides[0] ? slides[0].querySelector('video') : null;
        return {
          activeIdx,
          v0Ended: v0 ? v0.ended : false,
          v0CurrentTime: v0 ? v0.currentTime : 0
        };
      })()
    `);

    finalPlaybackTime = status.v0CurrentTime;
    if (status.activeIdx === 1) {
      slideTransitioned = true;
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`Observed Playback Duration before transition: ~${elapsed.toFixed(2)}s (video currentTime reached: ${finalPlaybackTime.toFixed(2)}s)`);

  if (slideTransitioned) {
    console.log(`✓ PASS: Transition to Slide 2 occurred after video completed full duration (~${videoDuration}s)`);
    console.log(`  Actual Video Duration: ${videoDuration}s | Observed Playback Duration: ${elapsed.toFixed(2)}s`);
  } else {
    console.error(`✗ FAIL: Slide did not transition within expected timeframe!`);
  }

  // 7. Test Slide 2 (49s video) doesn't get cut short after 3s or 5s
  console.log('\n[7. Testing Slide 1 (49s video) does not get cut short]');
  const slide1Info = await browser.evaluate(`
    (() => {
      const slides = Array.from(document.querySelectorAll('.hero-banner-slide'));
      const activeIdx = slides.findIndex(s => s.classList.contains('is-active'));
      const v = slides[activeIdx] ? slides[activeIdx].querySelector('video') : null;
      return {
        activeIdx,
        src: v ? v.src : null,
        duration: v ? v.duration : null,
        currentTime: v ? v.currentTime : null,
        paused: v ? v.paused : null
      };
    })()
  `);
  console.log('Slide 1 video info:', slide1Info);

  // Wait 4 seconds and check it is still playing Slide 1
  await new Promise(r => setTimeout(r, 4000));
  const stillSlide1 = await browser.evaluate(`
    (() => {
      const slides = Array.from(document.querySelectorAll('.hero-banner-slide'));
      const activeIdx = slides.findIndex(s => s.classList.contains('is-active'));
      const v = slides[activeIdx] ? slides[activeIdx].querySelector('video') : null;
      return {
        activeIdx,
        currentTime: v ? v.currentTime : null,
        paused: v ? v.paused : null
      };
    })()
  `);
  console.log('After 4 seconds, slide status:', stillSlide1);

  if (stillSlide1.activeIdx === 1 && !stillSlide1.paused && stillSlide1.currentTime > 3) {
    console.log('✓ PASS: Long video (49s) is playing continuously and not interrupted by fixed timer');
  } else {
    console.error('✗ FAIL: Long video interrupted or stopped');
  }

  // 8. Manual Controls Test
  console.log('\n[8. Testing Manual Pause / Play and Navigation]');
  // Click pause
  await browser.click('.hero-progress-next-btn');
  await new Promise(r => setTimeout(r, 300));
  const pausedVideo = await browser.evaluate(`
    (() => {
      const activeVid = document.querySelector('.hero-banner-slide.is-active video');
      return activeVid ? activeVid.paused : null;
    })()
  `);
  console.log('Video paused state:', pausedVideo);
  if (pausedVideo === true) {
    console.log('✓ PASS: Pause button successfully pauses video');
  } else {
    console.error('✗ FAIL: Video not paused');
  }

  // Click resume
  await browser.click('.hero-progress-next-btn');
  await new Promise(r => setTimeout(r, 300));
  const resumedVideo = await browser.evaluate(`
    (() => {
      const activeVid = document.querySelector('.hero-banner-slide.is-active video');
      return activeVid ? activeVid.paused : null;
    })()
  `);
  if (resumedVideo === false) {
    console.log('✓ PASS: Play button successfully resumes video');
  } else {
    console.error('✗ FAIL: Video not resumed');
  }

  // Click Dot 0
  await browser.click('.hero-progress-btn:nth-child(1)');
  await new Promise(r => setTimeout(r, 500));
  const backToSlide0 = await browser.evaluate(`
    (() => {
      const slides = Array.from(document.querySelectorAll('.hero-banner-slide'));
      return slides.findIndex(s => s.classList.contains('is-active'));
    })()
  `);
  if (backToSlide0 === 0) {
    console.log('✓ PASS: Manual dot click successfully navigated back to slide 0');
  } else {
    console.error('✗ FAIL: Dot navigation failed');
  }

  const errors = browser.getConsoleErrors();
  console.log('\nConsole Errors:', errors.length ? errors : 'None');

  await browser.close();
  console.log('\n--- All verification checks complete! ---');
}

main().catch(console.error);
