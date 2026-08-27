import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';

const PAGES = ['http://localhost:3001', 'http://localhost:3001/idil'];
const VIEWPORTS = [
  { key: 'mobile-portrait', width: 375, height: 812 },
  { key: 'mobile-landscape', width: 812, height: 375 },
  { key: 'tablet-mini-portrait', width: 768, height: 1024 },
  { key: 'tablet-mini-landscape', width: 1024, height: 768 },
  { key: 'tablet-midi-portrait', width: 834, height: 1194 },
  { key: 'tablet-midi-landscape', width: 1194, height: 834 },
  { key: 'tablet-max-portrait', width: 1024, height: 1366 },
  { key: 'tablet-max-landscape', width: 1366, height: 1024 },
  { key: 'desktop', width: 1440, height: 900 },
];

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const url of PAGES) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 500));
    const result = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    const overflow = result.scrollWidth - result.innerWidth;
    console.log(
      `${url} | ${vp.key} (${vp.width}x${vp.height}) -> scrollWidth=${result.scrollWidth} innerWidth=${result.innerWidth} ${overflow > 0 ? `OVERFLOW +${overflow}px` : 'OK'}`
    );
    await page.close();
  }
}

await browser.close();
