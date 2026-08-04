import {
  CalendarRange,
  Check,
  MessageCircle,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/button';
import { tours } from '../components/tour-data';
import { breadcrumbJsonLd } from '../lib/seo';
import { withBasePath } from '../lib/assets';
import { tourPath } from '../lib/tourRoutes';

const steps = [
  {
    title: 'Share your dates',
    description: 'Tell us the month, flexibility, route interests, and number of travelers.',
    icon: CalendarRange,
  },
  {
    title: 'We compare compatible requests',
    description: 'We match travelers only when dates, route, pace, and expectations make sense.',
    icon: Users,
  },
  {
    title: 'Review before confirming',
    description: 'You receive the route, group size, inclusions, and price before making a decision.',
    icon: UserRoundCheck,
  },
];

const suitableFor = [
  'Solo travelers who prefer not to book a private vehicle alone',
  'Friends or couples open to sharing a route with a small group',
  'Travelers with flexible dates or more than one acceptable itinerary',
  'Guests comfortable agreeing on a shared daily pace',
];

export function JoinTourPage() {
  return (
    <section className="bg-background">
      <SEO
        title="Join a Small-Group Tour in Kyrgyzstan"
        description="Request a compatible small-group Kyrgyzstan departure for Song-Kul, Issyk-Kul, Ala-Archa, horse riding, culture, or a road trip."
        path="/join-tour"
        jsonLd={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Join a Group Tour', path: '/join-tour' },
        ])}
      />

      <div className="border-b border-border bg-muted/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">Small-group matching</p>
            <h1 className="max-w-3xl text-4xl text-foreground sm:text-5xl">
              Share the journey without joining a crowded bus tour
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Send your dates and preferred route. We look for a small number of travelers with
              compatible plans, then show everyone the details before confirmation.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/feedback">Request group matching</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tours">Compare routes</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-secondary" />
            <h2 className="mt-4 text-2xl text-foreground">How matching is handled</h2>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                Your contact details are not posted publicly.
              </li>
              <li className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                No group is confirmed until route and price are accepted.
              </li>
              <li className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                Private travel remains available when no suitable match exists.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        <section>
          <div className="max-w-2xl">
            <h2 className="text-3xl text-foreground">Three simple steps</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Matching is based on more than dates. The route, comfort level, and travel pace
              should work for everyone.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-7 w-7 text-secondary" />
                    <span className="text-sm text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-2xl text-foreground">{step.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 rounded-2xl border border-border bg-muted/50 p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl text-foreground">Group travel works best when…</h2>
            <ul className="mt-5 space-y-3">
              {suitableFor.map((item) => (
                <li key={item} className="flex gap-3 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-card p-6">
            <MessageCircle className="h-7 w-7 text-secondary" />
            <h2 className="mt-4 text-2xl text-foreground">What to include in your request</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Send your available dates, preferred places, budget range, accommodation comfort,
              hiking or riding experience, and anything that could affect the group pace.
            </p>
            <Button asChild className="mt-5">
              <Link to="/feedback">Send matching details</Link>
            </Button>
          </div>
        </section>

        <section>
          <h2 className="text-3xl text-foreground">Routes commonly requested for sharing</h2>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {tours.slice(0, 3).map((tour) => (
              <article key={tour.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <img
                  src={withBasePath(tour.image.replace(/\.[^.]+$/, '-480.webp'))}
                  alt={tour.title}
                  width={480}
                  height={640}
                  loading="lazy"
                  decoding="async"
                  className="h-52 w-full object-cover"
                />
                <div className="p-5">
                  <h3 className="text-2xl text-foreground">{tour.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tour.duration} · {tour.season}
                  </p>
                  <Link
                    to={tourPath(tour)}
                    className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    View route details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl text-foreground">Is a departure guaranteed?</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              No. A group is proposed only when compatible requests exist. We can also quote a
              private alternative so you are not left without a plan.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl text-foreground">How large are the groups?</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              The final size depends on the route and transport. The goal is a practical small
              group, with the exact number shown before confirmation.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
