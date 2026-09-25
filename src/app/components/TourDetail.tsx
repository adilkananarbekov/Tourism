import { ArrowLeft, Calendar, Check, MapPin, Tag, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import type { Tour } from './tour-data';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { submitBookingRequest } from '../lib/dataStore';
import { appendLocalBooking, loadLocalProfile, saveLocalProfile } from '../lib/localStorage';
import { useAuth } from '../context/AuthContext';
import { guestSubmissionBackendEnabled } from '../lib/backend';
import { apiEnabled } from '../lib/api';
import { DeferredMapSection } from './DeferredMapSection';
import { ResponsiveImage } from './ResponsiveImage';
import { trackEvent } from '../lib/eventTracker';
import type { SiteLocale } from '../lib/locale';
import { localizedPath } from '../lib/locale';
import { getCountryOptions } from '../lib/countries';
import { tourPath } from '../lib/tourRoutes';
import { tourPriceAmount } from '../lib/tourPrice';
import { FOUNDER_NAME, TELEGRAM_URL, WHATSAPP_URL } from '../lib/contact';
import { Calendar as DateCalendar } from './ui/calendar';
import type { DateRange } from 'react-day-picker';
import { enGB, ru } from 'date-fns/locale';
import { TourBookingCalendar, bookingDate, bookingDateValue, bookingToday, useTourDepartureAvailability } from './TourBookingCalendar';

interface TourDetailProps {
  tour: Tour | null;
  locale?: SiteLocale;
  relatedTours?: Tour[];
}

const formString = z.string();
const requiredFormString = (message: string) => formString.pipe(z.string().trim().min(1, message));

const bookingCopy = {
  en: {
    nameLabel: 'Name *',
    namePlaceholder: 'Your name',
    countryLabel: 'Country of residence *',
    countryPlaceholder: 'For example, Kyrgyzstan',
    countryHint: 'Start typing your country. Choose from the list or enter your own.',
    contactLabel: 'How should we contact you? *',
    contactPlaceholder: 'Choose a contact method',
    contactHint: 'WhatsApp or Telegram is preferred. Email also works well for written communication.',
    telegramLabel: 'Telegram username *',
    telegramPlaceholder: '@username',
    whatsappLabel: 'WhatsApp number *',
    whatsappPlaceholder: '+1 803 555 0123',
    emailLabel: 'Email *',
    emailPlaceholder: 'you@example.com',
    startDateLabel: 'Preferred Start Date',
    endDateLabel: 'Preferred End Date',
    flexibilityLabel: 'Flexible Timing',
    flexibilityPlaceholder: 'Any week, weekends only, or another preference',
    dateChoiceTitle: 'How certain are your travel dates?',
    exactDates: 'Exact dates',
    flexibleMonth: 'Flexible month',
    notSureDates: 'Not sure yet',
    exactDatesHint: 'Choose the start and end date in one calendar.',
    flexibleMonthHint: 'Choose a month; we will suggest practical dates.',
    sectionContact: 'About you and contact',
    sectionDates: 'Travel dates',
    sectionTrip: 'Trip details',
    participantsLabel: 'Number of Participants *',
    notesLabel: 'Additional Notes — optional',
    notesPlaceholder: 'Any special requests, questions, or preferred contact time...',
    summaryTitle: 'Request summary',
    summaryTour: 'Tour',
    summaryTravelers: 'Travelers',
    summaryEstimatedTotal: 'Estimated total',
    summaryPrice: 'Price',
    summaryNote: 'The final price and availability will be confirmed before booking.',
    sending: 'Sending...',
    send: 'Send Tour Request',
    cancel: 'Cancel',
    successTitle: 'Thank you!',
    successMessage: 'Your request was sent to Go Kyrgyzstan Travel. We will contact you through the method you chose to confirm dates and availability. Your trip is not confirmed yet.',
    close: 'Close',
    backendError: 'The request service is temporarily unavailable. Please contact us through WhatsApp or Telegram.',
    submitError: 'Unable to submit your booking request. Please try again or contact us through WhatsApp or Telegram.',
    validation: {
      nameRequired: 'Name is required.',
      countryRequired: 'Choose your country of residence.',
      contactRequired: 'Choose how we should contact you.',
      invalidEmail: 'Enter a valid email address, for example you@example.com.',
      participantsMinimum: 'Enter a whole number of participants, from 1 to 100.',
      phoneRequired: 'Add the phone number with its country code.',
      phoneInvalid: 'Use international format, for example +1 803 555 0123.',
      telegramRequired: 'Add your Telegram username.',
      telegramInvalid: 'Enter your username, for example @username, without spaces.',
      emailRequired: 'Add your email address.',
      endDateInvalid: 'End date cannot be before the start date.',
      datesRequired: 'Choose both the start and end date, or select flexible dates.',
      datePast: 'Choose today or a future date.',
      departureRequired: 'Choose an available departure for your group.',
    },
  },
  ru: {
    nameLabel: 'Имя *',
    namePlaceholder: 'Ваше имя',
    countryLabel: 'Страна проживания *',
    countryPlaceholder: 'Например, Кыргызстан',
    countryHint: 'Начните вводить название страны. Можно выбрать из списка или вписать свою.',
    contactLabel: 'Как с вами связаться? *',
    contactPlaceholder: 'Выберите способ связи',
    contactHint: 'Предпочтительнее WhatsApp или Telegram. По email тоже можно вести переписку.',
    telegramLabel: 'Имя пользователя Telegram *',
    telegramPlaceholder: '@username',
    whatsappLabel: 'Номер WhatsApp *',
    whatsappPlaceholder: '+996 555 123 456',
    emailLabel: 'Электронная почта *',
    emailPlaceholder: 'you@example.com',
    startDateLabel: 'Желаемая дата начала',
    endDateLabel: 'Желаемая дата окончания',
    flexibilityLabel: 'Гибкость по датам',
    flexibilityPlaceholder: 'Например, любая неделя месяца или только выходные',
    dateChoiceTitle: 'Насколько точно вы знаете даты?',
    exactDates: 'Точные даты',
    flexibleMonth: 'Гибкий месяц',
    notSureDates: 'Пока не знаю',
    exactDatesHint: 'Выберите начало и конец поездки в одном календаре.',
    flexibleMonthHint: 'Выберите месяц, а мы предложим подходящие даты.',
    sectionContact: 'О вас и способ связи',
    sectionDates: 'Даты поездки',
    sectionTrip: 'Детали поездки',
    participantsLabel: 'Количество участников *',
    notesLabel: 'Дополнительные пожелания — необязательно',
    notesPlaceholder: 'Особые пожелания, вопросы или удобное время для связи...',
    summaryTitle: 'Кратко о заявке',
    summaryTour: 'Тур',
    summaryTravelers: 'Участники',
    summaryEstimatedTotal: 'Предварительная стоимость',
    summaryPrice: 'Стоимость',
    summaryNote: 'Итоговую стоимость и наличие мест мы подтвердим до бронирования.',
    sending: 'Отправляем...',
    send: 'Отправить заявку',
    cancel: 'Отменить',
    successTitle: 'Спасибо!',
    successMessage: 'Заявка отправлена в Go Kyrgyzstan Travel. Мы свяжемся с вами выбранным способом, чтобы подтвердить даты и наличие мест. Поездка пока не подтверждена.',
    close: 'Закрыть',
    backendError: 'Сервис заявок временно недоступен. Напишите нам в WhatsApp или Telegram.',
    submitError: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в WhatsApp либо Telegram.',
    validation: {
      nameRequired: 'Укажите имя.',
      countryRequired: 'Выберите страну проживания.',
      contactRequired: 'Выберите удобный способ связи.',
      invalidEmail: 'Укажите корректный email, например you@example.com.',
      participantsMinimum: 'Укажите целое число участников от 1 до 100.',
      phoneRequired: 'Укажите номер телефона с кодом страны.',
      phoneInvalid: 'Используйте международный формат, например +996 555 123 456.',
      telegramRequired: 'Укажите имя пользователя Telegram.',
      telegramInvalid: 'Укажите имя пользователя, например @username, без пробелов.',
      emailRequired: 'Укажите адрес электронной почты.',
      endDateInvalid: 'Дата окончания не может быть раньше даты начала.',
      datesRequired: 'Выберите начало и конец поездки или переключитесь на гибкие даты.',
      datePast: 'Выберите сегодняшнюю или будущую дату.',
      departureRequired: 'Выберите доступный выезд для вашей группы.',
    },
  },
} as const;

function createBookingDetailsSchema(locale: SiteLocale, requireDates = false, today = bookingToday()) {
  const messages = bookingCopy[locale].validation;

  return z
    .object({
      name: requiredFormString(messages.nameRequired),
      countryOfResidence: requiredFormString(messages.countryRequired),
      contactPreference: formString.refine((value) => ['whatsapp', 'telegram', 'email'].includes(value), messages.contactRequired),
      email: formString,
      telegramUsername: formString,
      phone: formString,
      participants: z
        .number({ error: messages.participantsMinimum })
        .int(messages.participantsMinimum)
        .min(1, messages.participantsMinimum)
        .max(100, messages.participantsMinimum),
      startDate: formString,
      endDate: formString,
      dateFlexibility: formString,
      notes: formString,
    })
    .superRefine((values, ctx) => {
      if ((requireDates || values.startDate || values.endDate) && (!bookingDate(values.startDate) || !bookingDate(values.endDate))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: messages.datesRequired });
      }
      if (values.startDate && values.startDate < today) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: messages.datePast });
      }
      if (values.contactPreference === 'whatsapp') {
        const phone = values.phone.replace(/[\s()-]/g, '');
        if (!phone) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phone'],
            message: messages.phoneRequired,
          });
        } else if (!/^\+\d{7,15}$/.test(phone)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phone'],
            message: messages.phoneInvalid,
          });
        }
      }
      if (values.contactPreference === 'telegram') {
        const username = values.telegramUsername.trim();
        if (!/^@?[A-Za-z0-9_]{1,32}$/.test(username)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['telegramUsername'],
            message: username ? messages.telegramInvalid : messages.telegramRequired,
          });
        }
      }
      if (values.contactPreference === 'email' && !z.string().email().safeParse(values.email.trim()).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['email'],
          message: values.email.trim() ? messages.invalidEmail : messages.emailRequired,
        });
      }

      if (
        values.startDate &&
        values.endDate &&
        Date.parse(values.endDate) < Date.parse(values.startDate)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: messages.endDateInvalid,
        });
      }
    });
}

type BookingDetailsValues = z.infer<ReturnType<typeof createBookingDetailsSchema>>;

function toDateFieldValue(date: Date | undefined) {
  return bookingDateValue(date);
}

function fromDateFieldValue(value: string | undefined) {
  return bookingDate(value);
}

export function TourDetail({ tour, locale = 'en', relatedTours = [] }: TourDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const bookingPanelRef = useRef<HTMLDivElement>(null);
  const bookingHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusBookingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isRussian = locale === 'ru';
  const text = isRussian
    ? {
        notFound: 'Тур не найден.', back: 'К списку туров', overview: 'Обзор', itinerary: 'Программа', highlights: 'Главное', packing: 'Что взять', info: 'Практическая информация',
        about: 'О туре', details: 'Детали тура', duration: 'Длительность', season: 'Сезон', type: 'Формат тура', difficulty: 'Сложность',
        dayByDay: 'Программа по дням', day: 'День', tourHighlights: 'Главные впечатления', whatToPack: 'Что взять с собой',
        accommodation: 'Размещение', meals: 'Питание', groupSize: 'Размер группы', included: 'Включено', notIncluded: 'Не включено',
        tourInformation: 'Информация о туре', startingFrom: 'Стоимость от', perPerson: 'за человека', request: 'Оставить заявку', bookingFormTitle: 'Заявка на этот тур', bestSeason: 'Лучший сезон',
        routeNotes: 'Что важно знать о маршруте', commonQuestions: 'Частые вопросы', relatedTours: 'Похожие маршруты', viewTour: 'Смотреть тур',
      }
    : {
        notFound: 'Tour not found.', back: 'Back to Tours', overview: 'Overview', itinerary: 'Itinerary', highlights: 'Highlights', packing: 'Packing', info: 'Practical Info',
        about: 'About This Tour', details: 'Tour Details', duration: 'Duration', season: 'Season', type: 'Tour Type', difficulty: 'Difficulty',
        dayByDay: 'Day by Day Itinerary', day: 'Day', tourHighlights: 'Tour Highlights', whatToPack: 'What to Pack',
        accommodation: 'Accommodation', meals: 'Meals', groupSize: 'Group Size', included: "What's Included", notIncluded: 'Not Included',
        tourInformation: 'Tour information', startingFrom: 'Starting from', perPerson: 'per person', request: 'Request This Tour', bookingFormTitle: 'Request this tour', bestSeason: 'Best Season',
        routeNotes: 'Route notes', commonQuestions: 'Common questions', relatedTours: 'Related routes', viewTour: 'View tour',
      };
  const toursPath = localizedPath('/tours', locale);
  const displayPrice = isRussian && tour?.price === 'Price on request' ? 'По запросу' : tour?.price;
  const numericPrice = tour ? tourPriceAmount(tour.price) : null;
  const quoteBasedInclusions = tour?.practicalInfo.included.every((item) => /confirm|planning|соглас|планирован/i.test(item));
  const isRouteOutline = tour?.itinerary.some((day) => /Today is paced around weather, road conditions|День проходит в соответствии с погодой, дорожной обстановкой и темпом группы/i.test(day.description));
  const itineraryLabel = isRouteOutline ? (isRussian ? 'План маршрута' : 'Route outline') : text.itinerary;
  const itineraryOutlineNote = isRussian
    ? 'Это ориентир для планирования, а не подтверждённая программа по дням. До бронирования согласуем время переездов и активностей, места ночёвок и включённые услуги в письменной программе и расчёте.'
    : 'This is a planning outline, not a confirmed daily schedule. We will agree the timing, overnight stays, and included services in your written itinerary and quote before confirmation.';

  const openBooking = () => {
    shouldFocusBookingRef.current = true;
    setShowBookingForm(true);
    navigate({ pathname: location.pathname, hash: '#booking' }, { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingRequested = params.get('book') === 'true' || location.hash === '#booking';
    if (bookingRequested && tour) {
      shouldFocusBookingRef.current = true;
      setShowBookingForm(true);
    }
  }, [location.hash, location.search, tour?.id]);

  useEffect(() => {
    if (!showBookingForm || !shouldFocusBookingRef.current) {
      return;
    }

    let focusFrame = 0;
    const scrollFrame = window.requestAnimationFrame(() => {
      bookingPanelRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      focusFrame = window.requestAnimationFrame(() => {
        bookingHeadingRef.current?.focus({ preventScroll: true });
        shouldFocusBookingRef.current = false;
      });
    });

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [location.hash, location.search, showBookingForm, tour?.id]);

  if (!tour) {
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-muted-foreground">{text.notFound}</p>
        <Button onClick={() => navigate(toursPath)} className="mt-4 btn-micro">
          {text.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="tour-detail-page bg-background">
      {/* Hero Section */}
      <div className="relative h-[320px] sm:h-[380px] md:h-[500px]">
        <ResponsiveImage
          src={tour.image}
          variants={[
            { src: tour.image.replace(/\.[^.]+$/, '-480.webp'), width: 480 },
            { src: tour.image.replace(/\.[^.]+$/, '-960.webp'), width: 960 },
          ]}
          mobileVariants={[
            { src: tour.image.replace(/\.[^.]+$/, '-480.webp'), width: 480 },
          ]}
          sizes="100vw"
          alt={tour.title}
          width={1280}
          height={720}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <Button
              onClick={() => navigate(toursPath)}
              variant="outline"
              className="mb-6 bg-white/10 hover:bg-white/20 text-white border-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {text.back}
            </Button>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              {tour.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-white text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{tour.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{tour.tourType}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <span>{displayPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1">
            <div className="bg-card rounded-md p-6 border border-border/50 shadow-xl lg:sticky lg:top-24">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">{numericPrice ? text.startingFrom : (isRussian ? 'Индивидуальный расчёт' : 'A quote for your trip')}</p>
                <p className="text-3xl sm:text-4xl text-foreground">{displayPrice}</p>
                {numericPrice ? <p className="text-sm text-muted-foreground">{text.perPerson}</p> : <p className="mt-3 text-sm leading-6 text-muted-foreground">{isRussian ? 'Стоимость зависит от дат, числа гостей, транспорта и размещения. Укажите свои пожелания — обсудим маршрут и состав услуг.' : 'The price depends on your dates, group size, transport and accommodation. Tell us your plans so we can discuss the route and services.'}</p>}
              </div>

              {!showBookingForm ? (
                <Button
                  onClick={openBooking}
                  className="w-full btn-micro btn-action mb-4"
                  data-track-event="tour_detail_request_open"
                  data-track-label={tour.title}
                >
                  {isRussian ? 'Уточнить даты и стоимость' : 'Ask about dates & price'}
                </Button>
              ) : (
                <div id="booking" ref={bookingPanelRef} className="scroll-mt-24">
                  <h2
                    ref={bookingHeadingRef}
                    tabIndex={-1}
                    className="mb-5 rounded-sm text-xl text-foreground outline-none"
                  >
                    {text.bookingFormTitle}
                  </h2>
                  <BookingFlow
                    key={tour.id}
                    tour={tour}
                    onCancel={() => {
                      setShowBookingForm(false);
                      if (location.hash === '#booking') navigate(location.pathname, { replace: true });
                    }}
                    locale={locale}
                  />
                </div>
              )}

              {!showBookingForm && <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>{isRussian ? 'Без оплаты на сайте. Сначала обсуждаем поездку, затем согласуем предложение письменно.' : 'No payment on this website. Discuss your trip first, then agree the details in writing.'}</p>
                <Link to={`${localizedPath('/terms-of-use', locale)}#booking`} className="font-medium text-primary underline underline-offset-4">{isRussian ? 'Как проходит бронирование' : 'How booking works'}</Link>
              </div>}

              <div className="mt-5 border-t border-border pt-4 text-sm leading-6">
                <p className="font-medium text-foreground">{isRussian ? 'Ваша местная команда' : 'Your local trip team'}</p>
                <p className="text-muted-foreground">{FOUNDER_NAME} · {isRussian ? 'Бишкек, Кыргызстан' : 'Bishkek, Kyrgyzstan'}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4" data-track-event="founder_whatsapp_click">WhatsApp</a>
                  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4" data-track-event="founder_telegram_click">Telegram</a>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground">{text.groupSize}</p>
                    <p className="text-sm text-muted-foreground">{tour.practicalInfo.groupSize}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground">{text.bestSeason}</p>
                    <p className="text-sm text-muted-foreground">{tour.season}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground">{text.difficulty}</p>
                    <p className="text-sm text-muted-foreground">{tour.practicalInfo.difficulty}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
            {/* Desktop Tabs */}
            <div className="hidden md:block">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 mb-8 h-auto">
                  <TabsTrigger value="overview">{text.overview}</TabsTrigger>
                  <TabsTrigger value="itinerary">{itineraryLabel}</TabsTrigger>
                  <TabsTrigger value="highlights">{text.highlights}</TabsTrigger>
                  <TabsTrigger value="packing">{text.packing}</TabsTrigger>
                  <TabsTrigger value="info">{text.info}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl text-foreground mb-4">{text.about}</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {tour.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xl text-foreground mb-3">{text.details}</h4>
                      <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                        <div>
                          <p className="text-sm text-muted-foreground/70">{text.duration}</p>
                          <p>{tour.duration}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground/70">{text.season}</p>
                          <p>{tour.season}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground/70">{text.type}</p>
                          <p>{tour.tourType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground/70">{text.difficulty}</p>
                          <p>{tour.practicalInfo.difficulty}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="itinerary">
                  <h3 className="text-2xl text-foreground mb-6">{isRouteOutline ? itineraryLabel : text.dayByDay}</h3>
                  {isRouteOutline && <p className="mb-6 rounded-md border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">{itineraryOutlineNote}</p>}
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {tour.itinerary.map((day) => (
                      <AccordionItem key={day.day} value={`day-${day.day}`} className="border rounded-md px-4 bg-card shadow-sm">
                        <AccordionTrigger className="text-left font-medium text-lg hover:text-primary hover:no-underline">
                          {text.day} {day.day}: {day.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2 pb-4">
                          {day.description}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="highlights">
                  <h3 className="text-2xl text-foreground mb-6">{text.tourHighlights}</h3>
                  <ul className="space-y-4">
                    {tour.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                        <span className="text-muted-foreground text-lg">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="packing">
                  <h3 className="text-2xl text-foreground mb-6">{text.whatToPack}</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tour.packingList.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="info">
                  <h3 className="text-2xl text-foreground mb-6">{text.info}</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg text-foreground mb-2">{text.accommodation}</h4>
                      <p className="text-muted-foreground">{tour.practicalInfo.accommodation}</p>
                    </div>
                    <div>
                      <h4 className="text-lg text-foreground mb-2">{text.meals}</h4>
                      <p className="text-muted-foreground">{tour.practicalInfo.meals}</p>
                    </div>
                    <div>
                      <h4 className="text-lg text-foreground mb-2">{text.groupSize}</h4>
                      <p className="text-muted-foreground">{tour.practicalInfo.groupSize}</p>
                    </div>
                    <div>
                      <h4 className="text-lg text-foreground mb-2">{quoteBasedInclusions ? (isRussian ? 'Услуги для согласования в расчёте' : 'Services to agree in your quote') : text.included}</h4>
                      <ul className="space-y-2 text-muted-foreground">
                        {tour.practicalInfo.included.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg text-foreground mb-2">{text.notIncluded}</h4>
                      <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                        {tour.practicalInfo.notIncluded.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Mobile Accordion */}
            <div className="md:hidden">
              <h2 className="sr-only">{text.tourInformation}</h2>
              <Accordion type="single" collapsible>
                <AccordionItem value="overview">
                  <AccordionTrigger>{text.overview}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl text-foreground mb-3">{text.about}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {tour.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg text-foreground mb-3">{text.details}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-muted-foreground">
                          <div>
                            <p className="text-sm text-muted-foreground/70">{text.duration}</p>
                            <p>{tour.duration}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground/70">{text.season}</p>
                            <p>{tour.season}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground/70">{text.type}</p>
                            <p>{tour.tourType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground/70">{text.difficulty}</p>
                            <p>{tour.practicalInfo.difficulty}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="itinerary">
                  <AccordionTrigger>{itineraryLabel}</AccordionTrigger>
                  <AccordionContent>
                    {isRouteOutline && <p className="mb-5 rounded-md border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">{itineraryOutlineNote}</p>}
                    <div className="space-y-6">
                      {tour.itinerary.map((day) => (
                        <div key={day.day} className="border-l-4 border-primary pl-4 pb-4">
                          <h4 className="text-foreground mb-2">
                            {text.day} {day.day}: {day.title}
                          </h4>
                          <p className="text-muted-foreground text-sm">{day.description}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="highlights">
                  <AccordionTrigger>{text.highlights}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3">
                      {tour.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                          <span className="text-muted-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="packing">
                  <AccordionTrigger>{text.packing}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3">
                      {tour.packingList.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                          <span className="text-muted-foreground text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="info">
                  <AccordionTrigger>{text.info}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-foreground mb-2">{text.accommodation}</h4>
                        <p className="text-muted-foreground text-sm">{tour.practicalInfo.accommodation}</p>
                      </div>
                      <div>
                        <h4 className="text-foreground mb-2">{text.meals}</h4>
                        <p className="text-muted-foreground text-sm">{tour.practicalInfo.meals}</p>
                      </div>
                      <div>
                        <h4 className="text-foreground mb-2">{text.groupSize}</h4>
                        <p className="text-muted-foreground text-sm">{tour.practicalInfo.groupSize}</p>
                      </div>
                      <div>
                        <h4 className="text-foreground mb-2">{quoteBasedInclusions ? (isRussian ? 'Услуги для согласования в расчёте' : 'Services to agree in your quote') : text.included}</h4>
                        <ul className="space-y-2 text-muted-foreground">
                          {tour.practicalInfo.included.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-foreground mb-2">{text.notIncluded}</h4>
                        <ul className="space-y-2 list-disc pl-5 text-muted-foreground text-sm">
                          {tour.practicalInfo.notIncluded.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="mt-10">
              <DeferredMapSection title={tour.title} locations={tour.locations} locale={locale} />
            </div>

            {tour.seoContent && (
              <section className="mt-10 rounded-md border border-border bg-card p-6 sm:p-8">
                <h2 className="text-2xl text-foreground">{tour.seoContent.heading || text.routeNotes}</h2>
                <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                  {tour.seoContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {tour.seoContent.faq?.length ? (
                  <div className="mt-7">
                    <h3 className="text-xl text-foreground">{text.commonQuestions}</h3>
                    <div className="mt-3 space-y-4">
                      {tour.seoContent.faq.map((item) => (
                        <div key={item.question}>
                          <h4 className="font-medium text-foreground">{item.question}</h4>
                          <p className="mt-1 text-muted-foreground leading-relaxed">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {relatedTours.length > 0 && (
              <section className="mt-10">
                <h2 className="text-2xl text-foreground">{text.relatedTours}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedTours.map((relatedTour) => (
                    <Link
                      key={relatedTour.id}
                      to={tourPath(relatedTour, locale)}
                      className="interactive-card rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/50"
                    >
                      <p className="text-sm text-secondary">{relatedTour.duration} · {relatedTour.tourType}</p>
                      <h3 className="mt-2 text-lg text-foreground">{relatedTour.title}</h3>
                      <span className="mt-4 inline-block text-sm font-medium text-primary">{text.viewTour} →</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function BookingFlow({ tour, onCancel, locale }: { tour: Tour; onCancel: () => void; locale: SiteLocale }) {
  const { user, profile } = useAuth();
  const copy = bookingCopy[locale];
  const [step, setStep] = useState<'details' | 'done'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<'exact' | 'flexible' | 'unsure'>('flexible');
  const [departureId, setDepartureId] = useState('');
  const departureSchedule = useTourDepartureAvailability(tour.id);
  const isScheduled = (departureSchedule.availability?.mode || tour.availabilityMode) === 'scheduled';
  const todayValue = departureSchedule.availability?.today || bookingToday();
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const detailsSchema = useMemo(() => createBookingDetailsSchema(locale, !isScheduled && dateMode === 'exact', todayValue), [locale, isScheduled, dateMode, todayValue]);
  const detailsForm = useForm<BookingDetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: profile?.name || '',
      countryOfResidence: '',
      contactPreference: '',
      email: profile?.email || user?.email || '',
      telegramUsername: '',
      phone: '',
      participants: 2,
      startDate: '',
      endDate: '',
      dateFlexibility: '',
      notes: '',
    },
  });
  const contactPreference = detailsForm.watch('contactPreference');
  const watchedStartDate = detailsForm.watch('startDate');
  const watchedEndDate = detailsForm.watch('endDate');
  const selectedDateRange: DateRange = {
    from: fromDateFieldValue(watchedStartDate),
    to: fromDateFieldValue(watchedEndDate),
  };
  const today = useMemo(() => bookingDate(todayValue)!, [todayValue]);
  const flexibleMonthChoices = useMemo(() => {
    return Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return {
        value: new Intl.DateTimeFormat(locale === 'ru' ? 'ru' : 'en', { month: 'long', year: 'numeric' }).format(date),
        short: new Intl.DateTimeFormat(locale === 'ru' ? 'ru' : 'en', { month: 'short' }).format(date),
      };
    });
  }, [locale, today]);

  const selectDateMode = (mode: 'exact' | 'flexible' | 'unsure') => {
    setDateMode(mode);
    detailsForm.clearErrors(['startDate', 'endDate']);
    if (mode === 'exact') {
      detailsForm.setValue('dateFlexibility', '');
      return;
    }
    detailsForm.setValue('startDate', '');
    detailsForm.setValue('endDate', '');
    if (mode === 'unsure') {
      detailsForm.setValue('dateFlexibility', locale === 'ru' ? 'Даты пока не определены' : 'Dates are not decided yet');
    } else if (/not decided|не определены/i.test(detailsForm.getValues('dateFlexibility'))) {
      detailsForm.setValue('dateFlexibility', '');
    }
  };

  const pricePerPerson = tourPriceAmount(tour.price) || 0;

  const participantsCount = Math.max(1, detailsForm.watch('participants') || 1);
  const selectedDeparture = departureSchedule.availability?.departures.find((departure) => departure.id === departureId
    && departure.status === 'open' && departure.remainingSeats >= participantsCount && departure.startDate >= todayValue);
  const totalPrice = pricePerPerson * participantsCount;
  const displayTourPrice = locale === 'ru' && tour.price === 'Price on request'
    ? 'По запросу'
    : tour.price;

  useEffect(() => {
    if (!isScheduled) return;
    detailsForm.setValue('startDate', selectedDeparture?.startDate || '');
    detailsForm.setValue('endDate', selectedDeparture?.endDate || '');
    detailsForm.setValue('dateFlexibility', '');
    if (departureId && !selectedDeparture && !departureSchedule.loading) {
      trackEvent('departure_unavailable', { code: 'selection_invalidated' });
      setDepartureId('');
      setErrorMessage(copy.validation.departureRequired);
    }
  }, [isScheduled, selectedDeparture?.startDate, selectedDeparture?.endDate, departureId, departureSchedule.loading, detailsForm, copy.validation.departureRequired]);

  useEffect(() => {
    if (profile?.name || profile?.email || user?.email) {
      const currentName = detailsForm.getValues('name');
      const currentEmail = detailsForm.getValues('email');
      if (!currentName) {
        detailsForm.setValue('name', profile?.name || '');
      }
      if (!currentEmail) {
        detailsForm.setValue('email', profile?.email || user?.email || '');
      }
    }
  }, [detailsForm, profile?.email, profile?.name, user?.email]);

  const handleDetailsSubmit = async (details: BookingDetailsValues) => {
    setErrorMessage(null);

    if (apiEnabled && (departureSchedule.loading || departureSchedule.error)) {
      trackEvent('tour_request_submit_error', { code: 'schedule_unavailable' });
      setErrorMessage(locale === 'ru' ? 'Обновите расписание перед отправкой заявки.' : 'Refresh the schedule before sending your request.');
      return;
    }
    if (isScheduled && (!selectedDeparture || departureSchedule.loading || departureSchedule.error)) {
      trackEvent('departure_unavailable', { code: 'departure_required' });
      setErrorMessage(copy.validation.departureRequired);
      return;
    }

    if (!guestSubmissionBackendEnabled) {
      trackEvent('tour_request_submit_error', { code: 'service_unavailable' });
      setErrorMessage(copy.backendError);
      return;
    }

    setIsSubmitting(true);
    trackEvent('tour_request_valid_attempt');
    try {
      const bookingPayload = {
        tourId: tour.id,
        tourTitle: tour.title,
        name: details.name,
        countryOfResidence: details.countryOfResidence,
        contactPreference: details.contactPreference,
        email: details.contactPreference === 'email' ? details.email.trim() : '',
        telegramUsername: details.contactPreference === 'telegram' ? details.telegramUsername.trim() : '',
        phone: details.contactPreference === 'whatsapp' ? details.phone.trim() : '',
        participants: participantsCount,
        departureId: isScheduled ? selectedDeparture?.id : undefined,
        startDate: isScheduled ? selectedDeparture!.startDate : details.startDate || '',
        endDate: isScheduled ? selectedDeparture!.endDate : details.endDate || '',
        dateFlexibility: isScheduled ? '' : details.dateFlexibility || '',
        notes: details.notes || '',
        pricePerPerson: tour.price,
        totalPrice: totalPrice ? `$${totalPrice}` : tour.price,
        userId: user?.uid,
      };
      await submitBookingRequest(bookingPayload);
      trackEvent('tour_request_submit_success', {
        label: tour.title,
      });
      if (!apiEnabled) {
        appendLocalBooking({ ...bookingPayload, status: 'pending' });
        const existingProfile = loadLocalProfile();
        if (!existingProfile && details.email && details.name) {
          saveLocalProfile({ name: details.name, email: details.email, role: 'buyer' });
        }
      }
      setStep('done');
    } catch (err) {
      trackEvent('tour_request_submit_error', { code: 'request_failed' });
      if (isScheduled) departureSchedule.refresh();
      setErrorMessage(copy.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="text-center py-6">
        <Check className="h-12 w-12 text-secondary mx-auto mb-4" />
        <h4 className="text-lg text-foreground mb-2">{copy.successTitle}</h4>
        <p className="text-sm text-muted-foreground mb-4">{copy.successMessage}</p>
        <Button onClick={onCancel} variant="outline" size="sm">
          {copy.close}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {step === 'details' && (
        <form noValidate onSubmit={detailsForm.handleSubmit(handleDetailsSubmit, (errors) => {
          trackEvent('tour_request_validation_error', { fields: Object.keys(errors).sort().join(',') });
        })} className="space-y-4">
          <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="booking-contact-heading">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">1</span>
              <h3 id="booking-contact-heading" className="text-lg text-foreground">{copy.sectionContact}</h3>
            </div>
            <div className="space-y-4">
          <div>
            <Label htmlFor="name">{copy.nameLabel}</Label>
            <Input
              id="name"
              placeholder={copy.namePlaceholder}
              autoComplete="name"
              maxLength={160}
              aria-required="true"
              aria-invalid={Boolean(detailsForm.formState.errors.name)}
              aria-describedby={detailsForm.formState.errors.name ? 'booking-name-error' : undefined}
              {...detailsForm.register('name')}
            />
            {detailsForm.formState.errors.name && (
              <p id="booking-name-error" role="alert" className="text-xs text-red-600">
                {detailsForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="countryOfResidence">{copy.countryLabel}</Label>
            <Input
              id="countryOfResidence"
              list="booking-country-options"
              autoComplete="country-name"
              placeholder={copy.countryPlaceholder}
              maxLength={240}
              aria-required="true"
              aria-invalid={Boolean(detailsForm.formState.errors.countryOfResidence)}
              aria-describedby={detailsForm.formState.errors.countryOfResidence ? 'booking-country-hint booking-country-error' : 'booking-country-hint'}
              {...detailsForm.register('countryOfResidence')}
            />
            <datalist id="booking-country-options">
              {countryOptions.map((country) => <option key={country.code} value={country.value} />)}
            </datalist>
            <p id="booking-country-hint" className="mt-1 text-xs text-muted-foreground">{copy.countryHint}</p>
            {detailsForm.formState.errors.countryOfResidence && (
              <p id="booking-country-error" role="alert" className="text-xs text-red-600">{detailsForm.formState.errors.countryOfResidence.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contactPreference">{copy.contactLabel}</Label>
            <select
              id="contactPreference"
              aria-required="true"
              aria-invalid={Boolean(detailsForm.formState.errors.contactPreference)}
              aria-describedby={detailsForm.formState.errors.contactPreference ? 'booking-contact-hint booking-contact-error' : 'booking-contact-hint'}
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              {...detailsForm.register('contactPreference')}
              onChange={(event) => {
                detailsForm.setValue('contactPreference', event.target.value, { shouldValidate: true });
                if (event.target.value !== 'whatsapp') detailsForm.setValue('phone', '');
                if (event.target.value !== 'telegram') detailsForm.setValue('telegramUsername', '');
                if (event.target.value !== 'email') detailsForm.setValue('email', '');
              }}
            >
              <option value="" disabled>{copy.contactPlaceholder}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
            </select>
            <p id="booking-contact-hint" className="mt-1 text-xs text-muted-foreground">{copy.contactHint}</p>
            {detailsForm.formState.errors.contactPreference && (
              <p id="booking-contact-error" role="alert" className="text-xs text-red-600">{detailsForm.formState.errors.contactPreference.message}</p>
            )}
          </div>
          {contactPreference === 'telegram' && <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <Label htmlFor="telegramUsername">{copy.telegramLabel}</Label>
            <Input
              id="telegramUsername"
              placeholder={copy.telegramPlaceholder}
              autoCapitalize="none"
              spellCheck={false}
              maxLength={33}
              aria-required="true"
              aria-invalid={Boolean(detailsForm.formState.errors.telegramUsername)}
              aria-describedby={detailsForm.formState.errors.telegramUsername ? 'booking-telegram-error' : undefined}
              {...detailsForm.register('telegramUsername')}
            />
            {detailsForm.formState.errors.telegramUsername && (
              <p id="booking-telegram-error" role="alert" className="text-xs text-red-600">
                {detailsForm.formState.errors.telegramUsername.message}
              </p>
            )}
          </div>}
          {contactPreference === 'whatsapp' && <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <Label htmlFor="phone">{copy.whatsappLabel}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder={copy.whatsappPlaceholder}
              autoComplete="tel"
              maxLength={80}
              aria-required="true"
              aria-invalid={Boolean(detailsForm.formState.errors.phone)}
              aria-describedby={detailsForm.formState.errors.phone ? 'booking-phone-error' : undefined}
              {...detailsForm.register('phone')}
            />
            {detailsForm.formState.errors.phone && (
              <p id="booking-phone-error" role="alert" className="text-xs text-red-600">
                {detailsForm.formState.errors.phone.message}
              </p>
            )}
          </div>}
          {contactPreference === 'email' && <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <Label htmlFor="email">{copy.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              placeholder={copy.emailPlaceholder}
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={240}
              aria-required="true"
              aria-invalid={Boolean(detailsForm.formState.errors.email)}
              aria-describedby={detailsForm.formState.errors.email ? 'booking-email-error' : undefined}
              {...detailsForm.register('email')}
            />
            {detailsForm.formState.errors.email && (
              <p id="booking-email-error" role="alert" className="text-xs text-red-600">
                {detailsForm.formState.errors.email.message}
              </p>
            )}
          </div>}
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="booking-dates-heading">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">2</span>
              <div>
                <h3 id="booking-dates-heading" className="text-lg text-foreground">{copy.sectionDates}</h3>
                <p className="text-xs text-muted-foreground">{isScheduled ? (locale === 'ru' ? 'Выберите выезд из расписания' : 'Choose a scheduled departure') : copy.dateChoiceTitle}</p>
              </div>
            </div>

            <div className="mb-5">
              <Label htmlFor="participants">{copy.participantsLabel}</Label>
              <Input
                id="participants"
                type="number"
                min="1"
                max="100"
                step="1"
                inputMode="numeric"
                className="mt-2"
                aria-required="true"
                aria-invalid={Boolean(detailsForm.formState.errors.participants)}
                aria-describedby={detailsForm.formState.errors.participants ? 'booking-participants-error' : undefined}
                {...detailsForm.register('participants', { valueAsNumber: true })}
              />
              {detailsForm.formState.errors.participants && <p id="booking-participants-error" role="alert" className="mt-1 text-xs text-red-600">{detailsForm.formState.errors.participants.message}</p>}
            </div>

            {(isScheduled || (apiEnabled && (departureSchedule.loading || departureSchedule.error))) ? <TourBookingCalendar
              {...departureSchedule}
              participants={participantsCount}
              selectedId={departureId}
              locale={locale}
              onRetry={departureSchedule.refresh}
              onSelect={(departure) => {
                trackEvent('departure_selected');
                setDepartureId(departure.id);
                setErrorMessage(null);
                detailsForm.clearErrors(['startDate', 'endDate']);
              }}
            /> : <>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={copy.dateChoiceTitle}>
              {([
                ['exact', copy.exactDates],
                ['flexible', copy.flexibleMonth],
                ['unsure', copy.notSureDates],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => selectDateMode(mode)}
                  aria-pressed={dateMode === mode}
                  className={`min-h-12 rounded-md border px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${dateMode === mode ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {dateMode === 'exact' && (
              <div className="mt-4 rounded-md border border-border bg-background p-2 sm:p-3">
                <p className="mb-2 text-sm text-muted-foreground">{copy.exactDatesHint}</p>
                <DateCalendar
                  mode="range"
                  locale={locale === 'ru' ? ru : enGB}
                  weekStartsOn={1}
                  selected={selectedDateRange}
                  onSelect={(range) => {
                    detailsForm.setValue('startDate', toDateFieldValue(range?.from), { shouldValidate: true });
                    detailsForm.setValue('endDate', toDateFieldValue(range?.to), { shouldValidate: true });
                  }}
                  disabled={{ before: today }}
                  fromMonth={today}
                  defaultMonth={selectedDateRange.from || today}
                  className="mx-auto w-fit max-w-full"
                  labels={{
                    labelNext: () => locale === 'ru' ? 'Следующий месяц' : 'Next month',
                    labelPrevious: () => locale === 'ru' ? 'Предыдущий месяц' : 'Previous month',
                  }}
                />
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                  <div>
                    <span className="block text-xs text-muted-foreground">{copy.startDateLabel}</span>
                    <span className="font-medium text-foreground">{watchedStartDate || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">{copy.endDateLabel}</span>
                    <span className="font-medium text-foreground">{watchedEndDate || '—'}</span>
                  </div>
                </div>
                {Boolean(detailsForm.formState.errors.startDate || detailsForm.formState.errors.endDate) && (
                  <p className="mt-2 text-xs text-red-600" role="alert">{detailsForm.formState.errors.startDate?.message || detailsForm.formState.errors.endDate?.message}</p>
                )}
              </div>
            )}

            {dateMode === 'flexible' && (
              <div className="mt-4">
                <p className="mb-3 text-sm text-muted-foreground">{copy.flexibleMonthHint}</p>
                <div className="grid grid-cols-3 gap-2">
                  {flexibleMonthChoices.map((month) => {
                    const active = detailsForm.watch('dateFlexibility') === month.value;
                    return (
                      <button
                        key={month.value}
                        type="button"
                        onClick={() => detailsForm.setValue('dateFlexibility', month.value, { shouldDirty: true })}
                        aria-pressed={active}
                        className={`min-h-10 shrink-0 rounded-md border px-4 text-sm font-medium transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                      >
                        {month.short}
                      </button>
                    );
                  })}
                </div>
                <Label htmlFor="dateFlexibility" className="mt-3 block">{copy.flexibilityLabel}</Label>
                <Input id="dateFlexibility" placeholder={copy.flexibilityPlaceholder} {...detailsForm.register('dateFlexibility')} />
              </div>
            )}

            {dateMode === 'unsure' && (
              <p className="mt-4 rounded-md border border-dashed border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                {locale === 'ru' ? 'Ничего страшного — сначала обсудим маршрут и сезон, а даты уточним позже.' : 'That is completely fine — we can choose the route and season first, then confirm dates later.'}
              </p>
            )}
            </>}
          </section>
          <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="booking-trip-heading">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">3</span>
              <h3 id="booking-trip-heading" className="text-lg text-foreground">{copy.sectionTrip}</h3>
            </div>
            <div className="space-y-4">
          <div>
            <Label htmlFor="notes">{copy.notesLabel}</Label>
            <Textarea
              id="notes"
              placeholder={copy.notesPlaceholder}
              rows={3}
              {...detailsForm.register('notes')}
            />
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-4" aria-live="polite">
            <h3 className="text-sm font-medium text-foreground">{copy.summaryTitle}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">{copy.summaryTour}</dt>
                <dd className="max-w-[65%] text-right text-foreground">{tour.title}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{copy.summaryTravelers}</dt>
                <dd className="text-foreground">{participantsCount}</dd>
              </div>
              {(watchedStartDate || detailsForm.watch('dateFlexibility')) && <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">{copy.sectionDates}</dt>
                <dd className="max-w-[65%] text-right text-foreground">{watchedStartDate
                  ? `${new Intl.DateTimeFormat(locale === 'ru' ? 'ru' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(bookingDate(watchedStartDate))}${watchedEndDate && watchedEndDate !== watchedStartDate ? ` — ${new Intl.DateTimeFormat(locale === 'ru' ? 'ru' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(bookingDate(watchedEndDate))}` : ''}`
                  : detailsForm.watch('dateFlexibility')}</dd>
              </div>}
              <div className="flex items-center justify-between gap-4 border-t border-border pt-2 font-medium">
                <dt className="text-foreground">
                  {totalPrice ? copy.summaryEstimatedTotal : copy.summaryPrice}
                </dt>
                <dd className="text-foreground">{totalPrice ? `$${totalPrice}` : displayTourPrice}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy.summaryNote}</p>
          </div>
            </div>
          </section>
          {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage} <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a> · <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="underline">Telegram</a></p>}
          <p className="text-xs leading-6 text-muted-foreground">{locale === 'ru' ? 'Это запрос, а не оплата или подтверждённая бронь. ' : 'This is an enquiry, not a payment or a confirmed booking. '}<Link className="text-primary underline underline-offset-4" to={`${localizedPath('/terms-of-use', locale)}#booking`}>{locale === 'ru' ? 'Бронирование, изменения и отмена' : 'Booking, changes & cancellation'}</Link>{' · '}<Link className="underline underline-offset-4" to={localizedPath('/privacy-policy', locale)}>{locale === 'ru' ? 'Конфиденциальность' : 'Privacy'}</Link></p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="submit"
              className="flex-1 btn-micro btn-action"
              disabled={isSubmitting || (apiEnabled && (departureSchedule.loading || departureSchedule.error)) || (isScheduled && (!selectedDeparture || departureSchedule.error))}
              data-track-event="tour_detail_request_submit"
              data-track-label={tour.title}
            >
              {isSubmitting ? copy.sending : copy.send}
            </Button>
            <Button type="button" onClick={onCancel} variant="outline">
              {copy.cancel}
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}
