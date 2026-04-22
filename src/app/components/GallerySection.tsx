import { Link } from 'react-router-dom';
import { galleryPreviewItems, galleryVideo } from '../data/gallery';
import { Button } from './ui/button';
import { withBasePath } from '../lib/assets';

export function GallerySection() {
  const videoSrc = withBasePath(galleryVideo.src);
  const videoPoster = withBasePath(galleryVideo.poster);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4">Trip Gallery</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Real moments from recent adventures across Kyrgyzstan - mountains, lakes, and unforgettable guests.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start">
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
              <video
                className="w-full h-full"
                src={videoSrc}
                poster={videoPoster}
                controls
                muted
                playsInline
                preload="metadata"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Featured clip</p>
                <p className="text-lg text-foreground">{galleryVideo.title}</p>
              </div>
              <Button
                asChild
                className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link to="/gallery">View Full Gallery</Link>
              </Button>
            </div>
          </div>

          <div className="masonry-grid masonry-grid--preview">
            {galleryPreviewItems.map((item) => (
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
        </div>
      </div>
    </section>
  );
}
