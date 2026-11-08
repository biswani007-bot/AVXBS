import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { sleep } from './helpers/test-env.mjs';

const viewports = [
  { name: 'Desktop (1440px)', w: 1440, h: 900, isMobile: false, expectedH: 94 },
  { name: 'Laptop (1024px)', w: 1024, h: 768, isMobile: false, expectedH: 76 },
  { name: 'Tablet (768px)', w: 768, h: 1024, isMobile: true, expectedH: 76 },
  { name: 'Mobile (425px)', w: 425, h: 800, isMobile: true, expectedH: 56 },
  { name: 'Mobile (375px)', w: 375, h: 667, isMobile: true, expectedH: 56 },
];

const ROBUST_INJECTION_SCRIPT = `
(function() {
  window.__DIAG_LOGS__ = window.__DIAG_LOGS__ || [];

  function recordStage(stage) {
    try {
      const headers = document.querySelectorAll('.site-header');
      const header = headers[0] || null;
      const r = header ? header.getBoundingClientRect() : null;
      const cs = header ? window.getComputedStyle(header) : null;
      
      const parents = [];
      let curr = header ? header.parentElement : null;
      while (curr && curr !== document.documentElement) {
        const pcs = window.getComputedStyle(curr);
        parents.push({
          tag: curr.tagName.toLowerCase(),
          id: curr.id || null,
          className: curr.className || null,
          position: pcs.position,
          overflow: pcs.overflow,
          overflowX: pcs.overflowX,
          overflowY: pcs.overflowY,
          marginTop: pcs.marginTop,
          paddingTop: pcs.paddingTop
        });
        curr = curr.parentElement;
      }

      const docEl = document.documentElement;
      const htmlCs = docEl ? window.getComputedStyle(docEl) : null;
      const body = document.body;
      const bodyCs = body ? window.getComputedStyle(body) : null;

      const record = {
        stage: stage,
        timestamp: performance.now(),
        scrollY: window.scrollY,
        headerInstances: headers.length,
        headerFound: Boolean(header),
        rect: r ? {
          top: Math.round(r.top * 100) / 100,
          bottom: Math.round(r.bottom * 100) / 100,
          height: Math.round(r.height * 100) / 100,
          width: Math.round(r.width * 100) / 100
        } : null,
        computed: cs ? {
          position: cs.position,
          top: cs.top,
          transform: cs.transform,
          marginTop: cs.marginTop
        } : null,
        parentInfo: parents.length > 0 ? parents[0] : null,
        parentsChain: parents.map(p => p.tag + (p.id ? '#' + p.id : '') + (p.className ? '.' + p.className.split(' ')[0] : '') + '(' + p.position + ',ovX=' + p.overflowX + ')').join(' > '),
        bodyInfo: bodyCs ? {
          position: bodyCs.position,
          overflow: bodyCs.overflow,
          overflowX: bodyCs.overflowX,
          overflowY: bodyCs.overflowY,
          marginTop: bodyCs.marginTop
        } : null,
        htmlInfo: htmlCs ? {
          position: htmlCs.position,
          overflow: htmlCs.overflow,
          overflowX: htmlCs.overflowX,
          overflowY: htmlCs.overflowY,
          marginTop: htmlCs.marginTop
        } : null
      };

      window.__DIAG_LOGS__.push(record);
      return record;
    } catch (e) {
      window.__DIAG_LOGS__.push({ stage, error: e.message });
      return null;
    }
  }

  window.__recordStage = recordStage;

  // 1. Immediately after navigation
  recordStage('1_immediately_after_navigation');

  // 2. DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      recordStage('2_DOMContentLoaded');
    });
  } else {
    recordStage('2_DOMContentLoaded');
  }

  // 3. React Mount (detect when .site-header is injected into DOM)
  let reactMountedRecorded = false;
  const setupObserver = () => {
    if (!document.documentElement) return;
    const observer = new MutationObserver(() => {
      if (!reactMountedRecorded && document.querySelector('.site-header')) {
        reactMountedRecorded = true;
        recordStage('3_React_mount');
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.documentElement) {
    setupObserver();
  } else {
    document.addEventListener('DOMContentLoaded', setupObserver);
  }

  // 7. Intercept fetch for API responses affecting header
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    try {
      const response = await originalFetch.apply(this, args);
      if (url.includes('/api/settings') || url.includes('/api/mega-menu') || url.includes('/api/banner') || url.includes('/api/submissions')) {
        setTimeout(() => {
          recordStage('7_api_response:' + url.split('?')[0]);
        }, 5);
      }
      return response;
    } catch (err) {
      if (url.includes('/api/settings') || url.includes('/api/mega-menu')) {
        recordStage('7_api_response_err:' + url.split('?')[0]);
      }
      throw err;
    }
  };
})();
`;

async function runDiagnosticForTarget(targetUrl, targetName) {
  console.log('\n' + '='.repeat(100));
  console.log(` MANDATORY DIAGNOSTIC VERIFICATION: ${targetName} (${targetUrl})`);
  console.log('='.repeat(100));

  const browser = new CDPBrowser();
  await browser.launch('about:blank');

  try {
    await browser.send('Page.enable');
    await browser.send('Runtime.enable');

    await browser.send('Page.addScriptToEvaluateOnNewDocument', {
      source: ROBUST_INJECTION_SCRIPT
    });

    const summaryReport = [];

    for (const vp of viewports) {
      console.log(`\n>>> TESTING VIEWPORT: ${vp.name} [Expected Header Height: ${vp.expectedH}px] <<<`);
      await browser.setViewport(vp.w, vp.h, vp.isMobile);

      // Initial visit
      await browser.send('Page.navigate', { url: targetUrl });
      await sleep(1500);

      const beforeReload = await browser.evaluate(`window.__recordStage('before_refresh')`);
      console.log(`  Position BEFORE Refresh: scrollY=${beforeReload.scrollY}, top=${beforeReload.rect?.top}px, h=${beforeReload.rect?.height}px, instances=${beforeReload.headerInstances}`);

      // Perform reload to capture lifecycle from navigation to settled
      await browser.evaluate(`window.__DIAG_LOGS__ = []`);
      await browser.send('Page.reload');

      // Checkpoint 4: After 500ms
      await sleep(500);
      await browser.evaluate(`window.__recordStage && window.__recordStage('4_after_500ms')`);

      // Checkpoint 5: After 1500ms
      await sleep(1000);
      await browser.evaluate(`window.__recordStage && window.__recordStage('5_after_1500ms')`);

      // Checkpoint 6: After all images and fonts load
      await browser.evaluate(`
        (async () => {
          if (document.fonts) {
            try { await document.fonts.ready; } catch(e) {}
          }
          const media = Array.from(document.querySelectorAll('img, video'));
          await Promise.all(media.map(el => {
            if (el.tagName === 'IMG' && el.complete) return Promise.resolve();
            if (el.tagName === 'VIDEO' && el.readyState >= 2) return Promise.resolve();
            return new Promise(res => {
              el.addEventListener('load', res, { once: true });
              el.addEventListener('loadeddata', res, { once: true });
              el.addEventListener('error', res, { once: true });
              setTimeout(res, 600);
            });
          }));
          if (window.__recordStage) {
            window.__recordStage('6_after_all_images_and_fonts_load');
          }
        })()
      `);

      const logs = await browser.evaluate(`window.__DIAG_LOGS__ || []`);

      console.log(`\n  Diagnostic Measurements Table [${vp.name}]:`);
      console.log(`  ------------------------------------------------------------------------------------------------------------------------------------------------`);
      console.log(`  Checkpoint / Stage                         | scrollY | Top   | Height | Instances | Pos    | Top CSS | Transform | Parent Chain`);
      console.log(`  ------------------------------------------------------------------------------------------------------------------------------------------------`);

      let vpPassed = true;

      for (const log of logs) {
        const topStr = log.headerFound ? `${log.rect?.top}px` : '(not in DOM)';
        const hStr = log.headerFound ? `${log.rect?.height}px` : '-';
        const posStr = log.computed ? log.computed.position : '-';
        const topCss = log.computed ? log.computed.top : '-';
        const trans = log.computed ? log.computed.transform : '-';
        const chain = log.parentsChain || (log.headerFound ? '-' : '(HTML parsing)');
        const stagePad = log.stage.padEnd(44, ' ');
        console.log(`  ${stagePad} | ${String(log.scrollY).padEnd(7)} | ${topStr.padEnd(5)} | ${hStr.padEnd(6)} | ${String(log.headerInstances).padEnd(9)} | ${posStr.padEnd(6)} | ${topCss.padEnd(7)} | ${trans.padEnd(9)} | ${chain}`);

        if (log.headerFound) {
          if (log.rect.top !== 0) {
            console.error(`    >>> CRITICAL ERROR: Navbar top shifted to ${log.rect.top}px (must be 0px) at stage: ${log.stage}!`);
            vpPassed = false;
          }
          if (log.rect.height !== vp.expectedH) {
            console.error(`    >>> CRITICAL ERROR: Navbar height changed to ${log.rect.height}px (must be ${vp.expectedH}px) at stage: ${log.stage}!`);
            vpPassed = false;
          }
          if (log.headerInstances !== 1) {
            console.error(`    >>> CRITICAL ERROR: Header instances count = ${log.headerInstances} (must be 1) at stage: ${log.stage}!`);
            vpPassed = false;
          }
        }
      }

      // Check sticky scroll behavior
      await browser.evaluate(`window.scrollTo(0, 400)`);
      const stickyCheck = await browser.evaluate(`(() => {
        const h = document.querySelector('.site-header');
        const r = h ? h.getBoundingClientRect() : null;
        return { scrollY: window.scrollY, top: r ? r.top : null, height: r ? r.height : null };
      })()`);
      console.log(`  Sticky Scroll Test (scrollY=400): actual scrollY=${stickyCheck.scrollY}px, top=${stickyCheck.top}px, h=${stickyCheck.height}px`);
      if (stickyCheck.top !== 0) {
        console.error(`    >>> CRITICAL ERROR: Sticky scroll broken! Navbar top=${stickyCheck.top}px when scrolled!`);
        vpPassed = false;
      }
      await browser.evaluate(`window.scrollTo(0, 0)`);

      summaryReport.push({
        viewport: vp.name,
        expectedH: vp.expectedH,
        passed: vpPassed,
        checkpointsRecorded: logs.length
      });
    }

    console.log(`\n================================================================================`);
    console.log(` SUMMARY REPORT FOR ${targetName}:`);
    for (const s of summaryReport) {
      console.log(`  - ${s.viewport}: ${s.passed ? 'PASSED (top: 0px, 1 instance, correct height)' : 'FAILED'}`);
    }
    console.log(`================================================================================\n`);

    return summaryReport;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('STARTING RIGOROUS BROWSER DIAGNOSTIC FOR AVXBS NAVBAR...');
  
  // Test 1: Production Build
  const prodSummary = await runDiagnosticForTarget('http://localhost:4173', 'PRODUCTION BUILD (Vite Preview)');

  // Test 2: Development Server
  const devSummary = await runDiagnosticForTarget('http://localhost:5173', 'DEVELOPMENT SERVER (Vite Dev)');

  const allPassed = [...prodSummary, ...devSummary].every(s => s.passed);
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
