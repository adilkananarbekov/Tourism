import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { withBasePath } from '../lib/assets';

export function Highlights() {
  const highlights = [
    {
      name: 'Issyk-Kul Lake',
      region: 'Issyk-Kul',
      season: 'May - Oct',
      description: 'Sunny lakeside views with alpine peaks in the background.',
      image: '/images/tour-issyk-kul.jpg',
    },
    {
      name: 'Song-Kol Lake',
      region: 'Naryn',
      season: 'Jun - Sep',
      description: 'High-mountain yurt camps, horseback rides, and open skies.',
      image: '/images/tour-songkul.jpg',
    },
    {
      name: 'Ala-Archa Gorge',
      region: 'Chuy',
      season: 'Apr - Oct',
      description: 'Easy hikes, waterfalls, and glacier views just outside Bishkek.',
      image: '/images/tour-ala-archa.jpg',
    },
    {
      name: 'Jety-Oguz Gorge',
      region: 'Issyk-Kul',
      season: 'May - Oct',
      description: 'Red sandstone cliffs, forest trails, and mountain viewpoints.',
      image: '/images/tour-silk-road.jpg',
    },
    {
      name: 'Sary-Chelek Reserve',
      region: 'Jalal-Abad',
      season: 'May - Sep',
      description: 'Lush forests, alpine lakes, and quiet mountain villages.',
      image: '/images/tour-peak-lenin.jpg',
    },
    {
      name: 'Alai Valley',
      region: 'Osh',
      season: 'Jun - Sep',
      description: 'Wide valleys and big-sky views near the Pamir mountains.',
      image: '/images/tour-horseback.jpg',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">
            Beautiful Places to Explore
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            These are a few favorite spots. Each trip is customized based on season and travel style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {highlights.map((place) => (
            <div key={place.name} className="bg-card border border-border rounded-lg overflow-hidden shadow-md">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={withBasePath(place.image)}
                  alt={place.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                <span className="absolute top-4 right-4 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary-foreground">
                  {place.season}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{place.region}</span>
                </div>
                <h3 className="text-xl text-foreground">{place.name}</h3>
                <p className="text-sm text-muted-foreground">{place.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/explore">See More Places</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
