import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary screenshots');

function getNextFilename(label) {
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  let max = 0;
  for (const f of files) {
    const match = f.match(/screenshot-(\d+)/);
    if (match) max = Math.max(max, parseInt(match[1]));
  }
  return `screenshot-${max + 1}-contact-form-modal.png`;
}

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 800));

await page.evaluate(() => {
  document.querySelector('#iletisim')?.scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 800));

await page.click('.contact__form-cta');
await new Promise((r) => setTimeout(r, 700));

await page.screenshot({ path: path.join(SCREENSHOTS_DIR, getNextFilename('contact-form-modal')) });
await browser.close();
console.log('done');
