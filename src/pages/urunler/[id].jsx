import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import ScrollTopButton from '@/components/ScrollTopButton';
import ProductGallery from '@/components/ProductGallery';
import ProductInfo from '@/components/ProductInfo';
import ProductPoster from '@/components/ProductPoster';
import { useLanguage } from '@/context/LanguageContext';
import { products, PRODUCT_CATEGORIES } from '@/data/products';
import useScrollReveal from '@/hooks/useScrollReveal';

const SITE_URL = 'https://visiondetail.com.tr';

// Static export: every product must be known at build time (CLAUDE.md — no on-demand
// rendering for an unknown id under `output: 'export'`).
export async function getStaticPaths() {
  return {
    paths: products.map((p) => ({ params: { id: p.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const product = products.find((p) => p.id === params.id);
  // Same family (color/size siblings) — see VariantPicker.jsx for why this is a set of
  // links to sibling detail pages rather than an in-page swatch switcher: each
  // color/size combination is genuinely its own product row/SKU in the data, not a
  // shared product with switchable attributes.
  const siblings = products.filter(
    (p) => p.id !== product.id && p.category === product.category && p.name.tr === product.name.tr
  );
  return { props: { product, siblings, categories: PRODUCT_CATEGORIES } };
}

export default function ProductDetailPage({ product, siblings, categories }) {
  useScrollReveal();
  const { t } = useLanguage();
  const router = useRouter();
  const category = categories.find((c) => c.slug === product.category);

  // "Almost back to where you were" (the user's own framing) rather than a plain link to
  // /urunler: router.back() replays the actual browser history entry, which — since
  // /urunler already syncs search/category/sort/page into the URL and reads them back on
  // load — restores the filtered list AND (natively, via the browser's own scroll
  // restoration) the scroll position, not just an unfiltered page 1. Only safe when the
  // previous entry is actually this site's listing page; a bookmarked/shared product link
  // has no useful "back" to return to, so it falls back to a plain /urunler navigation.
  const goBack = () => {
    const cameFromListing =
      typeof window !== 'undefined' &&
      window.history.length > 1 &&
      document.referrer &&
      new URL(document.referrer).origin === window.location.origin;
    if (cameFromListing) router.back();
    else router.push('/urunler');
  };
  const name = t(product.name);
  const url = `${SITE_URL}/urunler/${product.id}`;
  const title = `${name} | Vision Detail | chemicalworkz`;
  const description = t(product.description);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    sku: product.id,
    image: `${SITE_URL}${product.image}`,
    brand: { '@type': 'Brand', name: 'ChemicalWorkz' },
    // Literally true (not just the retail brand) — ChemicalWorkz manufactures these, Vision
    // Detail distributes them (the entity relationship the GEO rules ask to state in real
    // text; this is the schema-level echo of the same fact).
    manufacturer: { '@type': 'Organization', name: 'ChemicalWorkz' },
    category: category ? t(category.label) : undefined,
    inLanguage: 'tr',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      // No cart/checkout on this site (WhatsApp is the sales channel — CLAUDE.md hard
      // rule) and no real price data exists — url points at the page itself rather than
      // fabricating a price, which schema.org's Offer otherwise expects.
      url,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Anasayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Ürünler', item: `${SITE_URL}/urunler` },
      { '@type': 'ListItem', position: 3, name, item: url },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="tr" href={url} />
        <link rel="alternate" hrefLang="en" href={url} />
        <link rel="alternate" hrefLang="de" href={url} />
        <link rel="alternate" hrefLang="x-default" href={url} />

        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Vision Detail" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${SITE_URL}${product.image}`} />
        <meta property="og:locale" content="tr_TR" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}${product.image}`} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      </Head>

      <Header />

      <main id="main-content">
        <section className="product-detail container">
          <button type="button" className="product-detail__back gradient-hover" onClick={goBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ürünlere geri dön
          </button>

          <div className="product-detail__gallery-info" data-reveal>
            <ProductGallery images={product.gallery} alt={name} />
            <ProductInfo product={product} siblings={siblings} />
          </div>

          {/* Only 10 SKUs actually had a poster image specified in the source Excel — see
              scripts/build-products.mjs's POSTER_SKUS. Everyone else gets `poster: null`,
              and D2 just doesn't render rather than showing an unrequested image. */}
          {product.poster && <ProductPoster src={product.poster} alt={`${name} — ${t(product.tagline)}`} />}
        </section>
      </main>

      <Footer />
      <WhatsAppFab />
      <ScrollTopButton />
    </>
  );
}
