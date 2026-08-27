import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary screenshots');

const url = process.argv[2];
const selector = process.argv[3];
const wheelAmount = parseInt(process.argv[4] || '1600', 10);
const label = process.argv[5] || 'hover';

function getNextFilename(label) {
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  let max = 0;
  for (const f of files) {
    const match = f.match(/screenshot-(\d+)/);
    if (match) max = Math.max(max, parseInt(match[1]));
  }
  return `screenshot-${max + 1}-${label}.png`;
}

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 800));

await page.mouse.move(720, 450);
let scrolled = 0;
while (scrolled < wheelAmount) {
  await page.mouse.wheel({ deltaY: 800 });
  scrolled += 800;
  await new Promise((r) => setTimeout(r, 60));
}
await new Promise((r) => setTimeout(r, 1200));

const box = await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}, selector);

if (!box) {
  console.log('Selector not found:', selector);
  await browser.close();
  process.exit(1);
}

await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await new Promise((r) => setTimeout(r, 500));

await page.screenshot({
  path: path.join(SCREENSHOTS_DIR, getNextFilename(label)),
  clip: {
    x: Math.max(box.x - 30, 0),
    y: Math.max(box.y - 30, 0),
    width: Math.min(box.width + 60, 1440),
    height: box.height + 60,
  },
});
await browser.close();
console.log('done');
