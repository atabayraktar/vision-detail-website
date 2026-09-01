// One-time (re-runnable) pipeline: reads .claude/product-list/ (real product photos) +
// the seed data below (sourced from .claude/product-list.xlsx, reconciled against the
// actual folders — see the inventory notes inline), optimizes every image per CLAUDE.md's
// Media Optimization Pipeline, and writes src/data/products.js for the /urunler pages.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(ROOT, '.claude', 'product-list');
const OUT_IMG_ROOT = path.join(ROOT, 'public', 'images', 'products');

const CARD_MAX_WIDTH = 640;
const DETAIL_MAX_WIDTH = 1400;
// Gallery thumbnail rail (ProductGallery.jsx) displays each image at 68x68 CSS px — under
// `output: 'export'`, next/image runs with `unoptimized: true` (required for a static
// export, no image-optimization server available), which means it never generates a
// responsive srcset and just ships the <img>'s `src` file at full size regardless of the
// `sizes` hint. Every thumbnail was serving the same ~1400px DETAIL_MAX_WIDTH file as the
// main viewer — a real, measured Lighthouse finding (~99% wasted bytes per thumbnail,
// dragging down LCP by adding bandwidth contention). A dedicated small file per gallery
// image is the only way to actually shrink what the thumbnail rail downloads.
const THUMB_MAX_WIDTH = 160;
const QUALITY = 80;

// Poster images (0-3 per SKU) + real poster copy, extracted from the Excel's ÜRÜN POSTERİ
// GÖRSELİ / ÜRÜN POSTERİ AÇIKLAMASI columns (TR source, EN/DE hand-translated to match the
// site's tone) — see scripts/poster-data.json. `video` covers the one SKU (cw-ms) whose
// "feature" shot is genuinely a clip, not a photo. Both replace the old single-image
// `poster`/POSTER_SKUS allow-list D2 used to be gated behind.
const posterDataFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'poster-data.json'), 'utf8'));
const POSTER_DATA = posterDataFile.POSTER_DATA;
const VIDEO_DATA = posterDataFile.VIDEO_DATA;

// Real product descriptions from the Excel's ÜRÜN AÇIKLAMASI column (J) — see
// scripts/build-description-data.mjs, re-run that first if the Excel's column J changes.
// Empty for the 3 SKUs whose Excel row has no description text (cw-da9-pro-max, cw-da12,
// cw-hwa) — those fall back to the templated description built from name+category+tagline.
const DESCRIPTION_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'description-data.json'), 'utf8'));

// Exactly the 8 top-level categories from the source Excel's ANA KATEGORİLER column
// (rows 2-9, in the Excel's own order — vision-detail-ürün-listesi.xlsx, 2026-08 refresh).
// The old finer subcategories were never the user's: detay-fircalari → fircalar,
// manyetik-bez + mikrofiber-bezler → bezler, and kontrol-isigi / kurutucu / uygulayicilar
// (all long since product-less after the catalog refresh) are gone entirely.
// TR "Polisaj Makineleri" (plural) follows the newer Excel; the slug stays polisaj-makinesi
// so existing links (homepage hero CTA, shared filter URLs) keep working.
const CATEGORIES = [
  { slug: 'hava-tabancasi', label: { tr: 'Hava Tabancası', en: 'Air Gun', de: 'Druckluftpistole' } },
  { slug: 'polisaj-makinesi', label: { tr: 'Polisaj Makineleri', en: 'Polishers', de: 'Poliermaschinen' } },
  { slug: 'polisaj-pedleri', label: { tr: 'Polisaj Pedleri', en: 'Polishing Pads', de: 'Polierpads' } },
  { slug: 'fircalar', label: { tr: 'Fırçalar', en: 'Brushes', de: 'Bürsten' } },
  { slug: 'bezler', label: { tr: 'Bezler', en: 'Cloths', de: 'Tücher' } },
  { slug: 'sprey-siseleri', label: { tr: 'Sprey Şişeleri', en: 'Spray Bottles', de: 'Sprühflaschen' } },
  { slug: 'keceler', label: { tr: 'Keçeler', en: 'Felt Pads', de: 'Filzpads' } },
  { slug: 'yardimcilar', label: { tr: 'Yardımcılar', en: 'Accessories', de: 'Zubehör' } },
];

// STOK column of the newer Excel (vision-detail-ürün-listesi.xlsx): every product row says
// "var" except the bottom three (rows 54-56: cw-da9-pro-max, cw-da12, cw-hwa), whose STOK
// cell is empty — those are the user's "en alttaki 3 üründe stok yok".
const OUT_OF_STOCK = new Set(['cw-da9-pro-max', 'cw-da12', 'cw-hwa']);
const catLabel = (slug) => CATEGORIES.find((c) => c.slug === slug).label;

const COLORS = {
  Mor: { tr: 'Mor', en: 'Purple', de: 'Lila' },
  Turkuaz: { tr: 'Turkuaz', en: 'Turquoise', de: 'Türkis' },
  Siyah: { tr: 'Siyah', en: 'Black', de: 'Schwarz' },
  Mavi: { tr: 'Mavi', en: 'Blue', de: 'Blau' },
  Yeşil: { tr: 'Yeşil', en: 'Green', de: 'Grün' },
  Kırmızı: { tr: 'Kırmızı', en: 'Red', de: 'Rot' },
  Sarı: { tr: 'Sarı', en: 'Yellow', de: 'Gelb' },
};

// dir is relative to SRC_ROOT. tagline/name given in TR + a direct EN/DE translation.
const SEEDS = [
  { id: 'cw-mag', dir: 'Hava Tabancası/cw-mag', category: 'hava-tabancasi',
    // Excel's own ÜRÜN ADI cell literally says "Mini Air Gun" (English) for this row, but
    // the homepage's own hero-3 copy (src/data/homepageContent.js) already established
    // "Mini Hava Tabancası" as this product's Turkish name — using the Excel's literal
    // English text on the TR page would contradict copy the site already ships.
    name: { tr: 'Mini Hava Tabancası', en: 'Mini Air Gun', de: 'Mini-Luftpistole' },
    tagline: { tr: 'Basınçlı Hava Temizleme Tabancası', en: 'Compressed Air Cleaning Gun', de: 'Druckluft-Reinigungspistole' } },
  { id: 'cw-evo-mini', dir: 'Polisaj Makinesi/cw-evo-mini', category: 'polisaj-makinesi',
    name: { tr: 'EVO Mini', en: 'EVO Mini', de: 'EVO Mini' },
    tagline: { tr: 'Hibrit Polisaj Makineleri', en: 'Hybrid Polishing Machine', de: 'Hybrid-Poliermaschine' } },
  { id: 'cw-evo-mini-pro', dir: 'Polisaj Makinesi/cw-evo-mini-pro', category: 'polisaj-makinesi',
    name: { tr: 'EVO Mini Pro', en: 'EVO Mini Pro', de: 'EVO Mini Pro' },
    tagline: { tr: 'Hibrit Polisaj Makineleri', en: 'Hybrid Polishing Machine', de: 'Hybrid-Poliermaschine' } },
  // Polisaj Pedleri: the source photo folders are now shared per PAD TYPE across every size
  // variant (30/50/75/125mm all live in one "cw-pp-<type>" folder together) instead of one
  // folder per exact SKU — `images`/`posterFile` pin each SKU's own specific file(s) out of
  // that shared folder instead of relying on classify()'s single-folder heuristic, which
  // can't otherwise tell a 30mm packshot from a 125mm one. Sizes/filenames per
  // c:\Users\ataba\Downloads\vision-detail-ürün-listesi.xlsx (2026-08 catalog refresh).
  { id: 'cw-pp-125-heavy', dir: 'Polisaj Pedleri/cw-pp-heavy', category: 'polisaj-pedleri', size: '125mm',
    images: ['cw-pp-125-heavy-packshot_result.webp', 'pads_u1.webp', 'pads_u2.webp', 'cw-pp-125-heavy-a1_result.webp', 'cw-pp-125-heavy-a2_result.webp'],
    posterFile: 'cw-pp-125-heavy-a1_result.webp',
    name: { tr: 'Ağır Polisaj Pedi', en: 'Heavy Cutting Pad', de: 'Heavy-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Ağır Kesim', en: 'Performance Pad | Heavy Cutting', de: 'Performance-Pad | Starker Schnitt' } },
  { id: 'cw-pp-30-heavy', dir: 'Polisaj Pedleri/cw-pp-heavy', category: 'polisaj-pedleri', size: '30mm',
    images: ['chemicalworkz-heavy-cutting-performance-pad-30mm-grau.webp'],
    name: { tr: 'Ağır Polisaj Pedi', en: 'Heavy Cutting Pad', de: 'Heavy-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Ağır Kesim', en: 'Performance Pad | Heavy Cutting', de: 'Performance-Pad | Starker Schnitt' } },
  { id: 'cw-pp-50-heavy', dir: 'Polisaj Pedleri/cw-pp-heavy', category: 'polisaj-pedleri', size: '50mm',
    images: ['chemicalworkz-heavy-cutting-performance-pad-50mm-grau.webp'],
    name: { tr: 'Ağır Polisaj Pedi', en: 'Heavy Cutting Pad', de: 'Heavy-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Ağır Kesim', en: 'Performance Pad | Heavy Cutting', de: 'Performance-Pad | Starker Schnitt' } },
  { id: 'cw-pp-75-heavy', dir: 'Polisaj Pedleri/cw-pp-heavy', category: 'polisaj-pedleri', size: '75mm',
    images: ['chemicalworkz-heavy-cutting-performance-pad-75mm-grau.webp'],
    name: { tr: 'Ağır Polisaj Pedi', en: 'Heavy Cutting Pad', de: 'Heavy-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Ağır Kesim', en: 'Performance Pad | Heavy Cutting', de: 'Performance-Pad | Starker Schnitt' } },
  { id: 'cw-pp-125-medium', dir: 'Polisaj Pedleri/cw-pp-medium', category: 'polisaj-pedleri', size: '125mm',
    images: ['cw-pp-125-medium-packshot_result.webp', 'pads_u1.webp', 'pads_u2.webp', 'cw-pp-125-medium-a1_result.webp', 'cw-pp-125-medium-a2_result.webp'],
    posterFile: 'cw-pp-125-medium-a1_result.webp',
    name: { tr: 'Orta Polisaj Pedi', en: 'Medium Cutting Pad', de: 'Medium-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Orta-Zor', en: 'Performance Pad | Medium-Heavy', de: 'Performance-Pad | Mittel-Stark' } },
  { id: 'cw-pp-30-medium', dir: 'Polisaj Pedleri/cw-pp-medium', category: 'polisaj-pedleri', size: '30mm',
    images: ['chemicalworkz-medium-polishing-performance-pad-30mm-blau.webp'],
    name: { tr: 'Orta Polisaj Pedi', en: 'Medium Cutting Pad', de: 'Medium-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Orta-Zor', en: 'Performance Pad | Medium-Heavy', de: 'Performance-Pad | Mittel-Stark' } },
  { id: 'cw-pp-50-medium', dir: 'Polisaj Pedleri/cw-pp-medium', category: 'polisaj-pedleri', size: '50mm',
    images: ['chemicalworkz-medium-polishing-performance-pad-50mm-blau.webp'],
    name: { tr: 'Orta Polisaj Pedi', en: 'Medium Cutting Pad', de: 'Medium-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Orta-Zor', en: 'Performance Pad | Medium-Heavy', de: 'Performance-Pad | Mittel-Stark' } },
  { id: 'cw-pp-75-medium', dir: 'Polisaj Pedleri/cw-pp-medium', category: 'polisaj-pedleri', size: '75mm',
    images: ['chemicalworkz-medium-polishing-performance-pad-75mm-blau.webp'],
    name: { tr: 'Orta Polisaj Pedi', en: 'Medium Cutting Pad', de: 'Medium-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Orta-Zor', en: 'Performance Pad | Medium-Heavy', de: 'Performance-Pad | Mittel-Stark' } },
  { id: 'cw-pp-125-mf', dir: 'Polisaj Pedleri/cw-pp-125-mf', category: 'polisaj-pedleri', size: '125mm',
    images: ['cw-pp-125-mf-packshot_result.webp', 'pads_u1.webp', 'pads_u2.webp', 'cw-pp-125-mf-a1_result.webp'],
    posterFile: 'cw-pp-125-mf-a1_result.webp',
    name: { tr: 'MikroFiber Polisaj Pedi', en: 'Microfiber Polishing Pad', de: 'Mikrofaser-Polierpad' },
    tagline: { tr: 'Mikrofiber Ped | Yüksek Aşındırıcı', en: 'Microfiber Pad | High Cut', de: 'Mikrofaser-Pad | Starker Abtrag' } },
  { id: 'cw-pp-75-mf', dir: 'Polisaj Pedleri/cw-pp-125-mf', category: 'polisaj-pedleri', size: '75mm',
    images: ['chemicalworkz-microfiber-performance-pad-75mm.webp'],
    name: { tr: 'MikroFiber Polisaj Pedi', en: 'Microfiber Polishing Pad', de: 'Mikrofaser-Polierpad' },
    tagline: { tr: 'Mikrofiber Ped | Yüksek Aşındırıcı', en: 'Microfiber Pad | High Cut', de: 'Mikrofaser-Pad | Starker Abtrag' } },
  { id: 'cw-pp-125-os', dir: 'Polisaj Pedleri/cw-pp-os', category: 'polisaj-pedleri', size: '125mm',
    images: ['cw-pp-125-os-packshot_result.webp', 'pads_u1.webp', 'pads_u2.webp', 'cw-pp-125-os-a1_result.webp', 'cw-pp-125-os-a2_result.webp'],
    posterFile: 'cw-pp-125-os-a1_result.webp',
    name: { tr: 'Tek Adım Polisaj Pedi', en: 'One-Step Polishing Pad', de: 'One-Step-Polierpad' },
    tagline: { tr: 'Performans Pedi | Orta-Yumuşak', en: 'Performance Pad | Medium-Soft', de: 'Performance-Pad | Mittel-Weich' } },
  { id: 'cw-pp-125-soft', dir: 'Polisaj Pedleri/cw-pp-soft', category: 'polisaj-pedleri', size: '125mm',
    images: ['cw-pp-125-soft-packshot_result.webp', 'pads_u1.webp', 'pads_u2.webp', 'cw-pp-125-soft-a1_result.webp', 'cw-pp-125-soft-a2_result.webp'],
    posterFile: 'cw-pp-125-soft-a1_result.webp',
    name: { tr: 'Yumuşak Polisaj Pedi', en: 'Soft Finishing Pad', de: 'Soft-Finishing-Pad' },
    tagline: { tr: 'Performans Pedi | Yumuşak', en: 'Performance Pad | Soft', de: 'Performance-Pad | Weich' } },
  { id: 'cw-pp-30-soft', dir: 'Polisaj Pedleri/cw-pp-soft', category: 'polisaj-pedleri', size: '30mm',
    images: ['chemicalworkz-fine-finishing-performance-pad-30mm-schwarz.webp'],
    name: { tr: 'Yumuşak Polisaj Pedi', en: 'Soft Finishing Pad', de: 'Soft-Finishing-Pad' },
    tagline: { tr: 'Performans Pedi | Yumuşak', en: 'Performance Pad | Soft', de: 'Performance-Pad | Weich' } },
  { id: 'cw-pp-50-soft', dir: 'Polisaj Pedleri/cw-pp-soft', category: 'polisaj-pedleri', size: '50mm',
    images: ['chemicalworkz-fine-finishing-performance-pad-50mm-schwarz.webp'],
    name: { tr: 'Yumuşak Polisaj Pedi', en: 'Soft Finishing Pad', de: 'Soft-Finishing-Pad' },
    tagline: { tr: 'Performans Pedi | Yumuşak', en: 'Performance Pad | Soft', de: 'Performance-Pad | Weich' } },
  { id: 'cw-pp-75-soft', dir: 'Polisaj Pedleri/cw-pp-soft', category: 'polisaj-pedleri', size: '75mm',
    images: ['chemicalworkz-fine-finishing-performance-pad-75mm-schwarz.webp'],
    name: { tr: 'Yumuşak Polisaj Pedi', en: 'Soft Finishing Pad', de: 'Soft-Finishing-Pad' },
    tagline: { tr: 'Performans Pedi | Yumuşak', en: 'Performance Pad | Soft', de: 'Performance-Pad | Weich' } },
  { id: 'cw-pp-125-wool', dir: 'Polisaj Pedleri/cw-pp-wool', category: 'polisaj-pedleri', size: '125mm',
    images: ['cw-pp-125-wool-packshot_result.webp', 'cw-pp-125-wool-a1_result.webp', 'cw-pp-125-wool-a2_result.webp'],
    posterFile: 'cw-pp-125-wool-a1_result.webp',
    name: { tr: 'Yün Polisaj Pedi', en: 'Wool Cutting Pad', de: 'Woll-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Doğal Yün', en: 'Performance Pad | Natural Wool', de: 'Performance-Pad | Naturwolle' } },
  { id: 'cw-pp-50-wool', dir: 'Polisaj Pedleri/cw-pp-wool', category: 'polisaj-pedleri', size: '50mm',
    images: ['chemicalworkz-wool-cutting-perfomance-pad-50mm.webp'],
    name: { tr: 'Yün Polisaj Pedi', en: 'Wool Cutting Pad', de: 'Woll-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Doğal Yün', en: 'Performance Pad | Natural Wool', de: 'Performance-Pad | Naturwolle' } },
  { id: 'cw-pp-75-wool', dir: 'Polisaj Pedleri/cw-pp-wool', category: 'polisaj-pedleri', size: '75mm',
    images: ['chemicalworkz-wool-cutting-perfomance-pad-75mm.webp'],
    name: { tr: 'Yün Polisaj Pedi', en: 'Wool Cutting Pad', de: 'Woll-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Doğal Yün', en: 'Performance Pad | Natural Wool', de: 'Performance-Pad | Naturwolle' } },
  // New pad type this catalog refresh — a felt (not foam) pad specifically for glass.
  { id: 'cw-pp-75-gp', dir: 'Polisaj Pedleri/cw-pp-75-gp', category: 'polisaj-pedleri', size: '75mm',
    images: ['chemicalworkz-glass-felt-perfomance-pad-75mm.webp', '6830214b7ec0959e854f9dc9_cw-pp-gp_01.webp', '6830215243bd72bf98ceea29_cw-pp-gp_02.webp'],
    posterFile: '6830214b7ec0959e854f9dc9_cw-pp-gp_01.webp',
    name: { tr: 'Cam Performans Pedi', en: 'Glass Performance Pad', de: 'Glas-Performance-Pad' },
    tagline: { tr: 'Yüksek Kaliteli Keçe | Aşındırıcı', en: 'High-Quality Felt | Abrasive', de: 'Hochwertiger Filz | Abrasiv' } },
  { id: 'cw-db-ws-16', dir: 'Fırçalar/cw-db-ws-16', category: 'fircalar', size: '16mm',
    name: { tr: 'Yumuşak Detay Fırçası', en: 'Soft Detailing Brush', de: 'Weiche Detailing-Bürste' },
    tagline: { tr: 'Detay Fırçası | Süper Yumuşak', en: 'Detailing Brush | Super Soft', de: 'Detailing-Bürste | Super Weich' } },
  { id: 'cw-db-ws-20', dir: 'Fırçalar/cw-db-ws-20', category: 'fircalar', size: '20mm',
    name: { tr: 'Yumuşak Detay Fırçası', en: 'Soft Detailing Brush', de: 'Weiche Detailing-Bürste' },
    tagline: { tr: 'Detay Fırçası | Süper Yumuşak', en: 'Detailing Brush | Super Soft', de: 'Detailing-Bürste | Super Weich' } },
  { id: 'cw-db-ws-24', dir: 'Fırçalar/cw-db-ws-24', category: 'fircalar', size: '24mm',
    name: { tr: 'Yumuşak Detay Fırçası', en: 'Soft Detailing Brush', de: 'Weiche Detailing-Bürste' },
    tagline: { tr: 'Detay Fırçası | Süper Yumuşak', en: 'Detailing Brush | Super Soft', de: 'Detailing-Bürste | Super Weich' } },
  { id: 'cw-db-us', dir: 'Fırçalar/cw-db-us', category: 'fircalar', size: '20mm',
    name: { tr: 'Ultra Yumuşak Detay Fırçası', en: 'Ultra Soft Detailing Brush', de: 'Ultra-Weiche Detailing-Bürste' },
    tagline: { tr: 'Detay Fırçası | Ultra Yumuşak', en: 'Detailing Brush | Ultra Soft', de: 'Detailing-Bürste | Ultra Weich' } },
  { id: 'cw-db-bb-16', dir: 'Fırçalar/cw-db-bb-16', category: 'fircalar', size: '16mm',
    name: { tr: 'Siyah Detay Fırçası', en: 'Black Detailing Brush', de: 'Schwarze Detailing-Bürste' },
    tagline: { tr: 'Detay Fırçası | Yumuşak', en: 'Detailing Brush | Soft', de: 'Detailing-Bürste | Weich' } },
  { id: 'cw-db-bb-20', dir: 'Fırçalar/cw-db-bb-20', category: 'fircalar', size: '20mm',
    name: { tr: 'Siyah Detay Fırçası', en: 'Black Detailing Brush', de: 'Schwarze Detailing-Bürste' },
    tagline: { tr: 'Detay Fırçası | Yumuşak', en: 'Detailing Brush | Soft', de: 'Detailing-Bürste | Weich' } },
  { id: 'cw-db-bb-24', dir: 'Fırçalar/cw-db-bb-24', category: 'fircalar', size: '24mm',
    name: { tr: 'Siyah Detay Fırçası', en: 'Black Detailing Brush', de: 'Schwarze Detailing-Bürste' },
    tagline: { tr: 'Detay Fırçası | Yumuşak', en: 'Detailing Brush | Soft', de: 'Detailing-Bürste | Weich' } },
  { id: 'cw-usd-purple', dir: 'Fırçalar/cw-usd-purple', category: 'fircalar', color: 'Mor',
    name: { tr: "Ultra Yumuşak 2'li", en: 'Ultra Soft 2-Piece Set', de: 'Ultra-Weiches 2er-Set' },
    tagline: { tr: 'Detay Fırçası Seti | Mor', en: 'Detailing Brush Set | Purple', de: 'Detailing-Bürsten-Set | Lila' } },
  { id: 'cw-usd-turquoise', dir: 'Fırçalar/cw-usd-turquoise', category: 'fircalar', color: 'Turkuaz',
    name: { tr: "Ultra Yumuşak 2'li", en: 'Ultra Soft 2-Piece Set', de: 'Ultra-Weiches 2er-Set' },
    tagline: { tr: 'Detay Fırçası Seti | Turkuaz', en: 'Detailing Brush Set | Turquoise', de: 'Detailing-Bürsten-Set | Türkis' } },
  { id: 'cw-tdb', dir: 'Fırçalar/cw-tdb', category: 'fircalar',
    name: { tr: 'Lastik Parlatıcı Fırça', en: 'Tire Dressing Brush', de: 'Reifenglanz-Bürste' },
    tagline: { tr: 'Lastik Fırçası | Yüksek kaliteli | Kimyasal Maddelere Dayanıklı', en: 'Tire Brush | High Quality | Chemical Resistant', de: 'Reifenbürste | Hohe Qualität | Chemikalienbeständig' } },
  { id: 'cw-sb-L-b', dir: 'Sprey Şişeleri/cw-sb-L-b', category: 'sprey-siseleri', color: 'Siyah',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: '360° Tetikli Sprey Başlığı | 5 Renk Seçeneği', en: '360° Trigger Spray Head | 5 Color Options', de: '360°-Sprühkopf mit Abzug | 5 Farboptionen' } },
  { id: 'cw-sb-L-bL', dir: 'Sprey Şişeleri/cw-sb-L-bL', category: 'sprey-siseleri', color: 'Mavi',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: '360° Tetikli Sprey Başlığı | 5 Renk Seçeneği', en: '360° Trigger Spray Head | 5 Color Options', de: '360°-Sprühkopf mit Abzug | 5 Farboptionen' } },
  { id: 'cw-sb-L-gr', dir: 'Sprey Şişeleri/cw-sb-L-gr', category: 'sprey-siseleri', color: 'Yeşil',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: '360° Tetikli Sprey Başlığı | 5 Renk Seçeneği', en: '360° Trigger Spray Head | 5 Color Options', de: '360°-Sprühkopf mit Abzug | 5 Farboptionen' } },
  { id: 'cw-sb-L-re', dir: 'Sprey Şişeleri/cw-sb-L-re', category: 'sprey-siseleri', color: 'Kırmızı',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: '360° Tetikli Sprey Başlığı | 5 Renk Seçeneği', en: '360° Trigger Spray Head | 5 Color Options', de: '360°-Sprühkopf mit Abzug | 5 Farboptionen' } },
  { id: 'cw-sb-L-ye', dir: 'Sprey Şişeleri/cw-sb-L-ye', category: 'sprey-siseleri', color: 'Sarı',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: '360° Tetikli Sprey Başlığı | 5 Renk Seçeneği', en: '360° Trigger Spray Head | 5 Color Options', de: '360°-Sprühkopf mit Abzug | 5 Farboptionen' } },
  { id: 'cw-rps', dir: 'Sprey Şişeleri/cw-rps', category: 'sprey-siseleri',
    name: { tr: 'Doldurulabilir Basınçlı Sprey', en: 'Refillable Pressure Sprayer', de: 'Nachfüllbarer Drucksprüher' },
    tagline: { tr: 'Basınçlı Sprey Şişesi | 5-8 bar', en: 'Pressure Sprayer | 5-8 bar', de: 'Drucksprüher | 5-8 bar' } },
  { id: 'cw-cs', dir: 'Yardımcılar/cw-cs', category: 'yardimcilar',
    name: { tr: 'Sihirli Kil Süngeri', en: 'Magic Clay Sponge', de: 'Magic-Clay-Schwamm' },
    tagline: { tr: 'Temizleme Kili | Polimer Teknolojisi | 11x7x4.5cm', en: 'Cleaning Clay | Polymer Technology | 11x7x4.5cm', de: 'Reinigungsknete | Polymer-Technologie | 11x7x4,5cm' } },
  { id: 'cw-amm-gray', dir: 'Yardımcılar/cw-amm-gray', category: 'yardimcilar',
    name: { tr: 'Mikrofiber Eldiven', en: 'Microfiber Wash Mitt', de: 'Mikrofaser-Waschhandschuh' },
    tagline: { tr: 'Çok Amaçlı Mikrofiber Eldiven', en: 'Multi-Purpose Microfiber Mitt', de: 'Vielseitiger Mikrofaser-Waschhandschuh' } },
  { id: 'cw-pc-s', dir: 'Yardımcılar/cw-pc-s', category: 'yardimcilar',
    name: { tr: 'Parlatma Konileri', en: 'Polishing Cones', de: 'Polierkegel' },
    tagline: { tr: 'Polisaj Koni Seti | Dar alanlar ve detaylı uygulamalar için', en: 'Polishing Cone Set | For tight spaces and detailed work', de: 'Polierkegel-Set | Für enge Stellen und Detailarbeiten' } },
  { id: 'cw-hg', dir: 'Yardımcılar/cw-hg', category: 'yardimcilar',
    name: { tr: 'Kablo Kaydırıcı', en: 'Hose Guide', de: 'Schlauchführung' },
    tagline: { tr: 'Yüksek Kaliteli Plastik | 10x15cm', en: 'High-Quality Plastic | 10x15cm', de: 'Hochwertiger Kunststoff | 10x15cm' } },
  { id: 'cw-mw', dir: 'Yardımcılar/cw-mw', category: 'yardimcilar',
    name: { tr: 'Alet Takımı', en: 'Tool Kit', de: 'Werkzeugset' },
    tagline: { tr: 'Montaj Aparatı Seti | 12 parça', en: 'Assembly Tool Set | 12 pieces', de: 'Montagewerkzeug-Set | 12 Teile' } },
  { id: 'cw-ms', dir: 'Bezler/cw-ms', category: 'bezler',
    name: { tr: 'Manyetik Havlu', en: 'Magnetic Drying Towel', de: 'Magnet-Trockentuch' },
    tagline: { tr: 'Manyetik Kurulama Havlusu', en: 'Magnetic Drying Towel', de: 'Magnetisches Trockentuch' } },
  { id: 'cw-pss', dir: 'Yardımcılar/cw-pss', category: 'yardimcilar',
    name: { tr: 'Boya Rötuş Çubukları', en: 'Paint Touch-Up Sticks', de: 'Lack-Ausbesserstifte' },
    tagline: { tr: 'Boya Uygulama Çubukları | Mikrofiber | 20 adet', en: 'Paint Application Sticks | Microfiber | 20 pieces', de: 'Lack-Auftragsstäbchen | Mikrofaser | 20 Stück' } },
  { id: 'cw-ga', dir: 'Keçeler/cw-ga', category: 'keceler',
    name: { tr: 'Cam Keçe', en: 'Glass Felt Applicator', de: 'Glas-Filzapplikator' },
    tagline: { tr: 'Cam Uygulayıcı | Cam parlatma için ideal | 6x4x5cm', en: 'Glass Applicator | Ideal for glass polishing | 6x4x5cm', de: 'Glas-Applikator | Ideal zum Glaspolieren | 6x4x5cm' } },
  // Moved from "Uygulayıcılar" to "Keçeler" in the 2026-08 catalog refresh (both folder and
  // the Excel's own KATEGORİ column agree); name corrected too — the old "El Yıkama
  // Aplikatörü" (Hand WASH Applicator) was a misread, the Excel's ÜRÜN ADI is "Hand Wax
  // Applicator" (a wax, not wash, applicator — consistent with it being a felt/Keçeler item).
  { id: 'cw-hwa', dir: 'Keçeler/cw-hwa', category: 'keceler',
    name: { tr: 'El Cila Aplikatörü', en: 'Hand Wax Applicator', de: 'Hand-Wachsapplikator' },
    tagline: { tr: 'Uygulama Aparatı', en: 'Application Tool', de: 'Auftragswerkzeug' } },
  // Renamed from cw-cfgt-1pcs; Excel gives it a real product name instead of the previously
  // inferred "Cam Mikrofiber Bezi".
  { id: 'cw-cfgt-1pc', dir: 'Bezler/cw-cfgt-1pc', category: 'bezler',
    name: { tr: 'KarbonFiber Cam Bezi', en: 'Carbon Fiber Glass Cloth', de: 'Karbonfaser-Glastuch' },
    tagline: { tr: 'Karbon Mikrofiber | 40x40cm', en: 'Carbon Microfiber | 40x40cm', de: 'Karbon-Mikrofaser | 40x40cm' } },
  // New this catalog refresh — real Excel rows + photographed folders.
  { id: 'cw-pbk', dir: 'Yardımcılar/cw-pbk', category: 'yardimcilar',
    name: { tr: 'Ped Fırçası & Bıçağı', en: 'Pad Brush & Knife', de: 'Pad-Bürste & Messer' },
    tagline: { tr: 'Polisaj pedleri için ideal', en: 'Ideal for polishing pads', de: 'Ideal für Polierpads' } },
  { id: 'cw-fe', dir: 'Yardımcılar/cw-fe', category: 'yardimcilar',
    name: { tr: 'Folyo Sökme Diski', en: 'Foil Removal Disc', de: 'Folienentfernungsscheibe' },
    tagline: { tr: 'Folyo ve yapışkan kalıntıları için ideal', en: 'Ideal for foil and adhesive residue', de: 'Ideal für Folien- und Kleberückstände' } },
  { id: 'cw-dss-10', dir: 'Yardımcılar/cw-dss-10', category: 'yardimcilar',
    name: { tr: 'Detay Temizlik Çubukları', en: 'Detailing Cleaning Sticks', de: 'Detailing-Reinigungsstäbchen' },
    tagline: { tr: 'Temizlik ve Bakım Çubukları | Köpük veya mikrofiber uçlu', en: 'Cleaning & Care Sticks | Foam or microfiber tip', de: 'Reinigungs- und Pflegestäbchen | Schaum- oder Mikrofaserspitze' } },
  { id: 'cw-icpe-1', dir: 'Yardımcılar/cw-icpe-1', category: 'yardimcilar',
    name: { tr: 'İç Mekan Temizlik Pedi', en: 'Interior Cleaning Pad', de: 'Innenraum-Reinigungspad' },
    tagline: { tr: 'Temizlik Pedi | İç mekanlar için', en: 'Cleaning Pad | For interiors', de: 'Reinigungspad | Für Innenräume' } },
  { id: 'cw-da12', dir: 'Polisaj Makinesi/cw-da12', category: 'polisaj-makinesi',
    name: { tr: 'DA12 Polisaj Makinesi', en: 'DA12 Polisher', de: 'DA12 Poliermaschine' },
    tagline: { tr: 'Dual Action Polisaj', en: 'Dual Action Polishing', de: 'Dual-Action-Polieren' } },
  { id: 'cw-da9-pro-max', dir: 'Polisaj Makinesi/cw-da9-pro-max', category: 'polisaj-makinesi',
    name: { tr: 'DA9 Pro Max Polisaj Makinesi', en: 'DA9 Pro Max Polisher', de: 'DA9 Pro Max Poliermaschine' },
    tagline: { tr: 'Dual Action Polisaj', en: 'Dual Action Polishing', de: 'Dual-Action-Polieren' } },
  // Dropped in the 2026-08 catalog refresh — no folder anywhere in the reorganized
  // .claude/product-list/ tree AND no row in the new Excel (vision-detail-ürün-listesi.xlsx):
  // cw-ac250-10pcs, cw-cfgt-5pcs, cw-ipw-1pcs, cw-ipw-5pcs, cw-iup-5pcs, cw-tcb, cw-utb-L,
  // cw-dryer, cw-rotary, cw-pcg, cw-ma, cw-swb-L(+blue/green/red), cw-cL, cw-cm, cw-hL.
  // cw-evo-mini-es also has a folder now but it's empty (no photos) and has no Excel row —
  // left out rather than guessing at a product with zero source material.
];

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function thumbName(file) {
  return file.replace(/(\.\w+)$/, '-thumb$1');
}

// Classifies a SKU folder's files into (primary/card image, poster/action shot, full gallery).
function classify(files) {
  const packshots = files.filter((f) => /packshot/i.test(f));
  const actionShots = files.filter((f) => /-a\d/i.test(f) && !packshots.includes(f));
  const rest = files.filter((f) => !packshots.includes(f) && !actionShots.includes(f));
  const primary = packshots[0] || files[0];
  const poster = actionShots[0] || packshots.find((f) => f !== primary) || primary;
  const gallery = [primary, ...rest, ...actionShots.filter((f) => f !== poster)];
  if (!gallery.includes(poster)) gallery.push(poster);
  return { primary, poster, gallery: [...new Set(gallery)] };
}

async function optimizeOne(srcPath, outPath, maxWidth) {
  const before = fs.statSync(srcPath).size;
  const img = sharp(srcPath);
  const meta = await img.metadata();
  const pipeline = meta.width > maxWidth ? img.resize({ width: maxWidth }) : img;
  await pipeline.webp({ quality: QUALITY }).toFile(outPath);
  return { before, after: fs.statSync(outPath).size };
}

async function main() {
  const products = [];
  let totalBefore = 0;
  let totalAfter = 0;
  const skipped = [];

  for (const seed of SEEDS) {
    const srcDir = path.join(SRC_ROOT, seed.dir);
    if (!fs.existsSync(srcDir)) {
      skipped.push(`${seed.id}: source dir missing (${seed.dir})`);
      continue;
    }
    const files = fs.readdirSync(srcDir).filter((f) => /\.webp$/i.test(f));

    // Several Polisaj Pedleri SKUs now share ONE source folder across size variants (the
    // 30/50/75mm color-coded packshots live alongside the original 125mm set) — classify()'s
    // packshot/action-shot heuristic can't tell which files belong to which exact SKU in that
    // case, so `seed.images` (+ optional `seed.posterFile`) lets a seed pin its own explicit
    // file list instead of auto-classifying the whole folder.
    let primary, poster, gallery;
    if (seed.images) {
      const missing = seed.images.filter((f) => !files.includes(f));
      if (missing.length) {
        skipped.push(`${seed.id}: listed image(s) missing in ${seed.dir}: ${missing.join(', ')}`);
        continue;
      }
      gallery = seed.images;
      primary = gallery[0];
      poster = seed.posterFile || null;
    } else {
      if (files.length === 0) {
        skipped.push(`${seed.id}: no webp files in ${seed.dir}`);
        continue;
      }
      ({ primary, poster, gallery } = classify(files));
    }

    const outDir = path.join(OUT_IMG_ROOT, seed.id);
    fs.mkdirSync(outDir, { recursive: true });

    for (const file of gallery) {
      const isCard = file === primary;
      const { before, after } = await optimizeOne(
        path.join(srcDir, file),
        path.join(outDir, file),
        isCard ? CARD_MAX_WIDTH : DETAIL_MAX_WIDTH
      );
      totalBefore += before;
      totalAfter += after;
      // See THUMB_MAX_WIDTH's comment — a real small file for the thumbnail rail, not just
      // a `sizes` hint next/image can't act on under `unoptimized: true`.
      const { after: thumbAfter } = await optimizeOne(path.join(srcDir, file), path.join(outDir, thumbName(file)), THUMB_MAX_WIDTH);
      totalAfter += thumbAfter;
    }

    const category = catLabel(seed.category);
    const name = seed.name;
    const tagline = seed.tagline;
    // Real Excel copy (column J) where available; the 3 SKUs with no Excel description
    // text (cw-da9-pro-max, cw-da12, cw-hwa) fall back to a templated sentence.
    const description = DESCRIPTION_DATA[seed.id] ?? {
      tr: `${name.tr}, ${category.tr.toLocaleLowerCase('tr')} kategorisinde ${tagline.tr.toLocaleLowerCase('tr')}. ChemicalWorkz'ün Alman mühendisliğiyle geliştirilen bu ürün, profesyonel detailing ihtiyaçları için tasarlandı.`,
      en: `${name.en} is a ${tagline.en.toLowerCase()} product in our ${category.en.toLowerCase()} range. Engineered with ChemicalWorkz's German engineering standards, it's built for professional detailing needs.`,
      // German capitalizes every noun regardless of sentence position — unlike the TR/EN
      // templates above, category/tagline are NOT lowercased here.
      de: `${name.de} ist ein Produkt der Kategorie ${category.de} mit ${tagline.de}. Entwickelt nach den deutschen Ingenieursstandards von ChemicalWorkz, für den professionellen Detailing-Einsatz.`,
    };

    products.push({
      id: seed.id,
      name,
      category: seed.category,
      tagline,
      description,
      color: seed.color ? COLORS[seed.color] : null,
      size: seed.size || null,
      isNew: false,
      inStock: !OUT_OF_STOCK.has(seed.id),
      image: `/images/products/${seed.id}/${primary}`,
      gallery: gallery.map((f) => `/images/products/${seed.id}/${f}`),
      galleryThumbs: gallery.map((f) => `/images/products/${seed.id}/${thumbName(f)}`),
      posterImages: (POSTER_DATA[seed.id]?.images ?? []).map((f) => `/images/products/${seed.id}/${f}`),
      posterDescription: POSTER_DATA[seed.id]?.description ?? null,
      video: VIDEO_DATA[seed.id] ?? null,
    });

    // Poster image files aren't necessarily a subset of `gallery` (classify() only pulls
    // "-a" files it happens to find; POSTER_DATA is authoritative per the Excel and can name
    // files gallery skipped) — optimize any not already written above.
    const posterFiles = POSTER_DATA[seed.id]?.images ?? [];
    for (const file of posterFiles) {
      const outPath = path.join(outDir, file);
      if (fs.existsSync(outPath)) continue;
      const { before, after } = await optimizeOne(path.join(srcDir, file), outPath, DETAIL_MAX_WIDTH);
      totalBefore += before;
      totalAfter += after;
    }
  }

  const fileContent = `// Auto-generated by scripts/build-products.mjs from .claude/product-list/ (real product
// photos) + .claude/product-list.xlsx (product names/specs, reconciled against the actual
// photographed SKUs — Excel rows with no matching photos were excluded, and photographed
// SKUs with no Excel row got a reasonable inferred TR name — see the SEEDS array in that
// script for exactly which). Re-run that script if product-list/ or the Excel changes.

export const PRODUCT_CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

export const products = ${JSON.stringify(products, null, 2)};
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'products.js'), fileContent);

  console.log(`\n${products.length} products written to src/data/products.js`);
  console.log(`Categories: ${CATEGORIES.length}`);
  console.log(`Image payload: ${fmtKB(totalBefore)} -> ${fmtKB(totalAfter)}`);
  if (skipped.length) {
    console.log(`\nSkipped (${skipped.length}):`);
    skipped.forEach((s) => console.log(' - ' + s));
  }

  // Verify every referenced image path actually exists on disk.
  let missing = 0;
  for (const p of products) {
    for (const imgPath of [p.image, p.poster, ...p.gallery].filter(Boolean)) {
      const fsPath = path.join(ROOT, 'public', imgPath.replace(/^\//, ''));
      if (!fs.existsSync(fsPath)) {
        console.log(`MISSING FILE: ${p.id} -> ${imgPath}`);
        missing++;
      }
    }
  }
  console.log(missing === 0 ? '\nAll image paths verified OK.' : `\n${missing} missing image paths!`);

  // NOTE: the source video (.claude/product-list/Bezler/cw-ms/cw-ms-a1.mp4) was originally
  // copied as-is here, but that raw file was an unoptimized 64.5MB/11.5Mbps master — it's
  // been properly re-encoded once already (H.264 crf 26, ~11MB) directly into
  // public/videos/cw-ms-a1.mp4. Deliberately NOT re-copying it on every re-run of this
  // script, which would silently clobber that fix back to the raw 64.5MB file.

  const catCounts = {};
  products.forEach((p) => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
  console.log('\nProducts per category:');
  Object.entries(catCounts).forEach(([slug, n]) => console.log(`  ${slug}: ${n}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
