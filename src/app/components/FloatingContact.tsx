import { useEffect, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { TELEGRAM_URL, WHATSAPP_URL } from '../lib/contact';

export function FloatingContact() {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

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

  return (
    <div
      className={`fixed bottom-24 right-4 z-[100] hidden flex-col gap-3 transition-all duration-300 sm:bottom-6 sm:right-6 sm:flex ${
        isFooterVisible ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      aria-hidden={isFooterVisible}
    >
      <button
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#0088cc] text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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
