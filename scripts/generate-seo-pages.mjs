import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentFilePath);
const rootDir = path.resolve(scriptsDir, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const toursPath = path.join(rootDir, 'data', 'seed_tours.json');
const blogPostsPath = path.join(rootDir, 'data', 'seed_blog_posts.json');
const russianToursPath = path.join(rootDir, 'data', 'tour_translations_ru.json');
const destinationsPath = path.join(rootDir, 'data', 'destinations.json');
const tourSlugsPath = path.join(rootDir, 'data', 'tour_slugs.json');
const galleryCaptionsPath = path.join(rootDir, 'data', 'gallery_captions.json');
const blogSeoOverridesPath = path.join(rootDir, 'data', 'blog_seo_overrides.json');
const tourMetaDescriptionsPath = path.join(rootDir, 'data', 'tour_seo_descriptions.json');
const tourMetaTitlesPath = path.join(rootDir, 'data', 'tour_seo_titles.json');

const SITE_NAME = 'Go Kyrgyzstan Travel';
const SITE_URL = 'https://kyrgyz.tours';
const DEFAULT_IMAGE = '/images/travel-gallery-2026/travel-076-960.webp';
const FOUNDER_NAME = 'Jakypbekov Insan';
const FOUNDER_IMAGE = '/images/founder-jakypbekov-insan.webp';
const INSTAGRAM_URL = 'https://www.instagram.com/jakypbekovv1/';
const TELEGRAM_URL = 'https://t.me/Jakypbekovv1';
const WHATSAPP_URL = 'https://wa.me/996700987999';
const WHATSAPP_DISPLAY = '+996 700 987 999';
const SITE_DESCRIPTION =
  'Private Kyrgyzstan tours, small-group trips, Song-Kul and Issyk-Kul lake routes, horse riding, yurt stays, and mountain road trips with local planning.';
const GALLERY_IMAGES = Array.from(
  { length: 77 },
  (_, index) => `/images/travel-gallery-2026/travel-${String(index + 1).padStart(3, '0')}-960.webp`
);

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
  const values = String(price || '')
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values?.length ? Math.min(...values) : undefined;
}

function optimizedImagePath(value, width = 960) {
  return String(value || '').replace(/\.(jpe?g)$/i, `-${width}.webp`);
}

function tourDisplayTitle(title) {
  return /\btour\b/i.test(title) ? title : `${title} Tour`;
}

function tourMetaTitle(tour, locale = 'en') {
  if (locale === 'en' && tourMetaTitles[String(tour.id)]) {
    return tourMetaTitles[String(tour.id)];
  }

  const displayTitle = tourDisplayTitle(tour.title);
  return locale === 'en' ? `${displayTitle} in Kyrgyzstan` : displayTitle;
}

function sitemapDate(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : '';
}

function shortenMetaDescription(value, limit = 160) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  const excerpt = normalized.slice(0, limit + 1);
  const sentenceEnd = Math.max(excerpt.lastIndexOf('. '), excerpt.lastIndexOf('? '), excerpt.lastIndexOf('! '));
  if (sentenceEnd >= 90) {
    return excerpt.slice(0, sentenceEnd + 1);
  }

  const wordEnd = excerpt.lastIndexOf(' ');
  return `${excerpt.slice(0, Math.max(wordEnd, 1)).trimEnd()}…`;
}

function tourMetaDescription(tour, locale = 'en') {
  if (locale === 'en' && tourMetaDescriptions[String(tour.id)]) {
    return tourMetaDescriptions[String(tour.id)];
  }
  return shortenMetaDescription(tour.description);
}

function tourSlug(tour) {
  return tourSlugs[String(tour.id)] || `tour-${tour.id}`;
}

function tourPath(tour, locale = 'en') {
  const prefix = locale === 'ru' ? '/ru' : '';
  return `${prefix}/tours/${tourSlug(tour)}`;
}

function galleryImageAlt(image, index) {
  const originalPath = image.replace(/-\d+\.webp$/i, '.jpg');
  return galleryCaptions[originalPath] || `Kyrgyzstan travel photo ${index + 1}`;
}

function localizeTourRu(tour, translations) {
  const copy = translations[String(tour.id)];
  if (!copy) {
    return tour;
  }
  return {
    ...tour,
    ...copy,
    practicalInfo: {
      ...tour.practicalInfo,
      ...(copy.practicalInfo || {}),
      difficulty: copy.difficulty || copy.practicalInfo?.difficulty || tour.practicalInfo?.difficulty,
    },
  };
}

function localeAlternates(enPath) {
  const normalized = enPath === '/' ? '/' : enPath.replace(/^\/ru(?=\/|$)/, '') || '/';
  const ruPath = normalized === '/' ? '/ru' : `/ru${normalized}`;
  return [
    { hrefLang: 'en', path: normalized },
    { hrefLang: 'ru', path: ruPath },
    { hrefLang: 'x-default', path: normalized },
  ];
}

function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_IMAGE),
    logo: absoluteUrl('/brand/kyrgyz-tours-app-icon-512.png'),
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

function tourListJsonLd(tours, locale = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'ru' ? 'Туры по Кыргызстану' : 'Kyrgyzstan tour packages',
    inLanguage: locale,
    itemListElement: tours.map((tour, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(tourPath(tour, locale)),
      name: tour.title,
    })),
  };
}

function tourJsonLd(tour, locale = 'en') {
  const price = parseUsdPrice(tour.price);
  const path = tourPath(tour, locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${SITE_URL}${path}#tour`,
    name: locale === 'ru' ? tour.title : `${tourDisplayTitle(tour.title)} in Kyrgyzstan`,
    description: tour.description,
    image: [absoluteUrl(optimizedImagePath(tour.image)), absoluteUrl(tour.image)],
    url: absoluteUrl(path),
    inLanguage: locale,
    touristType: locale === 'ru'
      ? ['Иностранные путешественники', 'Любители активного отдыха', 'Ценители культуры']
      : ['International travelers', 'Adventure travelers', 'Culture travelers'],
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
          url: absoluteUrl(path),
        }
      : undefined,
  };
}

function setTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function blogPostJsonLd(post) {
  const postPath = `/blogs/${post.slug || post.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: absoluteUrl(post.coverImage || DEFAULT_IMAGE),
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    mainEntityOfPage: absoluteUrl(postPath),
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

function faqPageJsonLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function destinationTourListJsonLd(destination, destinationTours, locale = 'en') {
  const copy = destination[locale];
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy.title,
    itemListElement: destinationTours.map((tour, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tour.title,
      url: absoluteUrl(tourPath(tour, locale)),
    })),
  };
}

function listMarkup(items, renderItem) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  return `<ul>${items.map(renderItem).join('')}</ul>`;
}

function tourSummaryMarkup(tour) {
  return `
    <article>
      <h2><a href="${tourPath(tour)}">${escapeHtml(tour.title)}</a></h2>
      <p>${escapeHtml(tour.description)}</p>
      <p><strong>Duration:</strong> ${escapeHtml(tour.duration)} · <strong>Season:</strong> ${escapeHtml(tour.season)} · <strong>Price:</strong> ${escapeHtml(tour.price)}</p>
      ${listMarkup(tour.highlights, (highlight) => `<li>${escapeHtml(highlight)}</li>`)}
    </article>`;
}

function relatedToursMarkup(tour, tours, locale = 'en') {
  const relatedTours = (tour.relatedTourIds || [])
    .map((id) => tours.find((candidate) => Number(candidate.id) === Number(id)))
    .filter(Boolean);
  if (!relatedTours.length) {
    return '';
  }
  const title = locale === 'ru' ? 'Похожие маршруты' : 'Related Kyrgyzstan tours';
  const duration = locale === 'ru' ? 'Продолжительность' : 'Duration';
  return `
    <section>
      <h2>${title}</h2>
      <ul>${relatedTours.map((relatedTour) => {
        return `<li><a href="${tourPath(relatedTour, locale)}">${escapeHtml(relatedTour.title)}</a> — ${duration}: ${escapeHtml(relatedTour.duration)}</li>`;
      }).join('')}</ul>
    </section>`;
}

function seoContentMarkup(tour, locale = 'en') {
  const seoContent = tour.seoContent;
  if (!seoContent) {
    return '';
  }
  const paragraphs = Array.isArray(seoContent.paragraphs)
    ? seoContent.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
    : '';
  const faq = Array.isArray(seoContent.faq) && seoContent.faq.length
    ? `<h3>${locale === 'ru' ? 'Частые вопросы' : 'Common questions'}</h3><dl>${seoContent.faq.map((item) => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}</dl>`
    : '';
  return `<section><h2>${escapeHtml(seoContent.heading || 'Route notes')}</h2>${paragraphs}${faq}</section>`;
}

function tourDetailMarkup(tour, tours) {
  const isRouteOutline = (tour.itinerary || []).some((day) => /Today is paced around weather, road conditions|День проходит в соответствии с погодой, дорожной обстановкой и темпом группы/i.test(day.description));
  const itinerary = listMarkup(tour.itinerary, (day) => `
    <li>
      <h3>Day ${escapeHtml(day.day)}: ${escapeHtml(day.title)}</h3>
      <p>${escapeHtml(day.description)}</p>
    </li>`);
  const practicalInfo = tour.practicalInfo || {};
  const quoteBasedInclusions = (practicalInfo.included || []).every((item) => /confirm|planning|соглас|планирован/i.test(item));

  return `
    <article>
      <p><a href="/tours">All Kyrgyzstan tours</a></p>
      <h1>${escapeHtml(tourDisplayTitle(tour.title))} in Kyrgyzstan</h1>
      <p>${escapeHtml(tour.description)}</p>
      <p><strong>Duration:</strong> ${escapeHtml(tour.duration)} · <strong>Tour type:</strong> ${escapeHtml(tour.tourType)} · <strong>Season:</strong> ${escapeHtml(tour.season)} · <strong>Price:</strong> ${escapeHtml(tour.price)}</p>
      <h2>Tour highlights</h2>
      ${listMarkup(tour.highlights, (highlight) => `<li>${escapeHtml(highlight)}</li>`)}
      <h2>${isRouteOutline ? 'Route outline' : 'Day-by-day itinerary'}</h2>
      ${isRouteOutline ? '<p>This is a planning outline, not a confirmed daily schedule. We will agree the timing, overnight stays, and included services in your written itinerary and quote before confirmation.</p>' : ''}
      ${itinerary}
      <h2>Practical information</h2>
      <p><strong>Accommodation:</strong> ${escapeHtml(practicalInfo.accommodation)}</p>
      <p><strong>Meals:</strong> ${escapeHtml(practicalInfo.meals)}</p>
      <p><strong>Difficulty:</strong> ${escapeHtml(practicalInfo.difficulty)}</p>
      <p><strong>Group size:</strong> ${escapeHtml(practicalInfo.groupSize)}</p>
      <h2>${quoteBasedInclusions ? 'Services to agree in your quote' : 'What is included'}</h2>
      ${listMarkup(practicalInfo.included, (item) => `<li>${escapeHtml(item)}</li>`)}
      <h2>Not included</h2>
      ${listMarkup(practicalInfo.notIncluded, (item) => `<li>${escapeHtml(item)}</li>`)}
      <h2>What to pack</h2>
      ${listMarkup(tour.packingList, (item) => `<li>${escapeHtml(item)}</li>`)}
      ${seoContentMarkup(tour)}
      ${relatedToursMarkup(tour, tours)}
      <p>Ask for dates and a full quote for your group. The itinerary, included services, final price and trip conditions are agreed in writing before confirmation. Sending a request or selecting a date does not take payment or reserve places.</p>
      <p><a href="${tourPath(tour)}#booking">Request dates and a quote for this tour</a> · <a href="/terms-of-use#booking">Booking, changes and cancellation</a></p>
    </article>`;
}

function blogPostMarkup(post) {
  const routeLinks = {
    'best-time-to-visit-kyrgyzstan': [
      ['Plan by season: compare Song-Kul summer routes', '/destinations/song-kul'],
      ['See the winter Song-Kul horse ride', tourPath({ id: 6 })],
    ],
    'song-kul-lake-travel-guide': [
      ['Compare Song-Kul tours and horseback routes', '/destinations/song-kul'],
    ],
    'issyk-kul-road-trip-guide': [
      ['Compare private Issyk-Kul routes', '/destinations/issyk-kul'],
      ['See the 3-day Issyk-Kul tour from Bishkek', tourPath({ id: 7 })],
      ['See the 4-day Issyk-Kul gorges and hot springs tour', tourPath({ id: 10 })],
    ],
    'kyrgyzstan-horse-riding-guide': [
      ['See the 2-day Song-Kul horse ride', tourPath({ id: 4 })],
      ['See the 3-day Kyzart horse trek', tourPath({ id: 2 })],
    ],
    'ala-archa-day-trip-guide': [
      ['Request a private hiking plan', '/feedback'],
    ],
    'karakol-kyrgyzstan-guide': [
      ['Explore the Issyk-Kul place hub', '/destinations/issyk-kul'],
      ['Read the Issyk-Kul road-trip guide', '/blogs/issyk-kul-road-trip-guide'],
    ],
    'skazka-canyon-kyrgyzstan-guide': [
      ['Explore Issyk-Kul places', '/destinations/issyk-kul'],
      ['Check the seasonal guide', '/blogs/best-time-to-visit-kyrgyzstan'],
    ],
    'jeti-oguz-red-rocks-guide': [
      ['Read the Karakol place guide', '/blogs/karakol-kyrgyzstan-guide'],
      ['Explore the Issyk-Kul place hub', '/destinations/issyk-kul'],
    ],
    'burana-tower-guide': [
      ['Choose a realistic travel month', '/blogs/best-time-to-visit-kyrgyzstan'],
      ['Browse more place guides', '/blogs'],
    ],
  }[post.slug] || [];
  const isPlaceGuide = post.category === 'Places';
  const internalLinks = routeLinks.length
    ? `<aside><h2>Plan the next step</h2><p>${routeLinks.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p></aside>`
    : '';
  const faq = Array.isArray(post.faq) && post.faq.length
    ? `<section><h2>${isPlaceGuide ? `Frequently asked questions about ${escapeHtml(post.title.split(':')[0].replace(/^Why Visit\s+/i, ''))}` : 'Frequently asked questions about Kyrgyzstan travel seasons'}</h2><dl>${post.faq.map((item) => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}</dl></section>`
    : '';
  return `
    <article>
      <p><a href="/blogs">All Kyrgyzstan travel guides</a></p>
      <p>${escapeHtml(post.category || 'Travel Guide')} · ${escapeHtml(post.readTime || '')}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.excerpt)}</p>
      ${post.quickAnswer ? `<aside><h2>${escapeHtml(post.quickAnswer.heading)}</h2><p>${escapeHtml(post.quickAnswer.text)}</p><p>${post.quickAnswer.links.map(link => `<a href="${escapeHtml(link.path)}">${escapeHtml(link.label)}</a>`).join(' · ')}</p></aside>` : ''}
      ${post.content || ''}
      ${faq}
      ${internalLinks}
      <p><a href="${isPlaceGuide ? '/blogs' : '/feedback'}">${isPlaceGuide ? 'Browse more Kyrgyzstan place guides' : 'Request a private Kyrgyzstan itinerary'}</a></p>
    </article>`;
}

function russianTourSummaryMarkup(tour) {
  return `
    <article>
      <h2><a href="${tourPath(tour, 'ru')}">${escapeHtml(tour.title)}</a></h2>
      <p>${escapeHtml(tour.description)}</p>
      <p><strong>Продолжительность:</strong> ${escapeHtml(tour.duration)} · <strong>Сезон:</strong> ${escapeHtml(tour.season)} · <strong>Стоимость:</strong> ${escapeHtml(tour.price)}</p>
      ${listMarkup(tour.highlights, (highlight) => `<li>${escapeHtml(highlight)}</li>`)}</article>`;
}

function destinationStaticMarkup(page, locale = 'en') {
  const destination = page.destination;
  const copy = destination[locale];
  const destinationTours = page.destinationTours || [];
  const prefix = locale === 'ru' ? '/ru' : '';
  const labels = locale === 'ru'
    ? {
        allTours: 'Все туры по Кыргызстану',
        routes: copy.routeHeading,
        planning: copy.planningHeading,
        experience: copy.experienceHeading,
        faq: copy.faqHeading,
        request: copy.ctaPrimary,
        duration: 'Продолжительность',
        type: 'Формат',
      }
    : {
        allTours: 'All Kyrgyzstan tours',
        routes: copy.routeHeading,
        planning: copy.planningHeading,
        experience: copy.experienceHeading,
        faq: copy.faqHeading,
        request: copy.ctaPrimary,
        duration: 'Duration',
        type: 'Travel style',
      };

  return `
    <article>
      <p><a href="${prefix || '/'}">${locale === 'ru' ? 'Главная' : 'Home'}</a> · <a href="${prefix}/tours">${labels.allTours}</a></p>
      <h1>${escapeHtml(copy.title)}</h1>
      <p>${escapeHtml(copy.intro)}</p>
      <dl>
        ${copy.facts.map((fact) => `<dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd>`).join('')}
      </dl>
      <h2>${escapeHtml(labels.routes)}</h2>
      <p>${escapeHtml(copy.routeIntro)}</p>
      ${destinationTours.map((tour) => `
        <article>
          <h3><a href="${tourPath(tour, locale)}">${escapeHtml(tour.title)}</a></h3>
          <p>${escapeHtml(tour.description)}</p>
          <p><strong>${labels.duration}:</strong> ${escapeHtml(tour.duration)} · <strong>${labels.type}:</strong> ${escapeHtml(tour.tourType)} · <strong>${locale === 'ru' ? 'Сезон' : 'Season'}:</strong> ${escapeHtml(tour.season)}</p>
        </article>`).join('')}
      <h2>${escapeHtml(labels.planning)}</h2>
      ${listMarkup(copy.planningItems, (item) => `<li>${escapeHtml(item)}</li>`)}
      <h2>${escapeHtml(labels.experience)}</h2>
      ${copy.experienceItems.map((item) => `<section><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></section>`).join('')}
      <h2>${escapeHtml(labels.faq)}</h2>
      <dl>${copy.faq.map((item) => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}</dl>
      <p><a href="${prefix}/feedback?tour=${encodeURIComponent(copy.title)}">${labels.request}</a> · <a href="${prefix}/tours">${labels.allTours}</a></p>
    </article>`;
}

function russianStaticContentMarkup(page, tours) {
  if (page.destination) {
    return destinationStaticMarkup(page, 'ru');
  }

  if (page.tour) {
    const practicalInfo = page.tour.practicalInfo || {};
    const quoteBasedInclusions = (practicalInfo.included || []).every((item) => /confirm|planning|соглас|планирован/i.test(item));
    const isRouteOutline = (page.tour.itinerary || []).some((day) => /Today is paced around weather, road conditions|День проходит в соответствии с погодой, дорожной обстановкой и темпом группы/i.test(day.description));
    return `
      <article>
        <p><a href="/ru/tours">Все туры по Кыргызстану</a></p>
        <h1>${escapeHtml(page.tour.title)}</h1>
        <p>${escapeHtml(page.tour.description)}</p>
        <p><strong>Продолжительность:</strong> ${escapeHtml(page.tour.duration)} · <strong>Формат:</strong> ${escapeHtml(page.tour.tourType)} · <strong>Сезон:</strong> ${escapeHtml(page.tour.season)} · <strong>Цена:</strong> ${escapeHtml(page.tour.price)}</p>
        <h2>Главные впечатления</h2>
        ${listMarkup(page.tour.highlights, (item) => `<li>${escapeHtml(item)}</li>`)}
        <h2>${isRouteOutline ? 'План маршрута' : 'Программа по дням'}</h2>
        ${isRouteOutline ? '<p>Это ориентир для планирования, а не подтверждённая программа по дням. До бронирования согласуем время переездов и активностей, места ночёвок и включённые услуги в письменной программе и расчёте.</p>' : ''}
        ${listMarkup(page.tour.itinerary, (day) => `<li><h3>День ${escapeHtml(day.day)}: ${escapeHtml(day.title)}</h3><p>${escapeHtml(day.description)}</p></li>`)}
        <h2>Практическая информация</h2>
        <p><strong>Размещение:</strong> ${escapeHtml(practicalInfo.accommodation)}</p>
        <p><strong>Питание:</strong> ${escapeHtml(practicalInfo.meals)}</p>
        <p><strong>Сложность:</strong> ${escapeHtml(practicalInfo.difficulty)}</p>
        <p><strong>Размер группы:</strong> ${escapeHtml(practicalInfo.groupSize)}</p>
        <h2>${quoteBasedInclusions ? 'Услуги для согласования в расчёте' : 'Что включено'}</h2>
        ${listMarkup(practicalInfo.included, (item) => `<li>${escapeHtml(item)}</li>`)}
        <h2>Не включено</h2>
        ${listMarkup(practicalInfo.notIncluded, (item) => `<li>${escapeHtml(item)}</li>`)}
        ${seoContentMarkup(page.tour, 'ru')}
        ${relatedToursMarkup(page.tour, tours, 'ru')}
        <p>Запросите даты и полный расчёт для своей группы. Программу, состав услуг, итоговую цену и условия поездки согласуем письменно до подтверждения. Отправка заявки или выбор даты не списывают деньги и не резервируют места.</p>
        <p><a href="${tourPath(page.tour, 'ru')}#booking">Запросить даты и стоимость этого тура</a> · <a href="/ru/terms-of-use#booking">Бронирование, изменения и отмена</a></p>
      </article>`;
  }

  if (page.path === '/ru') {
    const hotTours = [6, 1, 2]
      .map((id) => tours.find((tour) => Number(tour.id) === id))
      .filter(Boolean);
    return `
      <h1>Туры по Кыргызстану: частные поездки и горные маршруты</h1>
      <p>Планируйте путешествие по Кыргызстану с локальной командой: Иссык-Куль, Сон-Куль, Кель-Суу, конные маршруты, юрты и горные автопутешествия.</p>
      <h2>Идеи сезонных маршрутов</h2>
      <p>Выберите интересующий маршрут и сообщите даты: доступность дорог, размещения и активностей уточняется для каждой поездки.</p>
      ${hotTours.map(russianTourSummaryMarkup).join('')}
      <h2>Инсан Жакыпбеков — организатор вашей поездки</h2>
      <p>Kyrgyz.tours — сайт Go Kyrgyzstan Travel. Инсан, основатель проекта, и местная команда в Бишкеке помогают выбрать маршрут и согласуют детали напрямую. Мы общаемся на английском, русском и кыргызском; язык гида уточняется для каждой поездки.</p>
      <p>Отправьте даты, интересы и размер группы. До бронирования согласуем в переписке программу, итоговую цену, включённые услуги и условия поездки.</p>
      <p><a href="/ru/destinations/song-kul">Туры на Сон-Куль и конные маршруты</a> · <a href="/ru/destinations/issyk-kul">Туры на Иссык-Куль из Бишкека</a> · <a href="/ru/destinations/kel-suu">Туры на Кель-Суу</a> · <a href="/ru/tours">Смотреть все туры</a> · <a href="/ru/feedback">Подобрать маршрут</a></p>`;
  }

  if (page.path === '/ru/tours') {
    return `
      <h1>Туры по Кыргызстану</h1>
      <p>Готовые маршруты к озёрам и горам Кыргызстана: Иссык-Куль, Сон-Куль, Кель-Суу, конные туры и горные автопутешествия.</p>
      ${tours.map(russianTourSummaryMarkup).join('')}
      <p><a href="/ru/feedback">Оставить заявку на тур</a></p>`;
  }

  if (page.path === '/ru/feedback') {
    return `
      <h1>Ваша поездка по Кыргызстану</h1>
      <p>Расскажите о датах, компании и местах, которые хотите увидеть. Инсан или наша местная команда помогут подобрать маршрут и рассчитать стоимость.</p>
      <p>Достаточно одного контакта для переписки: WhatsApp, Telegram или email. Маршрут, даты и пожелания можно уточнить позже. Отправка формы не списывает деньги и не бронирует места.</p>
      <h2>Что указать в заявке</h2>
      <ul><li>Даты или удобный месяц</li><li>Количество путешественников</li><li>Озёра, горы и желаемые активности</li><li>Уровень размещения и ориентировочный бюджет</li></ul>
      <p><a href="/ru/terms-of-use#booking">Как проходит бронирование и согласование условий</a></p>`;
  }

  if (page.path === '/ru/privacy-policy') {
    return `
      <h1>Политика конфиденциальности и cookies</h1>
      <p>Мы объясняем, как обрабатываем заявки на поездки, анонимную аналитику и настройки cookies.</p>
      <h2>Анонимная аналитика по согласию</h2>
      <p>После отдельного согласия сайт фиксирует просмотренные страницы, клики по турам и глубину чтения. Мы не используем рекламные пиксели, fingerprinting или запись экрана.</p>
      <h2>Ваш выбор</h2>
      <p>Вы можете в любое время отказаться от аналитики в настройках cookies. Для вопроса конфиденциальности используйте <a href="/ru/feedback">форму заявки</a>.</p>`;
  }

  if (page.path === '/ru/terms-of-use') {
    return `
      <h1>Условия использования</h1>
      <p>Сайт помогает изучить туры по Кыргызстану и отправить запрос. Заявка не является подтверждённым бронированием.</p>
      <h2 id="booking">Заявка не является бронированием</h2>
      <p>Бронирование подтверждается только после письменного согласования маршрута, стоимости, условий и оплаты с командой. На этом сайте оплата поездок не принимается.</p>
      <h2>Что происходит после заявки</h2>
      <ol><li>Команда отвечает по выбранному WhatsApp, Telegram или email, обсуждает маршрут и проверяет доступность на ваши даты.</li><li>Вы рассматриваете письменную программу и подробный расчёт: состав услуг, исключения, валюту, размер группы и организатора поездки.</li><li>До оплаты согласуйте письменно предоплату, срок внесения остатка, условия отмены и получателя платежа.</li><li>Получите письменное подтверждение. Отправка формы или выбор даты в календаре сами по себе не резервируют места.</li></ol>
      <h2 id="changes-and-cancellation">Изменения, отмена и возврат</h2>
      <p>На сайте не опубликован единый размер предоплаты или график отмены для всех маршрутов. Условия зависят от согласованной поездки и поставщиков; не считайте платёж автоматически возвратным.</p>
      <p>До принятия обязательств запросите в письменном предложении сроки отмены, удержания и возвращаемые суммы. Уточните действия при отмене организатором, закрытии дороги или невозможности провести активность из-за погоды, а также способ и срок согласованного возврата.</p>
      <p>Для изменения или отмены напишите команде в существующей переписке и укажите номер заявки или бронирования. Попросите письменное подтверждение получения и влияния изменений на программу и стоимость. Эти пояснения не заменяют условия конкретного бронирования и обязательные права по закону.</p>
      <p><a href="/ru/feedback">Задать вопрос о поездке</a> · <a href="/ru/privacy-policy">Политика конфиденциальности</a></p>`;
  }

  return `<h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p>`;
}

function staticContentMarkup(page, tours) {
  let content = '';

  if (page.locale === 'ru') {
    content = russianStaticContentMarkup(page, tours);
  } else if (page.destination) {
    content = destinationStaticMarkup(page);
  } else if (page.tour) {
    content = tourDetailMarkup(page.tour, tours);
  } else if (page.blogPost) {
    content = blogPostMarkup(page.blogPost);
  } else if (page.path === '/') {
    const hotTourIds = new Set([6, 1, 2]);
    const hotTours = [
      ...tours.filter((tour) => tour.isHot),
      ...tours.filter((tour) => hotTourIds.has(Number(tour.id))),
      ...tours,
    ].filter((tour, index, items) => items.findIndex((item) => item.id === tour.id) === index).slice(0, 3);
    content = `
      <h1>Private Kyrgyzstan Tours &amp; Mountain Trips</h1>
      <p>Plan a flexible private trip in Kyrgyzstan with local support: Song-Kul, Issyk-Kul, and Kel-Suu lakes, horse riding, yurt stays, and mountain road trips from Bishkek.</p>
      <h2>Seasonal route ideas</h2>
      <p>Explore a route that interests you and share your travel dates. Road access, accommodation and activities are checked for each trip before confirmation.</p>
      ${hotTours.map(tourSummaryMarkup).join('')}
      <h2>Compare Kyrgyzstan tour packages</h2>
      ${tours.map(tourSummaryMarkup).join('')}
      <h2>Meet your trip planner: ${escapeHtml(FOUNDER_NAME)}</h2>
      <p>Kyrgyz.tours is the website of Go Kyrgyzstan Travel. Insan, our founder, and our local team in Bishkek help you choose a route and agree the details with you directly. Talk to us in English, Russian or Kyrgyz; the guide’s language is confirmed for each trip.</p>
      <p>Share your dates, group size and interests. Before you book, we agree the itinerary, full price, included services and trip conditions in writing.</p>
      <p><a href="/destinations/song-kul">Explore Song-Kul tours and horseback routes</a> · <a href="/destinations/issyk-kul">Explore Issyk-Kul tours from Bishkek</a> · <a href="/destinations/kel-suu">Explore Kel-Suu tours</a> · <a href="/tours">Compare all tours</a> · <a href="/feedback">Request a custom tour</a></p>`;
  } else if (page.path === '/tours') {
    content = `
      <h1>Kyrgyzstan Tour Packages</h1>
      <p>Compare private and small-group routes for Song-Kul, Issyk-Kul, Kel-Suu, horse riding, yurt stays, and scenic mountain road trips from Bishkek.</p>
      <h2>Start with a route that matches your trip</h2>
      <ul>
        <li><a href="/destinations/song-kul">Song-Kul tours and horseback routes</a>: choose a route by your available days and riding experience.</li>
        <li><a href="/destinations/issyk-kul">Issyk-Kul tours from Bishkek</a>: compare a 3-day lake introduction or a 4-day gorges and hot springs route.</li>
        <li><a href="/destinations/kel-suu">Kel-Suu tours</a>: compare a focused mountain-lake route with a longer Kyrgyzstan lakes itinerary.</li>
        <li><a href="/blogs/best-time-to-visit-kyrgyzstan">Read the best time to visit Kyrgyzstan guide</a> before selecting a high-altitude route.</li>
      </ul>
      ${tours.map(tourSummaryMarkup).join('')}
      <p><a href="/feedback">Request a custom Kyrgyzstan itinerary</a></p>`;
  } else if (page.path === '/join-tour') {
    content = `
      <h1>Join a Small-Group Tour in Kyrgyzstan</h1>
      <p>Share your travel dates and preferred route to join a compatible small group for a mountain, lake, culture, or road-trip departure.</p>
      <h2>How group matching works</h2>
      <ol><li>Send your dates and interests.</li><li>We compare compatible requests.</li><li>You receive route, group-size, and price details before confirming.</li></ol>
      <p><a href="/feedback">Send a group-tour request</a></p>`;
  } else if (page.path === '/gallery') {
    content = `
      <h1>Kyrgyzstan Travel Photo Gallery</h1>
      <p>See mountain landscapes, high-altitude lakes, yurt camps, horse-riding routes, trekking days, and cultural experiences from trips across Kyrgyzstan.</p>
      <div class="seo-gallery">${GALLERY_IMAGES.map((image, index) => `<figure><img src="${escapeHtml(image)}" alt="${escapeHtml(galleryImageAlt(image, index))}" loading="lazy" width="960" height="640" /><figcaption>${escapeHtml(galleryImageAlt(image, index))}</figcaption></figure>`).join('')}</div>
      <p><a href="/tours">Explore the routes shown in the gallery</a></p>`;
  } else if (page.path === '/blogs') {
    content = `
      <h1>Kyrgyzstan Travel Guide</h1>
      <p>Practical guides for seasons, mountain roads, yurt stays, hiking, horse riding, Issyk-Kul, Song-Kul, and private route planning.</p>
      ${blogPosts.map((post) => `
        <article>
          <h2><a href="/blogs/${escapeHtml(post.slug || post.id)}">${escapeHtml(post.title)}</a></h2>
          <p>${escapeHtml(post.excerpt)}</p>
        </article>`).join('')}
      <p><a href="/tours">Browse Kyrgyzstan tours</a> · <a href="/feedback">Ask a trip-planning question</a></p>`;
  } else if (page.path === '/feedback') {
    content = `
      <h1>Your trip to Kyrgyzstan</h1>
      <p>Tell us when you would like to travel, who is coming, and what you want to see. Insan or our local team will help shape your route and prepare a quote.</p>
      <p>We only need one contact for a written reply: WhatsApp, Telegram or email. Your route, dates and preferences can be decided later. Sending this form does not take payment or reserve places.</p>
      <h2>Useful details to include</h2>
      <ul><li>Arrival and departure dates</li><li>Number of travelers</li><li>Preferred lakes, mountains, and activities</li><li>Accommodation level and approximate budget</li></ul>
      <p><a href="/terms-of-use#booking">How booking and agreeing the terms work</a></p>`;
  } else if (page.path === '/privacy-policy') {
    content = `
      <h1>Privacy Policy and Cookie Policy</h1>
      <p>This policy explains how Go Kyrgyzstan Travel handles trip requests, anonymous analytics, cookies, and privacy choices.</p>
      <h2>Optional anonymous analytics</h2>
      <p>Only after consent, the site records viewed pages, tour clicks, and reading depth. We do not use advertising pixels, fingerprinting, or session recording.</p>
      <h2>Your choices</h2>
      <p>You can withdraw analytics consent at any time in cookie settings. For a privacy request, use the <a href="/feedback">trip request form</a>.</p>`;
  } else if (page.path === '/terms-of-use') {
    content = `
      <h1>Terms of Use</h1>
      <p>This website helps you explore Kyrgyzstan tours and send a travel request. A request is not a confirmed booking.</p>
      <h2 id="booking">Requests are not bookings</h2>
      <p>A booking is confirmed only after the itinerary, price, terms and payment arrangements have been agreed with the team in writing. This website does not collect trip payments.</p>
      <h2>What happens after your enquiry</h2>
      <ol><li>The team replies through your selected WhatsApp, Telegram or email, discusses the route and checks availability for your dates.</li><li>Review a written itinerary and itemised quotation, including inclusions, exclusions, currency, group size and the trip organiser.</li><li>Before paying, agree the deposit, balance deadline, cancellation conditions and payment recipient in writing.</li><li>Obtain written confirmation. Sending the form or selecting a calendar date alone does not reserve places.</li></ol>
      <h2 id="changes-and-cancellation">Changes, cancellations and refunds</h2>
      <p>There is no single deposit amount or cancellation schedule published for every route. Conditions depend on the agreed trip and its suppliers; do not assume that a deposit or payment is refundable.</p>
      <p>Before committing, ask for the cancellation deadlines, charges and any refundable amounts in your written proposal. Clarify what happens if the organiser cancels, a road closes or weather prevents an activity, and how and when any agreed refund would be paid.</p>
      <p>To request a change or cancellation, write through your existing trip conversation and include your request or booking reference. Ask for written acknowledgement and the effect on your itinerary and price before accepting a replacement. These notes do not replace your individual booking terms or any mandatory rights.</p>
      <p><a href="/feedback">Ask a trip question</a> · <a href="/privacy-policy">Privacy Policy</a></p>`;
  } else {
    content = `<h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p>`;
  }

  return `<main data-static-seo-content="true" style="max-width:72rem;margin:0 auto;padding:2rem 1rem;font-family:system-ui,sans-serif;line-height:1.6">${content}</main>`;
}

function renderPage(template, page) {
  const canonical = absoluteUrl(page.path);
  const image = absoluteUrl(page.image || DEFAULT_IMAGE);
  const language = page.locale || 'en';
  let html = template;

  html = html.replace(/<html\s+lang="[^"]*">/, `<html lang="${language}">`);

  html = setTag(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title data-static-seo-head="true">${escapeHtml(page.title)}</title>`
  );
  html = setTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta data-static-seo-head="true" name="description" content="${escapeHtml(page.description)}" />`
  );
  html = setTag(
    html,
    /<meta\s+name="robots"[^>]*>/,
    `<meta data-static-seo-head="true" name="robots" content="${page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`
  );
  html = setTag(
    html,
    /<link\s+rel="canonical"[^>]*>/,
    `<link data-static-seo-head="true" rel="canonical" href="${canonical}" />`
  );
  if (page.alternates?.length) {
    const alternateLinks = page.alternates
      .map((alternate) => `<link data-static-seo-head="true" rel="alternate" hreflang="${escapeHtml(alternate.hrefLang)}" href="${escapeHtml(absoluteUrl(alternate.path))}" />`)
      .join('\n    ');
    html = html.replace('</head>', `    ${alternateLinks}\n  </head>`);
  }
  html = setTag(
    html,
    /<meta\s+property="og:title"[^>]*>/,
    `<meta data-static-seo-head="true" property="og:title" content="${escapeHtml(page.title)}" />`
  );
  html = setTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta data-static-seo-head="true" property="og:description" content="${escapeHtml(page.description)}" />`
  );
  html = setTag(
    html,
    /<meta\s+property="og:url"[^>]*>/,
    `<meta data-static-seo-head="true" property="og:url" content="${canonical}" />`
  );
  html = setTag(
    html,
    /<meta\s+property="og:image"[^>]*>/,
    `<meta data-static-seo-head="true" property="og:image" content="${image}" />`
  );
  html = html.replace(
    /<meta\s+property="og:locale"[^>]*>/,
    `<meta data-static-seo-head="true" property="og:locale" content="${language === 'ru' ? 'ru_RU' : 'en_US'}" />`
  );
  html = setTag(
    html,
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta data-static-seo-head="true" name="twitter:title" content="${escapeHtml(page.title)}" />`
  );
  html = setTag(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta data-static-seo-head="true" name="twitter:description" content="${escapeHtml(page.description)}" />`
  );
  html = setTag(
    html,
    /<meta\s+name="twitter:image"[^>]*>/,
    `<meta data-static-seo-head="true" name="twitter:image" content="${image}" />`
  );

  const jsonLd = (page.jsonLd || [])
    .map((item) => `<script data-static-seo="true" data-static-seo-head="true" type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ');

  if (jsonLd) {
    html = html.replace('</head>', `    ${jsonLd}\n  </head>`);
  }

  if (page.preloadImage) {
    const preload = page.preloadImage;
    const srcSet = preload.srcSet
      ? ` imagesrcset="${escapeHtml(preload.srcSet)}"`
      : '';
    const sizes = preload.sizes
      ? ` imagesizes="${escapeHtml(preload.sizes)}"`
      : '';
    const media = preload.media
      ? ` media="${escapeHtml(preload.media)}"`
      : '';
    html = html.replace(
      '</head>',
      `    <link rel="preload" as="image" href="${escapeHtml(preload.href)}"${srcSet}${sizes}${media} fetchpriority="high" />\n  </head>`
    );
  }

  html = html.replace(
    /<div\s+id="root">\s*<\/div>/,
    `<div id="root">${staticContentMarkup(page, tours)}</div>`
  );

  html = html.replace(
    'aria-label="Loading page"',
    `aria-label="${language === 'ru' ? 'Загружаем страницу' : 'Loading page'}"`
  );

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
const russianTourTranslations = JSON.parse(fs.readFileSync(russianToursPath, 'utf8'));
const tourSlugs = JSON.parse(fs.readFileSync(tourSlugsPath, 'utf8'));
const galleryCaptions = JSON.parse(fs.readFileSync(galleryCaptionsPath, 'utf8'));
const blogSeoOverrides = JSON.parse(fs.readFileSync(blogSeoOverridesPath, 'utf8'));
const tourMetaDescriptions = JSON.parse(fs.readFileSync(tourMetaDescriptionsPath, 'utf8'));
const tourMetaTitles = JSON.parse(fs.readFileSync(tourMetaTitlesPath, 'utf8'));
const russianTours = tours.map((tour) => localizeTourRu(tour, russianTourTranslations));
const blogPosts = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8'))
  .filter((post) => post.status !== 'draft' && post.status !== 'archived')
  .map((post) => ({ ...post, ...(blogSeoOverrides[post.slug] || {}) }));
const destinations = JSON.parse(fs.readFileSync(destinationsPath, 'utf8'));

function selectDestinationTours(destination, sourceTours) {
  const toursById = new Map(sourceTours.map((tour) => [Number(tour.id), tour]));
  return (destination.tourIds || [])
    .map((tourId) => toursById.get(Number(tourId)))
    .filter(Boolean);
}

const pages = [
  {
    path: '/',
    title: `${SITE_NAME} | Kyrgyzstan Tours & Private Trips`,
    description:
      'Book private Kyrgyzstan tours with local planning: Song-Kul, Issyk-Kul, Kel-Suu, horse riding, yurt camps, and flexible mountain road trips from Bishkek.',
    image: DEFAULT_IMAGE,
    images: [
      DEFAULT_IMAGE,
      '/images/founder-jakypbekov-insan-960.webp',
      ...tours.map((tour) => optimizedImagePath(tour.image)),
    ],
    preloadImage: {
      href: '/images/travel-gallery-2026/travel-076-480.webp',
      srcSet: '/images/travel-gallery-2026/travel-076-480.webp 480w, /images/travel-gallery-2026/travel-076-960.webp 960w',
      sizes: '100vw',
    },
    jsonLd: [organizationJsonLd(), websiteJsonLd(), breadcrumbJsonLd([{ name: 'Home', path: '/' }])],
  },
  {
    path: '/tours',
    title: `Kyrgyzstan Tour Packages | ${SITE_NAME}`,
    description:
      'Compare private Kyrgyzstan tour packages for Song-Kul, Issyk-Kul, Kel-Suu, horse riding, yurt stays, and flexible mountain road trips from Bishkek.',
    image: DEFAULT_IMAGE,
    images: tours.map((tour) => optimizedImagePath(tour.image)),
    preloadImage: {
      href: optimizedImagePath(tours[0].image, 480),
      media: '(max-width: 767px)',
    },
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
    images: GALLERY_IMAGES,
    preloadImage: {
      href: '/images/gallery/video-poster-480.webp',
      media: '(max-width: 767px)',
    },
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
      'Practical Kyrgyzstan travel guides for Song-Kul, Issyk-Kul, Ala-Archa, horse riding, road trips, seasons, and private tour planning.',
    image: DEFAULT_IMAGE,
    images: blogPosts.map((post) => post.coverImage).filter(Boolean),
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
  {
    path: '/privacy-policy',
    title: `Privacy Policy & Cookie Policy | ${SITE_NAME}`,
    description: 'Learn how Go Kyrgyzstan Travel handles tour requests, anonymous consented analytics, cookies, and privacy choices.',
    image: DEFAULT_IMAGE,
    jsonLd: [breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Privacy Policy', path: '/privacy-policy' }])],
  },
  {
    path: '/terms-of-use',
    title: `Terms of Use | ${SITE_NAME}`,
    description: 'Read the terms for using the Go Kyrgyzstan Travel website and requesting Kyrgyzstan trip information.',
    image: DEFAULT_IMAGE,
    jsonLd: [breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Terms of Use', path: '/terms-of-use' }])],
  },
  ...destinations.map((destination) => {
    const destinationTours = selectDestinationTours(destination, tours);
    return {
      path: `/destinations/${destination.slug}`,
      destination,
      destinationTours,
      title: `${destination.en.seoTitle} | ${SITE_NAME}`,
      description: destination.en.metaDescription,
      lastmod: sitemapDate(destination.updatedAt),
      image: destination.heroImage,
      images: [optimizedImagePath(destination.heroImage)],
      preloadImage: {
        href: optimizedImagePath(destination.heroImage, 480),
        media: '(max-width: 767px)',
      },
      jsonLd: [
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: destination.en.title, path: `/destinations/${destination.slug}` },
        ]),
        destinationTourListJsonLd(destination, destinationTours),
        faqPageJsonLd(destination.en.faq),
      ],
    };
  }),
  ...tours.map((tour) => ({
    path: tourPath(tour),
    tour,
    title: `${tourMetaTitle(tour)} | ${SITE_NAME}`,
    description: tourMetaDescription(tour),
    lastmod: sitemapDate(tour.updatedAt || tour.createdAt),
    image: tour.image,
    images: [optimizedImagePath(tour.image)],
    preloadImage: {
      href: optimizedImagePath(tour.image, 480),
      media: '(max-width: 767px)',
    },
    jsonLd: [
      tourJsonLd(tour),
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Tours', path: '/tours' },
        { name: tour.title, path: tourPath(tour) },
      ]),
    ],
  })),
  ...blogPosts.map((post) => {
    const postPath = `/blogs/${post.slug || post.id}`;
    return {
      path: postPath,
      blogPost: post,
      title: `${post.seoTitle || post.title} | ${SITE_NAME}`,
      description: post.seoDescription || post.excerpt,
      lastmod: sitemapDate(post.updatedAt || post.publishedAt || post.createdAt),
      image: post.coverImage || DEFAULT_IMAGE,
      images: [post.coverImage || DEFAULT_IMAGE],
      jsonLd: [
        blogPostJsonLd(post),
        ...(Array.isArray(post.faq) && post.faq.length ? [faqPageJsonLd(post.faq)] : []),
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Travel Guide', path: '/blogs' },
          { name: post.title, path: postPath },
        ]),
      ],
    };
  }),
];

const localizedEnglishPaths = new Set([
  '/',
  '/tours',
  '/feedback',
  '/privacy-policy',
  '/terms-of-use',
  ...destinations.map((destination) => `/destinations/${destination.slug}`),
  ...tours.map((tour) => tourPath(tour)),
]);

for (const page of pages) {
  if (localizedEnglishPaths.has(page.path)) {
    page.alternates = localeAlternates(page.path);
  }
}

pages.push(
  {
    path: '/ru',
    locale: 'ru',
    title: `Туры по Кыргызстану — частные поездки и горные маршруты | ${SITE_NAME}`,
    description: 'Частные туры по Кыргызстану: Иссык-Куль, Сон-Куль, Кель-Суу, конные маршруты, юрты и горные автопутешествия с локальной организацией.',
    image: DEFAULT_IMAGE,
    images: [DEFAULT_IMAGE, ...russianTours.map((tour) => optimizedImagePath(tour.image))],
    preloadImage: {
      href: '/images/travel-gallery-2026/travel-076-480.webp',
      srcSet: '/images/travel-gallery-2026/travel-076-480.webp 480w, /images/travel-gallery-2026/travel-076-960.webp 960w',
      sizes: '100vw',
    },
    alternates: localeAlternates('/'),
    jsonLd: [organizationJsonLd(), breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }])],
  },
  {
    path: '/ru/tours',
    locale: 'ru',
    title: `Туры по Кыргызстану — озёра, горы, культура и конные маршруты | ${SITE_NAME}`,
    description: 'Выберите тур по Кыргызстану: Иссык-Куль, Сон-Куль, Кель-Суу, верховая езда, юрты и горные автопутешествия из Бишкека.',
    image: DEFAULT_IMAGE,
    images: russianTours.map((tour) => optimizedImagePath(tour.image)),
    alternates: localeAlternates('/tours'),
    jsonLd: [
      breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }, { name: 'Туры', path: '/ru/tours' }]),
      tourListJsonLd(russianTours, 'ru'),
    ],
  },
  {
    path: '/ru/feedback',
    locale: 'ru',
    title: `Заявка на тур по Кыргызстану | ${SITE_NAME}`,
    description: 'Оставьте заявку на частный или групповой тур по Кыргызстану: даты, размер группы и контакты для личной связи.',
    image: DEFAULT_IMAGE,
    alternates: localeAlternates('/feedback'),
    jsonLd: [breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }, { name: 'Заявка на тур', path: '/ru/feedback' }])],
  },
  {
    path: '/ru/privacy-policy',
    locale: 'ru',
    title: `Политика конфиденциальности и cookies | ${SITE_NAME}`,
    description: 'Как Go Kyrgyzstan Travel обрабатывает заявки на туры, анонимную аналитику, cookies и настройки приватности.',
    image: DEFAULT_IMAGE,
    alternates: localeAlternates('/privacy-policy'),
    jsonLd: [breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }, { name: 'Конфиденциальность', path: '/ru/privacy-policy' }])],
  },
  {
    path: '/ru/terms-of-use',
    locale: 'ru',
    title: `Условия использования | ${SITE_NAME}`,
    description: 'Правила использования сайта Go Kyrgyzstan Travel и отправки запросов на путешествия по Кыргызстану.',
    image: DEFAULT_IMAGE,
    alternates: localeAlternates('/terms-of-use'),
    jsonLd: [breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }, { name: 'Условия использования', path: '/ru/terms-of-use' }])],
  },
  ...destinations.map((destination) => {
    const destinationTours = selectDestinationTours(destination, russianTours);
    return {
      path: `/ru/destinations/${destination.slug}`,
      locale: 'ru',
      destination,
      destinationTours,
      title: `${destination.ru.seoTitle} | ${SITE_NAME}`,
      description: destination.ru.metaDescription,
      image: destination.heroImage,
      images: [optimizedImagePath(destination.heroImage)],
      alternates: localeAlternates(`/destinations/${destination.slug}`),
      preloadImage: {
        href: optimizedImagePath(destination.heroImage, 480),
        media: '(max-width: 767px)',
      },
      jsonLd: [
        breadcrumbJsonLd([
          { name: 'Главная', path: '/ru' },
          { name: destination.ru.title, path: `/ru/destinations/${destination.slug}` },
        ]),
        destinationTourListJsonLd(destination, destinationTours, 'ru'),
        faqPageJsonLd(destination.ru.faq),
      ],
    };
  }),
  ...russianTours.map((tour) => ({
    path: tourPath(tour, 'ru'),
    locale: 'ru',
    tour,
    title: `${tour.title} — тур по Кыргызстану | ${SITE_NAME}`,
    description: tourMetaDescription(tour, 'ru'),
    image: tour.image,
    images: [optimizedImagePath(tour.image)],
    alternates: localeAlternates(tourPath(tour)),
    jsonLd: [
      tourJsonLd(tour, 'ru'),
      breadcrumbJsonLd([
        { name: 'Главная', path: '/ru' },
        { name: 'Туры', path: '/ru/tours' },
        { name: tour.title, path: tourPath(tour, 'ru') },
      ]),
    ],
  })),
);

for (const page of pages) {
  writeRouteHtml(page.path, renderPage(template, page));
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...pages
    .filter((page) => !page.noindex)
    .map((page) => {
      const images = (page.images || [])
        .map((image) => `<image:image><image:loc>${escapeHtml(absoluteUrl(image))}</image:loc></image:image>`)
        .join('');
      const alternates = (page.alternates || [])
        .map((alternate) => `<xhtml:link rel="alternate" hreflang="${escapeHtml(alternate.hrefLang)}" href="${escapeHtml(absoluteUrl(alternate.path))}" />`)
        .join('');
      const lastmod = page.lastmod ? `<lastmod>${escapeHtml(page.lastmod)}</lastmod>` : '';
      return `  <url><loc>${escapeHtml(absoluteUrl(page.path))}</loc>${lastmod}${alternates}${images}</url>`;
    }),
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');

const notFoundPage = {
  path: '/404',
  title: `Page Not Found | ${SITE_NAME}`,
  description: 'The requested page could not be found.',
  noindex: true,
};
fs.writeFileSync(path.join(distDir, '404.html'), renderPage(template, notFoundPage), 'utf8');

console.log(`Generated SEO HTML for ${pages.length} routes.`);
