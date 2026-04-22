import { CheckCircle2, Map, MessageCircle, Mountain, Route } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { withBasePath } from '../lib/assets';

const chapters = [
  {
    eyebrow: 'First message',
    title: 'Tell me the shape of the trip',
    body: 'Dates can be exact or flexible. A name and Telegram username or phone number is enough to start.',
    image: '/images/gallery/gallery-25.jpg',
    icon: MessageCircle,
  },
  {
    eyebrow: 'Route design',
    title: 'I turn preferences into a real route',
    body: 'The plan balances road time, altitude, comfort, scenery, and the season instead of forcing every guest into the same itinerary.',
    image: '/images/tour-songkul.jpg',
    icon: Route,
  },
  {
    eyebrow: 'Local coordination',
    title: 'Hosts, drivers, permits, and timing line up',
    body: 'Behind the route, the practical details are checked so the travel days feel simple when you arrive.',
    image: '/images/tour-horseback.jpg',
    icon: Map,
  },
  {
    eyebrow: 'On the road',
    title: 'The journey stays flexible',
    body: 'Weather, pace, and guest energy matter in the mountains. The route can adjust without losing the main experience.',
    image: '/images/tour-ala-archa.jpg',
    icon: Mountain,
  },
  {
    eyebrow: 'After the trip',
    title: 'Clear memories, not complicated logistics',
    body: 'The goal is a trip that feels personal, calm, and easy to remember because the planning stayed human.',
    image: '/images/gallery/gallery-08.jpg',
    icon: CheckCircle2,
  },
];

export function JourneyStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const chapterRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeChapter = chapters[activeIndex];

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.chapterIndex || 0);
            setActiveIndex(index);
          }
        });
      },
      {
        rootMargin: '-35% 0px -45% 0px',
        threshold: 0.2,
      }
    );

    chapterRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="story-scroll bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
            How the journey forms
          </p>
          <h2 className="mb-5 max-w-2xl text-3xl text-foreground sm:text-4xl lg:text-5xl">
            A Kyrgyzstan trip should feel designed around the guest, not assembled from a template.
          </h2>
          <p className="mb-8 max-w-xl text-base text-muted-foreground sm:text-lg">
            This is the planning rhythm I use: clear enough for trust, flexible enough for mountain travel.
          </p>

          <div className="story-scroll-media relative overflow-hidden rounded-md border border-border bg-muted">
            <img
              key={activeChapter.image}
              src={withBasePath(activeChapter.image)}
              alt={activeChapter.title}
              className="story-scroll-image h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-5 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                {activeChapter.eyebrow}
              </p>
              <p className="mt-1 max-w-md text-xl">{activeChapter.title}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:pt-24">
          {chapters.map((chapter, index) => {
            const Icon = chapter.icon;
            const isActive = index === activeIndex;

            return (
              <div
                key={chapter.title}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
                data-chapter-index={index}
                className={cn(
                  'story-scroll-chapter border-l px-5 py-7 transition-colors sm:px-7',
                  isActive
                    ? 'border-secondary bg-accent/45'
                    : 'border-border bg-transparent'
                )}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border',
                      isActive
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {String(index + 1).padStart(2, '0')} / {chapter.eyebrow}
                    </p>
                    <h3 className="text-xl text-foreground sm:text-2xl">{chapter.title}</h3>
                  </div>
                </div>
                <p className="max-w-xl text-base leading-7 text-muted-foreground">
                  {chapter.body}
                </p>
                <img
                  src={withBasePath(chapter.image)}
                  alt=""
                  className="mt-5 block aspect-[16/10] w-full rounded-md object-cover lg:hidden"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            );
          })}

          <div className="pt-6">
            <Button
              asChild
              className="btn-micro bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/custom-tour">Start With a Flexible Request</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
