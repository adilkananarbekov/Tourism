import { useEffect, useState } from 'react';
import { Cookie, Settings2, ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import {
  doNotTrackEnabled,
  getCookieConsent,
  openCookieSettings,
  setCookieConsent,
} from '../lib/cookieConsent';
import { trackEvent } from '../lib/eventTracker';
import { localizedPath, useSiteLocale } from '../lib/locale';

const OPEN_COOKIE_SETTINGS_EVENT = 'go-kyrgyzstan-open-cookie-settings';

export function CookieConsentBanner() {
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const policyPath = localizedPath('/privacy-policy', locale);
  const [consent, setConsent] = useState(() => getCookieConsent());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => getCookieConsent()?.analytics ?? false);
  const doNotTrack = doNotTrackEnabled();

  useEffect(() => {
    const openSettings = () => {
      const current = getCookieConsent();
      setAnalyticsEnabled(current?.analytics ?? false);
      setSettingsOpen(true);
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const save = (analytics: boolean) => {
    const updated = setCookieConsent(analytics);
    setConsent(updated);
    setAnalyticsEnabled(analytics);
    setSettingsOpen(false);
    if (analytics && !doNotTrack) {
      trackEvent('analytics_consent_granted', { label: 'Analytics consent' });
    }
  };

  const text = isRussian
    ? {
        heading: 'Настройки cookies',
        body: 'Мы используем обязательный cookie, чтобы сохранить ваш выбор. При отдельном согласии включается анонимная аналитика: просмотренные страницы, клики по турам и глубина чтения. Мы не используем рекламные пиксели, fingerprinting или запись экрана.',
        dnt: 'В браузере включён Do Not Track — аналитика останется выключенной.',
        policy: 'Политика конфиденциальности и cookies',
        reject: 'Только обязательные',
        accept: 'Принять аналитику',
        manage: 'Настроить',
        settingsTitle: 'Управление аналитикой',
        settingsBody: 'Обязательный cookie нужен только для сохранения выбора. Аналитические данные отправляются только после согласия и помогают понять интерес к страницам и турам.',
        analytics: 'Анонимная аналитика сайта',
        analyticsHelp: 'Страницы, клики по кнопкам и карточкам, глубина чтения и технический размер экрана. Без рекламы и без идентификации личности.',
        save: 'Сохранить выбор',
        close: 'Закрыть',
      }
    : {
        heading: 'Your cookie choices',
        body: 'We use one essential cookie to remember this choice. With separate consent, anonymous analytics records viewed pages, tour clicks, and reading depth. We do not use ad pixels, fingerprinting, or session recording.',
        dnt: 'Your browser has Do Not Track enabled, so analytics will remain off.',
        policy: 'Privacy & Cookie Policy',
        reject: 'Essential only',
        accept: 'Accept analytics',
        manage: 'Manage choices',
        settingsTitle: 'Manage analytics',
        settingsBody: 'The essential cookie only remembers your choice. Analytics is sent only after consent and helps us understand interest in pages and tours.',
        analytics: 'Anonymous site analytics',
        analyticsHelp: 'Viewed pages, button and tour-card clicks, reading depth, and technical screen size. No advertising or personal identification.',
        save: 'Save choices',
        close: 'Close',
      };

  if (consent && !settingsOpen) {
    return null;
  }

  return (
    <>
      {!consent && !settingsOpen && (
        <aside
          className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-2xl sm:bottom-6 sm:p-6"
          aria-label={text.heading}
        >
          <div className="flex gap-4">
            <Cookie className="mt-1 h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl text-foreground">{text.heading}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text.body}</p>
              {doNotTrack && <p className="mt-3 text-sm font-medium text-secondary">{text.dnt}</p>}
              <Link to={`${policyPath}#cookies`} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
                {text.policy}
              </Link>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="btn-micro" onClick={() => save(false)}>
                  {text.reject}
                </Button>
                <Button type="button" variant="outline" className="btn-micro" onClick={() => setSettingsOpen(true)}>
                  <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {text.manage}
                </Button>
                <Button type="button" className="btn-micro btn-action" onClick={() => save(true)} disabled={doNotTrack}>
                  {text.accept}
                </Button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-secondary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-medium">{text.heading}</span>
                </div>
                <h2 id="cookie-settings-title" className="mt-2 text-2xl text-foreground">{text.settingsTitle}</h2>
              </div>
              {consent && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setSettingsOpen(false)} aria-label={text.close}>
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text.settingsBody}</p>
            {doNotTrack && <p className="mt-3 text-sm font-medium text-secondary">{text.dnt}</p>}

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary"
                checked={analyticsEnabled}
                disabled={doNotTrack}
                onChange={(event) => setAnalyticsEnabled(event.target.checked)}
              />
              <span>
                <span className="block font-medium text-foreground">{text.analytics}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{text.analyticsHelp}</span>
              </span>
            </label>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" className="btn-micro" onClick={() => save(false)}>
                {text.reject}
              </Button>
              <Button type="button" className="btn-micro btn-action" onClick={() => save(analyticsEnabled)}>
                {text.save}
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
