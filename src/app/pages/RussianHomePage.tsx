import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SEO } from '../components/SEO';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { HeroAtmosphere } from '../components/HeroAtmosphere';
import { Reveal } from '../components/Reveal';
import { SectionTransition } from '../components/SectionTransition';
import { useToursData } from '../hooks/useTours';
import { localizeTour } from '../lib/localizedTours';
import { localeAlternates } from '../lib/locale';
import { breadcrumbJsonLd, organizationJsonLd } from '../lib/seo';
import { tourPath } from '../lib/tourRoutes';

const featuredTourIds = [2, 11, 3];

export function RussianHomePage() {
  const { tours } = useToursData();
  const featuredTours = featuredTourIds
    .map((id) => tours.find((tour) => tour.id === id))
    .filter((tour): tour is NonNullable<typeof tour> => Boolean(tour))
    .map((tour) => localizeTour(tour, 'ru'));

  return (
    <>
      <SEO
        title="Туры по Кыргызстану — частные поездки и горные маршруты"
        description="Частные туры по Кыргызстану: Иссык-Куль, Сон-Куль, Кель-Суу, конные маршруты, юрты и горные автопутешествия с локальной организацией."
        path="/ru"
        language="ru"
        alternates={localeAlternates('/')}
        jsonLd={[
          organizationJsonLd(),
          breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }]),
        ]}
      />

      <div className="home-flow">
      <section className="hero-surface relative isolate overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <ResponsiveImage
          src="/images/go-kyrgyzstan-hero.webp"
          variants={[
            { src: '/images/go-kyrgyzstan-hero-720.webp', width: 720 },
            { src: '/images/go-kyrgyzstan-hero-1080.webp', width: 1080 },
          ]}
          mobileVariants={[{ src: '/images/go-kyrgyzstan-hero-720.webp', width: 720 }]}
          sizes="100vw"
          alt="Горный пейзаж Кыргызстана"
          width={1080}
          height={1080}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="hero-main-photo absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="hero-wash absolute inset-0 -z-10" />
        <HeroAtmosphere />
        <div className="hero-content relative z-10 mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="hero-copy text-left">
              <p className="hero-eyebrow mb-4 text-sm uppercase tracking-[0.24em]">Кыргызстан с локальной командой</p>
              <h1 className="text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                Частные туры по Кыргызстану: горы, озёра и кочевая культура.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl">
                Подберём маршрут по датам, уровню активности и интересам: Иссык-Куль, Сон-Куль,
                Кель-Суу, конные поездки и горные автопутешествия.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="btn-action w-full sm:w-auto">
                <Link to="/ru/tours">
                  Смотреть туры
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="hero-outline-action w-full sm:w-auto">
                <Link to="/ru/feedback">Подобрать маршрут</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Reveal className="section-reveal">
      <SectionTransition />
      <section className="border-t border-border bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">Популярные маршруты</p>
            <h2 className="text-3xl text-foreground sm:text-4xl">С чего начать путешествие</h2>
            <p className="mt-4 text-lg leading-7 text-muted-foreground">
              Выберите готовую идею или отправьте даты — мы подтвердим реальную доступность и детали маршрута.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {featuredTours.map((tour) => (
              <article key={tour.id} className="interactive-card card-hover overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Link to={tourPath(tour, 'ru')} className="relative block h-60 overflow-hidden">
                  <ResponsiveImage
                    src={tour.image}
                    alt={tour.title}
                    width={960}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    className="card-media h-full w-full object-cover"
                  />
                  <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <span className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-1.5 text-sm text-white backdrop-blur-sm">{tour.season}</span>
                </Link>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl leading-snug text-foreground">
                      <Link to={tourPath(tour, 'ru')} className="card-title-link">
                        {tour.title}
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    </h3>
                    <span className="shrink-0 font-semibold text-primary">{tour.price}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-secondary" />{tour.duration}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-secondary" />{tour.tourType}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{tour.description}</p>
                  <Link to={tourPath(tour, 'ru')} className="card-cta mt-5 text-sm font-medium text-primary">
                    Подробнее о туре
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <Link
            to="/ru/destinations/song-kul"
            className="interactive-card mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between"
            data-track-event="ru_home_song_kul_destination_click"
            data-track-label="Song-Kul destination"
          >
            <span>
              <span className="block text-xs uppercase tracking-[0.18em] text-secondary">Популярное направление</span>
              <span className="mt-1 block text-xl text-foreground">Сон-Куль: юрты, конные маршруты и горные дороги</span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">Выбрать маршрут <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
          </Link>
        </div>
      </section>
      </Reveal>

      <Reveal className="section-reveal">
      <SectionTransition className="section-transition--reverse" />
      <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">Планирование без лишнего</p>
            <h2 className="text-3xl text-foreground">Маршрут под вашу поездку</h2>
            <p className="mt-4 text-lg leading-7 text-muted-foreground">
              Можно выбрать готовый тур, изменить темп и остановки или начать с запроса без точного маршрута.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5"><h3 className="text-lg text-foreground">Гибкие даты</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Уточняем доступность после вашей заявки.</p></div>
            <div className="rounded-xl border border-border bg-card p-5"><h3 className="text-lg text-foreground">Локальная организация</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Маршруты, водители, гиды и размещение в Кыргызстане.</p></div>
          </div>
        </div>
      </section>
      </Reveal>
      </div>
    </>
  );
}
