import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/eventTracker';
import { COOKIE_CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from '../lib/cookieConsent';

export function EventTracker() {
  const location = useLocation();
  const reachedDepths = useRef(new Set<number>());

  const trackPageView = useCallback(() => {
    trackEvent('page_view', {
      label: location.pathname,
      locale: location.pathname === '/ru' || location.pathname.startsWith('/ru/') ? 'ru' : 'en',
    });
  }, [location.pathname]);

  useEffect(() => {
    reachedDepths.current.clear();
    trackPageView();
  }, [location.pathname, trackPageView]);

  useEffect(() => {
    const handleConsentChange = () => {
      if (hasAnalyticsConsent()) {
        trackPageView();
      }
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleConsentChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleConsentChange);
  }, [trackPageView]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const trackable = target?.closest<HTMLElement>('[data-track-event]');
      if (!trackable) {
        return;
      }

      trackEvent(
        trackable.dataset.trackEvent || 'tracked_click',
        {
          label: trackable.dataset.trackLabel || trackable.textContent?.trim().slice(0, 80) || '',
          href: trackable instanceof HTMLAnchorElement ? trackable.href : '',
        },
        { label: trackable.dataset.trackLabel }
      );
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  useEffect(() => {
    const trackScrollDepth = () => {
      if (!hasAnalyticsConsent()) {
        return;
      }

      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const progress = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100));
      [25, 50, 75, 90].forEach((depth) => {
        if (progress >= depth && !reachedDepths.current.has(depth)) {
          reachedDepths.current.add(depth);
          trackEvent('scroll_depth', { label: `${depth}%`, depth });
        }
      });
    };

    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    trackScrollDepth();
    return () => window.removeEventListener('scroll', trackScrollDepth);
  }, [location.pathname]);

  return null;
}
