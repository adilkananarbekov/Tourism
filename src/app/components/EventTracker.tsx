import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/eventTracker';

export function EventTracker() {
  const location = useLocation();

  useEffect(() => {
    trackEvent('page_view', {
      label: location.pathname,
      search: location.search,
    });
  }, [location.pathname, location.search]);

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

  return null;
}
