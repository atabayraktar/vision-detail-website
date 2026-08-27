import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary screenshots');

const url = process.argv[2] || 'http://localhost:3000';
const args = process.argv.slice(3);
const mobileFlag = args.includes('--mobile');
const label = args.filter(a => !a.startsWith('--'))[0] || '';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Auto-increment filename
function getNextFilename() {
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  let max = 0;
  for (const f of files) {
    const match = f.match(/screenshot-(\d+)/);
    if (match) max = Math.max(max, parseInt(match[1]));
  }
  const n = max + 1;
  return label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
}

const filename = getNextFilename();
const outputPath = path.join(SCREENSHOTS_DIR, filename);

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
if (mobileFlag) {
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
} else {
  await page.setViewport({ width: 1440, height: 900 });
}
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 2000));
// Force all data-reveal elements to show (IntersectionObserver doesn't fire in fullPage screenshots)
await page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);
