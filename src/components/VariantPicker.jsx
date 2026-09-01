import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

// Each color/size combination in the catalog is its own real product (its own SKU/photos),
// not a switchable attribute on one shared product — so "picking a variant" here means
// navigating to that sibling product's own detail page, not swapping state in place. Only
// rendered when the product actually has siblings (see ProductInfo).
const COLOR_LABEL = { tr: 'Renk', en: 'Color', de: 'Farbe' };
const SIZE_LABEL = { tr: 'Beden / Ölçü', en: 'Size', de: 'Größe' };

export default function VariantPicker({ current, siblings }) {
  const { t } = useLanguage();
  const label = t(current.color ? COLOR_LABEL : SIZE_LABEL);

  // Sorted by id (not "current first, then siblings in whatever order") so every variant
  // always renders in the same position regardless of which one happens to be active —
  // picking the 3rd option used to always jump the newly-active variant to the front,
  // reading as a page reset instead of a selection.
  const all = [current, ...siblings].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="variant-picker">
      <span className="variant-picker__label">{label}</span>
      <ul className="variant-picker__options">
        {all.map((item) => (
          <li key={item.id}>
            {item.id === current.id ? (
              <span className="variant-picker__option variant-picker__option--active" aria-current="true">
                {item.color ? t(item.color) : item.size}
              </span>
            ) : (
              // replace, not push: switching color/size feels like updating the same
              // product page in place, not visiting a new one — pushing here was stacking
              // one history entry per variant hop, so "Ürünlere geri dön" (router.back(),
              // see [id].jsx) walked back through each previously-viewed color one click at
              // a time instead of returning straight to the listing.
              <Link href={`/urunler/${item.id}`} replace className="variant-picker__option">
                {item.color ? t(item.color) : item.size}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
