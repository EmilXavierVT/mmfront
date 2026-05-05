import { useEffect } from 'react';

const SITE_URL = 'https://morgendagensmaaltid.dk';
const SITE_NAME = 'Morgendagens Måltid';
const DEFAULT_IMAGE = `${SITE_URL}/fistIcon.png`;

const SEO_CONTENT = {
  home: {
    title: 'Catering & Food in Copenhagen | Morgendagens Måltid',
    description:
      'Copenhagen catering, seasonal food, event menus, and eco-minded cleaning from Morgendagens Måltid. Book dinners, office lunches, weddings, and post-event help.',
    keywords:
      'catering Copenhagen, food Copenhagen, event catering CPH, Copenhagen private chef, office lunch Copenhagen, Morgendagens Måltid',
  },
  catering: {
    title: 'Catering in Copenhagen | Seasonal Event Menus',
    description:
      'Catering in Copenhagen for dinner parties, offices, launches, weddings, and big moments. Seasonal menus, allergy-aware planning, and fast human quotes.',
    keywords:
      'catering Copenhagen, event catering Copenhagen, wedding catering Copenhagen, office catering CPH, private dinner Copenhagen',
  },
  cleaning: {
    title: 'Eco Cleaning in Copenhagen | Morgendagens Måltid',
    description:
      'Eco-minded cleaning in Copenhagen for homes, offices, move-outs, and post-event mornings. Vetted crews, clear quotes, and own products.',
    keywords:
      'cleaning Copenhagen, eco cleaning Copenhagen, post-event cleaning Copenhagen, home cleaning CPH',
  },
  about: {
    title: 'About Morgendagens Måltid | Copenhagen Catering & Cleaning',
    description:
      'Morgendagens Måltid is a Copenhagen service company for seasonal catering, food, cleaning, and practical event support.',
    keywords:
      'Morgendagens Måltid, Copenhagen catering company, catering and cleaning Copenhagen, food service Copenhagen',
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
  url: SITE_URL,
  image: DEFAULT_IMAGE,
  logo: DEFAULT_IMAGE,
  email: 'emil@morgendagensmaaltid.dk',
  telephone: '+45 27 82 88 67',
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
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      '@type': 'LocalBusiness',
      name: SITE_NAME,
    },
  };
}

export function SEO({ active = 'home' }) {
  useEffect(() => {
    const pageKey = SEO_CONTENT[active] ? active : 'home';
    const page = SEO_CONTENT[pageKey];
    const pageUrl = pageKey === 'home' ? SITE_URL : `${SITE_URL}/#${pageKey}`;
    const robots = page.robots || 'index,follow';

    document.documentElement.lang = 'en-DK';
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
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'en_DK' });

    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: page.title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE });

    setLink('link[rel="canonical"]', { rel: 'canonical', href: pageUrl });
    setJsonLd('local-business-schema', baseLocalBusinessSchema);
    setJsonLd('page-schema', getPageSchema(pageKey, page));
  }, [active]);

  return null;
}
