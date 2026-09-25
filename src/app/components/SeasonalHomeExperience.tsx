import {
  ArrowRight,
  CalendarRange,
  Compass,
  Leaf,
  MapPin,
  Mountain,
  ShieldCheck,
  Snowflake,
  Sprout,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToursData } from '../hooks/useTours';
import { localizedPath, useSiteLocale } from '../lib/locale';
import { localizeTour } from '../lib/localizedTours';
import { getTourAvailabilityStatus, rankToursForMonth, upcomingTravelMonth } from '../lib/seasonalTours';
import { tourPath } from '../lib/tourRoutes';
import { ResponsiveImage } from './ResponsiveImage';

const seasons = [
  {
    id: 'september',
    label: 'September',
    labelRu: 'Сентябрь',
    month: 9,
    icon: Leaf,
    description: 'Golden valleys, clear air, and quieter mountain roads.',
    descriptionRu: 'Золотые долины, прозрачный воздух и более спокойные горные дороги.',
  },
  {
    id: 'october',
    label: 'October',
    labelRu: 'Октябрь',
    month: 10,
    icon: Leaf,
    description: 'Cooler days, cultural stops, and autumn color around Issyk-Kul.',
    descriptionRu: 'Прохладные дни, культурные остановки и осенние краски вокруг Иссык-Куля.',
  },
  {
    id: 'winter',
    label: 'Winter',
    labelRu: 'Зима',
    month: 1,
    icon: Snowflake,
    description: 'Snowy peaks, warm guesthouses, and dedicated winter routes.',
    descriptionRu: 'Снежные вершины, тёплые гостевые дома и маршруты, созданные для зимы.',
  },
  {
    id: 'spring',
    label: 'Spring',
    labelRu: 'Весна',
    month: 5,
    icon: Sprout,
    description: 'Lower-valley hikes, fresh landscapes, and flexible road trips.',
    descriptionRu: 'Прогулки по нижним долинам, свежие пейзажи и гибкие автопутешествия.',
  },
] as const;

const reassurance = [
  {
    icon: MapPin,
    title: 'Local experts',
    titleRu: 'Местная команда',
    text: 'Born and based in Kyrgyzstan.',
    textRu: 'Живём и работаем в Кыргызстане.',
  },
  {
    icon: Users,
    title: 'Private & flexible',
    titleRu: 'Частно и гибко',
    text: 'Your group, pace, and comfort.',
    textRu: 'Ваша группа, темп и комфорт.',
  },
  {
    icon: CalendarRange,
    title: 'Tailored itineraries',
    titleRu: 'Маршрут под вас',
    text: 'Routes shaped around the season.',
    textRu: 'Учитываем сезон и ваши интересы.',
  },
  {
    icon: ShieldCheck,
    title: 'Carefully planned',
    titleRu: 'Всё продумано',
    text: 'Weather and access checked locally.',
    textRu: 'Проверяем погоду и доступность.',
  },
];

function tourImageVariants(image: string) {
  if (!/^\/images\/[\w/-]+\.(?:jpe?g|webp)$/i.test(image)) return [];
  const base = image.replace(/\.[^.]+$/, '');
  return [
    { src: `${base}-480.webp`, width: 480 },
    { src: `${base}-960.webp`, width: 960 },
  ];
}

function seasonForMonth(month: number): (typeof seasons)[number]['id'] {
  if (month === 9) return 'september';
  if (month === 10) return 'october';
  if ([11, 12, 1, 2, 3].includes(month)) return 'winter';
  return 'spring';
}

export function SeasonalHomeExperience() {
  const { tours } = useToursData();
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const [activeSeasonId, setActiveSeasonId] = useState<(typeof seasons)[number]['id']>(() => (
    seasonForMonth(upcomingTravelMonth())
  ));
  const activeSeason = seasons.find((season) => season.id === activeSeasonId) ?? seasons[0];

  const seasonalTours = useMemo(() => {
    const ranked = rankToursForMonth(tours, activeSeason.month);
    const inSeason = ranked.filter(
      (tour) => getTourAvailabilityStatus(tour, activeSeason.month) !== 'next-season'
    );
    const selected = [...inSeason];
    for (const tour of ranked) {
      if (selected.length >= 3) break;
      if (!selected.some((candidate) => candidate.id === tour.id)) selected.push(tour);
    }
    return selected.slice(0, 3).map((tour) => localizeTour(tour, locale));
  }, [activeSeason.month, locale, tours]);

  const activeSeasonLabel = isRussian ? activeSeason.labelRu : activeSeason.label;

  return (
    <section className="seasonal-home-experience" aria-labelledby="seasonal-home-heading">
      <div className="seasonal-home-hero">
        <ResponsiveImage
          src="/images/travel-gallery-2026/travel-076.jpg"
          variants={[
            { src: '/images/travel-gallery-2026/travel-076-480.webp', width: 480 },
            { src: '/images/travel-gallery-2026/travel-076-960.webp', width: 960 },
          ]}
          mobileVariants={[
            { src: '/images/travel-gallery-2026/travel-076-480.webp', width: 480 },
          ]}
          sizes="100vw"
          alt={isRussian ? 'Снежные горы Кыргызстана над высокогорным юрточным лагерем' : 'Snowy Kyrgyzstan mountain range above a highland yurt camp'}
          width={1080}
          height={719}
          loading="eager"
          className="seasonal-home-hero__image"
        />
        <div className="seasonal-home-hero__shade" aria-hidden="true" />

        <div className="seasonal-home-hero__content">
          <h1 id="seasonal-home-heading" className="seasonal-home-title">
            <span className="seasonal-home-title__lead">
              {isRussian ? <>Горы<br />меняются.</> : <>The mountains<br />change.</>}
            </span>
            <span className="seasonal-home-title__accent">
              {isRussian ? 'Маршрут — тоже.' : 'So should the route.'}
            </span>
          </h1>
          <p className="seasonal-home-kicker">
            {isRussian ? 'Сезонные маршруты по Кыргызстану' : 'Seasonal trips, built around Kyrgyzstan'}
          </p>
          <p className="seasonal-home-intro">
            {isRussian
              ? 'Частные путешествия, которые мы планируем на месте с учётом погоды, доступности, комфорта и пейзажей, которые стоит увидеть именно сейчас.'
              : 'Private journeys for international travelers, planned locally around weather, access, comfort, and the landscapes worth seeing now.'}
          </p>
          <div className="seasonal-home-actions">
            <Link
              to={localizedPath('/tours', locale)}
              className="seasonal-home-primary"
              data-track-event="cta_browse_tours_click"
              data-track-label="Explore seasonal trips"
            >
              {isRussian ? 'Смотреть сезонные туры' : 'Explore seasonal trips'}
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              to={localizedPath('/feedback', locale)}
              className="seasonal-home-secondary"
              data-track-event="cta_request_click"
              data-track-label="Plan my trip"
            >
              <Compass aria-hidden="true" />
              {isRussian ? 'Подобрать маршрут' : 'Plan my trip'}
            </Link>
          </div>
        </div>
      </div>

      <div className="seasonal-home-panel">
        <div className="seasonal-home-seasons" role="tablist" aria-label={isRussian ? 'Выберите сезон путешествия' : 'Choose a travel season'}>
          {seasons.map((season) => {
            const Icon = season.icon;
            const selected = season.id === activeSeason.id;
            return (
              <button
                key={season.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="seasonal-routes"
                className="seasonal-home-season"
                data-active={selected ? 'true' : 'false'}
                onClick={() => setActiveSeasonId(season.id)}
              >
                <Icon aria-hidden="true" />
                <span>{isRussian ? season.labelRu : season.label}</span>
              </button>
            );
          })}
        </div>

        <div className="seasonal-home-season-copy" aria-live="polite">
          <div>
            <p>{isRussian ? 'Выберите сезон' : 'Choose your season'}</p>
            <h2>{isRussian ? `${activeSeasonLabel}: маршруты от местной команды.` : `${activeSeasonLabel} routes, planned locally.`}</h2>
          </div>
          <p>{isRussian ? activeSeason.descriptionRu : activeSeason.description}</p>
        </div>

        <div id="seasonal-routes" className="seasonal-home-routes" role="tabpanel">
          {seasonalTours.map((tour, index) => {
            const imageVariants = tourImageVariants(tour.image);
            const path = tourPath(tour, locale);
            return (
              <Link
                key={`${activeSeason.id}-${tour.id}`}
                to={path}
                className="seasonal-home-route"
                data-featured={index === 0 ? 'true' : 'false'}
                data-track-event="home_hot_tour_image_click"
                data-track-label={tour.title}
              >
                <ResponsiveImage
                  src={tour.image}
                  variants={imageVariants}
                  mobileVariants={imageVariants.slice(0, 1)}
                  sizes={index === 0 ? '(min-width: 960px) 62vw, 100vw' : '(min-width: 960px) 32vw, 100vw'}
                  alt={tour.title}
                  width={960}
                  height={640}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="seasonal-home-route__image"
                />
                <span className="seasonal-home-route__shade" aria-hidden="true" />
                <span className="seasonal-home-route__content">
                  <span className="seasonal-home-route__season">
                    {isRussian ? `Маршрут · ${activeSeasonLabel}` : `${activeSeasonLabel} route`}
                  </span>
                  <strong>{tour.title}</strong>
                  <span className="seasonal-home-route__meta">
                    {tour.duration} · {tour.tourType}
                  </span>
                  <span className="seasonal-home-route__link">
                    {isRussian ? 'Смотреть маршрут' : 'Explore route'} <ArrowRight aria-hidden="true" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="seasonal-home-reassurance" aria-label={isRussian ? 'Почему путешествуют с нами' : 'Why travel with us'}>
          {reassurance.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title}>
                <Icon aria-hidden="true" />
                <span>
                  <strong>{isRussian ? item.titleRu : item.title}</strong>
                  <small>{isRussian ? item.textRu : item.text}</small>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <span className="seasonal-home-mountain-mark" aria-hidden="true">
        <Mountain />
      </span>
    </section>
  );
}
