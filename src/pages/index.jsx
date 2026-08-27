import Head from 'next/head';
import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import CategorySlider from '@/components/CategorySlider';
import AboutChemicalWorkz from '@/components/AboutChemicalWorkz';
import PolishingBanner from '@/components/PolishingBanner';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import useScrollReveal from '@/hooks/useScrollReveal';

const SITE_URL = 'https://visiondetail.com.tr';
const TITLE = 'Vision Detail';
const DESCRIPTION =
  "Vision Detail, Almanya merkezli ChemicalWorkz'ün Türkiye distribütörüdür. Profesyonel detailing ekipmanları, polisaj makineleri ve bakım aksesuarlarını keşfedin.";

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vision Detail',
  url: SITE_URL,
  logo: `${SITE_URL}/logos/vision-detail-dark.webp`,
  sameAs: ['https://www.instagram.com/visiondetail.tr', 'https://wa.me/905409982505'],
  parentOrganization: {
    '@type': 'Organization',
    name: 'ChemicalWorkz',
  },
  description: "Vision Detail, ChemicalWorkz'ün resmi Türkiye distribütörüdür.",
};

const LOCAL_BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Vision Detail',
  telephone: '+905409982505',
  url: SITE_URL,
  image: `${SITE_URL}/images/polishing-banner.webp`,
  hasMap: 'https://maps.app.goo.gl/E5zz1XL8ZF2bohJ2A',
  sameAs: ['https://www.instagram.com/visiondetail.tr'],
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Anasayfa',
      item: SITE_URL,
    },
  ],
};

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Vision Detail nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Vision Detail, Almanya merkezli ChemicalWorkz'ün Türkiye distribütörüdür ve profesyonel araç bakım/detailing ekipmanlarını Türkiye'deki kullanıcılara ulaştırır.",
      },
    },
    {
      '@type': 'Question',
      name: 'ChemicalWorkz ürünleri hakkında nasıl bilgi alabilirim?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ürün sayfalarındaki "WhatsApp ile Bilgi Al" butonu üzerinden veya +90 540 998 2505 numarasından Vision Detail ekibiyle doğrudan iletişime geçebilirsiniz.',
      },
    },
    {
      '@type': 'Question',
      name: 'Size uygun polisaj makinesini nasıl seçebilirim?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Anasayfadaki polisaj banner\'ındaki kısa anketi yanıtlayarak yüzey tipinize, deneyim seviyenize ve kullanım alanınıza uygun ChemicalWorkz polisaj makinesi önerisi için Vision Detail ekibine yönlendirilirsiniz.',
      },
    },
  ],
};

export default function HomePage() {
  useScrollReveal();

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={DESCRIPTION} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE_URL} />
        <link rel="preload" as="image" href="/images/hero-1-poster.webp" fetchpriority="high" />
        <link rel="alternate" hrefLang="tr" href={SITE_URL} />
        <link rel="alternate" hrefLang="en" href={SITE_URL} />
        <link rel="alternate" hrefLang="de" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Vision Detail" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/logos/vision-detail-square.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1200" />
        <meta property="og:image:alt" content="Vision Detail logo" />
        <meta property="og:locale" content="tr_TR" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/logos/vision-detail-square.png`} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      </Head>

      <Header />

      <main id="main-content">
        <HeroSlider />
        <CategorySlider />
        <AboutChemicalWorkz />
        <PolishingBanner />
        <ContactSection />
      </main>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
