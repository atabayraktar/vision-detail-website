import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import ScrollTopButton from '@/components/ScrollTopButton';
import SearchBar from '@/components/SearchBar';
import SortMenu, { SORT_OPTIONS } from '@/components/SortMenu';
import FilterPanel, { FilterPanelSheet } from '@/components/FilterPanel';
import ProductGrid from '@/components/ProductGrid';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import { useLanguage } from '@/context/LanguageContext';
import { products, PRODUCT_CATEGORIES } from '@/data/products';
import useScrollReveal from '@/hooks/useScrollReveal';

const SITE_URL = 'https://visiondetail.com.tr';
const TITLE = 'Ürünler | Vision Detail | chemicalworkz';
const DESCRIPTION =
  "chemicalworkz'in Türkiye distribütörü Vision Detail üzerinden polisaj makineleri, detay fırçaları, mikrofiber bezler ve daha fazla profesyonel detailing ekipmanını keşfedin.";
const PAGE_SIZE = 12;

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Anasayfa', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Ürünler', item: `${SITE_URL}/urunler` },
  ],
};

// Products/categories are a local, build-time-only source (CLAUDE.md's Static Site
// Generation rule) — getStaticProps is what makes that explicit, even though the data is
// already static-imported (no server/API involved either way).
export async function getStaticProps() {
  return { props: { products, categories: PRODUCT_CATEGORIES } };
}

export default function ProductsPage({ products: allProducts, categories }) {
  useScrollReveal();
  const { t } = useLanguage();
  const router = useRouter();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: allProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/urunler/${p.id}`,
      name: p.name.tr,
    })),
  };

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Static export: router.query is empty on the very first render (see CLAUDE.md's
  // Static Site Generation note) — hydrate from it only once the router is actually
  // ready, so the first paint is an unfiltered-but-correct list, not a flash of empty.
  useEffect(() => {
    if (!router.isReady) return;
    const { kategori, q, sirala, sayfa } = router.query;
    if (typeof kategori === 'string') setCategory(kategori);
    if (typeof q === 'string') setQuery(q);
    if (typeof sirala === 'string' && SORT_OPTIONS.some((o) => o.value === sirala)) setSort(sirala);
    if (typeof sayfa === 'string' && !Number.isNaN(Number(sayfa))) setPage(Math.max(1, Number(sayfa)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // "Ürünlere geri dön" on the product detail page uses router.back() to land on roughly
  // the same view — the URL-synced filters/sort/page above already handle that half, this
  // handles the scroll position half, which the browser's own scroll restoration doesn't
  // reliably reproduce here (this page's content height depends on client-side state that
  // hydrates from the URL a render AFTER first paint, so Next's automatic restore fires
  // against the wrong — pre-hydration — page height and lands at the top).
  //
  // Saved once per navigation-away (routeChangeStart fires as soon as a product card is
  // clicked, before this page unmounts), restored once after the query-hydration effect
  // above has actually applied (same deps, so this re-fires in the render right after
  // hydration commits) — a double rAF waits for that render's layout to actually paint
  // before scrolling, since the grid's final height isn't there yet on the same frame the
  // state updates.
  const scrollRestoredRef = useRef(false);
  useEffect(() => {
    const saveScroll = () => sessionStorage.setItem('urunler-scroll-y', String(window.scrollY));
    router.events.on('routeChangeStart', saveScroll);
    return () => router.events.off('routeChangeStart', saveScroll);
  }, [router.events]);

  useEffect(() => {
    if (!router.isReady || scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;
    const saved = sessionStorage.getItem('urunler-scroll-y');
    if (!saved) return;
    sessionStorage.removeItem('urunler-scroll-y');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
    });
  }, [router.isReady, category, query, sort, page]);

  // Keep the URL in sync (shareable filtered view) without a full navigation/reload.
  useEffect(() => {
    if (!router.isReady) return;
    const nextQuery = {};
    if (category) nextQuery.kategori = category;
    if (query) nextQuery.q = query;
    if (sort !== SORT_OPTIONS[0].value) nextQuery.sirala = sort;
    if (page > 1) nextQuery.sayfa = String(page);
    router.replace({ pathname: '/urunler', query: nextQuery }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort, page, router.isReady]);

  // Any filter/search/sort change resets pagination — staying on page 4 of a 1-result
  // search would just show an empty page instead of the actual results.
  useEffect(() => {
    setPage(1);
  }, [category, query, sort]);

  const filtered = useMemo(() => {
    let list = allProducts;
    if (category) list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.trim().toLocaleLowerCase('tr');
      list = list.filter((p) => {
        const name = t(p.name).toLocaleLowerCase('tr');
        const tagline = t(p.tagline).toLocaleLowerCase('tr');
        return name.includes(q) || tagline.includes(q);
      });
    }
    // Only two sort values exist now (see SortMenu.jsx's SORT_OPTIONS) — no "newest"
    // fallback needed, there's no real recency data to sort by.
    const sorted = [...list];
    if (sort === 'name-desc') sorted.sort((a, b) => t(b.name).localeCompare(t(a.name), 'tr'));
    else sorted.sort((a, b) => t(a.name).localeCompare(t(b.name), 'tr'));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort, t, allProducts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setQuery('');
    setCategory(null);
    setSort(SORT_OPTIONS[0].value);
  };

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={DESCRIPTION} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/urunler`} />
        <link rel="alternate" hrefLang="tr" href={`${SITE_URL}/urunler`} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/urunler`} />
        <link rel="alternate" hrefLang="de" href={`${SITE_URL}/urunler`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/urunler`} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Vision Detail" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={`${SITE_URL}/urunler`} />
        <meta property="og:image" content={`${SITE_URL}/logos/vision-detail-square.png`} />
        <meta property="og:locale" content="tr_TR" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      </Head>

      <Header />

      <main id="main-content">
        <section className="products-page container">
          <h1 className="products-page__title" data-reveal>Ürünler</h1>
          <p className="products-page__intro" data-reveal>
            chemicalworkz&apos;in Türkiye distribütörü Vision Detail üzerinden profesyonel detailing ekipmanlarını ve
            bakım aksesuarlarını keşfedin.
          </p>

          <div className="products-page__toolbar" data-reveal>
            <SearchBar value={query} onChange={setQuery} />
            <div className="products-page__toolbar-right">
              <button type="button" className="products-page__filter-toggle" onClick={() => setFilterSheetOpen(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Filtrele
              </button>
              <SortMenu value={sort} onChange={setSort} />
            </div>
          </div>

          <div className="products-page__layout">
            <FilterPanel
              categories={categories}
              active={category}
              onSelect={setCategory}
              className="products-page__filter-panel"
            />

            <div className="products-page__results">
              {pageItems.length > 0 ? (
                <>
                  <ProductGrid products={pageItems} />
                  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </>
              ) : (
                <EmptyState onReset={resetFilters} />
              )}
            </div>
          </div>
        </section>
      </main>

      <FilterPanelSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        categories={categories}
        active={category}
        onSelect={setCategory}
      />

      <Footer />
      <WhatsAppFab />
      <ScrollTopButton />
    </>
  );
}
