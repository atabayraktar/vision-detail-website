// Re-runnable step that derives favicon.ico + apple-touch-icon.png from the
// square app-icon master (public/logos/vision-detail-square.png), and shrinks
// that master in place for use as the og:image/twitter:image share thumbnail.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SQUARE_PATH = path.join(ROOT, 'public', 'logos', 'vision-detail-square.png');

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

// Minimal ICO container holding PNG-compressed frames (supported by every
// browser/OS since Vista) — far smaller than the legacy raw-BMP ICO format.
function buildIco(sizes, pngBuffers) {
  const headerSize = 6 + sizes.length * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);

  let offset = headerSize;
  sizes.forEach((size, i) => {
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // width (sizes here are all < 256)
    entry.writeUInt8(size, 1); // height
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buf.length, 8); // bytes in resource
    entry.writeUInt32LE(offset, 12); // image offset
    header.set(entry, 6 + i * 16);
    offset += buf.length;
  });

  return Buffer.concat([header, ...pngBuffers]);
}

async function main() {
  const original = fs.readFileSync(SQUARE_PATH);
  const beforeSquare = original.length;

  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map((size) => sharp(original).resize(size, size).png({ compressionLevel: 9 }).toBuffer())
  );
  const icoBuffer = buildIco(sizes, pngBuffers);
  const icoPath = path.join(ROOT, 'public', 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`favicon.ico: ${fmtKB(icoBuffer.length)} (${sizes.join('/')}px)`);

  const applePath = path.join(ROOT, 'public', 'apple-touch-icon.png');
  await sharp(original).resize(180, 180).png({ compressionLevel: 9 }).toFile(applePath);
  console.log(`apple-touch-icon.png: ${fmtKB(fs.statSync(applePath).size)}`);

  // Shrink the master itself (source was 3375x3375) — 1200px is plenty for a
  // share-thumbnail and this flat two-tone mark compresses losslessly via palette PNG.
  await sharp(original).resize(1200, 1200).png({ palette: true, compressionLevel: 9 }).toFile(SQUARE_PATH);
  const afterSquare = fs.statSync(SQUARE_PATH).size;
  console.log(`vision-detail-square.png: ${fmtKB(beforeSquare)} -> ${fmtKB(afterSquare)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
