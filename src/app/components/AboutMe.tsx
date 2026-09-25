import { ClipboardList, Instagram, Languages, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ResponsiveImage } from './ResponsiveImage';
import {
  FOUNDER_IMAGE,
  FOUNDER_NAME,
  INSTAGRAM_URL,
  TELEGRAM_URL,
  TELEGRAM_USERNAME,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../lib/contact';
import { localizedPath, useSiteLocale } from '../lib/locale';

export function AboutMe() {
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const name = isRussian ? 'Инсан Жакыпбеков' : FOUNDER_NAME;
  const text = isRussian ? {
    role: 'Основатель и организатор поездок',
    eyebrow: 'Кто планирует вашу поездку',
    intro: 'Я Инсан, основатель Go Kyrgyzstan Travel. Kyrgyz.tours — наш сайт для путешествий по Кыргызстану. Я или наша команда в Бишкеке поможем выбрать маршрут и согласуем с вами детали напрямую.',
    process: 'Расскажите о датах, составе группы и пожеланиях. До бронирования согласуем программу, итоговую цену, включённые услуги и условия поездки в переписке.',
    request: 'Обсудить поездку',
    location: 'Бишкек, Кыргызстан',
    locationDetail: 'Место встречи и завершения поездки согласуем для вашего маршрута.',
    languages: 'Общаемся на трёх языках',
    languagesDetail: 'Английский, русский и кыргызский. Язык гида уточняется для каждой поездки.',
    quote: 'Детали в письменном виде',
    quoteDetail: 'Программа, размещение, транспорт и питание — в согласованном предложении.',
  } : {
    role: 'Founder and local trip planner',
    eyebrow: 'Meet your trip planner',
    intro: 'I’m Insan, the founder of Go Kyrgyzstan Travel. Kyrgyz.tours is our website for trips in Kyrgyzstan. I or our team in Bishkek will help you choose a route and agree the details with you directly.',
    process: 'Share your dates, group size, and what you would love to see. Before you book, we agree the itinerary, full price, included services, and trip conditions in writing.',
    request: 'Talk about your trip',
    location: 'Bishkek, Kyrgyzstan',
    locationDetail: 'Meeting and drop-off arrangements are agreed for your route.',
    languages: 'Talk to us in your language',
    languagesDetail: 'English, Russian, and Kyrgyz. The guide’s language is confirmed for each trip.',
    quote: 'Your details in writing',
    quoteDetail: 'Itinerary, accommodation, transport, and meals are set out in your agreed quote.',
  };
  const highlights = [
    {
      icon: MapPin,
      title: text.location,
      description: text.locationDetail,
    },
    {
      icon: Languages,
      title: text.languages,
      description: text.languagesDetail,
    },
    {
      icon: ClipboardList,
      title: text.quote,
      description: text.quoteDetail,
    },
  ];

  return (
    <section id="founder" className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-md shadow-lg">
            <ResponsiveImage
              src={FOUNDER_IMAGE}
              variants={[
                { src: '/images/founder-jakypbekov-insan-480.webp', width: 480 },
                { src: '/images/founder-jakypbekov-insan-960.webp', width: 960 },
              ]}
              mobileVariants={[
                { src: '/images/founder-jakypbekov-insan-480.webp', width: 480 },
              ]}
              sizes="(min-width: 1024px) 40vw, 100vw"
              alt={isRussian ? `${name}, основатель Go Kyrgyzstan Travel` : `${FOUNDER_NAME}, founder of Go Kyrgyzstan Travel`}
              width={1200}
              height={1600}
              className="h-full w-full object-cover object-[center_38%]"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute -bottom-6 left-6 right-6 rounded-md border border-border bg-card p-4 shadow-lg">
            <p className="text-sm text-muted-foreground">{text.role}</p>
            <p className="text-lg text-foreground">{name}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              {text.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl text-foreground mb-4">{name}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {text.intro}
            </p>
          </div>

          <div className="grid gap-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm leading-6 text-muted-foreground">{text.process}</p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="btn-micro btn-action">
              <Link
                to={localizedPath('/feedback', locale)}
                data-track-event="about_request_click"
                data-track-label="About request"
              >
                {text.request}
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary"
              data-track-event="founder_instagram_click"
              data-track-label="jakypbekovv1"
            >
              <Instagram className="mb-3 h-5 w-5 text-secondary" />
              <p className="text-sm text-muted-foreground">Instagram</p>
              <p className="text-sm text-foreground">@jakypbekovv1</p>
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary"
              data-track-event="founder_telegram_card_click"
              data-track-label={TELEGRAM_USERNAME}
            >
              <MessageCircle className="mb-3 h-5 w-5 text-secondary" />
              <p className="text-sm text-muted-foreground">Telegram</p>
              <p className="text-sm text-foreground">{TELEGRAM_USERNAME}</p>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary"
              data-track-event="founder_whatsapp_click"
              data-track-label={WHATSAPP_DISPLAY}
            >
              <Phone className="mb-3 h-5 w-5 text-secondary" />
              <p className="text-sm text-muted-foreground">WhatsApp</p>
              <p className="text-sm text-foreground">{WHATSAPP_DISPLAY}</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
