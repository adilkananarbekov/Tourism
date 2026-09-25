import ruTourCopy from '../../../data/tour_translations_ru.json';
import type { Tour } from '../components/tour-data';
import type { SiteLocale } from './locale';

type RussianTourCopy = {
  title: string;
  duration: string;
  tourType: string;
  season: string;
  description: string;
  highlights: string[];
  difficulty: string;
  itinerary?: Tour['itinerary'];
  packingList?: Tour['packingList'];
  practicalInfo?: Tour['practicalInfo'];
};

const russianTours = ruTourCopy as Record<string, RussianTourCopy>;

export function localizeTour(tour: Tour, locale: SiteLocale): Tour {
  if (locale !== 'ru') {
    return tour;
  }

  const copy = russianTours[String(tour.id)];
  if (!copy) {
    return tour;
  }

  return {
    ...tour,
    title: copy.title,
    duration: copy.duration,
    tourType: copy.tourType,
    season: copy.season,
    description: copy.description,
    highlights: copy.highlights,
    itinerary: copy.itinerary || tour.itinerary,
    packingList: copy.packingList || tour.packingList,
    practicalInfo: {
      ...tour.practicalInfo,
      ...copy.practicalInfo,
      difficulty: copy.difficulty || copy.practicalInfo?.difficulty || tour.practicalInfo.difficulty,
    },
  };
}
