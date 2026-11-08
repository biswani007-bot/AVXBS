import { CDPBrowser } from './helpers/cdp-browser.mjs';
import fs from 'fs';
import path from 'path';

async function capture(browser, outputPath) {
  const res = await browser.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved screenshot: ${outputPath} (${buffer.length} bytes)`);
}

async function main() {
  const browser = new CDPBrowser();
  await browser.launch('http://localhost:5173');
  await browser.navigate('http://localhost:5173', 2500);

  const outDir = path.resolve('tests/screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Desktop 1440x900 - Closed
  await browser.setViewport(1440, 900, false);
  await new Promise(r => setTimeout(r, 400));
  await capture(browser, path.join(outDir, '1_desktop_1440_navbar_closed.png'));

  // 2. Desktop 1440x900 - Residential Mega Menu Open
  await browser.hover('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  await new Promise(r => setTimeout(r, 500));
  await capture(browser, path.join(outDir, '2_desktop_1440_residential_megamenu.png'));

  // 3. Desktop 1440x900 - Commercial Mega Menu Open
  await browser.hover('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]');
  await new Promise(r => setTimeout(r, 500));
  await capture(browser, path.join(outDir, '3_desktop_1440_commercial_megamenu.png'));

  // Close menu
  await browser.hover('.samsung-nav-backdrop');
  await new Promise(r => setTimeout(r, 400));

  // 4. Laptop 1024x768 - Navbar Closed
  await browser.setViewport(1024, 768, false);
  await new Promise(r => setTimeout(r, 400));
  await capture(browser, path.join(outDir, '4_laptop_1024_navbar_closed.png'));

  // 5. Laptop 1024x768 - Residential Mega Menu Open
  await browser.hover('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]');
  await new Promise(r => setTimeout(r, 500));
  await capture(browser, path.join(outDir, '5_laptop_1024_residential_megamenu.png'));

  // Close menu
  await browser.hover('.samsung-nav-backdrop');
  await new Promise(r => setTimeout(r, 400));

  // 6. Tablet 768x1024 - Navbar State (Residential & Commercial visible directly!)
  await browser.setViewport(768, 1024, true);
  await new Promise(r => setTimeout(r, 400));
  await capture(browser, path.join(outDir, '6_tablet_768_navbar_visible.png'));

  // 7. Tablet 768x1024 - Residential Mega Menu Open (Desktop two-column structure!)
  await browser.evaluate(`document.querySelector('.samsung-nav-tab-btn[aria-label="Residential solutions menu"]')?.click()`);
  await new Promise(r => setTimeout(r, 600));
  await capture(browser, path.join(outDir, '7_tablet_768_residential_megamenu.png'));

  // 8. Tablet 768x1024 - Commercial Mega Menu Switch
  await browser.evaluate(`document.querySelector('.samsung-nav-tab-btn[aria-label="Commercial solutions menu"]')?.click()`);
  await new Promise(r => setTimeout(r, 600));
  await capture(browser, path.join(outDir, '8_tablet_768_commercial_megamenu.png'));

  // Close menu
  await browser.evaluate(`document.querySelector('.samsung-nav-backdrop')?.click()`);
  await new Promise(r => setTimeout(r, 400));

  // 9. Mobile 375x667 - Navbar State (Search toggle icon, hamburger)
  await browser.setViewport(375, 667, true);
  await new Promise(r => setTimeout(r, 400));
  await capture(browser, path.join(outDir, '9_mobile_375_navbar.png'));

  // 10. Mobile 375x667 - Hamburger Drawer Open
  await browser.evaluate(`document.querySelector('.header-menu-btn')?.click()`);
  await new Promise(r => setTimeout(r, 500));
  await capture(browser, path.join(outDir, '10_mobile_375_drawer_open.png'));

  await browser.close();
  console.log('\nAll 10 verification screenshots captured successfully!');
}

main().catch(console.error);
