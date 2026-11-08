import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.navigate('http://localhost:5173', 2000);

  const viewports = [
    { name: 'Desktop', w: 1440, h: 900, isMobile: false },
    { name: 'Laptop', w: 1024, h: 768, isMobile: false },
    { name: 'Tablet', w: 768, h: 1024, isMobile: true }
  ];

  let anyOverflow = false;

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

      const overflowCheck = await browser.evaluate(`(() => {
        const cards = Array.from(document.querySelectorAll('.samsung-highlight-card'));
        return cards.map((c, i) => {
          const caption = c.querySelector('.samsung-highlight-caption');
          const name = c.querySelector('.samsung-highlight-name');
          const sub = c.querySelector('.samsung-highlight-sub');
          return {
            index: i,
            title: name?.textContent?.trim(),
            cardOverflow: c.scrollHeight > c.clientHeight,
            captionOverflow: caption ? caption.scrollHeight > caption.clientHeight : false,
            cardScrollH: c.scrollHeight,
            cardClientH: c.clientHeight,
            captionScrollH: caption?.scrollHeight,
            captionClientH: caption?.clientHeight
          };
        });
      })()`);

      console.log(`\n--- ${vp.name} [${menu}] ---`);
      for (const item of overflowCheck) {
        if (item.cardOverflow || item.captionOverflow) anyOverflow = true;
        console.log(`  Card ${item.index} ("${item.title}"): cardOverflow=${item.cardOverflow} (${item.cardScrollH}/${item.cardClientH}), captionOverflow=${item.captionOverflow} (${item.captionScrollH}/${item.captionClientH})`);
      }

      await browser.evaluate(`(() => {
        const backdrop = document.querySelector('.samsung-nav-backdrop');
        if (backdrop) backdrop.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      })()`);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  await browser.close();
  console.log(`\nOVERALL OVERFLOW CHECK: ${anyOverflow ? 'FAILED (found overflow)' : 'PASSED (zero overflow)'}`);
}

main().catch(console.error);
