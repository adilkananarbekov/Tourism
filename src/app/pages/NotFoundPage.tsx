import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Images,
  MessageCircle,
  Mountain,
  Search,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { withBasePath } from '../lib/assets';
import { localizedPath, useSiteLocale } from '../lib/locale';

const compassTicks = Array.from({ length: 48 }, (_, index) => ({
  rotation: index * 7.5,
  kind: index % 6 === 0 ? 'major' : index % 3 === 0 ? 'medium' : 'minor',
}));

function NotFoundCompass() {
  return (
    <div className="not-found-compass relative aspect-square w-44 sm:w-56 lg:w-72">
      <svg
        viewBox="0 0 320 320"
        className="h-full w-full overflow-visible"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="not-found-compass-face" cx="50%" cy="44%" r="63%">
            <stop offset="0" stopColor="#202520" />
            <stop offset="0.58" stopColor="#171b18" />
            <stop offset="1" stopColor="#101311" />
          </radialGradient>
          <linearGradient id="not-found-compass-brass" x1="58" y1="42" x2="270" y2="282" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7f8f4" />
            <stop offset="0.25" stopColor="#c2c9c3" />
            <stop offset="0.55" stopColor="#7b857d" />
            <stop offset="0.78" stopColor="#7ed4a8" />
            <stop offset="1" stopColor="#1f6b4f" />
          </linearGradient>
          <linearGradient id="not-found-compass-north" x1="160" y1="58" x2="160" y2="164" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e7f2eb" />
            <stop offset="0.5" stopColor="#7ed4a8" />
            <stop offset="1" stopColor="#1f6b4f" />
          </linearGradient>
          <linearGradient id="not-found-compass-south" x1="160" y1="158" x2="160" y2="264" gradientUnits="userSpaceOnUse">
            <stop stopColor="#eef0ec" />
            <stop offset="1" stopColor="#59615a" />
          </linearGradient>
          <filter id="not-found-compass-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle className="not-found-compass__halo" cx="160" cy="160" r="151" />

        <g className="not-found-compass__dial">
          <circle cx="160" cy="160" r="145" fill="#101311" stroke="url(#not-found-compass-brass)" strokeWidth="2" />
          <circle cx="160" cy="160" r="136" fill="url(#not-found-compass-face)" stroke="rgba(245, 246, 242, 0.5)" />
          <circle cx="160" cy="160" r="121" stroke="rgba(245, 246, 242, 0.24)" strokeWidth="1.5" />

          <g className="not-found-compass__ticks" stroke="#eef0ec" strokeLinecap="round">
            {compassTicks.map(({ rotation, kind }) => {
              const y2 = kind === 'major' ? 57 : kind === 'medium' ? 50 : 45;
              const opacity = kind === 'major' ? 0.88 : kind === 'medium' ? 0.58 : 0.32;
              return (
                <line
                  key={rotation}
                  x1="160"
                  y1="35"
                  x2="160"
                  y2={y2}
                  strokeWidth={kind === 'major' ? 2.25 : kind === 'medium' ? 1.5 : 1}
                  opacity={opacity}
                  transform={`rotate(${rotation} 160 160)`}
                />
              );
            })}
          </g>

          <circle cx="160" cy="160" r="99" stroke="rgba(126, 212, 168, 0.24)" strokeDasharray="2 8" strokeWidth="1.5" />
          <path
            d="M95 215c23-25 42-3 64-16 23-14 35-39 68-21 15 8 26 7 37-4"
            stroke="rgba(126, 212, 168, 0.26)"
            strokeDasharray="4 7"
            strokeLinecap="round"
          />
          <path
            d="M95 228c29-12 43 10 68-2 22-11 35-32 62-21 15 6 25 3 35-7"
            stroke="rgba(245, 246, 242, 0.15)"
            strokeLinecap="round"
          />

          <g fill="#f5f6f2" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600" textAnchor="middle">
            <text x="160" y="56" fontSize="16" letterSpacing="2">N</text>
            <text x="273" y="166" fontSize="16">E</text>
            <text x="160" y="280" fontSize="16">S</text>
            <text x="47" y="166" fontSize="16">W</text>
          </g>
        </g>

        <g className="not-found-compass__needle" filter="url(#not-found-compass-glow)">
          <path d="M160 154 181 87 160 57 139 87Z" fill="url(#not-found-compass-north)" stroke="#e7f2eb" strokeOpacity="0.72" />
          <path d="M160 166 176 232 160 263 144 232Z" fill="url(#not-found-compass-south)" stroke="#eef0ec" strokeOpacity="0.5" />
          <path d="M160 75v78" stroke="#f5f6f2" strokeLinecap="round" strokeOpacity="0.66" />
          <path d="M160 168v75" stroke="#c7cec8" strokeLinecap="round" strokeOpacity="0.34" />
        </g>
        <circle className="not-found-compass__pivot" cx="160" cy="160" r="10" />
        <circle cx="160" cy="160" r="3.5" fill="#f5f6f2" />
      </svg>
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const [query, setQuery] = useState('');

  const copy = isRussian
    ? {
        title: 'Этого места нет на карте',
        description:
          'Похоже, маршрут изменился или страница была перемещена. Найдите путешествие по Кыргызстану или начните сначала.',
        searchLabel: 'Поиск туров и направлений',
        searchPlaceholder: 'Например, Иссык-Куль или Сон-Куль',
        searchAction: 'Найти туры',
        homeAction: 'Вернуться на главную',
        quickLinks: 'Быстрые ссылки',
        links: ['Главная', 'Туры', 'Галерея', 'Связаться'],
      }
    : {
        title: 'This destination is off the map',
        description:
          "Looks like the trail changed or this page was moved. Search for a Kyrgyzstan journey, or let us get you back on track.",
        searchLabel: 'Search tours and destinations',
        searchPlaceholder: 'Try Issyk-Kul, Song-Kul or horse riding',
        searchAction: 'Search tours',
        homeAction: 'Back to homepage',
        quickLinks: 'Quick links',
        links: ['Home', 'Tours', 'Gallery', 'Contact'],
      };

  const quickLinks = [
    { label: copy.links[0], to: localizedPath('/', locale), icon: Home },
    { label: copy.links[1], to: localizedPath('/tours', locale), icon: Mountain },
    { label: copy.links[2], to: '/gallery', icon: Images },
    { label: copy.links[3], to: localizedPath('/feedback', locale), icon: MessageCircle },
  ];

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = query.trim();
    const toursPath = localizedPath('/tours', locale);
    navigate(search ? `${toursPath}?q=${encodeURIComponent(search)}` : toursPath);
  };

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-[var(--site-surface-dark)] px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8">
      <SEO
        title={isRussian ? 'Страница не найдена' : 'Page Not Found'}
        description={isRussian ? 'Запрошенная страница не найдена.' : 'The requested page could not be found.'}
        noindex
      />

      <img
        src={withBasePath('/images/go-kyrgyzstan-hero-1080.webp')}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-[#101311]/82" aria-hidden="true" />

      <div className="mx-auto w-full max-w-5xl">
        <div className="overflow-hidden rounded-md border border-white/15 bg-[#171b18]/94 shadow-2xl backdrop-blur-md">
          <div className="grid items-center gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:px-14 lg:py-12">
            <div className="flex items-center justify-center" aria-hidden="true">
              <NotFoundCompass />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.28em] text-[var(--site-green-on-dark)]">404</p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <div className="mt-6 h-px w-16 bg-[var(--site-green-on-dark)]" aria-hidden="true" />
              <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                {copy.description}
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-7 sm:px-10 lg:px-14">
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row" role="search">
              <label htmlFor="not-found-search" className="sr-only">
                {copy.searchLabel}
              </label>
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--site-green-on-dark)]" aria-hidden="true" />
                <input
                  id="not-found-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  autoComplete="off"
                  className="h-14 w-full rounded-md border border-white/15 bg-black/20 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-white/45 focus:border-[var(--site-green-on-dark)] focus:ring-2 focus:ring-[var(--site-green-on-dark)]/25"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[var(--site-green-on-dark)] px-6 font-semibold text-[var(--site-surface-dark)] transition hover:bg-[var(--site-green-on-dark-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--site-surface-dark-raised)]"
              >
                {copy.searchAction}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>

            <Link
              to={localizedPath('/', locale)}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[var(--site-green-on-dark)]/70 px-5 font-medium text-[var(--site-green-on-dark)] transition hover:border-[var(--site-green-on-dark-hover)] hover:bg-[var(--site-green-on-dark)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-green-on-dark)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {copy.homeAction}
            </Link>

            <div className="mt-8 flex items-center gap-4" aria-hidden="true">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-white/50">{copy.quickLinks}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <nav className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label={copy.quickLinks}>
              {quickLinks.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className="group flex min-h-12 items-center gap-3 rounded-md px-3 text-sm text-white/75 transition hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-green-on-dark)]"
                >
                  <Icon className="h-5 w-5 shrink-0 text-[var(--site-green-on-dark)]" strokeWidth={1.7} aria-hidden="true" />
                  <span>{label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-white/70" aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
