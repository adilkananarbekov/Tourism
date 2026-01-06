import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TourDetail } from '../components/TourDetail';
import { SEO } from '../components/SEO';
import { useToursData } from '../hooks/useTours';

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

  if (loading) {
    return <div className="py-16 px-4 text-center text-muted-foreground">Loading tour...</div>;
  }

  return (
    <>
      <SEO
        title={selectedTour?.title || 'Tour'}
        description={selectedTour?.description}
        image={selectedTour?.image}
      />
      <TourDetail tour={selectedTour} />
    </>
  );
}
