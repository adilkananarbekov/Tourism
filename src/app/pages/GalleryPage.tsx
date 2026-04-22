import { useState } from 'react';
import { galleryItems, galleryVideo } from '../data/gallery';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/button';
import { withBasePath } from '../lib/assets';

const INITIAL_GALLERY_COUNT = 12;
const GALLERY_BATCH_SIZE = 12;

export function GalleryPage() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_GALLERY_COUNT);
  const visibleItems = galleryItems.slice(0, visibleCount);
  const hasMore = visibleCount < galleryItems.length;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Gallery"
        description="Browse real photos and videos from Kyrgyzstan tours, hikes, and cultural experiences."
        image="/images/hero.jpg"
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
            <video
              className="w-full h-full"
              src={withBasePath(galleryVideo.src)}
              poster={withBasePath(galleryVideo.poster)}
              controls
              muted
              playsInline
              preload="metadata"
            />
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
                <img
                  src={withBasePath(item.src)}
                  alt={item.alt}
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
