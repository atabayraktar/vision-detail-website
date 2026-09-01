import { useLanguage } from '@/context/LanguageContext';
import { contactSection } from '@/data/homepageContent';
import { PRODUCT_CATEGORIES } from '@/data/products';
import GlassSurface from './GlassSurface';
import VariantPicker from './VariantPicker';

const WHATSAPP_MESSAGE = {
  tr: (name, id) => `Merhaba, ${name} (${id}) hakkında bilgi almak istiyorum.`,
  en: (name, id) => `Hello, I'd like information about ${name} (${id}).`,
  de: (name, id) => `Hallo, ich hätte gerne Informationen zu ${name} (${id}).`,
};
const CTA_LABEL = { tr: 'WhatsApp ile Bilgi Al', en: 'Ask on WhatsApp', de: 'Über WhatsApp anfragen' };

export default function ProductInfo({ product, siblings }) {
  const { t, lang } = useLanguage();
  const category = PRODUCT_CATEGORIES.find((c) => c.slug === product.category);

  const whatsappMessage = (WHATSAPP_MESSAGE[lang] ?? WHATSAPP_MESSAGE.tr)(t(product.name), product.id);
  const whatsappHref = `${contactSection.whatsappHref}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="product-info">
      {category && <span className="product-info__eyebrow">{t(category.label)}</span>}
      <h1 className="product-info__name">{t(product.name)}</h1>
      <p className="product-info__tagline">{t(product.tagline)}</p>

      {siblings.length > 0 && <VariantPicker current={product} siblings={siblings} />}

      <p className="product-info__description">{t(product.description)}</p>

      <GlassSurface
        as="a"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="product-info__cta glass-surface--tight glass-surface--solid"
        contentClassName="product-info__cta-content"
      >
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.02 4C9.4 4 4 9.37 4 15.98c0 2.15.57 4.15 1.56 5.9L4 28l6.28-1.53a11.9 11.9 0 0 0 5.74 1.46h.01c6.62 0 12.01-5.37 12.01-11.98C28.04 9.37 22.65 4 16.02 4Zm0 21.6h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.92 1-3.66-.24-.38a9.86 9.86 0 0 1-1.53-5.3c0-5.47 4.46-9.92 9.95-9.92 2.66 0 5.15 1.03 7.03 2.9a9.85 9.85 0 0 1 2.91 7.03c0 5.47-4.46 9.92-9.95 10Z"
          />
          <path
            fill="currentColor"
            d="M22.4 18.68c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.22.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.4-.26-.62-.53-.54-.72-.55h-.62c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.11 1.31 3.32.16.22 2.26 3.46 5.49 4.85.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.29-.22-.61-.38Z"
          />
        </svg>
        <span className="btn-glass__label">{t(CTA_LABEL)}</span>
      </GlassSurface>
    </div>
  );
}
