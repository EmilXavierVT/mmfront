import { useEffect } from 'react';

const SITE_URL = 'https://morgendagensmaaltid.dk';
const SITE_NAME = 'Morgendagens Måltid';
const SITE_ALTERNATE_NAME = 'Morgendagens Maaltid';
const DEFAULT_IMAGE = `${SITE_URL}/fistIcon.png`;
const CONTACT_EMAIL = 'emil@morgendagensmaaltid.dk';
const CONTACT_PHONE = '+45 27 82 88 67';

const FAQ_ITEMS = [
  {
    question: 'How far in advance should I book?',
    answer: 'Catering: 7+ days for parties under 30, 3+ weeks for larger events. Cleaning: most weeks we have same-week availability for one-offs.',
  },
  {
    question: 'Do you handle allergies and dietary restrictions?',
    answer: 'Yes. Tell us in the form, and we build the menu around it. We are nut-free certified and run a separate gluten-free station.',
  },
  {
    question: 'What is your cancellation policy?',
    answer: 'Full refund up to 7 days before. 50% within 7 days. Within 48 hours we keep the deposit but can rebook you within 90 days at no charge.',
  },
  {
    question: 'Do you bring your own equipment?',
    answer: 'For catering, yes: plates, glasses, cutlery, and serving staff if requested. For cleaning, all eco-certified products and tools come with the crew.',
  },
  {
    question: 'Where do you operate?',
    answer: 'Greater Copenhagen and out to Roskilde. Travel is included for the first 25km from Copenhagen city centre.',
  },
];

const SEO_CONTENT = {
  home: {
    title: 'Morgendagens Måltid | Catering og Mad i København',
    description:
      'Morgendagens Måltid leverer catering, mad til events, selskabsmenuer og rengøring i København. Book middage, firmafrokost, bryllup og praktisk eventhjælp.',
    keywords:
      'Morgendagens Måltid, Morgendagens Maaltid, catering København, mad København, event catering Copenhagen, catering Copenhagen, firmafrokost København',
  },
  catering: {
    title: 'Catering i København | Morgendagens Måltid',
    description:
      'Catering i København til middagsselskaber, kontorer, lanceringer, bryllupper og store øjeblikke. Sæsonmenuer, allergihensyn og hurtige tilbud.',
    keywords:
      'Morgendagens Måltid catering, catering København, event catering København, bryllup catering København, firmafrokost København, private dinner Copenhagen',
  },
  cleaning: {
    title: 'Rengøring i København | Morgendagens Måltid',
    description:
      'Rengøring i København til hjem, kontorer, flytninger og morgenen efter events. Klare tilbud, egne produkter og praktisk hjælp.',
    keywords:
      'Morgendagens Måltid rengøring, rengøring København, eco cleaning Copenhagen, post-event cleaning Copenhagen, home cleaning CPH',
  },
  about: {
    title: 'Om Morgendagens Måltid | Catering og Rengøring',
    description:
      'Morgendagens Måltid er et københavnsk servicefirma for sæsonbaseret catering, mad, rengøring og praktisk eventhjælp.',
    keywords:
      'Morgendagens Måltid, Morgendagens Maaltid, cateringfirma København, catering og rengøring København, food service Copenhagen',
  },
  profile: {
    title: 'Profile | Morgendagens Måltid',
    description: 'View your Morgendagens Måltid booking requests and account details.',
    keywords: 'Morgendagens Måltid profile',
    robots: 'noindex,nofollow',
  },
  admin: {
    title: 'Admin | Morgendagens Måltid',
    description: 'Morgendagens Måltid admin area.',
    keywords: 'Morgendagens Måltid admin',
    robots: 'noindex,nofollow',
  },
};

const baseLocalBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'FoodService', 'Caterer'],
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: SITE_URL,
  '@id': `${SITE_URL}/#business`,
  image: DEFAULT_IMAGE,
  logo: DEFAULT_IMAGE,
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bremmensgade 10',
    postalCode: '2300',
    addressLocality: 'København S',
    addressCountry: 'DK',
  },
  areaServed: [
    {
      '@type': 'City',
      name: 'Copenhagen',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Greater Copenhagen',
    },
  ],
  priceRange: '$$',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    areaServed: 'DK',
    availableLanguage: ['Danish', 'English'],
  },
  hasOfferCatalog: {
    '@id': `${SITE_URL}/#services`,
  },
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Catering in Copenhagen',
        serviceType: 'Catering',
      },
    },
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Event and home cleaning in Copenhagen',
        serviceType: 'Cleaning',
      },
    },
  ],
};

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: SITE_URL,
  inLanguage: ['da-DK', 'en-DK'],
  publisher: {
    '@id': `${SITE_URL}/#business`,
  },
};

const serviceCatalogSchema = {
  '@context': 'https://schema.org',
  '@type': 'OfferCatalog',
  '@id': `${SITE_URL}/#services`,
  name: 'Morgendagens Måltid services',
  itemListElement: [
    {
      '@type': 'Offer',
      url: `${SITE_URL}/#catering`,
      itemOffered: {
        '@type': 'Service',
        '@id': `${SITE_URL}/#catering-service`,
        name: 'Catering i København',
        alternateName: 'Catering in Copenhagen',
        serviceType: 'Catering',
        provider: {
          '@id': `${SITE_URL}/#business`,
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Greater Copenhagen',
        },
        description: 'Seasonal catering for dinners, offices, launches, weddings, and events in Copenhagen.',
      },
    },
    {
      '@type': 'Offer',
      url: `${SITE_URL}/#cleaning`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '400',
        priceCurrency: 'DKK',
        unitText: 'hour',
      },
      itemOffered: {
        '@type': 'Service',
        '@id': `${SITE_URL}/#cleaning-service`,
        name: 'Rengøring i København',
        alternateName: 'Cleaning in Copenhagen',
        serviceType: 'Cleaning',
        provider: {
          '@id': `${SITE_URL}/#business`,
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Greater Copenhagen',
        },
        description: 'Eco-minded cleaning for homes, offices, move-outs, and post-event mornings in Copenhagen.',
      },
    },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: FAQ_ITEMS.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

function getBreadcrumbSchema(pageKey, page) {
  const pageUrl = pageKey === 'home' ? SITE_URL : `${SITE_URL}/#${pageKey}`;
  const pageName = pageKey === 'home' ? SITE_NAME : page.title.split('|')[0].trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: SITE_URL,
      },
      ...(pageKey === 'home' ? [] : [{
        '@type': 'ListItem',
        position: 2,
        name: pageName,
        item: pageUrl,
      }]),
    ],
  };
}

function setMeta(selector, attributes) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
}

function setLink(selector, attributes) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
}

function setJsonLd(id, schema) {
  let tag = document.getElementById(id);

  if (!tag) {
    tag = document.createElement('script');
    tag.id = id;
    tag.type = 'application/ld+json';
    document.head.appendChild(tag);
  }

  tag.textContent = JSON.stringify(schema);
}

function getPageSchema(pageKey, page) {
  const pageUrl = pageKey === 'home' ? SITE_URL : `${SITE_URL}/#${pageKey}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: pageUrl,
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
    about: {
      '@id': `${SITE_URL}/#business`,
    },
  };
}

export function SEO({ active = 'home' }) {
  useEffect(() => {
    const pageKey = SEO_CONTENT[active] ? active : 'home';
    const page = SEO_CONTENT[pageKey];
    const pageUrl = pageKey === 'home' ? SITE_URL : `${SITE_URL}/#${pageKey}`;
    const robots = page.robots || 'index,follow';

    document.documentElement.lang = 'da-DK';
    document.title = page.title;

    setMeta('meta[name="description"]', { name: 'description', content: page.description });
    setMeta('meta[name="keywords"]', { name: 'keywords', content: page.keywords });
    setMeta('meta[name="robots"]', { name: 'robots', content: robots });
    setMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#1A171B' });

    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: page.title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: page.description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE });
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'da_DK' });

    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: page.title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE });

    setLink('link[rel="canonical"]', { rel: 'canonical', href: pageUrl });
    setJsonLd('website-schema', webSiteSchema);
    setJsonLd('local-business-schema', baseLocalBusinessSchema);
    setJsonLd('service-catalog-schema', serviceCatalogSchema);
    setJsonLd('faq-schema', faqSchema);
    setJsonLd('breadcrumb-schema', getBreadcrumbSchema(pageKey, page));
    setJsonLd('page-schema', getPageSchema(pageKey, page));
  }, [active]);

  return null;
}
