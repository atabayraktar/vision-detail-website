import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';
const DIR = path.join(__dirname, 'temporary screenshots');

async function shot(width, height, label) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${DIR}/screenshot-tablet-${label}.png`, fullPage: true });
  await browser.close();
  console.log(`Done: ${label} (${width}x${height})`);
}

// iPad Mini portrait & landscape
await shot(768, 1024, 'mini-portrait');
await shot(1024, 768, 'mini-landscape');
// iPad Air portrait
await shot(820, 1180, 'air-portrait');
// iPad Pro 12.9 portrait
await shot(1024, 1366, 'pro-portrait');
