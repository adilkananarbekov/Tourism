import { ArrowRight, Camera, Compass, Mountain, TentTree } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { tourPath } from '../lib/tourRoutes';

const ideas = [
  {
    title: 'First time in Kyrgyzstan',
    description: 'Lake views, canyons, hot springs, Karakol, and flexible stops around Issyk-Kul.',
    to: '/destinations/issyk-kul',
    action: 'Explore Issyk-Kul routes',
    icon: Compass,
  },
  {
    title: 'Horseback highlands',
    description: 'Ride from Kyzart through Kilemche Valley to Song-Kul, with yurt stays and wide mountain scenery.',
    to: tourPath(2),
    action: 'See horse route',
    icon: Camera,
  },
  {
    title: 'Nomad lake experience',
    description: 'Song-Kul yurts, horse riding, local families, open pastures, and high-altitude scenery.',
    to: '/destinations/song-kul',
    action: 'Explore Song-Kul routes',
    icon: TentTree,
  },
  {
    title: 'A week of mountain lakes',
    description: 'A private 7-day route connecting Song-Kul, Kel-Suu, and Issyk-Kul at a practical pace.',
    to: tourPath(3),
    action: 'See 7-day route',
    icon: Mountain,
  },
];

export function TripIdeas() {
  return (
    <section className="border-t border-border bg-muted px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              Not sure where to go?
            </p>
            <h2 className="text-3xl text-foreground sm:text-4xl">
              Start with a trip style.
            </h2>
          </div>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            Foreign travelers often know they want Kyrgyzstan, but not the exact route. These
            quick options help match the guest to a tour faster.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ideas.map((idea) => {
            const Icon = idea.icon;
            return (
              <article key={idea.title} className="interactive-card rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg text-foreground">{idea.title}</h3>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-muted-foreground">
                  {idea.description}
                </p>
                <Button asChild variant="outline" className="mt-5 w-full btn-micro btn-action-outline">
                  <Link
                    to={idea.to}
                    data-track-event="trip_idea_click"
                    data-track-label={idea.title}
                  >
                    <span>{idea.action}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
