import { useEffect, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { TELEGRAM_URL, WHATSAPP_URL } from '../lib/contact';

export function FloatingContact() {
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const { pathname } = useLocation();
  const hiddenRoutes = ['/feedback', '/privacy-policy', '/terms-of-use', '/admin', '/auth', '/dashboard'];
  const shouldHide = hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`/ru${route}`));

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (shouldHide) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-24 right-4 z-[100] hidden flex-col gap-3 transition-all duration-300 md:bottom-6 md:right-6 md:flex ${
        isFooterVisible ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      aria-hidden={isFooterVisible}
    >
      <button
        className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--site-green-on-dark)] bg-[var(--site-green-on-dark)] text-[var(--site-surface-dark)] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--site-green-on-dark-hover)] hover:shadow-2xl sm:h-14 sm:w-14"
        onClick={() => window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer')}
        tabIndex={isFooterVisible ? -1 : 0}
        data-track-event="floating_whatsapp_click"
        data-track-label="Floating WhatsApp"
        aria-label="Contact on WhatsApp"
        title="WhatsApp"
      >
        <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        className="flex h-12 w-12 items-center justify-center rounded-md border border-white/35 bg-[var(--site-surface-dark)] text-[var(--site-text-on-dark)] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--site-green-on-dark)] hover:text-[var(--site-green-on-dark)] hover:shadow-2xl sm:h-14 sm:w-14"
        onClick={() => window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer')}
        tabIndex={isFooterVisible ? -1 : 0}
        data-track-event="floating_telegram_click"
        data-track-label="Floating Telegram"
        aria-label="Contact on Telegram"
        title="Telegram"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
}
