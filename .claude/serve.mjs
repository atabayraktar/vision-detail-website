import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Serves the static export (`next build` -> out/), one level up from .claude/ — NOT
// .claude/ itself. Use `npm run dev` for iterative work against the Next dev server.
const ROOT = path.resolve(__dirname, '..', 'out');
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Text-ish types worth gzipping. Media (webp/mp4/webm) is already compressed — recompressing
// wastes CPU and gains nothing, so it's deliberately excluded.
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);

// Approximates the caching a real static host (Vercel/Netlify/Cloudflare Pages/S3+CDN) would
// apply: Next's hashed build assets are immutable forever, page/data files revalidate.
function cacheControlFor(urlPath, ext) {
  if (urlPath.startsWith('/_next/static/')) return 'public, max-age=31536000, immutable';
  if (ext === '.html') return 'public, max-age=0, must-revalidate';
  return 'public, max-age=3600';
}

const server = http.createServer((req, res) => {
  // req.url is the raw request-target — percent-encoded (e.g. the [id].js chunk for the
  // dynamic product route arrives as %5Bid%5D.js) and never decoded automatically by
  // Node's http module, so file lookups against it silently 404 without this.
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  else if (urlPath.endsWith('/')) urlPath += 'index.html';

  let filePath = path.join(ROOT, urlPath);
  // Next's static export writes route directories (e.g. /urunler -> out/urunler/index.html)
  // — a request with no trailing slash and no extension (like a real static host's rewrite
  // rule would handle) needs the same index.html fallback, not just the `/` and `/foo/` cases
  // above, or every non-root top-level page 404s.
  if (!path.extname(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControlFor(urlPath, ext),
    };

    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (COMPRESSIBLE.has(ext) && acceptEncoding.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      res.end(zlib.gzipSync(data));
      return;
    }

    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
