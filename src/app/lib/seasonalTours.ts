import type { Tour } from '../components/tour-data';
import type { SiteLocale } from './locale';

export type TourAvailabilityStatus = 'available' | 'check-access' | 'next-season';
export type TourPromotion = 'hot' | 'hit' | 'new' | null;

const ALL_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const MONTH_NUMBERS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const CURATED_MONTHS: Record<number, number[]> = {
  6: [11, 12, 1, 2, 3, 4],
  7: ALL_MONTHS,
  10: [4, 5, 6, 7, 8, 9, 10, 11],
};

const ACCESS_CHECKS: Record<number, number[]> = {
  2: [9],
  4: [9],
  5: [9],
};

function monthRange(start: number, end: number) {
  const months: number[] = [];
  let month = start;
  while (!months.includes(month)) {
    months.push(month);
    if (month === end) break;
    month = month === 12 ? 1 : month + 1;
  }
  return months;
}

function normalizeMonths(months: number[] | undefined) {
  if (!months) return [];
  return [...new Set(months.filter((month) => Number.isInteger(month) && month >= 1 && month <= 12))];
}

export function getTourAvailableMonths(tour: Tour) {
  const structured = normalizeMonths(tour.availableMonths);
  if (structured.length) return structured;
  if (CURATED_MONTHS[tour.id]) return CURATED_MONTHS[tour.id];

  const season = tour.season.toLowerCase().replace(/[–—]/g, '-');
  if (/all year|year-round|all seasons|круглый год|весь год/.test(season)) return ALL_MONTHS;
  if (/summer|лет/.test(season) && !Object.keys(MONTH_NUMBERS).some((name) => season.includes(name))) {
    return [6, 7, 8];
  }
  if (/winter|зим/.test(season) && !Object.keys(MONTH_NUMBERS).some((name) => season.includes(name))) {
    return [12, 1, 2];
  }

  const monthMatches = Object.entries(MONTH_NUMBERS)
    .filter(([name]) => season.includes(name))
    .map(([, number]) => number);
  if (monthMatches.length >= 2) return monthRange(monthMatches[0], monthMatches[1]);
  if (monthMatches.length === 1) return monthMatches;

  if (/spring.*autumn|весн.*осен/.test(season)) return [3, 4, 5, 6, 7, 8, 9, 10];
  if (/spring/.test(season)) return [3, 4, 5];
  if (/autumn|fall|осен/.test(season)) return [9, 10, 11];
  return [];
}

export function getTourAvailabilityStatus(tour: Tour, month: number): TourAvailabilityStatus {
  if (getTourAvailableMonths(tour).includes(month)) return 'available';
  if (ACCESS_CHECKS[tour.id]?.includes(month)) return 'check-access';
  return 'next-season';
}

function isPromotionActive(tour: Tour, today = new Date()) {
  const starts = tour.promotionStartsAt ? Date.parse(tour.promotionStartsAt) : Number.NaN;
  const ends = tour.promotionEndsAt ? Date.parse(tour.promotionEndsAt) : Number.NaN;
  if (Number.isFinite(starts) && today.getTime() < starts) return false;
  if (Number.isFinite(ends) && today.getTime() > ends) return false;
  return true;
}

export function getTourPromotion(tour: Tour, month: number, today = new Date()): TourPromotion {
  const status = getTourAvailabilityStatus(tour, month);
  if (tour.promotionTag && isPromotionActive(tour, today) && status === 'available') {
    return tour.promotionTag;
  }
  if (month >= 9 && month <= 11 && [7, 10].includes(tour.id) && status === 'available') return 'hot';
  if ([11, 12, 1, 2, 3, 4].includes(month) && [6, 7].includes(tour.id) && status === 'available') return 'hot';
  if ([2, 4].includes(tour.id)) return 'hit';
  // These were the original placeholder Home selections. Ignore their stale
  // API flag so the seasonal ranking does not keep resurfacing summer routes.
  if ([2, 3, 11].includes(tour.id)) return null;
  if (tour.isHot && status === 'available') return 'hot';
  return null;
}

export function getSeasonalTourLabels(tour: Tour, month: number, locale: SiteLocale = 'en') {
  const status = getTourAvailabilityStatus(tour, month);
  const promotion = getTourPromotion(tour, month);
  const ru = locale === 'ru';
  const promotionLabel = promotion === 'hot'
    ? (ru ? 'Лучшее на сезон' : 'Best this season')
    : promotion === 'hit'
      ? (ru ? 'Популярный маршрут' : 'Popular route')
      : promotion === 'new'
        ? (ru ? 'Новый маршрут' : 'New route')
        : null;
  const availabilityLabel = status === 'available'
    ? (ru ? 'Подходит по сезону' : 'Fits this season')
    : status === 'check-access'
      ? (ru ? 'Уточним условия' : 'Access check needed')
      : (ru ? 'Следующий сезон' : 'Next season');
  return { status, promotion, promotionLabel, availabilityLabel };
}

export function rankToursForMonth(tours: Tour[], month: number) {
  const statusScore: Record<TourAvailabilityStatus, number> = {
    available: 0,
    'check-access': 1,
    'next-season': 2,
  };
  const promotionScore: Record<Exclude<TourPromotion, null>, number> = { hot: 0, hit: 1, new: 2 };

  return [...tours].sort((first, second) => {
    const firstStatus = getTourAvailabilityStatus(first, month);
    const secondStatus = getTourAvailabilityStatus(second, month);
    const statusDifference = statusScore[firstStatus] - statusScore[secondStatus];
    if (statusDifference) return statusDifference;
    const firstPromotion = getTourPromotion(first, month);
    const secondPromotion = getTourPromotion(second, month);
    const promotionDifference = (firstPromotion ? promotionScore[firstPromotion] : 3)
      - (secondPromotion ? promotionScore[secondPromotion] : 3);
    if (promotionDifference) return promotionDifference;
    const rankDifference = (first.featuredRank ?? 999) - (second.featuredRank ?? 999);
    return rankDifference || first.id - second.id;
  });
}

export function upcomingTravelMonth(today = new Date()) {
  const month = today.getMonth() + 1;
  if (month === 8) return 9;
  return month;
}
