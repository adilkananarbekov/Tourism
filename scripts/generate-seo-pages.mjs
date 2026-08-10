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

const SITE_NAME = 'Go Kyrgyzstan Travel';
const SITE_URL = 'https://kyrgyz.tours';
const DEFAULT_IMAGE = '/images/go-kyrgyzstan-hero.webp';
const FOUNDER_NAME = 'Jakypbekov Insan';
const FOUNDER_IMAGE = '/images/founder-jakypbekov-insan.webp';
const INSTAGRAM_URL = 'https://www.instagram.com/jakypbekovv1/';
const TELEGRAM_URL = 'https://t.me/Jakypbekovv1';
const WHATSAPP_URL = 'https://wa.me/996880099808';
const WHATSAPP_DISPLAY = '+996 880 099 808';
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
      url: absoluteUrl(tourPath(tour)),
      name: tour.title,
    })),
  };
}

function tourJsonLd(tour) {
  const price = parseUsdPrice(tour.price);
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${SITE_URL}${tourPath(tour)}#tour`,
    name: `${tourDisplayTitle(tour.title)} in Kyrgyzstan`,
    description: tour.description,
    image: [absoluteUrl(optimizedImagePath(tour.image)), absoluteUrl(tour.image)],
    url: absoluteUrl(tourPath(tour)),
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
          url: absoluteUrl(tourPath(tour)),
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
  }[post.slug] || [];
  const internalLinks = routeLinks.length
    ? `<aside><h2>Plan the next step</h2><p>${routeLinks.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(' · ')}</p></aside>`
    : '';
  const faq = Array.isArray(post.faq) && post.faq.length
    ? `<section><h2>Frequently asked questions about Kyrgyzstan travel seasons</h2><dl>${post.faq.map((item) => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}</dl></section>`
    : '';
  return `
    <article>
      <p><a href="/blogs">All Kyrgyzstan travel guides</a></p>
      <p>${escapeHtml(post.category || 'Travel Guide')} · ${escapeHtml(post.readTime || '')}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.excerpt)}</p>
      ${post.content || ''}
      ${faq}
      ${internalLinks}
      <p><a href="/feedback">Request a private Kyrgyzstan itinerary</a></p>
    </article>`;
}

function russianTourSummaryMarkup(tour) {
  return `
    <article>
      <h2><a href="${tourPath(tour, 'ru')}">${escapeHtml(tour.title)}</a></h2>
      <p>${escapeHtml(tour.description)}</p>
      <p><strong>Продолжительность:</strong> ${escapeHtml(tour.duration)} · <strong>Сезон:</strong> ${escapeHtml(tour.season)} · <strong>Стоимость от:</strong> ${escapeHtml(tour.price)}</p>
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
      <p>Планируйте путешествие по Кыргызстану с локальной командой: Иссык-Куль, Сон-Куль, Кель-Суу, конные маршруты, юрты и горные автопутешествия.</p>
      <h2>Популярные туры</h2>
      ${hotTours.map(russianTourSummaryMarkup).join('')}
      <h2>Маршрут под вашу поездку</h2>
      <p>Выберите готовый тур или отправьте даты, интересы и размер группы. Мы уточним реальную доступность, темп и детали поездки.</p>
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
      <h1>Заявка на тур по Кыргызстану</h1>
      <p>Оставьте даты, количество гостей, интересующие места и контакты. Мы свяжемся лично и предложим маршрут.</p>
      <h2>Что указать в заявке</h2>
      <ul><li>Даты или удобный месяц</li><li>Количество путешественников</li><li>Озёра, горы и желаемые активности</li><li>Уровень размещения и ориентировочный бюджет</li></ul>`;
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
      <h2>Подтверждение поездки</h2>
      <p>Маршрут, цена, наличие мест и условия подтверждаются только после письменного согласования с командой.</p>
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
      <h2>Hot tours right now</h2>
      <p>These are routes travelers ask for most. Send your dates to confirm real availability and receive a personal plan for your group.</p>
      ${hotTours.map(tourSummaryMarkup).join('')}
      <h2>Popular Kyrgyzstan tour packages</h2>
      ${tours.map(tourSummaryMarkup).join('')}
      <h2>Plan your trip with a local travel specialist</h2>
      <p>Choose a ready route or send your dates, interests, group size, and preferred pace for a personal itinerary.</p>
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
      <h1>Request a Private Kyrgyzstan Tour</h1>
      <p>Send your preferred dates, group size, places, activities, and contact details. We will reply with route and planning options.</p>
      <h2>Useful details to include</h2>
      <ul><li>Arrival and departure dates</li><li>Number of travelers</li><li>Preferred lakes, mountains, and activities</li><li>Accommodation level and approximate budget</li></ul>`;
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
      <h2>Trip confirmation</h2>
      <p>Route, price, availability, and trip terms are confirmed only after written agreement with the team.</p>
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
    title: `${tourDisplayTitle(tour.title)} in Kyrgyzstan | ${SITE_NAME}`,
    description: tourMetaDescription(tour),
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
    jsonLd: [breadcrumbJsonLd([
      { name: 'Главная', path: '/ru' },
      { name: 'Туры', path: '/ru/tours' },
      { name: tour.title, path: tourPath(tour, 'ru') },
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
