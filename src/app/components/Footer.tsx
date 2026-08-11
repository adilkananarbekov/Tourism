import { Clock, Instagram, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FOUNDER_NAME,
  INSTAGRAM_URL,
  TELEGRAM_URL,
  TELEGRAM_USERNAME,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../lib/contact';
import { localizedPath, useSiteLocale } from '../lib/locale';
import { tourPath } from '../lib/tourRoutes';
import { openCookieSettings } from '../lib/cookieConsent';

const footerLinkClass =
  'rounded-sm text-[#d8e7de] transition-colors hover:text-white hover:underline hover:decoration-[#f2b179] hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b179] focus-visible:ring-offset-2 focus-visible:ring-offset-[#064e3b]';

export function Footer() {
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const path = (value: string) => localizedPath(value, locale);
  const currentYear = new Date().getFullYear();
  const text = isRussian
    ? {
        intro: `Частные туры по Кыргызстану с ${FOUNDER_NAME}.`,
        request: 'Спланировать путешествие',
        quick: 'Навигация',
        tours: 'Популярные туры',
        contact: 'Связаться с нами',
        allTours: 'Все туры',
        gallery: 'Галерея',
        stories: 'Путеводители',
        contactLink: 'Контакты',
        form: 'Форма заявки',
        reply: 'Обычно отвечаем в течение 24 часов',
        songKul: 'Туры и конные маршруты на Сон-Куль',
        mountainLakes: 'Сон-Куль, Кель-Суу и Иссык-Куль — 7 дней',
        horse: 'Конный тур на Сон-Куль — 2 дня',
        viewAll: 'Посмотреть все туры',
        whatsapp: 'WhatsApp Business',
        telegram: 'Telegram',
        rights: 'Все права защищены.',
        privacy: 'Конфиденциальность и cookies',
        terms: 'Условия использования',
        cookieSettings: 'Настройки cookies',
      }
    : {
        intro: `Private Kyrgyzstan tours planned by ${FOUNDER_NAME}.`,
        request: 'Plan your Kyrgyzstan trip',
        quick: 'Explore',
        tours: 'Popular Tours',
        contact: 'Contact Us',
        allTours: 'Our Tours',
        gallery: 'Gallery',
        stories: 'Travel Stories',
        contactLink: 'Contact',
        form: 'Trip request form',
        reply: 'Usually within 24 hours',
        songKul: 'Song-Kul Tours & Horse Routes',
        mountainLakes: 'Song-Kul, Kel-Suu & Issyk-Kul — 7 Days',
        horse: '2-Day Song-Kul Horseback Tour',
        viewAll: 'View all tours',
        whatsapp: 'WhatsApp Business',
        telegram: 'Telegram',
        rights: 'All rights reserved.',
        privacy: 'Privacy & cookies',
        terms: 'Terms of use',
        cookieSettings: 'Cookie settings',
      };

  return (
    <footer id="site-footer" className="border-t border-white/10 bg-[#064e3b] text-[#fffdf8]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-[1.15fr_0.75fr_1.05fr_1.15fr] xl:gap-12">
          <div className="order-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 font-medium text-white shadow-sm">
                KT
              </div>
              <span className="text-xl font-medium text-white">Go Kyrgyzstan Travel</span>
            </div>
            <p className="mb-5 max-w-sm text-sm leading-6 text-[#d8e7de]">{text.intro}</p>
            <Link
              to={path('/feedback')}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#fffdf8] px-4 py-2.5 text-sm font-medium text-[#064e3b] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b179] focus-visible:ring-offset-2 focus-visible:ring-offset-[#064e3b]"
              data-track-event="footer_request_click"
              data-track-label={text.request}
            >
              <Send className="h-4 w-4" />
              {text.request}
            </Link>
          </div>

          <div className="order-3 xl:order-2">
            <h3 className="mb-4 text-base font-semibold text-white">{text.quick}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to={path('/tours')} className={footerLinkClass}>{text.allTours}</Link></li>
              {!isRussian && <li><Link to="/gallery" className={footerLinkClass}>{text.gallery}</Link></li>}
              {!isRussian && <li><Link to="/blogs" className={footerLinkClass}>{text.stories}</Link></li>}
              <li><Link to={path('/feedback')} className={footerLinkClass}>{text.contactLink}</Link></li>
            </ul>
          </div>

          <div className="order-4 xl:order-3">
            <h3 className="mb-4 text-base font-semibold text-white">{text.tours}</h3>
            <ul className="space-y-3 text-sm leading-5">
              <li><Link to={path('/destinations/song-kul')} className={footerLinkClass}>{text.songKul}</Link></li>
              <li><Link to={tourPath(3, locale)} className={footerLinkClass}>{text.mountainLakes}</Link></li>
              <li><Link to={tourPath(4, locale)} className={footerLinkClass}>{text.horse}</Link></li>
              <li className="pt-1"><Link to={path('/tours')} className={`${footerLinkClass} font-medium text-white`}>{text.viewAll}</Link></li>
            </ul>
          </div>

          <div className="order-2 xl:order-4">
            <h3 className="mb-4 text-base font-semibold text-white">{text.contact}</h3>
            <div className="mb-4 space-y-2 text-sm text-[#d8e7de]">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Bishkek, Kyrgyzstan</p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {text.reply}</p>
            </div>
            <div className="space-y-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center gap-3 rounded-md bg-[#fffdf8] px-4 py-2.5 text-sm font-medium text-[#064e3b] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b179] focus-visible:ring-offset-2 focus-visible:ring-offset-[#064e3b]"
                data-track-event="footer_whatsapp_click"
                data-track-label={WHATSAPP_DISPLAY}
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span><span className="block text-xs font-normal opacity-75">{text.whatsapp}</span>{WHATSAPP_DISPLAY}</span>
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center gap-3 rounded-md border border-white/30 bg-white/[0.06] px-4 py-2.5 text-sm text-white transition-colors hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b179] focus-visible:ring-offset-2 focus-visible:ring-offset-[#064e3b]"
                data-track-event="footer_telegram_click"
                data-track-label={TELEGRAM_USERNAME}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span><span className="block text-xs text-[#d8e7de]">{text.telegram}</span>{TELEGRAM_USERNAME}</span>
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link to={path('/feedback')} className={footerLinkClass}>{text.form}</Link>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={`${footerLinkClass} inline-flex items-center gap-1.5`}>
                <Instagram className="h-4 w-4" /> @jakypbekovv1
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-6 text-sm text-[#d8e7de] md:flex-row">
          <p>&copy; {currentYear} Go Kyrgyzstan Travel. {text.rights}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:justify-end">
            <Link to={path('/privacy-policy')} className={footerLinkClass}>{text.privacy}</Link>
            <Link to={path('/terms-of-use')} className={footerLinkClass}>{text.terms}</Link>
            <button type="button" className={footerLinkClass} onClick={openCookieSettings}>{text.cookieSettings}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
