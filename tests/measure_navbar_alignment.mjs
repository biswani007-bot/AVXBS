import { CDPBrowser } from './helpers/cdp-browser.mjs';

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');

  const viewports = [
    { name: 'Desktop (1440x900)', w: 1440, h: 900, before: { headerH: 94, logoLeft: 16, resTop: 31.09, commTop: 31.09, resLeft: 219, commLeft: 352.84, gap: 8 } },
    { name: 'Laptop (1024x768)', w: 1024, h: 768, before: { headerH: 76, logoLeft: 16, resTop: 25.14, commTop: 25.14, resLeft: 138, commLeft: 241.02, gap: 8 } },
    { name: 'Tablet (768x1024)', w: 768, h: 1024, before: { headerH: 76, logoLeft: 16, resTop: 25.14, commTop: 25.14, resLeft: 138, commLeft: 241.02, gap: 8 } },
    { name: 'Mobile (425x800)', w: 425, h: 800, before: { headerH: 56, logoLeft: 12, resTop: null, commTop: null, resLeft: null, commLeft: null, gap: 8 } },
    { name: 'Mobile (375x667)', w: 375, h: 667, before: { headerH: 56, logoLeft: 10, resTop: null, commTop: null, resLeft: null, commLeft: null, gap: 8 } },
  ];

  console.log('='.repeat(95));
  console.log('                 AVXBS - STRICT HERO GAP & NAVBAR ALIGNMENT VERIFICATION');
  console.log('='.repeat(95));

  for (const vp of viewports) {
    await browser.setViewport(vp.w, vp.h, vp.w <= 768);
    await browser.navigate('http://localhost:5173', 1500);

    const m = await browser.evaluate(`
      (() => {
        const header = document.querySelector('.site-header');
        const logoLink = document.querySelector('.header-logo-link');
        const resBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
        const commBtn = document.querySelector('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
        const hero = document.querySelector('.hero-fullpage-master-section');
        const inquiry = document.querySelector('.inquiry-promo-section');

        const heroRect = hero ? hero.getBoundingClientRect() : null;
        const inqRect = inquiry ? inquiry.getBoundingClientRect() : null;
        const headerRect = header ? header.getBoundingClientRect() : null;
        const logoRect = logoLink ? logoLink.getBoundingClientRect() : null;
        const resRect = resBtn ? resBtn.getBoundingClientRect() : null;
        const commRect = commBtn ? commBtn.getBoundingClientRect() : null;

        const isNavVisible = resBtn && window.getComputedStyle(resBtn.closest('nav') || resBtn).display !== 'none';

        return {
          headerH: headerRect ? Number(headerRect.height.toFixed(2)) : null,
          logoLeft: logoRect ? Number(logoRect.left.toFixed(2)) : null,
          resTop: isNavVisible ? Number(resRect.top.toFixed(2)) : null,
          resLeft: isNavVisible ? Number(resRect.left.toFixed(2)) : null,
          commTop: isNavVisible ? Number(commRect.top.toFixed(2)) : null,
          commLeft: isNavVisible ? Number(commRect.left.toFixed(2)) : null,
          heroToInquiryGap: (heroRect && inqRect) ? Number((inqRect.top - heroRect.bottom).toFixed(2)) : null
        };
      })()
    `);

    console.log(`\n--- Viewport: ${vp.name} ---`);
    console.log(`  1. Hero -> Inquiry Gap:       ${m.heroToInquiryGap}px (Before: ${vp.before.gap}px | Target: exactly 4px) -> ${m.heroToInquiryGap === 4 ? 'PASS' : 'FAIL'}`);
    console.log(`  2. Navbar Height:             ${m.headerH}px (Before: ${vp.before.headerH}px | Target: identical) -> ${m.headerH === vp.before.headerH ? 'PASS' : 'FAIL'}`);
    console.log(`  3. Logo Horizontal Position:  ${m.logoLeft}px (Before: ${vp.before.logoLeft}px | Delta: +${Number((m.logoLeft - vp.before.logoLeft).toFixed(2))}px | Target: +2px) -> ${Math.abs(m.logoLeft - vp.before.logoLeft - 2) < 0.1 ? 'PASS' : 'FAIL'}`);

    if (m.resTop !== null) {
      const resDelta = Number((m.resTop - vp.before.resTop).toFixed(2));
      const commDelta = Number((m.commTop - vp.before.commTop).toFixed(2));
      const resHDelta = Number((m.resLeft - vp.before.resLeft).toFixed(2));
      const commHDelta = Number((m.commLeft - vp.before.commLeft).toFixed(2));
      console.log(`  4. Residential Top (Vertical): ${m.resTop}px (Before: ${vp.before.resTop}px | Delta: +${resDelta}px | Target: +4px) -> ${Math.abs(resDelta - 4) < 0.1 ? 'PASS' : 'FAIL'}`);
      console.log(`     Commercial Top (Vertical):  ${m.commTop}px (Before: ${vp.before.commTop}px | Delta: +${commDelta}px | Target: +4px) -> ${Math.abs(commDelta - 4) < 0.1 ? 'PASS' : 'FAIL'}`);
      console.log(`     Residential Left (Horiz):   ${m.resLeft}px (Before: ${vp.before.resLeft}px | Delta: ${resHDelta}px | Target: unchanged 0px) -> ${resHDelta === 0 ? 'PASS' : 'FAIL'}`);
      console.log(`     Commercial Left (Horiz):    ${m.commLeft}px (Before: ${vp.before.commLeft}px | Delta: ${commHDelta}px | Target: unchanged 0px) -> ${commHDelta === 0 ? 'PASS' : 'FAIL'}`);
    } else {
      console.log(`  4. Residential/Commercial:    Hidden in navbar (compact mobile navigation / drawer layout)`);
    }
  }

  console.log('\n' + '='.repeat(95));
  await browser.close();
}

main().catch(console.error);
