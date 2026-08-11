import tourSlugData from '../../../data/tour_slugs.json';
import type { Tour } from '../components/tour-data';
import type { SiteLocale } from './locale';
import { localizedPath } from './locale';

type TourReference = Pick<Tour, 'id'> | number;

const tourSlugs = tourSlugData as Record<string, string>;
const tourIdsBySlug = new Map(
  Object.entries(tourSlugs).map(([id, slug]) => [slug, Number(id)]),
);

function resolveTourId(tour: TourReference) {
  return typeof tour === 'number' ? tour : tour.id;
}

/**
 * Public URLs must not be derived from titles: titles can be edited in the
 * admin panel, while this mapping keeps an already-published URL permanent.
 */
export function tourSlug(tour: TourReference) {
  const id = resolveTourId(tour);
  return tourSlugs[String(id)] || `tour-${id}`;
}

export function tourPath(tour: TourReference, locale: SiteLocale = 'en') {
  return localizedPath(`/tours/${tourSlug(tour)}`, locale);
}

export function tourIdFromSlug(value?: string) {
  if (!value) {
    return undefined;
  }

  const knownTourId = tourIdsBySlug.get(value);
  if (knownTourId) {
    return knownTourId;
  }

  const generatedTour = /^tour-([1-9][0-9]*)$/.exec(value);
  return generatedTour ? Number(generatedTour[1]) : undefined;
}

export function isCanonicalTourSlug(value?: string) {
  return Boolean(value && (tourIdsBySlug.has(value) || /^tour-[1-9][0-9]*$/.test(value)));
}
