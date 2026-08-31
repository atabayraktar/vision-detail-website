import ProductCard from './ProductCard';

// First row's worth of cards (the desktop layout's own column count — see ProductGrid.scss)
// get `priority` so the actual LCP candidate isn't sitting behind next/image's default
// lazy-load: a Lighthouse run on /urunler flagged the LCP image as lazy-loaded, since
// ProductCard never opted any card into eager loading.
const EAGER_COUNT = 4;

export default function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < EAGER_COUNT} />
      ))}
    </div>
  );
}
