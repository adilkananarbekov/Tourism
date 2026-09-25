import { CalendarDays, Search, Snowflake, SunMedium } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../components/ui/utils';
import { SEO } from '../components/SEO';
import { ToursGrid } from '../components/ToursGrid';
import { useToursData } from '../hooks/useTours';
import { localizeTour } from '../lib/localizedTours';
import { localeAlternates } from '../lib/locale';
import { breadcrumbJsonLd, tourListJsonLd } from '../lib/seo';
import { rankToursForMonth, upcomingTravelMonth } from '../lib/seasonalTours';

type FilterKey =
  | 'all'
  | 'horseback'
  | 'road-trip'
  | 'active-adventure'
  | 'family'
  | 'two-three-days'
  | 'four-six-days'
  | 'seven-plus-days';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'horseback', label: 'Конные туры' },
  { key: 'road-trip', label: 'Автотуры' },
  { key: 'active-adventure', label: 'Активные туры' },
  { key: 'family', label: 'Для семьи' },
  { key: 'two-three-days', label: '2–3 дня' },
  { key: 'four-six-days', label: '4–6 дней' },
  { key: 'seven-plus-days', label: '7+ дней' },
];
const filterKeys = new Set<FilterKey>(filters.map((filter) => filter.key));
const monthChoices = [
  { value: 0, label: 'Любой месяц', short: 'Любой' },
  { value: 9, label: 'Сентябрь', short: 'Сен' },
  { value: 10, label: 'Октябрь', short: 'Окт' },
  { value: 11, label: 'Ноябрь', short: 'Ноя' },
  { value: 12, label: 'Зима', short: 'Зима' },
];

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function isFilterKey(value: string | null): value is FilterKey {
  return Boolean(value && filterKeys.has(value as FilterKey));
}

function getDurationDays(duration: string) {
  const days = Number(duration.match(/\d+/)?.[0]);
  return Number.isFinite(days) ? days : 0;
}

function tourMatchesFilter(
  tourTitle: string,
  tourType: string,
  duration: string,
  filter: FilterKey
) {
  if (filter === 'all') {
    return true;
  }

  const normalizedType = normalizeSearchText(tourType);
  if (filter === 'horseback') {
    return normalizedType.includes('конн') || normalizedType.includes('horseback');
  }
  if (filter === 'road-trip') {
    return normalizedType.includes('автопутешеств') || normalizedType.includes('road trip');
  }
  if (filter === 'active-adventure') {
    return normalizedType.includes('актив') || normalizedType.includes('active adventure');
  }
  if (filter === 'family') {
    const normalizedTitle = normalizeSearchText(tourTitle);
    return normalizedTitle.includes(normalizeSearchText('семейн')) || normalizedTitle.includes('family');
  }

  const days = getDurationDays(duration);
  if (filter === 'two-three-days') {
    return days >= 2 && days <= 3;
  }
  if (filter === 'four-six-days') {
    return days >= 4 && days <= 6;
  }
  return days >= 7;
}

export function RussianToursPage() {
  const { tours, loading, error } = useToursData();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const filterParam = searchParams.get('filter');
  const activeFilter: FilterKey = isFilterKey(filterParam) ? filterParam : 'all';
  const monthParam = Number(searchParams.get('month'));
  const selectedMonth = monthChoices.some((choice) => choice.value === monthParam) ? monthParam : 0;
  const rankingMonth = selectedMonth || upcomingTravelMonth();
  const translatedTours = useMemo(
    () => tours.map((tour) => localizeTour(tour, 'ru')),
    [tours]
  );
  const filteredTours = useMemo(() => {
    const queryTokens = normalizeSearchText(search).split(' ').filter(Boolean);

    const matchingTours = translatedTours.filter((tour) => {
      const tourText = normalizeSearchText([
        tour.title,
        tour.description,
        tour.tourType,
        tour.season,
        ...tour.highlights,
      ].join(' '));
      const matchesSearch = queryTokens.every((token) => tourText.includes(token));
      const matchesFilter = tourMatchesFilter(
        tour.title,
        tour.tourType,
        tour.duration,
        activeFilter
      );
      return matchesSearch && matchesFilter;
    });
    return rankToursForMonth(matchingTours, rankingMonth);
  }, [activeFilter, rankingMonth, search, selectedMonth, translatedTours]);
  const seoJsonLd = useMemo(
    () => [
      breadcrumbJsonLd([
        { name: 'Главная', path: '/ru' },
        { name: 'Туры', path: '/ru/tours' },
      ]),
      tourListJsonLd(translatedTours, 'ru'),
    ],
    [translatedTours]
  );

  const updateSearch = (query: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (query) {
        nextParams.set('q', query);
      } else {
        nextParams.delete('q');
      }
      return nextParams;
    }, { replace: true });
  };

  const updateFilter = (filter: FilterKey) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (filter === 'all') {
        nextParams.delete('filter');
      } else {
        nextParams.set('filter', filter);
      }
      return nextParams;
    });
  };

  const updateMonth = (month: number) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (month === 0) nextParams.delete('month');
      else nextParams.set('month', String(month));
      return nextParams;
    });
  };

  return (
    <div className="tours-catalog-page bg-background pb-20 md:pb-0">
      <SEO
        title="Туры по Кыргызстану — озёра, горы, культура и конные маршруты"
        description="Выберите тур по Кыргызстану: Иссык-Куль, Сон-Куль, Кель-Суу, верховая езда, юрты и горные автопутешествия из Бишкека."
        path="/ru/tours"
        language="ru"
        alternates={localeAlternates('/tours')}
        jsonLd={seoJsonLd}
      />
      <section className="page-editorial-hero border-b border-border bg-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">Частные поездки · Местная команда</p>
            <h1 className="text-3xl text-foreground sm:text-4xl lg:text-5xl">Туры по Кыргызстану</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Сравните маршруты по местам, длительности и формату. Запросите расчёт для своей группы: даты, включённые услуги и цену согласуем до бронирования.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <label htmlFor="russian-tour-search" className="sr-only">
                Поиск туров
              </label>
              <Search
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="russian-tour-search"
                type="search"
                placeholder="Поиск по маршруту, региону, озеру или типу тура..."
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                className="h-12 pl-10"
              />
            </div>
            <Button asChild className="btn-action w-full lg:w-auto">
              <Link
                to="/ru/feedback"
                data-track-event="tours_request_click"
                data-track-label="Russian tours request"
              >
                Подобрать тур
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background px-4 py-4 sm:px-6 lg:px-8" aria-labelledby="russian-travel-month-heading">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="russian-travel-month-heading" className="inline-flex items-center gap-2 text-base font-medium text-foreground">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Месяц поездки
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Сначала — подходящие по сезону маршруты. Даты и доступность уточним при расчёте.
              </p>
            </div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible" role="group" aria-label="Месяц поездки">
              {monthChoices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => updateMonth(choice.value)}
                  aria-pressed={selectedMonth === choice.value}
                  className={cn(
                    'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 motion-reduce:transition-none hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 active:translate-y-0',
                    selectedMonth === choice.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted'
                  )}
                >
                  {choice.value === 12 ? <Snowflake className="h-4 w-4" aria-hidden="true" /> : choice.value ? <SunMedium className="h-4 w-4" aria-hidden="true" /> : null}
                  <span className="sm:hidden">{choice.short}</span>
                  <span className="hidden sm:inline">{choice.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="sticky top-14 z-30 border-b border-border/50 bg-background/60 px-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8"
        aria-label="Фильтры туров"
      >
        <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto py-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateFilter(filter.key)}
              aria-pressed={activeFilter === filter.key}
              className={cn(
                'min-h-11 whitespace-nowrap rounded-md border px-5 text-sm font-medium transition-colors motion-reduce:transition-none',
                activeFilter === filter.key
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          Найдено туров: {filteredTours.length} из {translatedTours.length}
        </p>
        {(search || activeFilter !== 'all' || selectedMonth !== 0) && (
          <button type="button" className="min-h-11 rounded-sm text-sm font-medium text-primary underline underline-offset-4" onClick={() => setSearchParams({})}>
            Сбросить поиск и фильтры
          </button>
        )}
      </div>

      <ToursGrid tours={filteredTours} loading={loading} error={error} stagger compact hasActiveFilters={Boolean(search || activeFilter !== 'all')} locale="ru" selectedMonth={rankingMonth} />
    </div>
  );
}
