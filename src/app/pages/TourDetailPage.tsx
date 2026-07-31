import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TourDetail } from '../components/TourDetail';
import { SEO } from '../components/SEO';
import { useToursData } from '../hooks/useTours';
import { breadcrumbJsonLd, tourJsonLd } from '../lib/seo';
import { localeAlternates } from '../lib/locale';

export function TourDetailPage() {
  const { tourId } = useParams();
  const { tours, loading } = useToursData();

  const selectedTour = useMemo(() => {
    if (!tourId) {
      return null;
    }
    const parsed = Number(tourId);
    return tours.find((tour) => tour.id === parsed) ?? null;
  }, [tourId, tours]);
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
        path={selectedTour ? `/tours/${selectedTour.id}` : undefined}
        alternates={selectedTour ? localeAlternates(`/tours/${selectedTour.id}`) : []}
        noindex={!selectedTour}
        jsonLd={
          selectedTour
            ? [
                tourJsonLd(selectedTour),
                breadcrumbJsonLd([
                  { name: 'Home', path: '/' },
                  { name: 'Tours', path: '/tours' },
                  { name: selectedTour.title, path: `/tours/${selectedTour.id}` },
                ]),
              ]
            : undefined
        }
      />
      <TourDetail tour={selectedTour} relatedTours={relatedTours} />
    </>
  );
}
