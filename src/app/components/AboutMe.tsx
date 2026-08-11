import { BadgeCheck, Instagram, Languages, MapPin, MessageCircle, Phone, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ResponsiveImage } from './ResponsiveImage';
import {
  FOUNDER_IMAGE,
  FOUNDER_NAME,
  FOUNDER_ROLE,
  INSTAGRAM_URL,
  TELEGRAM_URL,
  TELEGRAM_USERNAME,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../lib/contact';

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
    <section id="founder" className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-lg">
            <ResponsiveImage
              src={FOUNDER_IMAGE}
              variants={[
                { src: '/images/founder-jakypbekov-insan-480.webp', width: 480 },
                { src: '/images/founder-jakypbekov-insan-960.webp', width: 960 },
              ]}
              mobileVariants={[
                { src: '/images/founder-jakypbekov-insan-480.webp', width: 480 },
              ]}
              sizes="(min-width: 1024px) 40vw, 100vw"
              alt={`${FOUNDER_NAME}, founder of Go Kyrgyzstan Travel`}
              width={1200}
              height={1600}
              className="h-full w-full object-cover object-[center_38%]"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute -bottom-6 left-6 right-6 rounded-xl border border-border bg-card p-4 shadow-lg">
            <p className="text-sm text-muted-foreground">{FOUNDER_ROLE}</p>
            <p className="text-lg text-foreground">{FOUNDER_NAME}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              Founder
            </p>
            <h2 className="text-3xl sm:text-4xl text-foreground mb-4">{FOUNDER_NAME}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              I am the founder of Go Kyrgyzstan Travel and a local trip planner based in
              Kyrgyzstan. Guests choose a ready route or send a request, then I or my managers
              contact them directly to confirm the details.
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
            <Button asChild className="btn-micro btn-action">
              <Link
                to="/feedback"
                data-track-event="about_request_click"
                data-track-label="About request"
              >
                Send a Request
              </Link>
            </Button>
            <Button asChild variant="outline" className="btn-micro btn-action-outline">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                data-track-event="founder_telegram_click"
                data-track-label={TELEGRAM_USERNAME}
              >
                <MessageCircle className="h-4 w-4" />
                Telegram
              </a>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
              data-track-event="founder_instagram_click"
              data-track-label="jakypbekovv1"
            >
              <Instagram className="mb-3 h-5 w-5 text-secondary" />
              <p className="text-sm text-muted-foreground">Instagram</p>
              <p className="text-sm text-foreground">@jakypbekovv1</p>
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
              data-track-event="founder_telegram_card_click"
              data-track-label={TELEGRAM_USERNAME}
            >
              <MessageCircle className="mb-3 h-5 w-5 text-secondary" />
              <p className="text-sm text-muted-foreground">Telegram</p>
              <p className="text-sm text-foreground">{TELEGRAM_USERNAME}</p>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
              data-track-event="founder_whatsapp_click"
              data-track-label={WHATSAPP_DISPLAY}
            >
              <Phone className="mb-3 h-5 w-5 text-secondary" />
              <p className="text-sm text-muted-foreground">WhatsApp</p>
              <p className="text-sm text-foreground">{WHATSAPP_DISPLAY}</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
