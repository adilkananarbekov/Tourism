import { useLocation } from 'react-router-dom';

export type SiteLocale = 'en' | 'ru';

export function localeFromPath(pathname: string): SiteLocale {
  return pathname === '/ru' || pathname.startsWith('/ru/') ? 'ru' : 'en';
}

export function withoutLocale(pathname: string) {
  const normalized = pathname || '/';
  if (normalized === '/ru') {
    return '/';
  }
  return normalized.startsWith('/ru/') ? normalized.slice(3) || '/' : normalized;
}

export function localizedPath(path: string, locale: SiteLocale) {
  if (!path.startsWith('/')) {
    return path;
  }

  const barePath = withoutLocale(path);
  return locale === 'ru' ? (barePath === '/' ? '/ru' : `/ru${barePath}`) : barePath;
}

export function languageSwitchPath(pathname: string, search = '') {
  const locale = localeFromPath(pathname);
  const barePath = withoutLocale(pathname);
  const supportsRussian =
    barePath === '/' ||
    barePath === '/tours' ||
    barePath === '/feedback' ||
    /^\/tours\/\d+$/.test(barePath) ||
    /^\/destinations\/[a-z0-9-]+$/.test(barePath);

  const destination =
    locale === 'ru'
      ? barePath
      : supportsRussian
        ? localizedPath(barePath, 'ru')
        : '/ru';

  return `${destination}${search}`;
}

export function useSiteLocale(): SiteLocale {
  const { pathname } = useLocation();
  return localeFromPath(pathname);
}

export function localeAlternates(enPath: string) {
  const normalizedEnPath = withoutLocale(enPath);
  return [
    { hrefLang: 'en', path: normalizedEnPath },
    { hrefLang: 'ru', path: localizedPath(normalizedEnPath, 'ru') },
    { hrefLang: 'x-default', path: normalizedEnPath },
  ];
}
