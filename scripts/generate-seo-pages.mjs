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
    name: `${tourDisplayTitle(tour.title)} in Kyrgyzstan`,
    description: tour.description,
    image: [absoluteUrl(optimizedImagePath(tour.image)), absoluteUrl(tour.image)],
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

function listMarkup(items, renderItem) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  return `<ul>${items.map(renderItem).join('')}</ul>`;
}

function tourSummaryMarkup(tour) {
  return `
    <article>
      <h2><a href="/tours/${tour.id}">${escapeHtml(tour.title)}</a></h2>
      <p>${escapeHtml(tour.description)}</p>
      <p><strong>Duration:</strong> ${escapeHtml(tour.duration)} · <strong>Season:</strong> ${escapeHtml(tour.season)} · <strong>From:</strong> ${escapeHtml(tour.price)}</p>
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
        const path = locale === 'ru' ? `/ru/tours/${relatedTour.id}` : `/tours/${relatedTour.id}`;
        return `<li><a href="${path}">${escapeHtml(relatedTour.title)}</a> — ${duration}: ${escapeHtml(relatedTour.duration)}</li>`;
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
  const itinerary = listMarkup(tour.itinerary, (day) => `
    <li>
      <h3>Day ${escapeHtml(day.day)}: ${escapeHtml(day.title)}</h3>
      <p>${escapeHtml(day.description)}</p>
    </li>`);
  const practicalInfo = tour.practicalInfo || {};

  return `
    <article>
      <p><a href="/tours">All Kyrgyzstan tours</a></p>
      <h1>${escapeHtml(tourDisplayTitle(tour.title))} in Kyrgyzstan</h1>
      <p>${escapeHtml(tour.description)}</p>
      <p><strong>Duration:</strong> ${escapeHtml(tour.duration)} · <strong>Tour type:</strong> ${escapeHtml(tour.tourType)} · <strong>Season:</strong> ${escapeHtml(tour.season)} · <strong>Price:</strong> ${escapeHtml(tour.price)}</p>
      <h2>Tour highlights</h2>
      ${listMarkup(tour.highlights, (highlight) => `<li>${escapeHtml(highlight)}</li>`)}
      <h2>Day-by-day itinerary</h2>
      ${itinerary}
      <h2>Practical information</h2>
      <p><strong>Accommodation:</strong> ${escapeHtml(practicalInfo.accommodation)}</p>
      <p><strong>Meals:</strong> ${escapeHtml(practicalInfo.meals)}</p>
      <p><strong>Difficulty:</strong> ${escapeHtml(practicalInfo.difficulty)}</p>
      <p><strong>Group size:</strong> ${escapeHtml(practicalInfo.groupSize)}</p>
      <h2>What is included</h2>
      ${listMarkup(practicalInfo.included, (item) => `<li>${escapeHtml(item)}</li>`)}
      <h2>What to pack</h2>
      ${listMarkup(tour.packingList, (item) => `<li>${escapeHtml(item)}</li>`)}
      ${seoContentMarkup(tour)}
      ${relatedToursMarkup(tour, tours)}
      <p><a href="/feedback">Request this private Kyrgyzstan tour</a></p>
    </article>`;
}

function blogPostMarkup(post) {
  return `
    <article>
      <p><a href="/blogs">All Kyrgyzstan travel guides</a></p>
      <p>${escapeHtml(post.category || 'Travel Guide')} · ${escapeHtml(post.readTime || '')}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.excerpt)}</p>
      ${post.content || ''}
      <p><a href="/feedback">Request a private Kyrgyzstan itinerary</a></p>
    </article>`;
}

function russianTourSummaryMarkup(tour) {
  return `
    <article>
      <h2><a href="/ru/tours/${tour.id}">${escapeHtml(tour.title)}</a></h2>
      <p>${escapeHtml(tour.description)}</p>
      <p><strong>Продолжительность:</strong> ${escapeHtml(tour.duration)} · <strong>Сезон:</strong> ${escapeHtml(tour.season)} · <strong>Стоимость от:</strong> ${escapeHtml(tour.price)}</p>
      ${listMarkup(tour.highlights, (highlight) => `<li>${escapeHtml(highlight)}</li>`)}</article>`;
}

function russianStaticContentMarkup(page, tours) {
  if (page.tour) {
    const practicalInfo = page.tour.practicalInfo || {};
    return `
      <article>
        <p><a href="/ru/tours">Все туры по Кыргызстану</a></p>
        <h1>${escapeHtml(page.tour.title)}</h1>
        <p>${escapeHtml(page.tour.description)}</p>
        <p><strong>Продолжительность:</strong> ${escapeHtml(page.tour.duration)} · <strong>Формат:</strong> ${escapeHtml(page.tour.tourType)} · <strong>Сезон:</strong> ${escapeHtml(page.tour.season)} · <strong>Цена от:</strong> ${escapeHtml(page.tour.price)}</p>
        <h2>Главные впечатления</h2>
        ${listMarkup(page.tour.highlights, (item) => `<li>${escapeHtml(item)}</li>`)}
        <h2>Практическая информация</h2>
        <p><strong>Сложность:</strong> ${escapeHtml(practicalInfo.difficulty)}</p>
        <p><strong>Размер группы:</strong> ${escapeHtml(practicalInfo.groupSize)}</p>
        ${seoContentMarkup(page.tour, 'ru')}
        ${relatedToursMarkup(page.tour, tours, 'ru')}
        <p><a href="/ru/feedback">Оставить заявку на этот тур</a></p>
      </article>`;
  }

  if (page.path === '/ru') {
    const hotTours = [6, 1, 2]
      .map((id) => tours.find((tour) => Number(tour.id) === id))
      .filter(Boolean);
    return `
      <h1>Туры по Кыргызстану: частные поездки и горные маршруты</h1>
      <p>Планируйте путешествие по Кыргызстану с локальной командой: Иссык-Куль, Сон-Куль, Ала-Арча, конные маршруты, юрты, горы и Шёлковый путь.</p>
      <h2>Популярные туры</h2>
      ${hotTours.map(russianTourSummaryMarkup).join('')}
      <h2>Маршрут под вашу поездку</h2>
      <p>Выберите готовый тур или отправьте даты, интересы и размер группы. Мы уточним реальную доступность, темп и детали поездки.</p>
      <p><a href="/ru/tours">Смотреть все туры</a> · <a href="/ru/feedback">Подобрать маршрут</a></p>`;
  }

  if (page.path === '/ru/tours') {
    return `
      <h1>Туры по Кыргызстану</h1>
      <p>Готовые маршруты к озёрам и горам Кыргызстана: Иссык-Куль, Сон-Куль, Ала-Арча, Шёлковый путь, конные туры и треккинг.</p>
      ${tours.map(russianTourSummaryMarkup).join('')}
      <p><a href="/ru/feedback">Оставить заявку на тур</a></p>`;
  }

  if (page.path === '/ru/feedback') {
    return `
      <h1>Заявка на тур по Кыргызстану</h1>
      <p>Оставьте даты, количество гостей, интересующие места и контакты. Мы свяжемся лично и предложим маршрут.</p>
      <h2>Что указать в заявке</h2>
      <ul><li>Даты или удобный месяц</li><li>Количество путешественников</li><li>Озёра, горы и желаемые активности</li><li>Уровень размещения и ориентировочный бюджет</li></ul>`;
  }

  return `<h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p>`;
}

function staticContentMarkup(page, tours) {
  let content = '';

  if (page.locale === 'ru') {
    content = russianStaticContentMarkup(page, tours);
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
      <p>Plan a flexible private trip in Kyrgyzstan with local support: Song-Kul and Issyk-Kul lakes, Ala-Archa hikes, horse riding, nomad culture, Silk Road routes, and road trips from Bishkek or Osh.</p>
      <h2>Hot tours right now</h2>
      <p>These are routes travelers ask for most. Send your dates to confirm real availability and receive a personal plan for your group.</p>
      ${hotTours.map(tourSummaryMarkup).join('')}
      <h2>Popular Kyrgyzstan tour packages</h2>
      ${tours.map(tourSummaryMarkup).join('')}
      <h2>Plan your trip with a local travel specialist</h2>
      <p>Choose a ready route or send your dates, interests, group size, and preferred pace for a personal itinerary.</p>
      <p><a href="/tours">Compare all tours</a> · <a href="/feedback">Request a custom tour</a></p>`;
  } else if (page.path === '/tours') {
    content = `
      <h1>Kyrgyzstan Tour Packages</h1>
      <p>Compare private and small-group routes for mountain lakes, nomad culture, trekking, horse riding, Silk Road heritage, and scenic road trips.</p>
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
      <h1>Kyrgyzstan Travel Photos and Videos</h1>
      <p>See mountain landscapes, high-altitude lakes, yurt camps, horse-riding routes, trekking days, and cultural experiences from trips across Kyrgyzstan.</p>
      <div class="seo-gallery">${GALLERY_IMAGES.map((image, index) => `<img src="${escapeHtml(image)}" alt="Kyrgyzstan travel photo ${index + 1}" loading="lazy" width="960" height="640" />`).join('')}</div>
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
      <h1>Request a Private Kyrgyzstan Tour</h1>
      <p>Send your preferred dates, group size, places, activities, and contact details. We will reply with route and planning options.</p>
      <h2>Useful details to include</h2>
      <ul><li>Arrival and departure dates</li><li>Number of travelers</li><li>Preferred lakes, mountains, and activities</li><li>Accommodation level and approximate budget</li></ul>`;
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
const russianTours = tours.map((tour) => localizeTourRu(tour, russianTourTranslations));
const blogPosts = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8'))
  .filter((post) => post.status !== 'draft' && post.status !== 'archived');

const pages = [
  {
    path: '/',
    title: `${SITE_NAME} | Kyrgyzstan Tours & Private Trips`,
    description:
      'Book private Kyrgyzstan tours with local planning: Song-Kul, Issyk-Kul, Ala-Archa, horse riding, yurt camps, Silk Road routes, private mountain trips, and canyon lake views.',
    image: DEFAULT_IMAGE,
    images: [
      '/images/go-kyrgyzstan-hero-1080.webp',
      '/images/founder-jakypbekov-insan-960.webp',
      ...tours.map((tour) => optimizedImagePath(tour.image)),
    ],
    preloadImage: {
      href: '/images/go-kyrgyzstan-hero-720.webp',
      media: '(max-width: 767px)',
    },
    jsonLd: [organizationJsonLd(), websiteJsonLd(), breadcrumbJsonLd([{ name: 'Home', path: '/' }])],
  },
  {
    path: '/tours',
    title: `Kyrgyzstan Tour Packages | ${SITE_NAME}`,
    description:
      'Compare Kyrgyzstan tour packages for Song-Kul, Issyk-Kul, Ala-Archa, Silk Road heritage, horse riding, trekking, and private road trips.',
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
  ...tours.map((tour) => ({
    path: `/tours/${tour.id}`,
    tour,
    title: `${tourDisplayTitle(tour.title)} in Kyrgyzstan | ${SITE_NAME}`,
    description: `${tour.description} Duration: ${tour.duration}. Starting from ${tour.price}.`,
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
        { name: tour.title, path: `/tours/${tour.id}` },
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
      image: post.coverImage || DEFAULT_IMAGE,
      images: [post.coverImage || DEFAULT_IMAGE],
      jsonLd: [
        blogPostJsonLd(post),
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
  ...tours.map((tour) => `/tours/${tour.id}`),
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
    description: 'Частные туры по Кыргызстану: Иссык-Куль, Сон-Куль, Ала-Арча, конные маршруты, юрты, горы и Шёлковый путь с локальной организацией.',
    image: DEFAULT_IMAGE,
    images: [DEFAULT_IMAGE, ...russianTours.map((tour) => optimizedImagePath(tour.image))],
    alternates: localeAlternates('/'),
    jsonLd: [organizationJsonLd(), breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }])],
  },
  {
    path: '/ru/tours',
    locale: 'ru',
    title: `Туры по Кыргызстану — озёра, горы, культура и конные маршруты | ${SITE_NAME}`,
    description: 'Выберите тур по Кыргызстану: Иссык-Куль, Сон-Куль, Ала-Арча, Шёлковый путь, верховая езда, треккинг и горные автопутешествия.',
    image: DEFAULT_IMAGE,
    images: russianTours.map((tour) => optimizedImagePath(tour.image)),
    alternates: localeAlternates('/tours'),
    jsonLd: [breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }, { name: 'Туры', path: '/ru/tours' }])],
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
  ...russianTours.map((tour) => ({
    path: `/ru/tours/${tour.id}`,
    locale: 'ru',
    tour,
    title: `${tour.title} — тур по Кыргызстану | ${SITE_NAME}`,
    description: `${tour.description} Продолжительность: ${tour.duration}. Цена от ${tour.price}.`,
    image: tour.image,
    images: [optimizedImagePath(tour.image)],
    alternates: localeAlternates(`/tours/${tour.id}`),
    jsonLd: [breadcrumbJsonLd([
      { name: 'Главная', path: '/ru' },
      { name: 'Туры', path: '/ru/tours' },
      { name: tour.title, path: `/ru/tours/${tour.id}` },
    ])],
  })),
);

for (const page of pages) {
  writeRouteHtml(page.path, renderPage(template, page));
}

const lastModified = new Date().toISOString().slice(0, 10);
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
      return `  <url><loc>${escapeHtml(absoluteUrl(page.path))}</loc><lastmod>${lastModified}</lastmod>${alternates}${images}</url>`;
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
