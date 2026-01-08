import type { CSSProperties } from 'react';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Spinner } from './Spinner';
import { Skeleton } from './ui/skeleton';
import type { Tour } from './tour-data';

interface ToursGridProps {
  tours: Tour[];
  loading?: boolean;
  error?: string | null;
  stagger?: boolean;
}

export function ToursGrid({ tours, loading = false, error, stagger = false }: ToursGridProps) {
  if (loading && tours.length === 0) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <Spinner />
            <p className="text-muted-foreground text-lg">Loading tours...</p>
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
            Our Adventure Tours
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose from our carefully curated selection of tours, each designed to showcase the best of Kyrgyzstan's natural beauty and cultural heritage
          </p>
        </div>

        {error && import.meta.env.DEV && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {tours.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
            No tours are available right now.
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour, index) => (
            <div
              key={tour.id}
              className={`bg-card rounded-lg overflow-hidden shadow-md card-hover${stagger ? ' stagger-item' : ''}`}
              style={
                (stagger
                  ? ({ '--stagger-delay': `${index * 60}ms` } as CSSProperties)
                  : undefined)
              }
            >
              {/* Tour Image */}
              <div className="relative h-56 overflow-hidden sm:h-64">
                <img
                  src={tour.image}
                  alt={tour.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover card-media"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent card-overlay" />
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-primary-foreground">
                    {tour.season}
                  </span>
                </div>
              </div>

              {/* Tour Content */}
              <div className="p-6">
                <h3 className="text-xl sm:text-2xl text-foreground mb-3">
                  {tour.title}
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
                    <Link to={`/tours/${tour.id}`}>View Details</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full btn-micro border-primary text-primary hover:bg-primary/10"
                  >
                    <Link to={`/tours/${tour.id}?book=true`}>Book Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
