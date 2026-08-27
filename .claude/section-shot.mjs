import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const selector = process.argv[2] || '#iletisim';
const label = process.argv[3] || 'section';

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));

const el = await page.$(selector);
const files = (await import('fs')).readdirSync(path.join(__dirname, 'temporary screenshots')).filter(f => f.match(/screenshot-(\d+)/));
let max = 0;
for (const f of files) { const m = f.match(/screenshot-(\d+)/); if (m) max = Math.max(max, parseInt(m[1])); }
const outPath = path.join(__dirname, `temporary screenshots/screenshot-${max+1}-${label}.png`);
await el.screenshot({ path: outPath });
await browser.close();
console.log(`saved: ${outPath}`);
