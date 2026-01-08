import type { CSSProperties } from 'react';
import regions from '../../data/kyrgyz_region_places.json';
import { SEO } from '../components/SEO';

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
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Explore"
        description="Discover seven regions of Kyrgyzstan with highlights, landmarks, and cultural insights."
      />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl text-foreground mb-4">Explore Kyrgyzstan</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover seven distinct regions, each packed with legendary landscapes, cultural
            heritage, and unforgettable adventures.
          </p>
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
                    region.places[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80'
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
                          src={place.imageUrl}
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
