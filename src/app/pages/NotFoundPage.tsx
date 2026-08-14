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
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-[#0b1510] px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8">
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
      <div className="absolute inset-0 -z-10 bg-[#07110c]/80" aria-hidden="true" />

      <div className="mx-auto w-full max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#101d16]/90 shadow-2xl backdrop-blur-md">
          <div className="grid items-center gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:px-14 lg:py-12">
            <div className="flex items-center justify-center" aria-hidden="true">
              <div className="not-found-compass relative aspect-square w-44 sm:w-56 lg:w-72">
                <span className="not-found-compass__halo absolute inset-0 rounded-full" />
                <img
                  src={withBasePath('/images/404-compass-dial-640.png')}
                  alt=""
                  className="not-found-compass__dial relative z-10 h-full w-full rounded-full object-cover"
                  decoding="async"
                />
                <img
                  src={withBasePath('/images/404-compass-needle.png')}
                  alt=""
                  className="not-found-compass__needle absolute left-[14%] top-[14%] z-20 h-[72%] w-[72%] object-contain"
                  decoding="async"
                />
                <span className="not-found-compass__pivot absolute left-1/2 top-1/2 z-30 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" />
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.28em] text-[#afd0aa]">404</p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <div className="mt-6 h-px w-16 bg-[#d6a06f]" aria-hidden="true" />
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
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#afd0aa]" aria-hidden="true" />
                <input
                  id="not-found-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  autoComplete="off"
                  className="h-14 w-full rounded-xl border border-white/15 bg-black/20 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-white/45 focus:border-[#afd0aa] focus:ring-2 focus:ring-[#afd0aa]/25"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#afd0aa] px-6 font-semibold text-[#112016] transition hover:bg-[#c1dfbc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101d16]"
              >
                {copy.searchAction}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>

            <Link
              to={localizedPath('/', locale)}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d6a06f]/70 px-5 font-medium text-[#efbd91] transition hover:border-[#efbd91] hover:bg-[#d6a06f]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#efbd91]"
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
                  className="group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm text-white/75 transition hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#afd0aa]"
                >
                  <Icon className="h-5 w-5 shrink-0 text-[#afd0aa]" strokeWidth={1.7} aria-hidden="true" />
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
