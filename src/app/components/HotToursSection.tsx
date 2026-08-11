import { ArrowRight, CalendarDays, Flame, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToursData } from '../hooks/useTours';
import type { Tour } from './tour-data';
import { ResponsiveImage } from './ResponsiveImage';
import { Button } from './ui/button';
import { tourPath } from '../lib/tourRoutes';

const DEFAULT_HOT_TOUR_IDS = [6, 1, 2];

function preferredTourOrder(tours: Tour[]) {
  const prioritized = new Map(
    DEFAULT_HOT_TOUR_IDS.map((id, index) => [id, index]),
  );

  return [...tours].sort(
    (first, second) =>
      (prioritized.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (prioritized.get(second.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function selectHotTours(tours: Tour[]) {
  const manuallySelected = tours.filter((tour) => tour.isHot);
  const candidates = [...manuallySelected, ...preferredTourOrder(tours), ...tours];
  const selected = new Map<number, Tour>();

  for (const tour of candidates) {
    if (!selected.has(tour.id)) {
      selected.set(tour.id, tour);
    }
    if (selected.size === 3) {
      break;
    }
  }

  return [...selected.values()];
}

function tourImageVariants(image: string) {
  if (!/^\/images\/tour-[\w-]+\.(?:jpe?g|webp)$/i.test(image)) {
    return [];
  }

  const base = image.replace(/\.[^.]+$/, '');
  return [
    { src: `${base}-480.webp`, width: 480 },
    { src: `${base}-960.webp`, width: 960 },
  ];
}

export function HotToursSection() {
  const { tours } = useToursData();
  const hotTours = selectHotTours(tours);

  if (hotTours.length === 0) {
    return null;
  }

  return (
    <section id="hot-tours" className="border-t border-border bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:mb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-secondary">
              <Flame className="h-4 w-4" aria-hidden="true" />
              Hot tours
            </p>
            <h2 className="text-3xl text-foreground sm:text-4xl">Start with the routes travelers ask for most.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              A short selection for an upcoming Kyrgyzstan trip. Send your dates and we will
              confirm real availability, route details, and the best pace for your group.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full btn-micro btn-action-outline lg:w-auto">
            <Link to="/tours" data-track-event="home_hot_tours_all_click" data-track-label="All tours">
              Explore all tours
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {hotTours.map((tour, index) => {
            const imageVariants = tourImageVariants(tour.image);
            const publicTourPath = tourPath(tour);
            return (
              <article
                key={tour.id}
                className="group interactive-card card-hover overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <Link
                  to={publicTourPath}
                  className="relative block h-60 overflow-hidden sm:h-64"
                  aria-label={`View ${tour.title}`}
                  data-track-event="home_hot_tour_image_click"
                  data-track-label={tour.title}
                >
                  <ResponsiveImage
                    src={tour.image}
                    variants={imageVariants}
                    mobileVariants={imageVariants.slice(0, 1)}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt={tour.title}
                    width={960}
                    height={640}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="card-media h-full w-full object-cover"
                  />
                  <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                    <Flame className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                    Hot right now
                  </span>
                  <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                    {tour.season || 'Flexible season'}
                  </span>
                </Link>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl leading-snug text-foreground sm:text-2xl">
                      <Link
                        to={publicTourPath}
                        className="card-title-link"
                        data-track-event="home_hot_tour_title_click"
                        data-track-label={tour.title}
                      >
                        {tour.title}
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    </h3>
                    <p className="shrink-0 text-base font-semibold text-primary">{tour.price}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-secondary" aria-hidden="true" />
                      {tour.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-secondary" aria-hidden="true" />
                      {tour.tourType}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{tour.description}</p>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4 text-secondary" aria-hidden="true" />
                      Dates and final price confirmed personally
                    </span>
                    <Link
                      to={`${publicTourPath}#booking`}
                      className="card-cta shrink-0 text-sm font-medium text-primary"
                      data-track-event="home_hot_tour_request_click"
                      data-track-label={tour.title}
                    >
                      Ask about dates
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
