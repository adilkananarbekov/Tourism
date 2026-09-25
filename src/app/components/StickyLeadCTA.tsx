import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { localizedPath, useSiteLocale } from '../lib/locale';

export function StickyLeadCTA() {
  const { pathname, hash } = useLocation();
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const isTourDetail = /^\/(?:ru\/)?tours\/[^/]+$/.test(pathname);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const hiddenRoutes = ['/feedback', '/blogs', '/privacy-policy', '/terms-of-use', '/admin', '/auth', '/dashboard'];
  const shouldHide = hash === '#booking'
    || hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`/ru${route}`));

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.02 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (shouldHide || isFooterVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{isTourDetail ? (isRussian ? 'Интересует этот маршрут?' : 'Interested in this route?') : (isRussian ? 'Нужна помощь с выбором?' : 'Need help choosing?')}</p>
            <p className="truncate text-xs text-muted-foreground">{isRussian ? 'Уточните даты и стоимость.' : 'Ask about dates and price.'}</p>
          </div>
        </div>
        <Button asChild className="btn-micro btn-action shrink-0">
          <Link
            to={isTourDetail ? `${pathname}#booking` : localizedPath('/feedback', locale)}
            data-track-event="sticky_mobile_lead_click"
            data-track-label="Mobile sticky lead CTA"
          >
            {isRussian ? 'Заявка' : 'Request'}
          </Link>
        </Button>
      </div>
    </div>
  );
}
