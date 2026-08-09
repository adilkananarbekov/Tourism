import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { SiteLocale } from '../lib/locale';

type MapLocation = {
  name: string;
  lat: number;
  lng: number;
};

const MapSection = lazy(() =>
  import('./MapSection').then((module) => ({ default: module.MapSection }))
);

export function DeferredMapSection({
  title,
  locations = [],
  locale = 'en',
}: {
  title: string;
  locations?: MapLocation[];
  locale?: SiteLocale;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || shouldLoad) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -30% 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef}>
      {shouldLoad ? (
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-lg border border-border bg-muted sm:h-72" />
          }
        >
          <MapSection title={title} locations={locations} locale={locale} />
        </Suspense>
      ) : (
        <div className="space-y-3">
          <h3 className="text-2xl text-foreground">{locale === 'ru' ? 'Карта маршрута' : 'Map Preview'}</h3>
          <p className="text-sm text-muted-foreground">
            {locale === 'ru'
              ? 'Интерактивная карта маршрута загрузится, когда вы прокрутите страницу ближе к этому разделу.'
              : 'The interactive route map loads when you scroll closer to this section.'}
          </p>
          <div className="h-64 rounded-lg border border-border bg-muted sm:h-72" />
        </div>
      )}
    </div>
  );
}
