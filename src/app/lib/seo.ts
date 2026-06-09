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

export const SITE_NAME = 'Go Kyrgyzstan Travel';
export const SITE_URL = 'https://kyrgyz.tours';
export const DEFAULT_SOCIAL_IMAGE = '/images/go-kyrgyzstan-hero.webp';
export const SITE_DESCRIPTION =
  'Private Kyrgyzstan tours, small-group trips, nomad culture experiences, horse riding, mountain trekking, and Silk Road routes with local planning.';

export type JsonLd = Record<string, unknown>;

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

function parseUsdPrice(price: string) {
  const value = Number(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : undefined;
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

export function tourListJsonLd(tours: Tour[]): JsonLd {
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

export function tourJsonLd(tour: Tour): JsonLd {
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
          url: absoluteUrl(`/tours/${tour.id}`),
        }
      : undefined,
  };
}
