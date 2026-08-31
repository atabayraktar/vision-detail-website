import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SearchBar from '@/components/SearchBar';
import SortMenu, { SORT_OPTIONS } from '@/components/SortMenu';
import StockFilter from '@/components/StockFilter';
import FilterPanel, { FilterPanelSheet } from '@/components/FilterPanel';
import ProductGrid from '@/components/ProductGrid';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import { useLanguage } from '@/context/LanguageContext';
import { products, PRODUCT_CATEGORIES } from '@/data/products';
import useScrollReveal from '@/hooks/useScrollReveal';

const SITE_URL = 'https://visiondetail.com.tr';
const TITLE = 'Ürünler | Vision Detail | ChemicalWorkz';
const DESCRIPTION =
  "ChemicalWorkz'ün Türkiye distribütörü Vision Detail üzerinden polisaj makineleri, detay fırçaları, mikrofiber bezler ve daha fazla profesyonel detailing ekipmanını keşfedin.";
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
//
// Trimmed to only the fields the grid/search/sort/filter/card actually read — the full
// product record now also carries gallery arrays, video, and (since the poster rework)
// multi-paragraph posterDescription text in three languages, none of which this page uses.
// Serializing all of that per product pushed this page over Next's 128kB page-data
// warning threshold once the catalog grew to 54 products; each of those unused fields
// still has to ship in the static HTML and get parsed/hydrated client-side, which is
// exactly what CLAUDE.md's Lighthouse performance target keeps flagging as the risk here.
export async function getStaticProps() {
  const listProducts = products.map(({ id, name, tagline, category, color, size, isNew, inStock, image }) => ({
    id,
    name,
    tagline,
    category,
    color,
    size,
    isNew,
    inStock,
    image,
  }));
  return { props: { products: listProducts, categories: PRODUCT_CATEGORIES } };
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
  const [stock, setStock] = useState(null);
  const [page, setPage] = useState(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Static export: router.query is empty on the very first render (see CLAUDE.md's
  // Static Site Generation note) — hydrate from it only once the router is actually
  // ready, so the first paint is an unfiltered-but-correct list, not a flash of empty.
  useEffect(() => {
    if (!router.isReady) return;
    const { kategori, q, sirala, stok, sayfa } = router.query;
    if (typeof kategori === 'string') setCategory(kategori);
    if (typeof q === 'string') setQuery(q);
    if (typeof sirala === 'string' && SORT_OPTIONS.some((o) => o.value === sirala)) setSort(sirala);
    if (stok === 'in' || stok === 'out') setStock(stok);
    if (typeof sayfa === 'string' && !Number.isNaN(Number(sayfa))) setPage(Math.max(1, Number(sayfa)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Keep the URL in sync (shareable filtered view) without a full navigation/reload.
  useEffect(() => {
    if (!router.isReady) return;
    const nextQuery = {};
    if (category) nextQuery.kategori = category;
    if (query) nextQuery.q = query;
    if (sort !== SORT_OPTIONS[0].value) nextQuery.sirala = sort;
    if (stock) nextQuery.stok = stock;
    if (page > 1) nextQuery.sayfa = String(page);
    router.replace({ pathname: '/urunler', query: nextQuery }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort, stock, page, router.isReady]);

  // Any filter/search/sort change resets pagination — staying on page 4 of a 1-result
  // search would just show an empty page instead of the actual results.
  useEffect(() => {
    setPage(1);
  }, [category, query, sort, stock]);

  const filtered = useMemo(() => {
    let list = allProducts;
    if (category) list = list.filter((p) => p.category === category);
    if (stock === 'in') list = list.filter((p) => p.inStock !== false);
    else if (stock === 'out') list = list.filter((p) => p.inStock === false);
    if (query.trim()) {
      const q = query.trim().toLocaleLowerCase('tr');
      list = list.filter((p) => {
        const name = t(p.name).toLocaleLowerCase('tr');
        const tagline = t(p.tagline).toLocaleLowerCase('tr');
        return name.includes(q) || tagline.includes(q);
      });
    }
    // Two sort values (see SortMenu.jsx's SORT_OPTIONS): name A-Z / Z-A. Stock availability
    // is StockFilter's job now, not a sort order — see StockFilter.jsx.
    const sorted = [...list];
    if (sort === 'name-desc') sorted.sort((a, b) => t(b.name).localeCompare(t(a.name), 'tr'));
    else sorted.sort((a, b) => t(a.name).localeCompare(t(b.name), 'tr'));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort, stock, t, allProducts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setQuery('');
    setCategory(null);
    setSort(SORT_OPTIONS[0].value);
    setStock(null);
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

      <main id="main-content">
        <section className="products-page container">
          <h1 className="products-page__title" data-reveal>Ürünler</h1>
          <p className="products-page__intro" data-reveal>
            ChemicalWorkz&apos;ün Türkiye distribütörü Vision Detail üzerinden profesyonel detailing ekipmanlarını ve
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
              <StockFilter value={stock} onChange={setStock} />
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
    </>
  );
}
