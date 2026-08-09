import type { Tour } from '../components/tour-data';
import tourMetaDescriptions from '../../../data/tour_seo_descriptions.json';

type TourMetaCopy = Pick<Tour, 'id' | 'description' | 'duration'>;

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
