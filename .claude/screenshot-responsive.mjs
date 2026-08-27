import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary screenshots');

const url = process.argv[2] || 'http://localhost:3000';
const pageLabel = process.argv[3] || 'page';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function getNextFilename(label) {
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  let max = 0;
  for (const f of files) {
    const match = f.match(/screenshot-(\d+)/);
    if (match) max = Math.max(max, parseInt(match[1]));
  }
  const n = max + 1;
  return `screenshot-${n}-${label}.png`;
}

// Mobile / tablet mini / midi / max, each portrait + landscape, plus desktop.
const VIEWPORTS = [
  { key: 'mobile-portrait', width: 375, height: 812, isMobile: true },
  { key: 'mobile-landscape', width: 812, height: 375, isMobile: true },
  { key: 'tablet-mini-portrait', width: 768, height: 1024, isMobile: true },
  { key: 'tablet-mini-landscape', width: 1024, height: 768, isMobile: true },
  { key: 'tablet-midi-portrait', width: 834, height: 1194, isMobile: true },
  { key: 'tablet-midi-landscape', width: 1194, height: 834, isMobile: true },
  { key: 'tablet-max-portrait', width: 1024, height: 1366, isMobile: true },
  { key: 'tablet-max-landscape', width: 1366, height: 1024, isMobile: true },
  { key: 'desktop', width: 1440, height: 900, isMobile: false },
];

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    isMobile: vp.isMobile,
    deviceScaleFactor: vp.isMobile ? 2 : 1,
  });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.addStyleTag({
    content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}',
  });
  await new Promise((r) => setTimeout(r, 500));
  const filename = getNextFilename(`${pageLabel}-${vp.key}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: true });
  console.log(`Saved: temporary screenshots/${filename}`);
  await page.close();
}

await browser.close();
