import type { Tour } from '../components/tour-data';
import {
  FOUNDER_IMAGE,
  FOUNDER_NAME,
  INSTAGRAM_URL,
  SOCIAL_PROFILE_URLS,
  TELEGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from './contact';
import type { SiteLocale } from './locale';
import { tourPath } from './tourRoutes';

export const SITE_NAME = 'Go Kyrgyzstan Travel';
export const SITE_URL = 'https://kyrgyz.tours';
export const DEFAULT_SOCIAL_IMAGE = '/images/go-kyrgyzstan-hero.webp';
export const SITE_DESCRIPTION =
  'Private Kyrgyzstan tours, small-group trips, Song-Kul and Issyk-Kul lake routes, horse riding, yurt stays, and mountain road trips with local planning.';

export type JsonLd = Record<string, unknown>;

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

function parseUsdPrice(price: string) {
  const values = price
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values?.length ? Math.min(...values) : undefined;
}

function optimizedImagePath(value: string, width = 960) {
  return value.replace(/\.(jpe?g)$/i, `-${width}.webp`);
}

function tourDisplayTitle(title: string) {
  return /\btour\b/i.test(title) ? title : `${title} Tour`;
}

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_SOCIAL_IMAGE),
    logo: absoluteUrl('/favicon.svg'),
    description: SITE_DESCRIPTION,
    sameAs: SOCIAL_PROFILE_URLS,
    founder: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      image: absoluteUrl(FOUNDER_IMAGE),
      sameAs: [INSTAGRAM_URL, TELEGRAM_URL],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Kyrgyzstan',
    },
    knowsAbout: [
      'Kyrgyzstan tours',
      'Private tours in Kyrgyzstan',
      'Song-Kul Lake tours',
      'Issyk-Kul tours',
      'Ala-Archa hiking',
      'Horse riding in Kyrgyzstan',
      'Silk Road tours',
      'Nomad culture trips',
    ],
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

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: [
      'Kyrgyzstan tours',
      'Kyrgyzstan private tours',
      'Kyrgyzstan travel agency',
    ],
    url: SITE_URL,
    inLanguage: 'en',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
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

export function tourListJsonLd(tours: Tour[], locale: SiteLocale = 'en'): JsonLd {
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

export function tourJsonLd(tour: Tour, locale: SiteLocale = 'en'): JsonLd {
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
    itinerary: (tour.locations || []).map((location) => ({
      '@type': 'TouristDestination',
      name: location.name,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.lat,
        longitude: location.lng,
      },
    })),
    provider: {
      '@id': `${SITE_URL}/#organization`,
    },
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
