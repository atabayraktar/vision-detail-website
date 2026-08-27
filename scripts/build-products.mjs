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
const QUALITY = 80;

// Only these 10 SKUs actually had a value in Excel's ÜRÜN POSTERİ GÖRSELİ column — every
// other row (including all 5 spray bottle colors) left it empty, meaning "no D2 poster
// section for this product," not "figure one out yourself." classify() below still finds
// an action-shot candidate for every SKU that has one (folders often contain "-a*" files
// regardless of what Excel specified), but that candidate is only used as the actual
// `poster` field for ids in this set — see the products.push() call.
const POSTER_SKUS = new Set([
  'cw-mag',
  'cw-evo-mini',
  'cw-evo-mini-pro',
  'cw-pp-125-heavy',
  'cw-pp-125-medium',
  'cw-pp-125-mf',
  'cw-pp-125-os',
  'cw-pp-125-soft',
  'cw-pp-125-wool',
  'cw-ga',
]);

const CATEGORIES = [
  { slug: 'detay-fircalari', label: { tr: 'Detay Fırçaları', en: 'Detailing Brushes', de: 'Detailing-Bürsten' } },
  { slug: 'keceler', label: { tr: 'Keçeler', en: 'Felt Pads', de: 'Filzpads' } },
  { slug: 'kontrol-isigi', label: { tr: 'Kontrol Işığı', en: 'Inspection Light', de: 'Prüflicht' } },
  { slug: 'kurutucu', label: { tr: 'Kurutucu', en: 'Blower Dryer', de: 'Trockner' } },
  { slug: 'manyetik-bez', label: { tr: 'Manyetik Bez', en: 'Magnetic Cloth', de: 'Magnettuch' } },
  { slug: 'mikrofiber-bezler', label: { tr: 'Mikrofiber Bezler', en: 'Microfiber Cloths', de: 'Mikrofasertücher' } },
  { slug: 'sprey-siseleri', label: { tr: 'Sprey Şişeleri', en: 'Spray Bottles', de: 'Sprühflaschen' } },
  { slug: 'uygulayicilar', label: { tr: 'Uygulayıcılar', en: 'Applicators', de: 'Applikatoren' } },
  { slug: 'hava-tabancasi', label: { tr: 'Hava Tabancası', en: 'Air Gun', de: 'Druckluftpistole' } },
  { slug: 'polisaj-makinesi', label: { tr: 'Polisaj Makinesi', en: 'Polishers', de: 'Poliermaschinen' } },
  { slug: 'polisaj-pedleri', label: { tr: 'Polisaj Pedleri', en: 'Polishing Pads', de: 'Polierpads' } },
  { slug: 'yardimcilar', label: { tr: 'Yardımcılar', en: 'Accessories', de: 'Zubehör' } },
];
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
    tagline: { tr: 'Hibrit Polisaj Makinesi', en: 'Hybrid Polisher', de: 'Hybrid-Poliermaschine' } },
  { id: 'cw-evo-mini-pro', dir: 'Polisaj Makinesi/cw-evo-mini-pro', category: 'polisaj-makinesi',
    name: { tr: 'EVO Mini Pro', en: 'EVO Mini Pro', de: 'EVO Mini Pro' },
    tagline: { tr: 'Hibrit Polisaj Makinesi', en: 'Hybrid Polisher', de: 'Hybrid-Poliermaschine' } },
  { id: 'cw-pp-125-heavy', dir: 'Polisaj Pedleri/cw-pp-125-heavy', category: 'polisaj-pedleri', size: '125mm',
    name: { tr: 'Ağır Polisaj Pedi', en: 'Heavy Cutting Pad', de: 'Heavy-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Ağır Kesim', en: 'Performance Pad | Heavy Cutting', de: 'Performance-Pad | Starker Schnitt' } },
  { id: 'cw-pp-125-medium', dir: 'Polisaj Pedleri/cw-pp-125-medium', category: 'polisaj-pedleri', size: '125mm',
    name: { tr: 'Orta Polisaj Pedi', en: 'Medium Cutting Pad', de: 'Medium-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Orta-Zor', en: 'Performance Pad | Medium-Heavy', de: 'Performance-Pad | Mittel-Stark' } },
  { id: 'cw-pp-125-mf', dir: 'Polisaj Pedleri/cw-pp-125-mf', category: 'polisaj-pedleri', size: '125mm',
    name: { tr: 'MikroFiber Polisaj Pedi', en: 'Microfiber Polishing Pad', de: 'Mikrofaser-Polierpad' },
    tagline: { tr: 'Mikrofiber Ped | Yüksek Aşındırıcı', en: 'Microfiber Pad | High Cut', de: 'Mikrofaser-Pad | Starker Abtrag' } },
  { id: 'cw-pp-125-os', dir: 'Polisaj Pedleri/cw-pp-125-os', category: 'polisaj-pedleri', size: '125mm',
    name: { tr: 'Tek Adım Polisaj Pedi', en: 'One-Step Polishing Pad', de: 'One-Step-Polierpad' },
    tagline: { tr: 'Performans Pedi | Orta-Yumuşak', en: 'Performance Pad | Medium-Soft', de: 'Performance-Pad | Mittel-Weich' } },
  { id: 'cw-pp-125-soft', dir: 'Polisaj Pedleri/cw-pp-125-soft', category: 'polisaj-pedleri', size: '125mm',
    name: { tr: 'Yumuşak Polisaj Pedi', en: 'Soft Finishing Pad', de: 'Soft-Finishing-Pad' },
    tagline: { tr: 'Performans Pedi | Yumuşak', en: 'Performance Pad | Soft', de: 'Performance-Pad | Weich' } },
  { id: 'cw-pp-125-wool', dir: 'Polisaj Pedleri/cw-pp-125-wool', category: 'polisaj-pedleri', size: '125mm',
    name: { tr: 'Yün Polisaj Pedi', en: 'Wool Cutting Pad', de: 'Woll-Cutting-Pad' },
    tagline: { tr: 'Performans Pedi | Doğal Yün', en: 'Performance Pad | Natural Wool', de: 'Performance-Pad | Naturwolle' } },
  { id: 'cw-db-ws-16', dir: 'Fırçalar/cw-db-ws-16', category: 'detay-fircalari', size: '16mm',
    name: { tr: 'Yumuşak Detay Fırçası', en: 'Soft Detailing Brush', de: 'Weiche Detailing-Bürste' },
    tagline: { tr: 'Süper Yumuşak', en: 'Super Soft', de: 'Super Weich' } },
  { id: 'cw-db-ws-20', dir: 'Fırçalar/cw-db-ws-20', category: 'detay-fircalari', size: '20mm',
    name: { tr: 'Yumuşak Detay Fırçası', en: 'Soft Detailing Brush', de: 'Weiche Detailing-Bürste' },
    tagline: { tr: 'Süper Yumuşak', en: 'Super Soft', de: 'Super Weich' } },
  { id: 'cw-db-ws-24', dir: 'Fırçalar/cw-db-ws-24', category: 'detay-fircalari', size: '24mm',
    name: { tr: 'Yumuşak Detay Fırçası', en: 'Soft Detailing Brush', de: 'Weiche Detailing-Bürste' },
    tagline: { tr: 'Süper Yumuşak', en: 'Super Soft', de: 'Super Weich' } },
  { id: 'cw-db-us', dir: 'Fırçalar/cw-db-us', category: 'detay-fircalari', size: '20mm',
    name: { tr: 'Ultra Yumuşak Detay Fırçası', en: 'Ultra Soft Detailing Brush', de: 'Ultra-Weiche Detailing-Bürste' },
    tagline: { tr: 'Ultra Yumuşak', en: 'Ultra Soft', de: 'Ultra Weich' } },
  { id: 'cw-db-bb-16', dir: 'Fırçalar/cw-db-bb-16', category: 'detay-fircalari', size: '16mm',
    name: { tr: 'Siyah Detay Fırçası', en: 'Black Detailing Brush', de: 'Schwarze Detailing-Bürste' },
    tagline: { tr: 'Yumuşak', en: 'Soft', de: 'Weich' } },
  { id: 'cw-db-bb-20', dir: 'Fırçalar/cw-db-bb-20', category: 'detay-fircalari', size: '20mm',
    name: { tr: 'Siyah Detay Fırçası', en: 'Black Detailing Brush', de: 'Schwarze Detailing-Bürste' },
    tagline: { tr: 'Yumuşak', en: 'Soft', de: 'Weich' } },
  { id: 'cw-db-bb-24', dir: 'Fırçalar/cw-db-bb-24', category: 'detay-fircalari', size: '24mm',
    name: { tr: 'Siyah Detay Fırçası', en: 'Black Detailing Brush', de: 'Schwarze Detailing-Bürste' },
    tagline: { tr: 'Yumuşak', en: 'Soft', de: 'Weich' } },
  { id: 'cw-usd-purple', dir: 'Fırçalar/cw-usd-purple', category: 'detay-fircalari', color: 'Mor',
    name: { tr: "Ultra Yumuşak 2'li", en: 'Ultra Soft 2-Piece Set', de: 'Ultra-Weiches 2er-Set' },
    tagline: { tr: 'Detay Fırçası Seti | Mor', en: 'Detailing Brush Set | Purple', de: 'Detailing-Bürsten-Set | Lila' } },
  { id: 'cw-usd-turquoise', dir: 'Fırçalar/cw-usd-turquoise', category: 'detay-fircalari', color: 'Turkuaz',
    name: { tr: "Ultra Yumuşak 2'li", en: 'Ultra Soft 2-Piece Set', de: 'Ultra-Weiches 2er-Set' },
    tagline: { tr: 'Detay Fırçası Seti | Turkuaz', en: 'Detailing Brush Set | Turquoise', de: 'Detailing-Bürsten-Set | Türkis' } },
  { id: 'cw-tdb', dir: 'Fırçalar/cw-tdb', category: 'detay-fircalari',
    name: { tr: 'Lastik Parlatıcı Fırça', en: 'Tire Dressing Brush', de: 'Reifenglanz-Bürste' },
    tagline: { tr: 'Kimyasal Maddelere Dayanıklı', en: 'Chemical Resistant', de: 'Chemikalienbeständig' } },
  { id: 'cw-sb-L-b', dir: 'Sprey Şişeleri/cw-sb-L-b', category: 'sprey-siseleri', color: 'Siyah',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: "360° Tetikli | 5 Renk Seçeneği", en: '360° Trigger | 5 Color Options', de: '360°-Sprühkopf | 5 Farboptionen' } },
  { id: 'cw-sb-L-bL', dir: 'Sprey Şişeleri/cw-sb-L-bL', category: 'sprey-siseleri', color: 'Mavi',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: "360° Tetikli | 5 Renk Seçeneği", en: '360° Trigger | 5 Color Options', de: '360°-Sprühkopf | 5 Farboptionen' } },
  { id: 'cw-sb-L-gr', dir: 'Sprey Şişeleri/cw-sb-L-gr', category: 'sprey-siseleri', color: 'Yeşil',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: "360° Tetikli | 5 Renk Seçeneği", en: '360° Trigger | 5 Color Options', de: '360°-Sprühkopf | 5 Farboptionen' } },
  { id: 'cw-sb-L-re', dir: 'Sprey Şişeleri/cw-sb-L-re', category: 'sprey-siseleri', color: 'Kırmızı',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: "360° Tetikli | 5 Renk Seçeneği", en: '360° Trigger | 5 Color Options', de: '360°-Sprühkopf | 5 Farboptionen' } },
  { id: 'cw-sb-L-ye', dir: 'Sprey Şişeleri/cw-sb-L-ye', category: 'sprey-siseleri', color: 'Sarı',
    name: { tr: 'Sprey Şişesi', en: 'Spray Bottle', de: 'Sprühflasche' },
    tagline: { tr: "360° Tetikli | 5 Renk Seçeneği", en: '360° Trigger | 5 Color Options', de: '360°-Sprühkopf | 5 Farboptionen' } },
  { id: 'cw-rps', dir: 'Sprey Şişeleri/cw-rps', category: 'sprey-siseleri',
    name: { tr: 'Doldurulabilir Basınçlı Sprey', en: 'Refillable Pressure Sprayer', de: 'Nachfüllbarer Drucksprüher' },
    tagline: { tr: '5-8 bar', en: '5-8 bar', de: '5-8 bar' } },
  { id: 'cw-cs', dir: 'Yardımcılar/cw-cs', category: 'yardimcilar',
    name: { tr: 'Sihirli Kil Süngeri', en: 'Magic Clay Sponge', de: 'Magic-Clay-Schwamm' },
    tagline: { tr: 'Polimer Teknolojisi | 11x7x4.5cm', en: 'Polymer Technology | 11x7x4.5cm', de: 'Polymer-Technologie | 11x7x4,5cm' } },
  { id: 'cw-amm-gray', dir: 'Yardımcılar/cw-amm-gray', category: 'yardimcilar',
    name: { tr: 'Mikrofiber Eldiven', en: 'Microfiber Wash Mitt', de: 'Mikrofaser-Waschhandschuh' },
    tagline: { tr: 'Çok Amaçlı', en: 'Multi-Purpose', de: 'Vielseitig' } },
  { id: 'cw-pc-s', dir: 'Yardımcılar/cw-pc-s', category: 'yardimcilar',
    name: { tr: 'Parlatma Konileri', en: 'Polishing Cones', de: 'Polierkegel' },
    tagline: { tr: 'Dar alanlar için', en: 'For tight spaces', de: 'Für enge Stellen' } },
  { id: 'cw-hg', dir: 'Yardımcılar/cw-hg', category: 'yardimcilar',
    name: { tr: 'Kablo Kaydırıcı', en: 'Hose Guide', de: 'Schlauchführung' },
    tagline: { tr: 'Yüksek Kaliteli Plastik | 10x15cm', en: 'High-Quality Plastic | 10x15cm', de: 'Hochwertiger Kunststoff | 10x15cm' } },
  { id: 'cw-mw', dir: 'Yardımcılar/cw-mw', category: 'yardimcilar',
    name: { tr: 'Alet Takımı', en: 'Tool Kit', de: 'Werkzeugset' },
    tagline: { tr: 'Montaj Aparatı | 12 parça', en: 'Assembly Kit | 12 pieces', de: 'Montageset | 12 Teile' } },
  { id: 'cw-ms', dir: 'Bezler/cw-ms', category: 'manyetik-bez',
    name: { tr: 'Manyetik Havlu', en: 'Magnetic Drying Towel', de: 'Magnet-Trockentuch' },
    tagline: { tr: 'Manyetik Kurulama Havlusu', en: 'Magnetic Drying Towel', de: 'Magnetisches Trockentuch' } },
  { id: 'cw-pss', dir: 'Yardımcılar/cw-pss', category: 'yardimcilar',
    name: { tr: 'Boya Rötuş Çubukları', en: 'Paint Touch-Up Sticks', de: 'Lack-Ausbesserstifte' },
    tagline: { tr: 'Mikrofiber | 20 adet', en: 'Microfiber | 20 pieces', de: 'Mikrofaser | 20 Stück' } },
  { id: 'cw-ga', dir: 'Uygulayıcılar/cw-ga', category: 'keceler',
    name: { tr: 'Cam Keçe', en: 'Glass Felt Applicator', de: 'Glas-Filzapplikator' },
    tagline: { tr: 'Cam Uygulayıcı | Cam parlatma için ideal | 6x4x5cm', en: 'Glass Applicator | Ideal for glass polishing | 6x4x5cm', de: 'Glas-Applikator | Ideal zum Glaspolieren | 6x4x5cm' } },
  // No Excel row — inferred from SKU + category context.
  { id: 'cw-ac250-10pcs', dir: 'Bezler/cw-ac250-10pcs', category: 'mikrofiber-bezler', size: "10'lu",
    name: { tr: 'Mikrofiber Kurulama Havlusu', en: 'Microfiber Drying Towel', de: 'Mikrofaser-Trockentuch' },
    tagline: { tr: "10'lu Paket", en: 'Pack of 10', de: '10er-Set' } },
  { id: 'cw-cfgt-1pcs', dir: 'Bezler/cw-cfgt-1pcs', category: 'mikrofiber-bezler', size: '1 adet',
    name: { tr: 'Cam Mikrofiber Bezi', en: 'Glass Microfiber Cloth', de: 'Glas-Mikrofasertuch' },
    tagline: { tr: '1 Adet', en: '1 Piece', de: '1 Stück' } },
  { id: 'cw-cfgt-5pcs', dir: 'Bezler/cw-cfgt-5pcs', category: 'mikrofiber-bezler', size: '5 adet',
    name: { tr: 'Cam Mikrofiber Bezi', en: 'Glass Microfiber Cloth', de: 'Glas-Mikrofasertuch' },
    tagline: { tr: '5 Adet', en: '5 Pieces', de: '5 Stück' } },
  { id: 'cw-ipw-1pcs', dir: 'Bezler/cw-ipw-1pcs', category: 'mikrofiber-bezler', size: '1 adet',
    name: { tr: 'İç Mekan Temizlik Bezi', en: 'Interior Cleaning Cloth', de: 'Innenraum-Reinigungstuch' },
    tagline: { tr: '1 Adet', en: '1 Piece', de: '1 Stück' } },
  { id: 'cw-ipw-5pcs', dir: 'Bezler/cw-ipw-5pcs', category: 'mikrofiber-bezler', size: '5 adet',
    name: { tr: 'İç Mekan Temizlik Bezi', en: 'Interior Cleaning Cloth', de: 'Innenraum-Reinigungstuch' },
    tagline: { tr: '5 Adet', en: '5 Pieces', de: '5 Stück' } },
  { id: 'cw-iup-5pcs', dir: 'Bezler/cw-iup-5pcs', category: 'mikrofiber-bezler', size: '5 adet',
    name: { tr: 'Universal Mikrofiber Bez', en: 'Universal Microfiber Cloth', de: 'Universal-Mikrofasertuch' },
    tagline: { tr: '5 Adet', en: '5 Pieces', de: '5 Stück' } },
  { id: 'cw-tcb', dir: 'Fırçalar/cw-tcb', category: 'detay-fircalari',
    name: { tr: 'Lastik Temizlik Fırçası', en: 'Tire Cleaning Brush', de: 'Reifen-Reinigungsbürste' },
    tagline: { tr: 'Dayanıklı Kıllar', en: 'Durable Bristles', de: 'Robuste Borsten' } },
  { id: 'cw-utb-L', dir: 'Fırçalar/cw-utb-L', category: 'detay-fircalari', size: 'Büyük',
    name: { tr: 'Universal Detay Fırçası', en: 'Universal Detailing Brush', de: 'Universal-Detailing-Bürste' },
    tagline: { tr: 'Büyük Boy', en: 'Large Size', de: 'Große Größe' } },
  { id: 'cw-dryer', dir: 'Kurutma Makinesi', category: 'kurutucu',
    name: { tr: 'Kurutma Makinesi', en: 'Blower Dryer', de: 'Trockner' },
    tagline: { tr: 'Yüksek Hızlı Kurutma', en: 'High-Speed Drying', de: 'Schnelltrocknung' } },
  { id: 'cw-da12', dir: 'Polisaj Makinesi/cw-da12', category: 'polisaj-makinesi',
    name: { tr: 'DA12 Polisaj Makinesi', en: 'DA12 Polisher', de: 'DA12 Poliermaschine' },
    tagline: { tr: 'Dual Action Polisaj', en: 'Dual Action Polishing', de: 'Dual-Action-Polieren' } },
  { id: 'cw-da9-pro-max', dir: 'Polisaj Makinesi/cw-da9-pro-max', category: 'polisaj-makinesi',
    name: { tr: 'DA9 Pro Max Polisaj Makinesi', en: 'DA9 Pro Max Polisher', de: 'DA9 Pro Max Poliermaschine' },
    tagline: { tr: 'Dual Action Polisaj', en: 'Dual Action Polishing', de: 'Dual-Action-Polieren' } },
  { id: 'cw-rotary', dir: 'Polisaj Makinesi/cw-rotary', category: 'polisaj-makinesi',
    name: { tr: 'Rotary Polisaj Makinesi', en: 'Rotary Polisher', de: 'Rotationspoliermaschine' },
    tagline: { tr: 'Yüksek Performans', en: 'High Performance', de: 'Hohe Leistung' } },
  { id: 'cw-pcg', dir: 'Sprey Şişeleri/cw-pcg', category: 'sprey-siseleri',
    name: { tr: 'Basınçlı Sprey Şişesi', en: 'Pressure Spray Bottle', de: 'Druck-Sprühflasche' },
    tagline: { tr: 'Geniş Kapasiteli', en: 'Large Capacity', de: 'Große Kapazität' } },
  { id: 'cw-hwa', dir: 'Uygulayıcılar/cw-hwa', category: 'uygulayicilar',
    name: { tr: 'El Yıkama Aplikatörü', en: 'Hand Wash Applicator', de: 'Handwasch-Applikator' },
    tagline: { tr: 'Uygulama Aparatı', en: 'Application Tool', de: 'Auftragswerkzeug' } },
  { id: 'cw-ma', dir: 'Uygulayıcılar/cw-ma', category: 'uygulayicilar',
    name: { tr: 'Mikrofiber Aplikatör', en: 'Microfiber Applicator', de: 'Mikrofaser-Applikator' },
    tagline: { tr: 'Uygulama Aparatı', en: 'Application Tool', de: 'Auftragswerkzeug' } },
  { id: 'cw-swb-L', dir: 'Yardımcılar/cw-swb-L', category: 'yardimcilar',
    name: { tr: 'Yıkama Süngeri', en: 'Wash Sponge', de: 'Waschschwamm' },
    tagline: { tr: 'Yumuşak Dokulu', en: 'Soft Texture', de: 'Weiche Textur' } },
  { id: 'cw-swb-L-blue', dir: 'Yardımcılar/cw-swb-L-blue', category: 'yardimcilar', color: 'Mavi',
    name: { tr: 'Yıkama Süngeri', en: 'Wash Sponge', de: 'Waschschwamm' },
    tagline: { tr: 'Yumuşak Dokulu', en: 'Soft Texture', de: 'Weiche Textur' } },
  { id: 'cw-swb-L-green', dir: 'Yardımcılar/cw-swb-L-green', category: 'yardimcilar', color: 'Yeşil',
    name: { tr: 'Yıkama Süngeri', en: 'Wash Sponge', de: 'Waschschwamm' },
    tagline: { tr: 'Yumuşak Dokulu', en: 'Soft Texture', de: 'Weiche Textur' } },
  { id: 'cw-swb-L-red', dir: 'Yardımcılar/cw-swb-L-red', category: 'yardimcilar', color: 'Kırmızı',
    name: { tr: 'Yıkama Süngeri', en: 'Wash Sponge', de: 'Waschschwamm' },
    tagline: { tr: 'Yumuşak Dokulu', en: 'Soft Texture', de: 'Weiche Textur' } },
  // Low confidence — SKU alone doesn't give enough signal for a specific name.
  // TODO: unclear from SKU alone, confirm real name with user.
  { id: 'cw-cL', dir: 'Yardımcılar/cw-cL', category: 'yardimcilar',
    name: { tr: 'Detailing Aksesuarı', en: 'Detailing Accessory', de: 'Detailing-Zubehör' },
    tagline: { tr: 'ChemicalWorkz Aksesuarı', en: 'ChemicalWorkz Accessory', de: 'ChemicalWorkz-Zubehör' } },
  { id: 'cw-cm', dir: 'Yardımcılar/cw-cm', category: 'yardimcilar',
    name: { tr: 'Detailing Aksesuarı', en: 'Detailing Accessory', de: 'Detailing-Zubehör' },
    tagline: { tr: 'ChemicalWorkz Aksesuarı', en: 'ChemicalWorkz Accessory', de: 'ChemicalWorkz-Zubehör' } },
  { id: 'cw-hL', dir: 'Yardımcılar/cw-hL', category: 'yardimcilar',
    name: { tr: 'Detailing Aksesuarı', en: 'Detailing Accessory', de: 'Detailing-Zubehör' },
    tagline: { tr: 'ChemicalWorkz Aksesuarı', en: 'ChemicalWorkz Accessory', de: 'ChemicalWorkz-Zubehör' } },
];

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
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
    if (files.length === 0) {
      skipped.push(`${seed.id}: no webp files in ${seed.dir}`);
      continue;
    }
    const { primary, poster, gallery } = classify(files);

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
    }

    const category = catLabel(seed.category);
    const name = seed.name;
    const tagline = seed.tagline;
    const description = {
      tr: `${name.tr}, ${category.tr.toLocaleLowerCase('tr')} kategorisinde ${tagline.tr.toLocaleLowerCase('tr')}. ChemicalWorkz'in Alman mühendisliğiyle geliştirilen bu ürün, profesyonel detailing ihtiyaçları için tasarlandı.`,
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
      image: `/images/products/${seed.id}/${primary}`,
      gallery: gallery.map((f) => `/images/products/${seed.id}/${f}`),
      poster: POSTER_SKUS.has(seed.id) ? `/images/products/${seed.id}/${poster}` : null,
    });
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
