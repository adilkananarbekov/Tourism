import type { CSSProperties } from 'react';
import { ArrowRight, Calendar, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Spinner } from './Spinner';
import { Skeleton } from './ui/skeleton';
import type { Tour } from './tour-data';
import { ResponsiveImage } from './ResponsiveImage';
import type { SiteLocale } from '../lib/locale';
import { localizedPath } from '../lib/locale';

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

interface ToursGridProps {
  tours: Tour[];
  loading?: boolean;
  error?: string | null;
  stagger?: boolean;
  locale?: SiteLocale;
}

export function ToursGrid({ tours, loading = false, error, stagger = false, locale = 'en' }: ToursGridProps) {
  const isRussian = locale === 'ru';
  const labels = isRussian
    ? {
        loading: 'Загружаем туры...',
        heading: 'Готовые туры по Кыргызстану',
        intro: 'Выберите маршрут, оставьте контакты — команда Go Kyrgyzstan Travel свяжется с вами лично.',
        empty: 'Сейчас нет доступных туров.',
        view: 'Подробнее',
        request: 'Оставить заявку',
        viewAria: 'Открыть',
      }
    : {
        loading: 'Loading tours...',
        heading: 'Signature Tours',
        intro: 'Choose a route, send your contact details, and Go Kyrgyzstan Travel will follow up personally.',
        empty: 'No tours are available right now.',
        view: 'View Details',
        request: 'Request Tour',
        viewAria: 'View',
      };

  if (loading && tours.length === 0) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <Spinner />
            <p className="text-muted-foreground text-lg">{labels.loading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-card rounded-lg overflow-hidden shadow-md">
                <Skeleton className="h-56 w-full sm:h-64" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">
            {labels.heading}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {labels.intro}
          </p>
        </div>

        {error && import.meta.env.DEV && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {tours.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
            {labels.empty}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour, index) => (
            <article
              key={tour.id}
              className={`interactive-card bg-card rounded-lg overflow-hidden shadow-md card-hover${stagger ? ' stagger-item' : ''}`}
              style={
                (stagger
                  ? ({ '--stagger-delay': `${index * 60}ms` } as CSSProperties)
                  : undefined)
              }
            >
              {/* Tour Image */}
              <Link
                to={localizedPath(`/tours/${tour.id}`, locale)}
                className="relative block h-56 overflow-hidden sm:h-64"
                aria-label={`${labels.viewAria} ${tour.title}`}
                data-track-event="tour_card_image_click"
                data-track-label={tour.title}
              >
                <ResponsiveImage
                  src={tour.image}
                  variants={tourImageVariants(tour.image)}
                  mobileVariants={tourImageVariants(tour.image).slice(0, 1)}
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  alt={tour.title}
                  width={960}
                  height={640}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className="w-full h-full object-cover card-media"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent card-overlay" />
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-primary-foreground">
                    {tour.season}
                  </span>
                </div>
              </Link>

              {/* Tour Content */}
              <div className="p-6">
                <h3 className="text-xl sm:text-2xl text-foreground mb-3">
                  <Link
                    to={localizedPath(`/tours/${tour.id}`, locale)}
                    className="card-title-link"
                    data-track-event="tour_card_title_click"
                    data-track-label={tour.title}
                  >
                    {tour.title}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </h3>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{tour.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{tour.tourType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>{tour.price}</span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 line-clamp-3">
                  {tour.description}
                </p>

                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    className="w-full btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Link
                      to={localizedPath(`/tours/${tour.id}`, locale)}
                      data-track-event="tour_card_view_click"
                      data-track-label={tour.title}
                    >
                      {labels.view}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full btn-micro btn-action-outline"
                  >
                    <Link
                      to={`${localizedPath(`/tours/${tour.id}`, locale)}?book=true`}
                      data-track-event="tour_card_request_click"
                      data-track-label={tour.title}
                    >
                      {labels.request}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
