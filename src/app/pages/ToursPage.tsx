import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ToursGrid } from '../components/ToursGrid';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../components/ui/utils';
import { SEO } from '../components/SEO';
import { useToursData } from '../hooks/useTours';
import { breadcrumbJsonLd, tourListJsonLd } from '../lib/seo';
import { localeAlternates } from '../lib/locale';
import { tourPath } from '../lib/tourRoutes';

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
  { key: 'all', label: 'All' },
  { key: 'horseback', label: 'Horse riding' },
  { key: 'road-trip', label: 'Road trips' },
  { key: 'active-adventure', label: 'Active tours' },
  { key: 'family', label: 'Family' },
  { key: 'two-three-days', label: '2–3 days' },
  { key: 'four-six-days', label: '4–6 days' },
  { key: 'seven-plus-days', label: '7+ days' },
];
const filterKeys = new Set<FilterKey>(filters.map((filter) => filter.key));

const routeHighlights = [
  {
    title: 'Song-Kul horse riding',
    description: 'Compare a compact overnight ride with a longer trek from Kyzart.',
    links: [
      { to: '/destinations/song-kul', label: 'Song-Kul route hub' },
      { to: tourPath(4), label: '2-day horse ride' },
      { to: tourPath(2), label: '3-day horse trek' },
    ],
  },
  {
    title: 'Issyk-Kul from Bishkek',
    description: 'Choose a three-day lake introduction or a four-day gorges and hot-springs route.',
    links: [
      { to: '/destinations/issyk-kul', label: 'Issyk-Kul route hub' },
      { to: tourPath(10), label: '4-day Issyk-Kul tour' },
    ],
  },
  {
    title: 'Kel-Suu and mountain lakes',
    description: 'Plan for remote-road access with a private route linking Kel-Suu, Song-Kul, and Issyk-Kul.',
    links: [
      { to: '/destinations/kel-suu', label: 'Kel-Suu route hub' },
      { to: tourPath(3), label: '7-day mountain lakes tour' },
    ],
  },
  {
    title: 'Choose the right season',
    description: 'High-altitude routes, yurt camps, and winter travel have different access windows.',
    links: [
      { to: '/blogs/best-time-to-visit-kyrgyzstan', label: 'Read the season guide' },
      { to: tourPath(6), label: 'Winter Song-Kul ride' },
    ],
  },
];

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
    return normalizedType.includes('horseback') || normalizedType.includes('horse riding');
  }
  if (filter === 'road-trip') {
    return normalizedType.includes('road trip');
  }
  if (filter === 'active-adventure') {
    return normalizedType.includes('active adventure');
  }
  if (filter === 'family') {
    return normalizeSearchText(tourTitle).includes('family');
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

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isFilterKey(value: string | null): value is FilterKey {
  return Boolean(value && filterKeys.has(value as FilterKey));
}

export function ToursPage() {
  const { tours, loading, error } = useToursData();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const filterParam = searchParams.get('filter');
  const activeFilter: FilterKey = isFilterKey(filterParam) ? filterParam : 'all';

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const tourText = normalizeSearchText([
        tour.title,
        tour.description,
        tour.tourType,
        tour.season,
        ...tour.highlights,
      ]
        .join(' '));
      const queryTokens = normalizeSearchText(search).split(' ').filter(Boolean);
      const matchesSearch = queryTokens.every((token) => tourText.includes(token));
      const matchesFilter = tourMatchesFilter(
        tour.title,
        tour.tourType,
        tour.duration,
        activeFilter
      );
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, search, tours]);
  const seoJsonLd = useMemo(
    () => [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Tours', path: '/tours' },
      ]),
      tourListJsonLd(tours),
    ],
    [tours]
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

  return (
    <div className="bg-background pb-20 md:pb-0">
      <SEO
        title="Kyrgyzstan Tour Packages"
        description="Compare private Kyrgyzstan tour packages for Song-Kul, Issyk-Kul, Kel-Suu, horse riding, yurt stays, and flexible mountain road trips from Bishkek."
        path="/tours"
        alternates={localeAlternates('/tours')}
        jsonLd={seoJsonLd}
      />

      <section className="border-b border-border bg-muted px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              Ready routes
            </p>
            <h1 className="mb-4 text-3xl text-foreground sm:text-4xl lg:text-5xl">
              Kyrgyzstan Tour Packages
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Choose a curated Kyrgyzstan route first. Dates, pace, and stops can still be
              adjusted after we receive your request.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <label htmlFor="tour-search" className="sr-only">Search tours</label>
              <Search
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="tour-search"
                type="search"
                placeholder="Search by route, region, lake, mountain, culture..."
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                className="h-12 pl-10"
              />
            </div>
            <Button asChild className="btn-micro btn-action">
              <Link
                to="/feedback"
                data-track-event="tours_request_click"
                data-track-label="Tours request"
              >
                Send Trip Request
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-2xl text-foreground sm:text-3xl">Start with the route that matches your trip.</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              These routes have the clearest practical details and help narrow the trip by days, season, and travel style before you compare the wider catalogue.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {routeHighlights.map((route) => (
              <article key={route.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-xl text-foreground">{route.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{route.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {route.links.map((link) => (
                    <Link key={link.to} to={link.to} className="card-cta text-sm font-medium text-primary">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="sticky top-14 z-30 border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl shadow-sm sm:px-6 lg:px-8"
        aria-label="Tour filters"
      >
        <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto py-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateFilter(filter.key)}
              aria-pressed={activeFilter === filter.key}
              className={cn(
                'min-h-[40px] whitespace-nowrap rounded-full border px-5 text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95',
                activeFilter === filter.key
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          Showing {filteredTours.length} of {tours.length} tours
        </p>
      </div>

      <ToursGrid tours={filteredTours} loading={loading} error={error} stagger />
    </div>
  );
}
