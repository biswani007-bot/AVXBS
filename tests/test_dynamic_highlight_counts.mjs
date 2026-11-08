import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.navigate('http://localhost:5173', 2000);
  await browser.setViewport(1440, 900, false);
  await new Promise(r => setTimeout(r, 400));

  await browser.hover('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  await new Promise(r => setTimeout(r, 500));

  const testCounts = [1, 3, 5, 6];

  for (const count of testCounts) {
    const result = await browser.evaluate(`(() => {
      const grid = document.querySelector('.samsung-highlights-grid');
      const originalCards = Array.from(grid.querySelectorAll('.samsung-highlight-card'));
      const template = originalCards[0].cloneNode(true);

      // Re-populate grid with count cards
      grid.innerHTML = '';
      for (let i = 0; i < ${count}; i++) {
        const clone = template.cloneNode(true);
        const nameEl = clone.querySelector('.samsung-highlight-name');
        if (nameEl) nameEl.textContent = 'Card Item ' + (i + 1);
        grid.appendChild(clone);
      }

      const csGrid = window.getComputedStyle(grid);
      const newCards = Array.from(grid.querySelectorAll('.samsung-highlight-card'));
      const cardRects = newCards.map((c, i) => {
        const r = c.getBoundingClientRect();
        const imgBox = c.querySelector('.samsung-highlight-img-box');
        const rImg = imgBox ? imgBox.getBoundingClientRect() : null;
        return {
          index: i,
          w: Math.round(r.width),
          h: Math.round(r.height),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
          isSquare: Math.abs(r.width - r.height) <= 1,
          imgW: rImg ? Math.round(rImg.width) : 0,
          imgH: rImg ? Math.round(rImg.height) : 0,
          imgSquare: rImg ? Math.abs(rImg.width - rImg.height) <= 1 : true
        };
      });

      let rowGap = null;
      if (cardRects.length >= 3) {
        rowGap = cardRects[2].top - cardRects[0].bottom;
      }

      let colGap = null;
      if (cardRects.length >= 2) {
        colGap = cardRects[1].left - cardRects[0].right;
      }

      return {
        count: ${count},
        colGap,
        rowGap,
        computedRowGap: csGrid.rowGap,
        computedColGap: csGrid.columnGap,
        allCardsSquare: cardRects.every(c => c.isSquare),
        allImgsSquare: cardRects.every(c => c.imgSquare),
      };
    })()`);

    console.log(`Tested ${count} cards: colGap=${result.colGap}px, rowGap=${result.rowGap}px, allSquare=${result.allCardsSquare}, imgSquare=${result.allImgsSquare}`);
    if (result.rowGap !== null && Math.abs(result.rowGap - 8) > 1) {
      throw new Error(`Row gap drifted to ${result.rowGap}px for count ${count}`);
    }
  }

  await browser.close();
  console.log('Dynamic card count tests ALL PASSED!');
}

main().catch(console.error);
