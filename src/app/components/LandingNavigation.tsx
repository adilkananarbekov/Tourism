import { Images, Lightbulb, MapPinned, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const landingLinks = [
  {
    title: 'Available tours',
    description: 'Choose a ready route with flexible dates.',
    to: '/tours',
    action: 'View tours',
    icon: MapPinned,
  },
  {
    title: 'Trip ideas',
    description: 'Find places and route inspiration.',
    to: '/explore',
    action: 'Get ideas',
    icon: Lightbulb,
  },
  {
    title: 'Real gallery',
    description: 'See real photos before deciding.',
    to: '/gallery',
    action: 'See photos',
    icon: Images,
  },
  {
    title: 'Direct request',
    description: 'Send contact details and a message.',
    to: '/feedback',
    action: 'Contact us',
    icon: MessageCircle,
  },
];

export function LandingNavigation() {
  return (
    <section className="border-t border-border bg-background px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              Start here
            </p>
            <h2 className="text-2xl text-foreground sm:text-3xl">
              Pick the next step in seconds.
            </h2>
          </div>
          <p className="text-base text-muted-foreground sm:text-lg">
            The homepage stays short like a business card. Detailed tours, route ideas,
            photos, and contact live on separate pages.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {landingLinks.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.to} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-teal-600 via-emerald-700 to-orange-700 text-white shadow-sm ring-1 ring-white/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
                <Button asChild variant="outline" className="mt-4 w-full btn-micro btn-action-outline">
                  <Link
                    to={item.to}
                    data-track-event="landing_navigation_click"
                    data-track-label={item.title}
                  >
                    {item.action}
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
