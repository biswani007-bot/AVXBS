import { CDPBrowser } from './helpers/cdp-browser.mjs';
import { sleep } from './helpers/test-env.mjs';

const viewports = [
  { name: 'Desktop', w: 1440, h: 900, isMobile: false },
  { name: 'Laptop', w: 1024, h: 768, isMobile: false },
  { name: 'Tablet', w: 768, h: 1024, isMobile: true },
  { name: 'Mobile 425', w: 425, h: 800, isMobile: true },
  { name: 'Mobile 375', w: 375, h: 667, isMobile: true },
];

async function runDiagnosticForUrl(urlName, baseUrl) {
  console.log(`\n===============================================================`);
  console.log(` RUNNING DETAILED DIAGNOSTIC ON: ${urlName} (${baseUrl})`);
  console.log(`===============================================================`);

  const browser = new CDPBrowser();
  await browser.launch('about:blank');

  try {
    for (const vp of viewports) {
      console.log(`\n>>> Viewport: ${vp.name} (${vp.w}x${vp.h}) <<<`);
      await browser.setViewport(vp.w, vp.h, vp.isMobile);

      // Pre-navigate to URL
      await browser.navigate(baseUrl, 1000);

      // Evaluate position before refresh
      const beforeRefresh = await browser.evaluate(`(() => {
        const header = document.querySelector('.site-header');
        const r = header ? header.getBoundingClientRect() : null;
        const cs = header ? window.getComputedStyle(header) : null;
        return {
          scrollY: window.scrollY,
          headerExists: Boolean(header),
          rect: r ? { top: r.top, left: r.left, height: r.height, width: r.width } : null,
          computed: cs ? {
            position: cs.position,
            top: cs.top,
            transform: cs.transform,
            marginTop: cs.marginTop,
            paddingTop: cs.paddingTop
          } : null
        };
      })()`);
      console.log(`Position before refresh: scrollY=${beforeRefresh.scrollY}, top=${beforeRefresh.rect?.top}, h=${beforeRefresh.rect?.height}`);

      // Now set up page hooks via evaluateOnNewDocument
      await browser.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
          window.__DIAG_LOGS__ = [];
          function recordStage(stage) {
            const headers = document.querySelectorAll('.site-header');
            const header = headers[0] || null;
            const r = header ? header.getBoundingClientRect() : null;
            const cs = header ? window.getComputedStyle(header) : null;
            const parent = header ? header.parentElement : null;
            const parentCs = parent ? window.getComputedStyle(parent) : null;
            const root = document.getElementById('root');
            const rootCs = root ? window.getComputedStyle(root) : null;
            const bodyCs = window.getComputedStyle(document.body);
            const htmlCs = window.getComputedStyle(document.documentElement);

            window.__DIAG_LOGS__.push({
              stage,
              timestamp: performance.now(),
              scrollY: window.scrollY,
              headerCount: headers.length,
              headerFound: Boolean(header),
              rect: r ? { top: r.top, left: r.left, height: r.height, width: r.width } : null,
              headerComputed: cs ? {
                position: cs.position,
                top: cs.top,
                transform: cs.transform,
                marginTop: cs.marginTop,
                display: cs.display
              } : null,
              parentInfo: parent ? {
                tagName: parent.tagName,
                className: parent.className,
                position: parentCs.position,
                overflow: parentCs.overflow,
                overflowX: parentCs.overflowX,
                overflowY: parentCs.overflowY,
                paddingTop: parentCs.paddingTop,
                marginTop: parentCs.marginTop
              } : null,
              bodyInfo: {
                overflow: bodyCs.overflow,
                overflowX: bodyCs.overflowX,
                overflowY: bodyCs.overflowY,
                marginTop: bodyCs.marginTop,
                paddingTop: bodyCs.paddingTop
              },
              htmlInfo: {
                overflow: htmlCs.overflow,
                overflowX: htmlCs.overflowX,
                overflowY: htmlCs.overflowY,
                marginTop: htmlCs.marginTop,
                paddingTop: htmlCs.paddingTop
              }
            });
          }

          recordStage('1_immediately_after_navigation');

          document.addEventListener('DOMContentLoaded', () => {
            recordStage('2_DOMContentLoaded');
          });

          window.addEventListener('load', () => {
            recordStage('all_assets_window_load');
          });

          // Intercept fetch API to capture API responses
          const origFetch = window.fetch;
          window.fetch = async function(...args) {
            const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';
            try {
              const res = await origFetch.apply(this, args);
              // record stage after API response
              recordStage('api_response:' + url);
              return res;
            } catch (err) {
              recordStage('api_response_err:' + url);
              throw err;
            }
          };

          // MutationObserver to catch React mount
          const observer = new MutationObserver(() => {
            if (document.querySelector('.site-header') && !window.__recordedReactMount) {
              window.__recordedReactMount = true;
              recordStage('3_React_mount');
            }
          });
          observer.observe(document.documentElement, { childList: true, subtree: true });
        `
      });

      // Reload
      await browser.send('Page.reload');

      // 4. After 500ms
      await sleep(500);
      await browser.evaluate(`recordStage('4_after_500ms')`);

      // 5. After 1500ms
      await sleep(1000);
      await browser.evaluate(`recordStage('5_after_1500ms')`);

      // 6. After all images and fonts load
      await browser.evaluate(`
        (async () => {
          if (document.fonts) await document.fonts.ready;
          const imgs = Array.from(document.images);
          await Promise.all(imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(res => { img.onload = img.onerror = res; });
          }));
          recordStage('6_after_all_images_and_fonts_load');
        })()
      `);

      // Retrieve full diagnostic logs
      const logs = await browser.evaluate(`window.__DIAG_LOGS__`);

      console.log(`\n  Diagnostic Checkpoints for ${vp.name}:`);
      console.log(`  ----------------------------------------------------------------------------------------------------------------`);
      console.log(`  Stage                                      | scrollY | Top   | H     | Pos    | Top CSS | Transform | Header Count`);
      console.log(`  ----------------------------------------------------------------------------------------------------------------`);
      for (const log of logs) {
        const topStr = log.rect ? `${log.rect.top}px` : 'N/A';
        const hStr = log.rect ? `${log.rect.height}px` : 'N/A';
        const posStr = log.headerComputed ? log.headerComputed.position : 'N/A';
        const topCss = log.headerComputed ? log.headerComputed.top : 'N/A';
        const trans = log.headerComputed ? log.headerComputed.transform : 'N/A';
        const stagePad = log.stage.padEnd(42, ' ');
        console.log(`  ${stagePad} | ${String(log.scrollY).padEnd(7)} | ${topStr.padEnd(5)} | ${hStr.padEnd(5)} | ${posStr.padEnd(6)} | ${topCss.padEnd(7)} | ${trans.padEnd(9)} | ${log.headerCount}`);
        
        if (log.headerFound && log.rect.top !== 0) {
          console.error(`  >>> ANOMALY DETECTED: Navbar top is ${log.rect.top} at stage "${log.stage}"! <<<`);
        }
      }
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  await runDiagnosticForUrl('Dev Server (Vite)', 'http://localhost:5173');
}

main().catch(console.error);
