import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SEO } from '../components/SEO';
import { ToursGrid } from '../components/ToursGrid';
import { useToursData } from '../hooks/useTours';
import { localizeTour } from '../lib/localizedTours';
import { localeAlternates } from '../lib/locale';
import { breadcrumbJsonLd } from '../lib/seo';

export function RussianToursPage() {
  const { tours, loading, error } = useToursData();
  const translatedTours = tours.map((tour) => localizeTour(tour, 'ru'));

  return (
    <div className="bg-background pb-20 md:pb-0">
      <SEO
        title="Туры по Кыргызстану — озёра, горы, культура и конные маршруты"
        description="Выберите тур по Кыргызстану: Иссык-Куль, Сон-Куль, Ала-Арча, Шёлковый путь, верховая езда, треккинг и горные автопутешествия."
        path="/ru/tours"
        language="ru"
        alternates={localeAlternates('/tours')}
        jsonLd={breadcrumbJsonLd([
          { name: 'Главная', path: '/ru' },
          { name: 'Туры', path: '/ru/tours' },
        ])}
      />
      <section className="border-b border-border bg-muted px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">Готовые маршруты</p>
            <h1 className="text-3xl text-foreground sm:text-4xl lg:text-5xl">Туры по Кыргызстану</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Выберите маршрут, а даты, темп и остановки уточним после личного общения.
            </p>
          </div>
          <Button asChild className="btn-action w-full lg:w-auto"><Link to="/ru/feedback">Подобрать тур</Link></Button>
        </div>
      </section>
      <ToursGrid tours={translatedTours} loading={loading} error={error} stagger locale="ru" />
    </div>
  );
}
