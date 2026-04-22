import { Images, Lightbulb, MapPinned, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const landingLinks = [
  {
    title: 'Available tours',
    description: 'Ready routes guests can request without a long form.',
    to: '/tours',
    action: 'View tours',
    icon: MapPinned,
  },
  {
    title: 'Trip ideas',
    description: 'Places, regions, and route inspiration for guests who are still choosing.',
    to: '/explore',
    action: 'Get ideas',
    icon: Lightbulb,
  },
  {
    title: 'Real gallery',
    description: 'Photos and clips that sell the feeling before the guest sends a request.',
    to: '/gallery',
    action: 'See photos',
    icon: Images,
  },
  {
    title: 'Direct request',
    description: 'Name plus Telegram or phone is enough to start the conversation.',
    to: '/feedback',
    action: 'Contact us',
    icon: MessageCircle,
  },
];

export function LandingNavigation() {
  return (
    <section className="border-t border-border bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
            Start here
          </p>
          <h2 className="text-3xl text-foreground sm:text-4xl">
            A simple travel website first, with deeper pages when guests want details.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            The home page works like a business card and advertisement. Navigation then takes
            people to tours, route ideas, gallery proof, or a fast contact form.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {landingLinks.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.to} className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl text-foreground">{item.title}</h3>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
                <Button asChild variant="outline" className="mt-5 w-full btn-micro btn-action-outline">
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
