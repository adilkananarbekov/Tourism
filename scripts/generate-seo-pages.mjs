import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentFilePath);
const rootDir = path.resolve(scriptsDir, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const toursPath = path.join(rootDir, 'data', 'seed_tours.json');

const SITE_NAME = 'Go Kyrgyzstan Travel';
const SITE_URL = 'https://kyrgyz.tours';
const DEFAULT_IMAGE = '/images/go-kyrgyzstan-hero.webp';
const FOUNDER_NAME = 'Jakypbekov Insan';
const FOUNDER_IMAGE = '/images/founder-jakypbekov-insan.webp';
const INSTAGRAM_URL = 'https://www.instagram.com/jakypbekovv1/';
const TELEGRAM_URL = 'https://t.me/Jakypbekovv1';
const WHATSAPP_URL = 'https://wa.me/996502099808';
const WHATSAPP_DISPLAY = '+996 502 099 808';
const SITE_DESCRIPTION =
  'Private Kyrgyzstan tours, small-group trips, nomad culture experiences, horse riding, mountain trekking, and Silk Road routes with local planning.';

function absoluteUrl(value = '/') {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseUsdPrice(price) {
  const value = Number(String(price || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_IMAGE),
    logo: absoluteUrl('/favicon.svg'),
    description: SITE_DESCRIPTION,
    sameAs: [INSTAGRAM_URL, TELEGRAM_URL, WHATSAPP_URL],
    founder: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      image: absoluteUrl(FOUNDER_IMAGE),
      sameAs: [INSTAGRAM_URL, TELEGRAM_URL],
    },
    areaServed: { '@type': 'Country', name: 'Kyrgyzstan' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Russian'],
      telephone: WHATSAPP_DISPLAY,
      url: absoluteUrl('/feedback'),
      sameAs: [TELEGRAM_URL, WHATSAPP_URL],
    },
  };
}

function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ['Kyrgyzstan tours', 'Kyrgyzstan private tours', 'Kyrgyzstan travel agency'],
    url: SITE_URL,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function tourListJsonLd(tours) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kyrgyzstan tour packages',
    itemListElement: tours.map((tour, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/tours/${tour.id}`),
      name: tour.title,
    })),
  };
}

function tourJsonLd(tour) {
  const price = parseUsdPrice(tour.price);
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${SITE_URL}/tours/${tour.id}#tour`,
    name: `${tour.title} in Kyrgyzstan`,
    description: tour.description,
    image: absoluteUrl(tour.image),
    url: absoluteUrl(`/tours/${tour.id}`),
    touristType: ['International travelers', 'Adventure travelers', 'Culture travelers'],
    provider: { '@id': `${SITE_URL}/#organization` },
    itinerary: (tour.locations || []).map((location) => ({
      '@type': 'TouristDestination',
      name: location.name,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.lat,
        longitude: location.lng,
      },
    })),
    offers: price
      ? {
          '@type': 'Offer',
          price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: absoluteUrl(`/tours/${tour.id}`),
        }
      : undefined,
  };
}

function setTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function renderPage(template, page) {
  const canonical = absoluteUrl(page.path);
  const image = absoluteUrl(page.image || DEFAULT_IMAGE);
  let html = template;

  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = setTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(page.description)}" />`
  );
  html = setTag(
    html,
    /<meta\s+name="robots"[^>]*>/,
    `<meta name="robots" content="${page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`
  );
  html = setTag(
    html,
    /<link\s+rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = setTag(
    html,
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`
  );
  html = setTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`
  );
  html = setTag(
    html,
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${canonical}" />`
  );
  html = setTag(
    html,
    /<meta\s+property="og:image"[^>]*>/,
    `<meta property="og:image" content="${image}" />`
  );

  const jsonLd = (page.jsonLd || [])
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join('\n    ');

  if (jsonLd) {
    html = html.replace('</head>', `    ${jsonLd}\n  </head>`);
  }

  return html;
}

function writeRouteHtml(routePath, html) {
  if (routePath === '/') {
    fs.writeFileSync(indexPath, html, 'utf8');
    return;
  }

  const routeDir = path.join(distDir, routePath.replace(/^\//, ''));
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf8');
}

if (!fs.existsSync(indexPath)) {
  throw new Error('dist/index.html not found. Run vite build first.');
}

const template = fs.readFileSync(indexPath, 'utf8');
const tours = JSON.parse(fs.readFileSync(toursPath, 'utf8'));

const pages = [
  {
    path: '/',
    title: `${SITE_NAME} | Kyrgyzstan Tours & Private Trips`,
    description:
      'Book private Kyrgyzstan tours with local planning: Song-Kul, Issyk-Kul, Ala-Archa, horse riding, yurt camps, Silk Road routes, private mountain trips, and canyon lake views.',
    image: DEFAULT_IMAGE,
    jsonLd: [organizationJsonLd(), websiteJsonLd(), breadcrumbJsonLd([{ name: 'Home', path: '/' }])],
  },
  {
    path: '/tours',
    title: `Kyrgyzstan Tour Packages | ${SITE_NAME}`,
    description:
      'Compare Kyrgyzstan tour packages for Song-Kul, Issyk-Kul, Ala-Archa, Silk Road heritage, horse riding, trekking, and private road trips.',
    image: DEFAULT_IMAGE,
    jsonLd: [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Tours', path: '/tours' },
      ]),
      tourListJsonLd(tours),
    ],
  },
  {
    path: '/join-tour',
    title: `Join a Group Tour in Kyrgyzstan | ${SITE_NAME}`,
    description:
      'Join a small-group Kyrgyzstan tour, meet fellow travelers, and request a shared mountain, lake, culture, or road-trip departure.',
    image: DEFAULT_IMAGE,
    jsonLd: [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Join a Group Tour', path: '/join-tour' },
      ]),
    ],
  },
  {
    path: '/gallery',
    title: `Kyrgyzstan Travel Photos & Videos | ${SITE_NAME}`,
    description:
      'See real Kyrgyzstan travel photos and videos from mountain tours, horse riding routes, yurt camps, hikes, and cultural experiences.',
    image: DEFAULT_IMAGE,
    jsonLd: [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Gallery', path: '/gallery' },
      ]),
    ],
  },
  {
    path: '/blogs',
    title: `Kyrgyzstan Travel Guide | ${SITE_NAME}`,
    description:
      'Read Kyrgyzstan travel guides, route ideas, culture notes, and trip planning stories for foreign travelers visiting Kyrgyzstan.',
    image: DEFAULT_IMAGE,
    jsonLd: [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Blogs', path: '/blogs' },
      ]),
    ],
  },
  {
    path: '/feedback',
    title: `Request a Kyrgyzstan Tour | ${SITE_NAME}`,
    description:
      'Request a private Kyrgyzstan tour or small-group trip. Send dates, group size, and contact details for personal follow-up from Go Kyrgyzstan Travel.',
    image: DEFAULT_IMAGE,
    jsonLd: [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Request a Tour', path: '/feedback' },
      ]),
    ],
  },
  ...tours.map((tour) => ({
    path: `/tours/${tour.id}`,
    title: `${tour.title} Tour in Kyrgyzstan | ${SITE_NAME}`,
    description: `${tour.description} Duration: ${tour.duration}. Starting from ${tour.price}.`,
    image: tour.image,
    jsonLd: [
      tourJsonLd(tour),
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Tours', path: '/tours' },
        { name: tour.title, path: `/tours/${tour.id}` },
      ]),
    ],
  })),
];

for (const page of pages) {
  writeRouteHtml(page.path, renderPage(template, page));
}

console.log(`Generated SEO HTML for ${pages.length} routes.`);
