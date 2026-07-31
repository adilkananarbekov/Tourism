import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ToursGrid } from '../components/ToursGrid';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../components/ui/utils';
import { SEO } from '../components/SEO';
import { useToursData } from '../hooks/useTours';
import { breadcrumbJsonLd, tourListJsonLd } from '../lib/seo';
import { localeAlternates } from '../lib/locale';

const filters = [
  'All',
  'Mountains',
  'Lakes',
  'Culture',
  'Adventure',
  'Family',
  'Short trips',
  'Road trip',
  'Weekend',
];

function tourMatchesFilter(tourText: string, duration: string, filter: string) {
  if (filter === 'All') {
    return true;
  }

  const lowerFilter = filter.toLowerCase();
  if (lowerFilter === 'short trips') {
    const days = Number(duration.replace(/[^0-9]/g, ''));
    return Number.isFinite(days) && days > 0 && days <= 3;
  }

  if (lowerFilter === 'lakes') {
    return tourText.includes('lake') || tourText.includes('kul') || tourText.includes('song-kul');
  }

  if (lowerFilter === 'mountains') {
    return tourText.includes('mountain') || tourText.includes('peak') || tourText.includes('gorge') || tourText.includes('archa');
  }

  if (lowerFilter === 'road trip') {
    return tourText.includes('road') || tourText.includes('circuit') || tourText.includes('drive');
  }

  if (lowerFilter === 'weekend') {
    const days = Number(duration.replace(/[^0-9]/g, ''));
    return Number.isFinite(days) && days > 0 && days <= 3;
  }

  return tourText.includes(lowerFilter);
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function ToursPage() {
  const { tours, loading, error } = useToursData();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const [activeFilter, setActiveFilter] = useState('All');

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
      const matchesFilter = tourMatchesFilter(tourText, tour.duration, activeFilter);
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

  return (
    <div className="bg-background pb-20 md:pb-0">
      <SEO
        title="Kyrgyzstan Tour Packages"
        description="Compare Kyrgyzstan tour packages for Song-Kul, Issyk-Kul, Ala-Archa, Silk Road heritage, horse riding, trekking, and private road trips."
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
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by route, region, lake, mountain, culture..."
                value={search}
                onChange={(event) => {
                  const query = event.target.value;
                  setSearchParams(query ? { q: query } : {}, { replace: true });
                }}
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

      <section className="sticky top-14 z-30 border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto py-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'min-h-[40px] whitespace-nowrap rounded-full border px-5 text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95',
                activeFilter === filter
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTours.length} of {tours.length} tours
        </p>
      </div>

      <ToursGrid tours={filteredTours} loading={loading} error={error} stagger />
    </div>
  );
}
