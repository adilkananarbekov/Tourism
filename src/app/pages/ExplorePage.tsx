import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import regions from '../../data/kyrgyz_region_places.json';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/button';
import { withBasePath } from '../lib/assets';

interface RegionPlace {
  name: string;
  description: string;
  imageUrl: string;
}

interface Region {
  name: string;
  description: string;
  places: RegionPlace[];
}

const regionData = regions as Region[];

export function ExplorePage() {
  const ideaFilters = ['Weekend', 'Lakes', 'Mountains', 'Culture', 'Photo stops', 'Family'];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Trip Ideas"
        description="Find ideas for where to go in Kyrgyzstan before requesting a ready or custom tour."
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              Where can we go?
            </p>
            <h1 className="text-3xl sm:text-4xl text-foreground mb-4">Trip Ideas in Kyrgyzstan</h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl">
              Use this page as inspiration before choosing a tour. If guests do not know the exact
              route, they can pick places they like and send a custom request.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Not sure what fits the season, dates, or group?
            </p>
            <Button asChild className="mt-4 w-full btn-micro btn-action">
              <Link
                to="/custom-tour"
                data-track-event="ideas_custom_tour_click"
                data-track-label="Ideas custom tour"
              >
                Build a Custom Route
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {ideaFilters.map((filter) => (
            <span
              key={filter}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
            >
              {filter}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {regionData.map((region, index) => (
            <div
              key={region.name}
              className="bg-card border border-border rounded-lg overflow-hidden shadow-sm card-hover h-full flex flex-col stagger-item"
              style={{ '--stagger-delay': `${index * 60}ms` } as CSSProperties}
            >
              <div className="relative h-52 w-full bg-muted overflow-hidden">
                <img
                  src={
                    withBasePath(region.places[0]?.imageUrl || '/images/gallery/gallery-01.jpg')
                  }
                  alt={`${region.name} region`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover card-media"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent card-overlay" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl text-foreground">{region.name}</h2>
                  <p className="text-muted-foreground">{region.description}</p>
                </div>
                <div className="space-y-3">
                  {region.places.map((place) => (
                    <div key={place.name} className="flex gap-3">
                      <div className="h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={withBasePath(place.imageUrl)}
                          alt={place.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{place.name}</p>
                        <p className="text-sm text-muted-foreground">{place.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
