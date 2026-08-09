import { useMemo } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Mountain, Route } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { Button } from '../components/ui/button';
import { findDestination } from '../data/destinations';
import { useToursData } from '../hooks/useTours';
import { localizedPath, localeAlternates, useSiteLocale } from '../lib/locale';
import { absoluteUrl, breadcrumbJsonLd } from '../lib/seo';
import { localizeTour } from '../lib/localizedTours';
import { tourPath } from '../lib/tourRoutes';

function imageVariants(image: string) {
  if (!/\.(jpe?g)$/i.test(image)) {
    return [];
  }

  const base = image.replace(/\.(jpe?g)$/i, '');
  return [
    { src: `${base}-480.webp`, width: 480 },
    { src: `${base}-960.webp`, width: 960 },
  ];
}

export function DestinationPage() {
  const { slug } = useParams();
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const destination = findDestination(slug);
  const { tours } = useToursData();

  const copy = destination?.[locale];
  const selectedTours = useMemo(() => {
    if (!destination) {
      return [];
    }

    const toursById = new Map(tours.map((tour) => [tour.id, tour]));
    return destination.tourIds
      .map((tourId) => toursById.get(tourId))
      .filter((tour): tour is NonNullable<typeof tour> => Boolean(tour))
      .map((tour) => localizeTour(tour, locale));
  }, [destination, locale, tours]);

  if (!destination || !copy) {
    const fallbackCopy = isRussian
      ? {
          title: 'Направление не найдено',
          text: 'Эта страница направления недоступна. Посмотрите все туры по Кыргызстану или отправьте нам идею поездки.',
          tours: 'Все туры',
          request: 'Подобрать маршрут',
        }
      : {
          title: 'Destination not found',
          text: 'This destination page is not available. Browse all Kyrgyzstan tours or send us your travel idea.',
          tours: 'All tours',
          request: 'Plan a trip',
        };

    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <SEO
          title={fallbackCopy.title}
          description={fallbackCopy.text}
          language={locale}
          noindex
        />
        <Mountain className="mx-auto h-11 w-11 text-secondary" aria-hidden="true" />
        <h1 className="mt-5 text-3xl text-foreground sm:text-4xl">{fallbackCopy.title}</h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">{fallbackCopy.text}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild className="btn-action">
            <Link to={localizedPath('/tours', locale)}>{fallbackCopy.tours}</Link>
          </Button>
          <Button asChild variant="outline" className="btn-action-outline">
            <Link to={localizedPath('/feedback', locale)}>{fallbackCopy.request}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const pagePath = localizedPath(`/destinations/${destination.slug}`, locale);
  const requestPath = `${localizedPath('/feedback', locale)}?tour=${encodeURIComponent(copy.title)}`;
  const labels = isRussian
    ? {
        home: 'Главная',
        tours: 'Туры',
        route: 'Маршрут',
        details: 'Подробнее',
        request: 'Уточнить этот маршрут',
        season: 'Сезон',
        type: 'Формат',
        allTours: 'Все туры по Кыргызстану',
      }
    : {
        home: 'Home',
        tours: 'Tours',
        route: 'Route',
        details: 'View details',
        request: 'Ask about this route',
        season: 'Season',
        type: 'Travel style',
        allTours: 'All Kyrgyzstan tours',
      };

  const listJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy.title,
    itemListElement: selectedTours.map((tour, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tour.title,
      url: absoluteUrl(tourPath(tour, locale)),
    })),
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="bg-background pb-20 md:pb-0">
      <SEO
        title={copy.seoTitle}
        description={copy.metaDescription}
        image={destination.heroImage}
        path={pagePath}
        language={locale}
        alternates={localeAlternates(`/destinations/${destination.slug}`)}
        jsonLd={[
          breadcrumbJsonLd([
            { name: labels.home, path: localizedPath('/', locale) },
            { name: copy.title, path: pagePath },
          ]),
          listJsonLd,
          faqJsonLd,
        ]}
      />

      <section className="relative isolate overflow-hidden border-b border-border bg-primary px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <ResponsiveImage
          src={destination.heroImage}
          variants={imageVariants(destination.heroImage)}
          mobileVariants={imageVariants(destination.heroImage).slice(0, 1)}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          width={960}
          height={640}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0c2a22]/95 via-[#173d31]/85 to-[#173d31]/50" />
        <div className="relative mx-auto max-w-7xl">
          <nav aria-label={isRussian ? 'Хлебные крошки' : 'Breadcrumb'} className="mb-7 text-sm text-white/75">
            <Link className="hover:text-white" to={localizedPath('/', locale)}>{labels.home}</Link>
            <span aria-hidden="true"> / </span>
            <span>{copy.title}</span>
          </nav>
          <div className="max-w-3xl">
            <p className="mb-4 text-sm uppercase tracking-[0.22em] text-[#f2d3a0]">{copy.eyebrow}</p>
            <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">{copy.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl">{copy.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="btn-action bg-white text-primary hover:bg-white/90">
                <Link to={requestPath} data-track-event="destination_request_click" data-track-label={destination.slug}>
                  {copy.ctaPrimary}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/45 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to={localizedPath('/tours', locale)}>{copy.ctaSecondary}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/50 px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {copy.facts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-secondary">{fact.label}</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{fact.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-secondary">
              <Route className="h-4 w-4" aria-hidden="true" />
              {labels.route}
            </p>
            <h2 className="text-3xl text-foreground sm:text-4xl">{copy.routeHeading}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{copy.routeIntro}</p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {selectedTours.map((tour) => {
              const variants = imageVariants(tour.image);
              const publicTourPath = tourPath(tour, locale);
              return (
                <article key={tour.id} className="interactive-card card-hover overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <Link
                    to={publicTourPath}
                    aria-label={`${labels.details}: ${tour.title}`}
                    className="relative block h-52 overflow-hidden"
                    data-track-event="destination_tour_image_click"
                    data-track-label={tour.title}
                  >
                    <ResponsiveImage
                      src={tour.image}
                      variants={variants}
                      mobileVariants={variants.slice(0, 1)}
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                      alt={tour.title}
                      width={960}
                      height={640}
                      loading="lazy"
                      decoding="async"
                      className="card-media h-full w-full object-cover"
                    />
                    <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-xs text-white backdrop-blur-sm">{tour.season}</span>
                  </Link>
                  <div className="p-5">
                    <h3 className="text-xl leading-snug text-foreground">
                      <Link
                        to={publicTourPath}
                        className="card-title-link"
                        data-track-event="destination_tour_title_click"
                        data-track-label={tour.title}
                      >
                        {tour.title}
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-secondary" aria-hidden="true" />{tour.duration}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-secondary" aria-hidden="true" />{tour.tourType}</span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{tour.description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm font-medium text-primary">{tour.price}</span>
                      <Link
                        to={`${publicTourPath}?book=true`}
                        className="card-cta text-sm font-medium text-primary"
                        data-track-event="destination_tour_request_click"
                        data-track-label={tour.title}
                      >
                        {labels.request}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-secondary">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {isRussian ? 'Практично' : 'Practical'}
            </p>
            <h2 className="text-3xl text-foreground">{copy.planningHeading}</h2>
            <ul className="mt-6 space-y-4 text-base leading-7 text-muted-foreground">
              {copy.planningItems.map((item) => (
                <li key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {copy.experienceItems.map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-lg text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-secondary">FAQ</p>
            <h2 className="text-3xl text-foreground">{copy.faqHeading}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{copy.ctaText}</p>
            <Button asChild className="mt-6 btn-action">
              <Link to={requestPath} data-track-event="destination_faq_request_click" data-track-label={destination.slug}>
                {copy.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border bg-card px-5 shadow-sm sm:px-6">
            {copy.faq.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg text-foreground marker:content-none">
                  <span>{item.question}</span>
                  <span className="mt-1 text-secondary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 pr-6 leading-7 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary px-4 py-14 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl">{copy.ctaTitle}</h2>
            <p className="mt-3 leading-7 text-primary-foreground/80">{copy.ctaText}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="btn-action bg-white text-primary hover:bg-white/90">
              <Link to={requestPath}>{copy.ctaPrimary}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to={localizedPath('/tours', locale)}>{labels.allTours}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
