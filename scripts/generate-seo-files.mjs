// Prebuild step (see package.json "build" script): writes robots.txt, llms.txt and
// sitemap.xml into public/ from the same page/product source Next.js builds from.
// Static-export friendly — no runtime route involved.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const SITE_URL = 'https://visiondetail.com.tr';

// products.js is plain JS (not JSON) — a dynamic import works fine from an .mjs script.
// pathToFileURL is required on Windows: a raw absolute path like "C:\..." isn't a valid
// ESM import specifier/URL on its own.
const productsModuleUrl = pathToFileURL(path.join(__dirname, '..', 'src', 'data', 'products.js'));
const { products } = await import(productsModuleUrl);

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/urunler', priority: '0.9', changefreq: 'weekly' },
  ...products.map((p) => ({ path: `/urunler/${p.id}`, priority: '0.7', changefreq: 'monthly' })),
];

function writeRobotsTxt() {
  const content = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), content);
}

function writeLlmsTxt() {
  const content = `# Vision Detail

> Vision Detail is the official Turkey distributor of ChemicalWorkz, a Germany-based
> manufacturer of professional vehicle detailing equipment and premium care accessories.
> Vision Detail brings ChemicalWorkz's German-engineered detailing products — polishers,
> applicators, microfiber cloths, drying and inspection equipment — to professionals and
> car enthusiasts in Turkey.

## Key facts

- Entity relationship: Vision Detail = ChemicalWorkz's Turkey distributor (not the manufacturer).
- Manufacturer: ChemicalWorkz, headquartered in Germany, distributed across 10+ European countries.
- Sales channel: WhatsApp (+90 540 998 2505) — there is no online cart/checkout on this site.
- Contact: Instagram @visiondetail.tr, WhatsApp https://wa.me/905409982505

## Pages

- [Homepage](${SITE_URL}/): hero, equipment categories, ChemicalWorkz brand background, polisher-picker quiz, contact.
- [Products](${SITE_URL}/urunler): full ChemicalWorkz product catalog available through Vision Detail, filterable by category.

## Sitemap

${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), content);
}

function writeSitemap() {
  const urls = STATIC_PAGES.map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).join('\n');

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), content);
}

writeRobotsTxt();
writeLlmsTxt();
writeSitemap();
console.log('SEO files written: robots.txt, llms.txt, sitemap.xml');
