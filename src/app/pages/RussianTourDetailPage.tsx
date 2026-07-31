import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TourDetail } from '../components/TourDetail';
import { SEO } from '../components/SEO';
import { useToursData } from '../hooks/useTours';
import { localizeTour } from '../lib/localizedTours';
import { localeAlternates } from '../lib/locale';
import { breadcrumbJsonLd } from '../lib/seo';

export function RussianTourDetailPage() {
  const { tourId } = useParams();
  const { tours, loading } = useToursData();
  const selectedTour = useMemo(() => {
    const id = Number(tourId);
    const tour = tours.find((item) => item.id === id);
    return tour ? localizeTour(tour, 'ru') : null;
  }, [tourId, tours]);

  if (loading) {
    return <div className="px-4 py-16 text-center text-muted-foreground">Загружаем тур...</div>;
  }

  const path = selectedTour ? `/tours/${selectedTour.id}` : '/tours';
  const relatedTours = useMemo(() => {
    if (!selectedTour?.relatedTourIds?.length) {
      return [];
    }
    const localizedTours = tours.map((tour) => localizeTour(tour, 'ru'));
    const byId = new Map(localizedTours.map((tour) => [tour.id, tour]));
    return selectedTour.relatedTourIds
      .map((id) => byId.get(id))
      .filter((tour): tour is NonNullable<typeof tour> => Boolean(tour));
  }, [selectedTour, tours]);
  return (
    <>
      <SEO
        title={selectedTour ? `${selectedTour.title} — тур по Кыргызстану` : 'Тур по Кыргызстану'}
        description={selectedTour ? `${selectedTour.description} Продолжительность: ${selectedTour.duration}. Цена от ${selectedTour.price}.` : 'Детали тура по Кыргызстану.'}
        image={selectedTour?.image}
        path={selectedTour ? `/ru/tours/${selectedTour.id}` : '/ru/tours'}
        language="ru"
        alternates={localeAlternates(path)}
        noindex={!selectedTour}
        jsonLd={selectedTour ? breadcrumbJsonLd([
          { name: 'Главная', path: '/ru' },
          { name: 'Туры', path: '/ru/tours' },
          { name: selectedTour.title, path: `/ru/tours/${selectedTour.id}` },
        ]) : undefined}
      />
      <TourDetail tour={selectedTour} locale="ru" relatedTours={relatedTours} />
    </>
  );
}
