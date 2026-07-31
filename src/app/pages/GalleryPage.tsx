import { useState } from 'react';
import { galleryItems, galleryVideo } from '../data/gallery';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/button';
import { withBasePath } from '../lib/assets';
import { breadcrumbJsonLd } from '../lib/seo';
import { ResponsiveImage } from '../components/ResponsiveImage';

const INITIAL_GALLERY_COUNT = 12;
const GALLERY_BATCH_SIZE = 12;

export function GalleryPage() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_GALLERY_COUNT);
  const [videoActive, setVideoActive] = useState(false);
  const visibleItems = galleryItems.slice(0, visibleCount);
  const hasMore = visibleCount < galleryItems.length;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Kyrgyzstan Travel Photos & Videos"
        description="See real Kyrgyzstan travel photos and videos from mountain tours, horse riding routes, yurt camps, hikes, and cultural experiences."
        image="/images/hero.jpg"
        path="/gallery"
        jsonLd={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Gallery', path: '/gallery' },
        ])}
      />
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl text-foreground mb-4">Gallery</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            A visual diary of trips, landscapes, and guest experiences across Kyrgyzstan.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
            {videoActive ? (
              <video
                className="h-full w-full"
                src={withBasePath(galleryVideo.src)}
                poster={withBasePath('/images/gallery/video-poster-960.webp')}
                controls
                autoPlay
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <button
                type="button"
                className="btn-interactive group relative block w-full overflow-hidden rounded-xl text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary"
                onClick={() => setVideoActive(true)}
                aria-label={`Play ${galleryVideo.title}`}
              >
                <ResponsiveImage
                  src={galleryVideo.poster}
                  variants={[
                    { src: '/images/gallery/video-poster-480.webp', width: 480 },
                    { src: '/images/gallery/video-poster-960.webp', width: 960 },
                  ]}
                  mobileVariants={[
                    { src: '/images/gallery/video-poster-480.webp', width: 480 },
                  ]}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  alt="Night sky timelapse over a mountain yurt camp in Kyrgyzstan"
                  width={1920}
                  height={1080}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-video h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="rounded-full bg-white/95 px-5 py-3 text-sm font-medium text-slate-900 shadow-lg">
                    Play video
                  </span>
                </span>
              </button>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm text-muted-foreground">Featured video</p>
            <h2 className="text-2xl text-foreground">{galleryVideo.title}</h2>
            <p className="text-muted-foreground">
              Short clips from recent trips, including night skies, mountain drives, and camp moments.
            </p>
            <p className="text-sm text-muted-foreground">
              Want a custom photo stop? Tell me what you want to capture and I will plan for it.
            </p>
          </div>
        </div>

        <div className="masonry-grid">
          {visibleItems.map((item) => (
            <div key={item.src} className="masonry-item">
              <div className="rounded-lg overflow-hidden border border-border bg-card shadow-sm">
                <ResponsiveImage
                  src={item.src}
                  variants={[
                    { src: item.src.replace(/\.[^.]+$/, '-480.webp'), width: 480 },
                    { src: item.src.replace(/\.[^.]+$/, '-960.webp'), width: 960 },
                  ]}
                  mobileVariants={[
                    { src: item.src.replace(/\.[^.]+$/, '-480.webp'), width: 480 },
                  ]}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  decoding="async"
                  className="masonry-image"
                />
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="flex justify-center">
            <Button
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() =>
                setVisibleCount((count) =>
                  Math.min(count + GALLERY_BATCH_SIZE, galleryItems.length)
                )
              }
            >
              Load more photos
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
