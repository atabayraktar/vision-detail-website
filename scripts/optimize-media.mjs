// One-time (re-runnable) pipeline that pulls homepage assets from
// .claude/homepage_data + .claude/logos into public/, optimized per
// CLAUDE.md's Media Optimization Pipeline rule.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, '.claude', 'homepage_data');
const LOGOS_SRC = path.join(ROOT, '.claude', 'logos');
const CHROME_PATH = 'C:/Users/ataba/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe';

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

async function rasterizeSvgToPng(svgPath, outPngPath, targetWidth) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const vbW = vb ? parseFloat(vb[1]) : 600;
  const vbH = vb ? parseFloat(vb[2]) : 250;
  const targetHeight = Math.round((vbH / vbW) * targetWidth);

  const html = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;background:transparent;}
svg{display:block;width:${targetWidth}px;height:${targetHeight}px;}
</style></head><body>${svg}</body></html>`;
  const tmpHtml = outPngPath + '.render.html';
  fs.writeFileSync(tmpHtml, html);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: targetWidth, height: targetHeight, deviceScaleFactor: 1 });
  await page.goto('file:///' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  const el = await page.$('svg');
  await el.screenshot({ path: outPngPath, omitBackground: true });
  await browser.close();
  fs.unlinkSync(tmpHtml);
}

async function logoToWebp(svgName, srcDir, outName) {
  const svgPath = path.join(srcDir, svgName);
  const tmpPng = path.join(ROOT, 'public', 'logos', outName + '.tmp.png');
  const outPath = path.join(ROOT, 'public', 'logos', outName + '.webp');
  await rasterizeSvgToPng(svgPath, tmpPng, 900);
  const before = fs.statSync(svgPath).size;
  await sharp(tmpPng).webp({ quality: 92, alphaQuality: 100 }).toFile(outPath);
  fs.unlinkSync(tmpPng);
  const after = fs.statSync(outPath).size;
  console.log(`logo ${outName}: ${fmtKB(before)} (svg) -> ${fmtKB(after)} (webp)`);
}

async function videoPosterToWebp(videoPath, outPath) {
  const tmpPng = outPath + '.tmp.png';
  // -update 1 (not a %d sequence) since we only want a single still frame.
  execFileSync('ffmpeg', ['-y', '-i', videoPath, '-ss', '0.2', '-frames:v', '1', '-update', '1', tmpPng], {
    stdio: 'ignore',
  });
  await sharp(tmpPng).webp({ quality: 76 }).toFile(outPath);
  fs.unlinkSync(tmpPng);
  console.log(`poster ${path.basename(outPath)}: ${fmtKB(fs.statSync(outPath).size)}`);
}

async function imageToWebp(srcPath, outPath, maxWidth, quality) {
  const before = fs.statSync(srcPath).size;
  const img = sharp(srcPath);
  const meta = await img.metadata();
  const pipeline = meta.width > maxWidth ? img.resize({ width: maxWidth }) : img;
  await pipeline.webp({ quality }).toFile(outPath);
  const after = fs.statSync(outPath).size;
  console.log(`${path.basename(outPath)}: ${fmtKB(before)} -> ${fmtKB(after)}`);
}

async function main() {
  // 1. Vision Detail logo (dark + light) — rasterized from the pseudo-vector source SVGs.
  await logoToWebp('logo-dark.svg', LOGOS_SRC, 'vision-detail-dark');
  await logoToWebp('logo-light.svg', LOGOS_SRC, 'vision-detail-light');

  // 2. ChemicalWorkz logo — genuine vector, copy through untouched.
  const cwSvg = path.join(DATA, 'header', 'siyah_logo_chemicalworkz (1).svg');
  fs.copyFileSync(cwSvg, path.join(ROOT, 'public', 'logos', 'chemicalworkz-dark.svg'));
  console.log('logo chemicalworkz-dark.svg: copied as-is (genuine vector)');

  // 3. Equipment category images. Only 5 of the 8 homepage categories have a real supplied
  // photo (kontrol-isigi/kurutucu/uygulayicilar still fall back to a reused image — see
  // homepageContent.js) — skip missing sources instead of crashing so this script stays
  // re-runnable as more real photos land.
  const eqDir = path.join(DATA, 'equipment-category-section');
  const eqSlugs = {
    'Detay Fırçaları_result.webp': 'detay-fircalari',
    'Keçeler_result.webp': 'keceler',
    'Kontrol Işığı_result.webp': 'kontrol-isigi',
    'kurutucu_result.webp': 'kurutucu',
    'Manyetik Bez_result.webp': 'manyetik-bez',
    'Mikrofiber Bezler_result.webp': 'mikrofiber-bezler',
    'Sprey Şişeleri_result.webp': 'sprey-siseleri',
    'Uygulayıcılar_result.webp': 'uygulayicilar',
  };
  for (const [file, slug] of Object.entries(eqSlugs)) {
    const src = path.join(eqDir, file);
    if (!fs.existsSync(src)) {
      console.log(`skip equipment/${slug}.webp: no source photo supplied yet (${file})`);
      continue;
    }
    await imageToWebp(src, path.join(ROOT, 'public', 'images', 'equipment', `${slug}.webp`), 800, 80);
  }

  // 3b. ChemicalWorkz About section image — now has its own dedicated source (previously
  // this section just reused the mikrofiber-bezler category photo as a placeholder since
  // nothing else existed; homepageContent.js's aboutChemicalWorkz.image now points here).
  await imageToWebp(
    path.join(DATA, 'chemical-works-about-section', 'chemicalworkz-about-4x3.webp'),
    path.join(ROOT, 'public', 'images', 'about-chemicalworkz.webp'),
    1000,
    82
  );

  // 4. Polishing banner image — desktop (wide) + a genuinely different art-directed mobile
  // crop (portrait, not just a resize — see the aspect ratios) swapped in via a media query
  // in PolishingBanner.jsx, not just responsive `sizes`.
  await imageToWebp(
    path.join(DATA, 'polishing-banner-section', 'polishing-banner_result.webp'),
    path.join(ROOT, 'public', 'images', 'polishing-banner.webp'),
    1920,
    80
  );
  await imageToWebp(
    path.join(DATA, 'polishing-banner-section', 'polishing-banner-mobil.webp'),
    path.join(ROOT, 'public', 'images', 'polishing-banner-mobile.webp'),
    900,
    80
  );

  // 5. Hero-4 pad image — same desktop/mobile art-direction pair as the polishing banner.
  await imageToWebp(
    path.join(DATA, 'hero-section', 'hero-4', 'pads-hero_result.webp'),
    path.join(ROOT, 'public', 'images', 'hero-4-pads.webp'),
    1920,
    82
  );
  await imageToWebp(
    path.join(DATA, 'hero-section', 'hero-4', 'pads-hero-mobil.webp'),
    path.join(ROOT, 'public', 'images', 'hero-4-pads-mobile.webp'),
    900,
    82
  );

  // 6. Poster frames for the hero videos — gives the <video poster> attribute a real
  // still (better perceived load, and a stable LCP candidate instead of the video itself).
  // Requires public/videos/hero-N.mp4 to already exist (run the ffmpeg video pass first).
  for (const slug of ['hero-1', 'hero-2', 'hero-3']) {
    const videoPath = path.join(ROOT, 'public', 'videos', `${slug}.mp4`);
    if (!fs.existsSync(videoPath)) {
      console.log(`skip poster for ${slug}: ${videoPath} not found — run the ffmpeg video pass first`);
      continue;
    }
    await videoPosterToWebp(videoPath, path.join(ROOT, 'public', 'images', `${slug}-poster.webp`));
  }

  console.log('\nImage pipeline done. Run the ffmpeg video pass separately (see CLAUDE.md).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
