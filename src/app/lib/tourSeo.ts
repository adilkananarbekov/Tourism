import type { Tour } from '../components/tour-data';
import tourMetaDescriptions from '../../../data/tour_seo_descriptions.json';
import tourMetaTitles from '../../../data/tour_seo_titles.json';

type TourMetaCopy = Pick<Tour, 'id' | 'description' | 'duration'>;
type TourTitleCopy = Pick<Tour, 'id' | 'title'>;

function shorten(value: string, limit = 160) {
  const normalized = value.replace(/\s+/g, ' ').trim();
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

export function tourMetaDescription(tour: TourMetaCopy, locale: 'en' | 'ru' = 'en') {
  if (locale === 'en') {
    const override = (tourMetaDescriptions as Record<string, string>)[String(tour.id)];
    if (override) {
      return override;
    }
  }

  return shorten(tour.description);
}

export function tourMetaTitle(tour: TourTitleCopy, locale: 'en' | 'ru' = 'en') {
  if (locale === 'en') {
    const override = (tourMetaTitles as Record<string, string>)[String(tour.id)];
    if (override) {
      return override;
    }
  }

  const displayTitle = /\btour\b/i.test(tour.title) ? tour.title : `${tour.title} Tour`;
  return locale === 'en' ? `${displayTitle} in Kyrgyzstan` : displayTitle;
}
