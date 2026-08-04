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

export function Footer() {
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const path = (value: string) => localizedPath(value, locale);
  const text = isRussian
    ? {
        intro: `Частные туры по Кыргызстану с ${FOUNDER_NAME}.`, request: 'Оставить заявку', quick: 'Навигация', tours: 'Наши туры', contact: 'Контакты',
        allTours: 'Все туры', gallery: 'Галерея', stories: 'Путеводители', contactLink: 'Связаться', form: 'Форма заявки', reply: 'Обычно отвечаем в течение 24 часов',
        songKul: 'Туры и конные маршруты на Сон-Куль', mountainLakes: 'Сон-Куль, Кель-Суу и Иссык-Куль — 7 дней', horse: 'Конный тур на Сон-Куль — 2 дня', roadTrip: 'Автопутешествие: Иссык-Куль и Сон-Куль', winterRide: 'Зимний конный маршрут к Сон-Кулю', rights: 'Все права защищены.',
      }
    : {
        intro: `Private Kyrgyzstan tours planned by ${FOUNDER_NAME}.`, request: 'Start a trip request', quick: 'Quick Links', tours: 'Popular Tours', contact: 'Contact Us',
        allTours: 'Our Tours', gallery: 'Gallery', stories: 'Travel Stories', contactLink: 'Contact', form: 'Trip request form', reply: 'Usually within 24 hours',
        songKul: 'Song-Kul Tours & Horse Routes', mountainLakes: 'Song-Kul, Kel-Suu & Issyk-Kul — 7 Days', horse: '2-Day Song-Kul Horseback Tour', roadTrip: 'Issyk-Kul & Song-Kul Road Trip', winterRide: 'Winter Song-Kul Horse Ride', rights: 'All rights reserved.',
      };
  return (
    <footer className="bg-[#064e3b] text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <span className="text-primary-foreground">KT</span>
              </div>
              <span className="text-xl">Go Kyrgyzstan Travel</span>
            </div>
            <p className="text-primary-foreground/70 text-sm mb-4">{text.intro}</p>
            <Link
              to={path('/feedback')}
              className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <Send className="h-4 w-4" />
              {text.request}
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">{text.quick}</h3>
            <ul className="space-y-2 text-primary-foreground/70 text-sm">
              <li>
                <Link to={path('/tours')} className="hover:text-primary-foreground transition-colors">
                  {text.allTours}
                </Link>
              </li>
              {!isRussian && <li><Link to="/gallery" className="hover:text-primary-foreground transition-colors">{text.gallery}</Link></li>}
              {!isRussian && <li><Link to="/blogs" className="hover:text-primary-foreground transition-colors">{text.stories}</Link></li>}
              <li>
                <Link to={path('/feedback')} className="hover:text-primary-foreground transition-colors">
                  {text.contactLink}
                </Link>
              </li>
            </ul>
          </div>

          {/* Tours */}
          <div>
            <h3 className="text-lg mb-4">{text.tours}</h3>
            <ul className="space-y-2 text-primary-foreground/70 text-sm">
              <li>
                <Link to={path('/destinations/song-kul')} className="hover:text-primary-foreground transition-colors">
                  {text.songKul}
                </Link>
              </li>
              <li>
                <Link to={tourPath(3, locale)} className="hover:text-primary-foreground transition-colors">
                  {text.mountainLakes}
                </Link>
              </li>
              <li>
                <Link to={tourPath(4, locale)} className="hover:text-primary-foreground transition-colors">
                  {text.horse}
                </Link>
              </li>
              <li>
                <Link to={tourPath(5, locale)} className="hover:text-primary-foreground transition-colors">
                  {text.roadTrip}
                </Link>
              </li>
              <li>
                <Link to={tourPath(6, locale)} className="hover:text-primary-foreground transition-colors">
                  {text.winterRide}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg mb-4">{text.contact}</h3>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Bishkek, Kyrgyzstan</span>
              </li>
              <li className="flex items-start gap-2">
                <Send className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <Link to={path('/feedback')} className="hover:text-primary-foreground transition-colors">
                  {text.form}
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  Telegram {TELEGRAM_USERNAME}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Instagram className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  Instagram @jakypbekovv1
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{text.reply}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/70 text-sm">
          <p>&copy; 2025 Go Kyrgyzstan Travel. {text.rights}</p>
        </div>
      </div>
    </footer>
  );
}
