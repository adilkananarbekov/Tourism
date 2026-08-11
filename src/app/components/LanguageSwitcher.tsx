import { Languages } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { languageSwitchPath, localeFromPath } from '../lib/locale';

export function LanguageSwitcher() {
  const { pathname, search } = useLocation();
  const locale = localeFromPath(pathname);
  const destination = languageSwitchPath(pathname, search);
  const nextLanguage = locale === 'ru' ? 'English' : 'Русский';

  return (
    <Link
      to={destination}
      className="btn-interactive inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-accent"
      aria-label={`Switch site language to ${nextLanguage}`}
      title={nextLanguage}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span>{locale === 'ru' ? 'EN' : 'RU'}</span>
    </Link>
  );
}
