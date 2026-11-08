import { CDPBrowser } from './helpers/cdp-browser.mjs';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.navigate('http://localhost:5173', 2000);

  const viewports = [
    { name: 'Desktop', w: 1440, h: 900, isMobile: false },
    { name: 'Laptop', w: 1024, h: 768, isMobile: false },
    { name: 'Tablet', w: 768, h: 1024, isMobile: true }
  ];

  const results = [];
  const outDir = path.resolve('tests/screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  for (const vp of viewports) {
    await browser.setViewport(vp.w, vp.h, vp.isMobile);
    await new Promise(r => setTimeout(r, 400));

    for (const menu of ['Residential', 'Commercial']) {
      if (vp.isMobile) {
        await browser.evaluate(`(() => {
          const btn = document.querySelector('.samsung-nav-tab-btn[aria-label="${menu} solutions menu"]');
          if (btn) btn.click();
        })()`);
      } else {
        await browser.hover(`.samsung-nav-tab-btn[aria-label="${menu} solutions menu"]`);
      }
      await new Promise(r => setTimeout(r, 600));

      const measurement = await browser.evaluate(`(() => {
        const leftSection = document.querySelector('.samsung-nav-section-left');
        const grid = document.querySelector('.samsung-highlights-grid');
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        const csGrid = grid ? window.getComputedStyle(grid) : {};
        
        const cardData = cards.map((c, i) => {
          const r = c.getBoundingClientRect();
          const imgBox = c.querySelector('.samsung-highlight-img-box');
          const rImg = imgBox ? imgBox.getBoundingClientRect() : null;
          return {
            i,
            title: c.querySelector('.samsung-highlight-name')?.textContent?.trim(),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            left: Math.round(r.left),
            right: Math.round(r.right),
            w: Math.round(r.width),
            h: Math.round(r.height),
            cardAspect: (r.width / r.height).toFixed(3),
            imgW: rImg ? Math.round(rImg.width) : 0,
            imgH: rImg ? Math.round(rImg.height) : 0,
            imgAspect: rImg ? (rImg.width / rImg.height).toFixed(3) : 0
          };
        });

        let horizontalColGap = null;
        if (cardData.length >= 2) {
          horizontalColGap = cardData[1].left - cardData[0].right;
        }

        let verticalRowGap = null;
        if (cardData.length >= 4) {
          verticalRowGap = cardData[2].top - cardData[0].bottom;
        }

        return {
          leftSectionH: leftSection ? Math.round(leftSection.getBoundingClientRect().height) : 0,
          gridH: grid ? Math.round(grid.getBoundingClientRect().height) : 0,
          computedRowGap: csGrid.rowGap,
          computedColGap: csGrid.columnGap,
          computedAlignContent: csGrid.alignContent,
          cardCount: cards.length,
          cardData,
          measuredColGap: horizontalColGap,
          measuredRowGap: verticalRowGap,
          allCardsSquare: cardData.every(c => Math.abs(c.w - c.h) <= 1),
          allImgsSquare: cardData.every(c => Math.abs(c.imgW - c.imgH) <= 1),
        };
      })()`);

      // Screenshot for verification
      const res = await browser.send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const filename = path.join(outDir, `compact_highlights_${menu.toLowerCase()}_${vp.name.toLowerCase()}.png`);
      fs.writeFileSync(filename, buffer);

      results.push({
        viewport: vp.name,
        menu,
        ...measurement,
        screenshot: filename
      });

      // Close menu
      await browser.evaluate(`(() => {
        const backdrop = document.querySelector('.samsung-nav-backdrop');
        if (backdrop) backdrop.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      })()`);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  await browser.close();

  console.log('\n======================================================');
  console.log('SPACING VERIFICATION RESULTS');
  console.log('======================================================');
  for (const r of results) {
    console.log(`\n[${r.viewport}] ${r.menu} Menu:`);
    console.log(`  Cards count: ${r.cardCount}`);
    console.log(`  Computed styles: alignContent="${r.computedAlignContent}", rowGap="${r.computedRowGap}", columnGap="${r.computedColGap}"`);
    console.log(`  Measured Column Gap: ${r.measuredColGap}px`);
    if (r.measuredRowGap !== null) {
      console.log(`  Measured Row Gap: ${r.measuredRowGap}px`);
    } else {
      console.log(`  (Only 1 row of cards; row-gap configured at ${r.computedRowGap})`);
    }
    console.log(`  All cards square: ${r.allCardsSquare}`);
    console.log(`  All images square: ${r.allImgsSquare}`);
    console.log(`  Card dimensions: ${r.cardData[0]?.w}x${r.cardData[0]?.h}`);
    console.log(`  Image dimensions: ${r.cardData[0]?.imgW}x${r.cardData[0]?.imgH}`);
    console.log(`  Screenshot saved: ${r.screenshot}`);
  }
}

main().catch(console.error);
