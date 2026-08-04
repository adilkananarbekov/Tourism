import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TourDetail } from '../components/TourDetail';
import { SEO } from '../components/SEO';
import { useToursData } from '../hooks/useTours';
import { breadcrumbJsonLd, tourJsonLd } from '../lib/seo';
import { localeAlternates } from '../lib/locale';
import { tourIdFromSlug, tourPath } from '../lib/tourRoutes';

export function TourDetailPage() {
  const { tourSlug } = useParams();
  const { tours, loading } = useToursData();

  const selectedTour = useMemo(() => {
    const id = tourIdFromSlug(tourSlug);
    if (!id) {
      return null;
    }
    return tours.find((tour) => tour.id === id) ?? null;
  }, [tourSlug, tours]);
  const selectedTourTitle = selectedTour
    ? /\btour\b/i.test(selectedTour.title)
      ? selectedTour.title
      : `${selectedTour.title} Tour`
    : 'Tour';
  const relatedTours = useMemo(() => {
    if (!selectedTour?.relatedTourIds?.length) {
      return [];
    }
    const byId = new Map(tours.map((tour) => [tour.id, tour]));
    return selectedTour.relatedTourIds
      .map((id) => byId.get(id))
      .filter((tour): tour is NonNullable<typeof tour> => Boolean(tour));
  }, [selectedTour, tours]);

  if (loading) {
    return <div className="py-16 px-4 text-center text-muted-foreground">Loading tour...</div>;
  }

  return (
    <>
      <SEO
        title={selectedTourTitle}
        description={
          selectedTour
            ? `${selectedTour.description} Duration: ${selectedTour.duration}. Starting from ${selectedTour.price}.`
            : 'Kyrgyzstan tour details and booking request.'
        }
        image={selectedTour?.image}
        path={selectedTour ? tourPath(selectedTour) : undefined}
        alternates={selectedTour ? localeAlternates(tourPath(selectedTour)) : []}
        noindex={!selectedTour}
        jsonLd={
          selectedTour
            ? [
                tourJsonLd(selectedTour),
                breadcrumbJsonLd([
                  { name: 'Home', path: '/' },
                  { name: 'Tours', path: '/tours' },
                  { name: selectedTour.title, path: tourPath(selectedTour) },
                ]),
              ]
            : undefined
        }
      />
      <TourDetail tour={selectedTour} relatedTours={relatedTours} />
    </>
  );
}
