import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ChromeClient {
  constructor() {
    this.chromeProcess = null;
    this.ws = null;
    this.tempDir = null;
    this.idCounter = 1;
    this.pending = new Map();
  }

  async init(url = 'http://localhost:5173') {
    this.tempDir = path.join(os.tmpdir(), `chrome-test-${Date.now()}`);
    fs.mkdirSync(this.tempDir, { recursive: true });

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    this.chromeProcess = spawn(chromePath, [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${this.tempDir}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      url
    ], { stdio: 'ignore' });

    let version = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9222/json/version');
        if (res.ok) {
          version = await res.json();
          break;
        }
      } catch (e) {}
      await wait(150);
    }

    if (!version) {
      this.chromeProcess.kill();
      throw new Error('Chrome CDP failed to initialize');
    }

    let pageTarget = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9222/json/list');
        const list = await res.json();
        pageTarget = list.find((t) => t.type === 'page' && t.url.includes('5173'));
        if (pageTarget && pageTarget.webSocketDebuggerUrl) break;
      } catch (e) {}
      await wait(150);
    }

    if (!pageTarget) {
      this.chromeProcess.kill();
      throw new Error('Could not locate page target');
    }

    this.ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await this.send('Page.enable');
    await this.send('DOM.enable');
    await this.send('Runtime.enable');
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.idCounter++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evalJs(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`CDP JS Error: ${res.exceptionDetails.text} / ${JSON.stringify(res.exceptionDetails.exception)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height, scale = 1, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: Math.round(width),
      height: Math.round(height),
      deviceScaleFactor: scale,
      mobile: isMobile
    });
    // Wait for resize relayout
    await wait(250);
  }

  async close() {
    try { if (this.ws) this.ws.close(); } catch (e) {}
    try { if (this.chromeProcess) this.chromeProcess.kill(); } catch (e) {}
    try { if (this.tempDir) fs.rmSync(this.tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}

async function runTestSuite() {
  console.log('=== STARTING EMPIRICAL VERIFICATION SUITE ===');
  const results = {
    r1_overflow: [],
    r1_widget_clamping: null,
    r2_navbar: null,
    r3_hero_image: null,
    r4_arrows_and_slider: null,
    r4_slider_dynamics: null,
    r5_non_regression: null,
  };

  const client = new ChromeClient();
  await client.init('http://localhost:5173');
  await wait(3000); // Allow complete React hydration and asset loading

  try {
    // -------------------------------------------------------------
    // R1: RESPONSIVE OVERFLOW & MULTI-ZOOM STRESS TEST
    // -------------------------------------------------------------
    console.log('\n--- Running R1: Responsive Overflow & Multi-Zoom Stress Test ---');
    const widths = [375, 430, 600, 768, 1024, 1280, 1440, 1920, 2560];
    const zoomLevels = [0.8, 0.9, 1.0, 1.1, 1.25]; // 80%, 90%, 100%, 110%, 125%

    for (const width of widths) {
      for (const zoom of zoomLevels) {
        const height = 900;
        await client.setViewport(width, height, zoom, width <= 768);

        const check = await client.evalJs(`(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const innerWidth = window.innerWidth;
          const scrollX = window.scrollX || window.pageXOffset || 0;

          // Check if any element overflows the viewport horizontally
          const allElements = Array.from(document.querySelectorAll('*'));
          let overflowingElements = [];
          for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            // Ignore fixed / non-rendered elements or elements with zero width
            if (rect.width === 0 || rect.height === 0) continue;
            if (rect.right > clientWidth + 1.5) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className ? '.' + String(el.className).trim().replace(/\\s+/g, '.') : '';
              const id = el.id ? '#' + el.id : '';
              overflowingElements.push({
                selector: tag + id + cls,
                right: Math.round(rect.right),
                excess: Math.round(rect.right - clientWidth)
              });
              if (overflowingElements.length >= 3) break;
            }
          }

          return {
            scrollWidth,
            clientWidth,
            innerWidth,
            scrollX,
            hasHorizontalScrollbar: scrollWidth > clientWidth + 1,
            overflowExcess: Math.max(0, scrollWidth - clientWidth),
            overflowingElements
          };
        })()`);

        const pass = !check.hasHorizontalScrollbar && check.scrollX === 0;
        const entry = {
          width,
          zoom: `${Math.round(zoom * 100)}%`,
          clientWidth: check.clientWidth,
          scrollWidth: check.scrollWidth,
          hasHorizontalScrollbar: check.hasHorizontalScrollbar,
          overflowExcess: check.overflowExcess,
          overflowingElements: check.overflowingElements,
          pass
        };
        results.r1_overflow.push(entry);
        console.log(`[R1] Width: ${width}px | Zoom: ${entry.zoom} | clientWidth: ${check.clientWidth} | scrollWidth: ${check.scrollWidth} | Scrollbar: ${check.hasHorizontalScrollbar ? 'FAIL' : 'PASS'}`);
      }
    }

    // R1: FloatingSupportWidget Scrollbar Boundary Clamping Test
    console.log('\n--- Running R1: FloatingSupportWidget Scrollbar Clamping Test ---');
    await client.setViewport(1440, 900, 1.0, false);
    const widgetStress = await client.evalJs(`(() => {
      const widget = document.querySelector('.floating-support-chat');
      if (!widget) return { found: false };

      const docEl = document.documentElement;
      const initialRect = widget.getBoundingClientRect();
      const initialClientWidth = docEl.clientWidth;

      // Simulate dragging far to the right (+2000px)
      const avatarBox = widget.querySelector('.avatar-widget-interactive-box');
      if (!avatarBox) return { found: true, avatarFound: false };

      const downEvent = new MouseEvent('mousedown', {
        clientX: initialRect.right - 20,
        clientY: initialRect.bottom - 20,
        bubbles: true,
        cancelable: true
      });
      avatarBox.dispatchEvent(downEvent);

      const moveEvent = new MouseEvent('mousemove', {
        clientX: initialRect.right + 2000,
        clientY: initialRect.bottom,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(moveEvent);

      const upEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(upEvent);

      const draggedRect = widget.getBoundingClientRect();
      const finalClientWidth = docEl.clientWidth;

      // avatar is clamped to maxX = docEl.clientWidth - 76
      const rightEdge = draggedRect.right;
      const exceedsClientWidth = rightEdge > finalClientWidth;

      return {
        found: true,
        avatarFound: true,
        initialRight: initialRect.right,
        draggedRight: rightEdge,
        clientWidth: finalClientWidth,
        exceedsClientWidth,
        clampedWithinBounds: rightEdge <= finalClientWidth && rightEdge > 0
      };
    })()`);
    results.r1_widget_clamping = widgetStress;
    console.log('[R1 Widget Clamping]:', widgetStress);

    // -------------------------------------------------------------
    // R2: NAVBAR ALIGNMENT, SHADOW & DIMENSIONS
    // -------------------------------------------------------------
    console.log('\n--- Running R2: Navbar Alignment, Shadow & Dimensions ---');
    await client.setViewport(1440, 900, 1.0, false);

    const r2Audit = await client.evalJs(`(() => {
      const header = document.querySelector('.site-header');
      if (!header) return { found: false };

      const headerStyle = window.getComputedStyle(header);
      const headerRect = header.getBoundingClientRect();

      const logo = document.querySelector('.header-logo-link');
      const logoImg = document.querySelector('.header-brand-logo');
      const logoRect = logo ? logo.getBoundingClientRect() : null;
      const logoCenterY = logoRect ? logoRect.top + logoRect.height / 2 : null;

      const navList = document.querySelector('.header-nav-list');
      const firstNavLink = navList ? navList.querySelector('.nav-link') : null;
      const navRect = firstNavLink ? firstNavLink.getBoundingClientRect() : null;
      const navCenterY = navRect ? navRect.top + navRect.height / 2 : null;

      const rightGroup = document.querySelector('.header-right-group');
      const rightGroupStyle = rightGroup ? window.getComputedStyle(rightGroup) : null;
      const rightGroupRect = rightGroup ? rightGroup.getBoundingClientRect() : null;

      const searchWrapper = document.querySelector('.navbar-search-wrapper');
      const searchRect = searchWrapper ? searchWrapper.getBoundingClientRect() : null;
      const searchCenterY = searchRect ? searchRect.top + searchRect.height / 2 : null;

      const hamburger = document.querySelector('.header-mobile-toggle') || document.querySelector('.header-extra-toggle-btn') || document.querySelector('.header-search-icon-btn');
      const hamburgerRect = hamburger ? hamburger.getBoundingClientRect() : null;
      const hamburgerCenterY = hamburgerRect ? hamburgerRect.top + hamburgerRect.height / 2 : null;

      // Optical alignment delta
      const logoToSearchDeltaY = (logoCenterY !== null && searchCenterY !== null) ? Math.abs(logoCenterY - searchCenterY) : null;
      const navToSearchDeltaY = (navCenterY !== null && searchCenterY !== null) ? Math.abs(navCenterY - searchCenterY) : null;

      return {
        found: true,
        headerHeight: headerRect.height,
        headerBoxShadow: headerStyle.boxShadow,
        headerBorderBottom: headerStyle.borderBottom,
        headerPadding: headerStyle.padding,
        rightGroupTransform: rightGroupStyle ? rightGroupStyle.transform : null,
        searchWrapperHeight: searchRect ? searchRect.height : null,
        logoCenterY,
        navCenterY,
        searchCenterY,
        hamburgerCenterY,
        logoToSearchDeltaY,
        navToSearchDeltaY,
        boxShadowRemoved: headerStyle.boxShadow === 'none' || headerStyle.boxShadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px',
        isHeight94: Math.abs(headerRect.height - 94) < 1.0,
        isSearchAligned: logoToSearchDeltaY !== null && logoToSearchDeltaY <= 4.0
      };
    })()`);
    results.r2_navbar = r2Audit;
    console.log('[R2 Navbar Audit]:', r2Audit);

    // -------------------------------------------------------------
    // R3: HERO PROMOTIONAL IMAGE ALIGNMENT & 1:1 SQUARE RATIO
    // -------------------------------------------------------------
    console.log('\n--- Running R3: Hero Promotional Image Alignment & 1:1 Ratio ---');
    await client.setViewport(1440, 900, 1.0, false);

    const r3Audit = await client.evalJs(`(() => {
      const section = document.querySelector('.inquiry-promo-section');
      const container = document.querySelector('.inquiry-promo-container');
      const leftCol = document.querySelector('.inquiry-promo-left');
      const imgWrapper = document.querySelector('.inquiry-promo-image-wrapper');
      const img = document.querySelector('.inquiry-promo-img');
      const heroContainer = document.querySelector('.full-page-hero-container');

      if (!section || !container || !leftCol || !imgWrapper) {
        return { found: false, section: !!section, container: !!container, leftCol: !!leftCol, imgWrapper: !!imgWrapper };
      }

      const sectionStyle = window.getComputedStyle(section);
      const containerStyle = window.getComputedStyle(container);
      const leftColStyle = window.getComputedStyle(leftCol);
      const imgWrapperStyle = window.getComputedStyle(imgWrapper);

      const sectionRect = section.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const leftColRect = leftCol.getBoundingClientRect();
      const imgWrapperRect = imgWrapper.getBoundingClientRect();
      const heroRect = heroContainer ? heroContainer.getBoundingClientRect() : null;

      const aspectRatio = imgWrapperRect.width / imgWrapperRect.height;
      const isSquare = Math.abs(aspectRatio - 1.0) < 0.03; // Allow minor sub-pixel rendering variation
      const leftGap = leftColRect.left; // Distance from left viewport edge

      return {
        found: true,
        sectionPaddingLeft: sectionStyle.paddingLeft,
        containerMarginLeft: containerStyle.marginLeft,
        containerJustifyContent: containerStyle.justifyContent,
        leftColMarginLeft: leftColStyle.marginLeft,
        leftColTransform: leftColStyle.transform,
        leftColLeft: leftColRect.left,
        imgWrapperWidth: Math.round(imgWrapperRect.width),
        imgWrapperHeight: Math.round(imgWrapperRect.height),
        aspectRatio: Number(aspectRatio.toFixed(4)),
        isSquare,
        transformOrigin: imgWrapperStyle.transformOrigin,
        heroHeight: heroRect ? heroRect.height : null,
        isFlushLeft: leftColRect.left <= 24 // Close to left edge within outer section bounds
      };
    })()`);
    results.r3_hero_image = r3Audit;
    console.log('[R3 Hero Image Audit]:', r3Audit);

    // -------------------------------------------------------------
    // R4: HERO NAVIGATION ARROWS & SLIDER CONTROLS BELOW BANNER
    // -------------------------------------------------------------
    console.log('\n--- Running R4: Hero Navigation Arrows & Relocated Controls ---');
    await client.setViewport(1440, 900, 1.0, false);

    const r4StaticAudit = await client.evalJs(`(() => {
      // 1. Check Arrow Buttons
      const arrows = document.querySelectorAll('.hero-nav-arrow, .arrow-prev, .arrow-next');
      let visibleArrows = 0;
      arrows.forEach(a => {
        const s = window.getComputedStyle(a);
        if (s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0') {
          visibleArrows++;
        }
      });

      // 2. Check Slider Indicators Position relative to banner
      const heroBanner = document.querySelector('.full-page-hero-container');
      const indicators = document.querySelector('.hero-progress-indicators');

      if (!heroBanner || !indicators) {
        return { found: false, heroBanner: !!heroBanner, indicators: !!indicators };
      }

      const heroRect = heroBanner.getBoundingClientRect();
      const indRect = indicators.getBoundingClientRect();
      const indStyle = window.getComputedStyle(indicators);

      const isBelowBanner = indRect.top >= heroRect.bottom - 1; // Sits below the hero container
      const isRelative = indStyle.position === 'relative';

      // 3. Check Row Layout
      const barsRow = indicators.querySelector('.hero-progress-bars-row');
      const toggleBtn = indicators.querySelector('.hero-progress-next-btn');
      const barsRowRect = barsRow ? barsRow.getBoundingClientRect() : null;
      const toggleBtnRect = toggleBtn ? toggleBtn.getBoundingClientRect() : null;

      // Same horizontal row: vertical center alignment
      const rowAligned = barsRowRect && toggleBtnRect
        ? Math.abs((barsRowRect.top + barsRowRect.height / 2) - (toggleBtnRect.top + toggleBtnRect.height / 2)) < 5
        : false;

      // 4. Color & Contrast Tokens
      const track = indicators.querySelector('.hero-progress-track');
      const fill = indicators.querySelector('.hero-progress-fill');
      const playIcon = indicators.querySelector('.play-triangle-icon');

      const trackStyle = track ? window.getComputedStyle(track) : null;
      const fillStyle = fill ? window.getComputedStyle(fill) : null;
      const iconStyle = playIcon ? window.getComputedStyle(playIcon) : null;

      return {
        found: true,
        arrowElementCount: arrows.length,
        visibleArrows,
        arrowsRemoved: visibleArrows === 0,
        heroBottom: heroRect.bottom,
        indicatorsTop: indRect.top,
        isBelowBanner,
        indicatorsPosition: indStyle.position,
        indicatorsBottom: indStyle.bottom,
        indicatorsBackground: indStyle.backgroundColor,
        rowAligned,
        trackColor: trackStyle ? trackStyle.backgroundColor : null,
        fillColor: fillStyle ? fillStyle.backgroundColor : null,
        iconColor: iconStyle ? iconStyle.color || iconStyle.fill : null
      };
    })()`);
    results.r4_arrows_and_slider = r4StaticAudit;
    console.log('[R4 Static Audit]:', r4StaticAudit);

    // Dynamic Autoplay, Pause/Resume & Slide Transition Test
    console.log('\n--- Running R4: Slider Autoplay, Transitions & Pause/Resume Dynamics ---');
    const r4DynamicAudit = await client.evalJs(`(async () => {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      const indicators = document.querySelector('.hero-progress-indicators');
      const toggleBtn = indicators ? indicators.querySelector('.hero-progress-next-btn') : null;
      const getActiveIndex = () => {
        const btns = Array.from(document.querySelectorAll('.hero-progress-btn'));
        return btns.findIndex(b => b.classList.contains('is-active'));
      };

      const initialIdx = getActiveIndex();
      
      // 1. Test Autoplay progression (default 3000ms, wait 3500ms)
      await wait(3500);
      const afterAutoplayIdx = getActiveIndex();
      const autoplayAdvanced = afterAutoplayIdx !== initialIdx;

      // 2. Test Pause button
      if (toggleBtn) {
        toggleBtn.click();
      }
      await wait(500);
      const isPausedIcon = toggleBtn ? !!toggleBtn.querySelector('.play-triangle-icon:not(.pause-icon)') : false;
      const pausedIdx = getActiveIndex();

      // Wait 3500ms to verify slide does NOT advance while paused
      await wait(3500);
      const afterWaitPausedIdx = getActiveIndex();
      const stayedPaused = afterWaitPausedIdx === pausedIdx;

      // 3. Test Resume button
      if (toggleBtn) {
        toggleBtn.click();
      }
      await wait(500);
      const isRunningIcon = toggleBtn ? !!toggleBtn.querySelector('.pause-icon') : false;

      // 4. Test Manual dot jump to slide index 0
      const dotButtons = Array.from(document.querySelectorAll('.hero-progress-btn'));
      let manualJumpWorked = false;
      if (dotButtons.length > 0) {
        dotButtons[0].click();
        await wait(600);
        manualJumpWorked = getActiveIndex() === 0;
      }

      return {
        initialIdx,
        afterAutoplayIdx,
        autoplayAdvanced,
        isPausedIcon,
        pausedIdx,
        afterWaitPausedIdx,
        stayedPaused,
        isRunningIcon,
        manualJumpWorked
      };
    })()`);
    results.r4_slider_dynamics = r4DynamicAudit;
    console.log('[R4 Dynamics Audit]:', r4DynamicAudit);

    // -------------------------------------------------------------
    // R5: NON-REGRESSION AUDIT ON UNRELATED SECTIONS
    // -------------------------------------------------------------
    console.log('\n--- Running R5: Unrelated Sections Non-Regression Audit ---');
    const r5Audit = await client.evalJs(`(() => {
      const sections = {
        header: !!document.querySelector('.site-header'),
        megaMenuSolutions: !!document.querySelector('.mega-menu-panel') || !!document.querySelector('.header-nav-list'),
        heroContainer: !!document.querySelector('.full-page-hero-container'),
        promoSection: !!document.querySelector('.inquiry-promo-section'),
        sliderSection: !!document.querySelector('.slider-section') || !!document.querySelector('.interactive-section-wrapper'),
        supportWidget: !!document.querySelector('.floating-support-chat'),
        footer: !!document.querySelector('footer') || !!document.querySelector('.site-footer')
      };

      // Check for unhandled React error boundary / crashed containers
      const errorBoundary = document.querySelector('.error-boundary, [data-error]');

      return {
        sections,
        errorBoundaryDetected: !!errorBoundary
      };
    })()`);
    results.r5_non_regression = r5Audit;
    console.log('[R5 Unrelated Sections Audit]:', r5Audit);

  } finally {
    await client.close();
  }

  // Save raw test output for report generation
  fs.writeFileSync(
    path.join('D:\\New folder\\New folder\\AVXBS\\AVXBS\\Frontend\\tests\\empirical_results.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log('\n=== EMPIRICAL VERIFICATION COMPLETE. Results written to tests/empirical_results.json ===');
}

runTestSuite().catch(err => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
