import { MessageCircle, Phone } from 'lucide-react';

export function FloatingContact() {
  return (
    <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-3">
      <button
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        onClick={() => window.open('https://wa.me/996555123456', '_blank')}
        aria-label="Contact on WhatsApp"
        title="WhatsApp"
      >
        <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#0088cc] text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        onClick={() => window.open('https://t.me/adilkan_dev', '_blank')}
        aria-label="Contact on Telegram"
        title="Telegram"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
}
