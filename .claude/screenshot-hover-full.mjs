import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary screenshots');

const url = process.argv[2];
const selector = process.argv[3];
const label = process.argv[4] || 'hover-full';

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
await new Promise((r) => setTimeout(r, 1000));

// Force hover state via CSS class injection instead of relying on real mouse
// position (avoids Lenis smooth-scroll fighting Puppeteer's scroll-into-view).
await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (el) {
    el.scrollIntoView({ block: 'center' });
  }
}, selector);
await new Promise((r) => setTimeout(r, 800));

await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (el) {
    el.classList.add('force-hover-debug');
    const style = document.createElement('style');
    style.textContent = `.force-hover-debug { border-color: var(--ink) !important; }`;
    document.head.appendChild(style);
  }
}, selector);

// Also dispatch a real mouseover so :hover CSS actually applies.
const box = await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}, selector);
await page.mouse.move(box.x, box.y);
await new Promise((r) => setTimeout(r, 500));

await page.screenshot({ path: path.join(SCREENSHOTS_DIR, getNextFilename(label)), fullPage: true });
await browser.close();
console.log('done');
