// Homepage copy, sourced from .claude/homepage_data (Turkish is the source of truth;
// English/German are translations added so the header's TR/EN/DE switcher is functional).

export const header = {
  // The ChemicalWorkz logo already sits right before this text (see Header.jsx) — repeating
  // the brand name here read as redundant, so this is just the relationship line now.
  info: {
    tr: 'Türkiye Distribütörü',
    en: 'Turkey Distributor',
    de: 'Vertriebspartner Türkei',
  },
  nav: [
    { href: '/urunler', label: { tr: 'Ürünler', en: 'Products', de: 'Produkte' } },
    { href: '#chemicalworkz', label: { tr: 'ChemicalWorkz', en: 'ChemicalWorkz', de: 'ChemicalWorkz' } },
    { href: '#iletisim', label: { tr: 'İletişim', en: 'Contact', de: 'Kontakt' } },
  ],
};

export const heroSlides = [
  {
    id: 'hero-1',
    media: {
      type: 'video',
      mp4: '/videos/hero-1.mp4',
      webm: '/videos/hero-1.webm',
      // A genuinely different portrait crop (not just a smaller resize) supplied for
      // mobile — swapped in via a <source media> query in HeroSlider.jsx.
      mobileMp4: '/videos/hero-1-mobile.mp4',
      mobileWebm: '/videos/hero-1-mobile.webm',
      poster: '/images/hero-1-poster.webp',
    },
    title: {
      tr: "ChemicalWorkz Türkiye'de!",
      en: 'ChemicalWorkz is now in Turkey!',
      de: 'ChemicalWorkz jetzt in der Türkei!',
    },
    info: {
      tr: 'Alman kalitesiyle geliştirilen ChemicalWorkz detailing ürünlerini keşfedin; profesyonel ekipmanları, bakım aksesuarlarını ve ürün detaylarını yakından inceleyin.',
      en: 'Discover ChemicalWorkz detailing products, engineered to German quality standards — explore professional equipment, care accessories and every product detail up close.',
      de: 'Entdecken Sie die ChemicalWorkz Detailing-Produkte in deutscher Qualität — professionelle Ausrüstung, Pflegezubehör und alle Produktdetails aus nächster Nähe.',
    },
    cta: { tr: 'Daha fazla bilgi edin', en: 'Learn more', de: 'Mehr erfahren' },
    href: '/urunler',
  },
  {
    id: 'hero-2',
    media: {
      type: 'video',
      mp4: '/videos/hero-2.mp4',
      webm: '/videos/hero-2.webm',
      mobileMp4: '/videos/hero-2-mobile.mp4',
      mobileWebm: '/videos/hero-2-mobile.webm',
      poster: '/images/hero-2-poster.webp',
    },
    title: {
      tr: 'Tasarım ve işlevsellik bir arada.',
      en: 'Design and function, combined.',
      de: 'Design und Funktion vereint.',
    },
    info: {
      tr: 'Gelişmiş teknolojiyi ergonomik tasarımla buluşturan polisaj makineleri; farklı uygulama ihtiyaçlarına uyum sağlayan güçlü performansı, kullanım kolaylığı ve uzun ömürlü yapısıyla profesyonel sonuçlar için tasarlandı.',
      en: "Polishing machines that pair advanced technology with ergonomic design — built for professional results through powerful, adaptable performance, ease of use and long-lasting durability.",
      de: 'Poliermaschinen, die fortschrittliche Technologie mit ergonomischem Design verbinden — für professionelle Ergebnisse durch starke, anpassungsfähige Leistung, einfache Bedienung und langlebige Konstruktion.',
    },
    cta: { tr: 'Daha fazla bilgi edin', en: 'Learn more', de: 'Mehr erfahren' },
    href: '/urunler?kategori=polisaj-makinesi',
  },
  {
    id: 'hero-3',
    media: {
      type: 'video',
      mp4: '/videos/hero-3.mp4',
      webm: '/videos/hero-3.webm',
      mobileMp4: '/videos/hero-3-mobile.mp4',
      mobileWebm: '/videos/hero-3-mobile.webm',
      poster: '/images/hero-3-poster.webp',
    },
    title: {
      tr: 'Küçük ama güçlü. Detaylar için tasarlandı.',
      en: 'Small but powerful. Built for the details.',
      de: 'Klein, aber stark. Für jedes Detail gemacht.',
    },
    info: {
      tr: 'Mini Hava Tabancası, bezin ulaşamadığı her yerde, en inatçı kirleri bile hassas ve maksimum kontrol ile temizler.',
      en: "The Mini Air Gun reaches everywhere a cloth can't — clearing even the most stubborn dirt with precision and maximum control.",
      de: 'Die Mini-Luftpistole erreicht jede Stelle, an die ein Tuch nicht herankommt, und entfernt selbst hartnäckigsten Schmutz präzise und mit maximaler Kontrolle.',
    },
    cta: { tr: 'Daha fazla bilgi edin', en: 'Learn more', de: 'Mehr erfahren' },
    href: '/urunler/cw-mag',
  },
  {
    id: 'hero-4',
    media: {
      type: 'image',
      src: '/images/hero-4-pads.webp',
      // Real art-directed portrait crop for mobile, not a resize — see HeroSlider.jsx.
      mobileSrc: '/images/hero-4-pads-mobile.webp',
      alt: {
        tr: 'Farklı ChemicalWorkz polisaj pedi seçenekleri',
        en: 'A range of ChemicalWorkz polishing pad options',
        de: 'Verschiedene ChemicalWorkz Polierpad-Optionen',
      },
    },
    title: {
      tr: 'Her Yüzey İçin Doğru Dokunuş.',
      en: 'The Right Touch for Every Surface.',
      de: 'Die richtige Note für jede Oberfläche.',
    },
    info: {
      tr: 'Farklı yüzeyler, uygulama aşamaları ve polisaj ihtiyaçları için geliştirilen pad seçenekleri; dengeli performansı ve kontrollü sonuçları bir araya getirir.',
      en: 'A range of pads developed for different surfaces, application stages and polishing needs — bringing balanced performance and controlled results together.',
      de: 'Pad-Optionen für unterschiedliche Oberflächen, Arbeitsschritte und Polieranforderungen — für ausgewogene Leistung und kontrollierte Ergebnisse.',
    },
    cta: { tr: 'Daha fazla bilgi edin', en: 'Learn more', de: 'Mehr erfahren' },
    href: '/urunler?kategori=polisaj-pedleri',
  },
];

export const equipmentSection = {
  title: {
    tr: ['Her zorluk için', 'yenilikçi ürünler.'],
    en: ['Innovative products', 'for every challenge.'],
    de: ['Innovative Produkte', 'für jede Herausforderung.'],
  },
  // Curated, not exhaustive — only categories with a real supplied photo in
  // .claude/homepage_data/equipment-category-section/ appear here. Slugs must match
  // PRODUCT_CATEGORIES in scripts/build-products.mjs (the user's 8 real Excel categories):
  // the old detay-fircalari card became fircalar, and the two separate cloth cards
  // (manyetik-bez + mikrofiber-bezler) merged into one bezler card so every card lands on
  // a populated /urunler filter.
  categories: [
    {
      slug: 'fircalar',
      image: '/images/equipment/detay-fircalari.webp',
      title: { tr: 'Fırçalar', en: 'Brushes', de: 'Bürsten' },
    },
    {
      slug: 'keceler',
      image: '/images/equipment/keceler.webp',
      title: { tr: 'Keçeler', en: 'Felt Pads', de: 'Filzpads' },
    },
    {
      slug: 'bezler',
      image: '/images/equipment/mikrofiber-bezler.webp',
      title: { tr: 'Bezler', en: 'Cloths', de: 'Tücher' },
    },
    {
      slug: 'sprey-siseleri',
      image: '/images/equipment/sprey-siseleri.webp',
      title: { tr: 'Sprey Şişeleri', en: 'Spray Bottles', de: 'Sprühflaschen' },
    },
  ],
};

export const aboutChemicalWorkz = {
  title: { tr: 'ChemicalWorkz Hakkında', en: 'About ChemicalWorkz', de: 'Über ChemicalWorkz' },
  paragraph: {
    tr: "Almanya merkezli ChemicalWorkz, profesyonel araç bakım ve detailing sektöründe geliştirdiği yenilikçi ekipmanlar ve premium aksesuarlarla kısa sürede global ölçekte güçlü bir konum elde etmiş bir markadır. Profesyonellerin ihtiyaçları doğrultusunda tasarlanıp test edilen ürünleri; yüksek kalite standartları, modern tasarımı ve uzun ömürlü performansıyla öne çıkar. Bugün birçok ülkedeki distribütör ağıyla otomobil tutkunlarına ve detailing profesyonellerine ulaşan ChemicalWorkz, Alman mühendisliğini günlük kullanıma taşıyan güvenilir markalar arasında yer almaktadır. Vision Detail olarak bu kalite anlayışını, ChemicalWorkz'ün Türkiye distribütörü kimliğimizle Türkiye'deki kullanıcılarla buluşturuyoruz.",
    en: "Headquartered in Germany, ChemicalWorkz has quickly built a strong global presence in professional vehicle care and detailing through innovative equipment and premium accessories. Designed and tested around the needs of professionals, its products stand out through high quality standards, modern design and long-lasting performance. Reaching car enthusiasts and detailing professionals through a distributor network spanning many countries today, ChemicalWorkz is among the trusted brands bringing German engineering into everyday use. As Vision Detail, we bring this quality standard to users in Turkey as ChemicalWorkz's official Turkish distributor.",
    de: 'Die in Deutschland ansässige Marke ChemicalWorkz hat sich mit innovativer Ausrüstung und hochwertigem Zubehör für die professionelle Fahrzeugpflege und das Detailing schnell weltweit etabliert. Die für die Anforderungen von Profis entwickelten und getesteten Produkte überzeugen durch hohe Qualitätsstandards, modernes Design und langlebige Leistung. Mit einem Vertriebsnetz in zahlreichen Ländern erreicht ChemicalWorkz heute Autoliebhaber und Detailing-Profis gleichermaßen und zählt zu den vertrauenswürdigen Marken, die deutsche Ingenieurskunst in den Alltag bringen. Als Vision Detail bringen wir diesen Qualitätsanspruch als offizieller türkischer Vertriebspartner von ChemicalWorkz zu den Nutzern in der Türkei.',
  },
  // Now has its own dedicated supplied photo instead of reusing the mikrofiber-bezler
  // category card image as a placeholder (see .claude/homepage_data/chemical-works-about-section).
  image: '/images/about-chemicalworkz.webp',
  boxes: [
    {
      icon: 'rank',
      eyebrow: { tr: '#1', en: '#1', de: '#1' },
      info: {
        tr: "Almanya'nın Lider Otomobil Bakım Ekosistemi",
        en: "Germany's Leading Vehicle Care Ecosystem",
        de: 'Deutschlands führendes Fahrzeugpflege-Ökosystem',
      },
    },
    {
      icon: 'eu',
      eyebrow: { tr: 'Avrupa Birliği', en: 'European Union', de: 'Europäische Union' },
      info: {
        tr: "Uluslararası distribütör ağıyla Avrupa'da 10'dan fazla ülkede.",
        en: 'Present in more than 10 European countries through an international distributor network.',
        de: 'Mit einem internationalen Vertriebsnetz in über 10 europäischen Ländern vertreten.',
      },
    },
    {
      icon: 'flag-de',
      eyebrow: { tr: 'DE', en: 'DE', de: 'DE' },
      info: {
        tr: "Profesyoneller için Almanya'da geliştirildi.",
        en: 'Developed in Germany for professionals.',
        de: 'Entwickelt in Deutschland für Profis.',
      },
    },
    {
      icon: 'customers',
      eyebrow: { tr: '500+', en: '500+', de: '500+' },
      info: {
        tr: 'Profesyonel müşteri tarafından tercih ediliyor.',
        en: 'Trusted by professional customers.',
        de: 'Von professionellen Kunden bevorzugt.',
      },
    },
    {
      icon: 'gear',
      eyebrow: { tr: 'Performans', en: 'Performance', de: 'Leistung' },
      info: {
        tr: 'Yüksek performans odaklı tasarım anlayışı.',
        en: 'A design philosophy focused on high performance.',
        de: 'Designphilosophie mit Fokus auf Höchstleistung.',
      },
    },
  ],
};

export const polishingBanner = {
  image: '/images/polishing-banner.webp',
  imageDark: '/images/polishing-banner-dark.webp',
  // Real art-directed portrait crop for mobile, not a resize — see PolishingBanner.jsx.
  mobileImage: '/images/polishing-banner-mobile.webp',
  mobileImageDark: '/images/polishing-banner-mobile-dark.webp',
  title: {
    tr: 'Küçük, güçlü, çok yönlü: EVO Mini.',
    en: 'Small, powerful, versatile: the EVO Mini.',
    de: 'Klein, stark, vielseitig: der EVO Mini.',
  },
  cta: {
    tr: "EVO Mini'yi keşfedin",
    en: 'Discover the EVO Mini',
    de: 'EVO Mini entdecken',
  },
};

export const contactSection = {
  title: { tr: 'İletişim', en: 'Contact', de: 'Kontakt' },
  mapHref: 'https://maps.app.goo.gl/E5zz1XL8ZF2bohJ2A',
  mapCoords: '40.149898,26.443142',
  phone: '+90 540 998 2505',
  phoneDisplay: '0 540 998 2505',
  whatsappHref: 'https://wa.me/905409982505',
  instagramHref: 'https://www.instagram.com/visiondetail.tr',
  facebookHref: 'https://www.facebook.com/profile.php?id=61592227389637',
  instagramHandle: '@visiondetail.tr',
  // No backend — this form composes a WhatsApp message and hands off to wa.me
  // (see ContactSection.jsx), matching the rest of the site's WhatsApp-first contact model.
  form: {
    nameLabel: { tr: 'Ad Soyad', en: 'Full name', de: 'Name' },
    phoneLabel: { tr: 'Telefon', en: 'Phone', de: 'Telefon' },
    messageLabel: { tr: 'Mesajınız', en: 'Message', de: 'Nachricht' },
    submit: { tr: "WhatsApp'tan Gönder", en: 'Send via WhatsApp', de: 'Über WhatsApp senden' },
    errors: {
      nameRequired: { tr: 'Lütfen adınızı girin.', en: 'Please enter your name.', de: 'Bitte geben Sie Ihren Namen ein.' },
      phoneRequired: { tr: 'Lütfen telefon numaranızı girin.', en: 'Please enter your phone number.', de: 'Bitte geben Sie Ihre Telefonnummer ein.' },
      phoneInvalid: { tr: 'Lütfen geçerli bir telefon numarası girin.', en: 'Please enter a valid phone number.', de: 'Bitte geben Sie eine gültige Telefonnummer ein.' },
      messageRequired: { tr: 'Lütfen mesajınızı girin.', en: 'Please enter your message.', de: 'Bitte geben Sie Ihre Nachricht ein.' },
    },
  },
  labels: {
    address: { tr: 'Konum', en: 'Location', de: 'Standort' },
    addressCta: { tr: 'Haritada görüntüle', en: 'View on map', de: 'Auf der Karte ansehen' },
    phone: { tr: 'Telefon', en: 'Phone', de: 'Telefon' },
    instagram: { tr: 'Instagram', en: 'Instagram', de: 'Instagram' },
  },
};

export const footer = {
  tagline: {
    tr: "Vision Detail, ChemicalWorkz'ün Türkiye distribütörüdür.",
    en: "Vision Detail is the Turkey distributor of ChemicalWorkz.",
    de: 'Vision Detail ist der türkische Vertriebspartner von ChemicalWorkz.',
  },
  rights: {
    tr: 'Tüm hakları saklıdır.',
    en: 'All rights reserved.',
    de: 'Alle Rechte vorbehalten.',
  },
};
