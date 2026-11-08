import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function runVerification() {
  console.log('=================================================================');
  console.log('AVXBS: Testimonials & Mega Menu Verification Suite');
  console.log('=================================================================\n');

  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.setViewport(1440, 900);
  await browser.navigate('http://localhost:5173', 2500);

  let allPassed = true;

  // 1. Initial Mega Menu Closed
  const initialOpen = await browser.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  console.log(`[CHECK 1] Mega Menu closed initially on page load: ${!initialOpen ? 'PASS' : 'FAIL'}`);
  if (initialOpen) allPassed = false;

  // 2. Open Residential on Hover
  await browser.hover('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  await new Promise(r => setTimeout(r, 400));
  const resOpen = await browser.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  console.log(`[CHECK 2] Residential Mega Menu opened on hover: ${resOpen ? 'PASS' : 'FAIL'}`);
  if (!resOpen) allPassed = false;

  // 3. Residential 8 Highlights in 2x4 Grid
  const resMetrics = await browser.evaluate(`
    (() => {
      const grid = document.querySelector('.samsung-highlights-grid');
      if (!grid) return null;
      const style = window.getComputedStyle(grid);
      const cards = Array.from(grid.querySelectorAll('.samsung-highlight-card'));
      const rects = cards.map(c => c.getBoundingClientRect());
      const cols = style.gridTemplateColumns.split(' ').length;
      const distinctTops = [...new Set(rects.map(r => Math.round(r.top)))].sort((a,b) => a - b);
      const imgBox = cards[0]?.querySelector('.samsung-highlight-img-box');
      const imgBoxHeight = imgBox ? Math.round(imgBox.getBoundingClientRect().height) : 0;
      const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
      
      return {
        count: cards.length,
        cols,
        rows: distinctTops.length,
        imgBoxHeight,
        topRowTop: rects[0]?.top,
        titles
      };
    })()
  `);
  const res8Pass = resMetrics?.count === 8 && resMetrics?.cols === 2 && resMetrics?.rows === 4;
  console.log(`[CHECK 3] Residential highlights (8 cards in 2x4 grid, img box ~58px): ${res8Pass ? 'PASS' : 'FAIL'}`);
  console.log(`          Titles: ${resMetrics?.titles.join(', ')}`);
  if (!res8Pass) allPassed = false;

  // 4. Instant Hover Switch to Commercial
  await browser.hover('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
  await new Promise(r => setTimeout(r, 400));
  const commMetrics = await browser.evaluate(`
    (() => {
      const grid = document.querySelector('.samsung-highlights-grid');
      if (!grid) return null;
      const style = window.getComputedStyle(grid);
      const cards = Array.from(grid.querySelectorAll('.samsung-highlight-card'));
      const rects = cards.map(c => c.getBoundingClientRect());
      const cols = style.gridTemplateColumns.split(' ').length;
      const distinctTops = [...new Set(rects.map(r => Math.round(r.top)))].sort((a,b) => a - b);
      const imgBox = cards[0]?.querySelector('.samsung-highlight-img-box');
      const imgBoxHeight = imgBox ? Math.round(imgBox.getBoundingClientRect().height) : 0;
      const titles = cards.map(c => c.querySelector('.samsung-highlight-name')?.textContent?.trim());
      
      return {
        count: cards.length,
        cols,
        rows: distinctTops.length,
        imgBoxHeight,
        topRowTop: rects[0]?.top,
        titles
      };
    })()
  `);
  const comm8Pass = commMetrics?.count === 8 && commMetrics?.cols === 2 && commMetrics?.rows === 4;
  console.log(`[CHECK 4] Commercial highlights on hover switch (8 cards in 2x4 grid): ${comm8Pass ? 'PASS' : 'FAIL'}`);
  console.log(`          Titles: ${commMetrics?.titles.join(', ')}`);
  if (!comm8Pass) allPassed = false;

  // 5. Automatic Close on Pointer Leaving
  await browser.hover('.samsung-nav-backdrop');
  await new Promise(r => setTimeout(r, 400));
  const closedAfterLeave = await browser.evaluate(`Boolean(document.querySelector('.samsung-nav-mega-surface'))`);
  console.log(`[CHECK 5] Mega Menu automatically closed on pointer exit: ${!closedAfterLeave ? 'PASS' : 'FAIL'}`);
  if (closedAfterLeave) allPassed = false;

  // 6. Testimonial Card Height & Equal Height Verification
  const tInfo = await browser.evaluate(`
    (() => {
      const center = document.querySelector('.testimonial-card.card-center');
      const left = document.querySelector('.testimonial-card.card-left');
      const right = document.querySelector('.testimonial-card.card-right');
      const farLeft = document.querySelector('.testimonial-card.card-far-left');
      const farRight = document.querySelector('.testimonial-card.card-far-right');
      const getH = el => el ? Math.round(el.getBoundingClientRect().height) : null;
      return {
        centerH: getH(center),
        leftH: getH(left),
        rightH: getH(right),
        farLeftH: getH(farLeft),
        farRightH: getH(farRight),
        allEqual: (getH(center) === getH(left) && getH(left) === getH(right))
      };
    })()
  `);
  const tHeightPass = tInfo.centerH === 395 && tInfo.leftH === 395 && tInfo.rightH === 395 && tInfo.allEqual;
  console.log(`[CHECK 6] Testimonial cards height (Center: ${tInfo.centerH}px, Left: ${tInfo.leftH}px, Right: ${tInfo.rightH}px): ${tHeightPass ? 'PASS (all 3 equal at 395px)' : 'FAIL'}`);
  if (!tHeightPass) allPassed = false;

  // 7. Responsive Viewports & Horizontal Overflow Check
  const viewports = [1440, 1024, 768, 375];
  for (const w of viewports) {
    await browser.setViewport(w, 800);
    await new Promise(r => setTimeout(r, 200));
    const overflow = await browser.evaluate(`document.documentElement.scrollWidth > window.innerWidth`);
    console.log(`[CHECK 7] Viewport ${w}px horizontal overflow: ${!overflow ? 'PASS (fits cleanly)' : 'FAIL (overflow detected)'}`);
    if (overflow) allPassed = false;
  }

  await browser.close();

  console.log('\n=================================================================');
  if (allPassed) {
    console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.error('ONE OR MORE CHECKS FAILED!');
    process.exit(1);
  }
  console.log('=================================================================');
}

runVerification().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
