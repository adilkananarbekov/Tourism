import { BadgeCheck, Languages, MapPin, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { withBasePath } from '../lib/assets';

export function AboutMe() {
  const highlights = [
    {
      icon: MapPin,
      title: 'Based in Bishkek',
      description: 'Flexible pickups and meetups across Kyrgyzstan.',
    },
    {
      icon: Languages,
      title: 'Languages',
      description: 'English, Russian, and Kyrgyz.',
    },
    {
      icon: BadgeCheck,
      title: 'Local expertise',
      description: 'Routes built with trusted drivers, hosts, and guides.',
    },
    {
      icon: Shield,
      title: 'Safety-first',
      description: 'Clear planning, reliable gear, and realistic pacing.',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-lg">
            <img
              src={withBasePath('/images/about-me.jpg')}
              alt="Local guide with eagle in Kyrgyzstan"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute -bottom-6 left-6 right-6 rounded-xl border border-border bg-card p-4 shadow-lg">
            <p className="text-sm text-muted-foreground">Solo guide and trip designer</p>
            <p className="text-lg text-foreground">Custom routes for every season</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-3xl sm:text-4xl text-foreground mb-4">About Me</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              I am a local guide and tour seller based in Kyrgyzstan. Guests choose a ready route
              or send a custom request, then I or my managers contact them directly to confirm the
              tour details.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/feedback">Send a Request</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="btn-micro border-primary text-primary hover:bg-primary/10"
            >
              <Link to="/custom-tour">Custom Tour</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
