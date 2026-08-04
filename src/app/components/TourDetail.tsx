import { ArrowLeft, Calendar, Check, MapPin, Tag, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { DeferredMapSection } from './DeferredMapSection';
import { ResponsiveImage } from './ResponsiveImage';
import { trackEvent } from '../lib/eventTracker';
import type { SiteLocale } from '../lib/locale';
import { localizedPath } from '../lib/locale';
import { getCountryOptions } from '../lib/countries';

interface TourDetailProps {
  tour: Tour | null;
  locale?: SiteLocale;
  relatedTours?: Tour[];
}

const formString = z.string();
const requiredFormString = (message: string) => formString.pipe(z.string().trim().min(1, message));
const optionalEmail = formString.pipe(
  z.string().refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Use a valid email or leave it empty.',
  })
);

const bookingDetailsSchema = z
  .object({
    name: requiredFormString('Name is required.'),
    countryOfResidence: requiredFormString('Choose your country of residence.'),
    contactPreference: requiredFormString('Choose how we should contact you.'),
    email: optionalEmail,
    telegramUsername: formString,
    phone: formString,
    participants: z.number().min(1, 'Add at least 1 participant.'),
    startDate: formString,
    endDate: formString,
    dateFlexibility: formString,
    notes: formString,
  })
  .superRefine((values, ctx) => {
    if (values.contactPreference === 'whatsapp') {
      const phone = values.phone.replace(/[\s()-]/g, '');
      if (!phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'Add the phone number with its country code.',
        });
      } else if (!/^\+\d{7,15}$/.test(phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'Use international format, for example +1 803 555 0123.',
        });
      }
    }
    if (values.contactPreference === 'telegram' && !values.telegramUsername?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['telegramUsername'],
        message: 'Add your Telegram username.',
      });
    }
    if (values.contactPreference === 'email' && !values.email?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Add your email address.',
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
        message: 'End date should be after the start date.',
      });
    }
  });

type BookingDetailsValues = z.infer<typeof bookingDetailsSchema>;

export function TourDetail({ tour, locale = 'en', relatedTours = [] }: TourDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isRussian = locale === 'ru';
  const text = isRussian
    ? {
        notFound: 'Тур не найден.', back: 'К списку туров', overview: 'Обзор', itinerary: 'Программа', highlights: 'Главное', packing: 'Что взять', info: 'Практическая информация',
        about: 'О туре', details: 'Детали тура', duration: 'Длительность', season: 'Сезон', type: 'Формат тура', difficulty: 'Сложность',
        dayByDay: 'Программа по дням', day: 'День', tourHighlights: 'Главные впечатления', whatToPack: 'Что взять с собой',
        accommodation: 'Размещение', meals: 'Питание', groupSize: 'Размер группы', included: 'Включено', notIncluded: 'Не включено',
        tourInformation: 'Информация о туре', startingFrom: 'Стоимость от', perPerson: 'за человека', request: 'Оставить заявку', bestSeason: 'Лучший сезон',
        routeNotes: 'Что важно знать о маршруте', commonQuestions: 'Частые вопросы', relatedTours: 'Похожие маршруты', viewTour: 'Смотреть тур',
      }
    : {
        notFound: 'Tour not found.', back: 'Back to Tours', overview: 'Overview', itinerary: 'Itinerary', highlights: 'Highlights', packing: 'Packing', info: 'Practical Info',
        about: 'About This Tour', details: 'Tour Details', duration: 'Duration', season: 'Season', type: 'Tour Type', difficulty: 'Difficulty',
        dayByDay: 'Day by Day Itinerary', day: 'Day', tourHighlights: 'Tour Highlights', whatToPack: 'What to Pack',
        accommodation: 'Accommodation', meals: 'Meals', groupSize: 'Group Size', included: "What's Included", notIncluded: 'Not Included',
        tourInformation: 'Tour information', startingFrom: 'Starting from', perPerson: 'per person', request: 'Request This Tour', bestSeason: 'Best Season',
        routeNotes: 'Route notes', commonQuestions: 'Common questions', relatedTours: 'Related routes', viewTour: 'View tour',
      };
  const toursPath = localizedPath('/tours', locale);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('book') === 'true') {
      setShowBookingForm(true);
    }
  }, [location.search]);

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
    <div className="bg-background">
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
                <span>{tour.price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Desktop Tabs */}
            <div className="hidden md:block">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 mb-8 h-auto">
                  <TabsTrigger value="overview">{text.overview}</TabsTrigger>
                  <TabsTrigger value="itinerary">{text.itinerary}</TabsTrigger>
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
                  <h3 className="text-2xl text-foreground mb-6">{text.dayByDay}</h3>
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {tour.itinerary.map((day) => (
                      <AccordionItem key={day.day} value={`day-${day.day}`} className="border rounded-xl px-4 bg-card shadow-sm">
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
                      <h4 className="text-lg text-foreground mb-2">{text.included}</h4>
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
                  <AccordionTrigger>{text.itinerary}</AccordionTrigger>
                  <AccordionContent>
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
                        <h4 className="text-foreground mb-2">{text.included}</h4>
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
              <DeferredMapSection title={tour.title} locations={tour.locations} />
            </div>

            {tour.seoContent && (
              <section className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
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
                      to={localizedPath(`/tours/${relatedTour.id}`, locale)}
                      className="interactive-card rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-xl lg:sticky lg:top-24">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">{text.startingFrom}</p>
                <p className="text-3xl sm:text-4xl text-foreground">{tour.price}</p>
                <p className="text-sm text-muted-foreground">{text.perPerson}</p>
              </div>

              {!showBookingForm ? (
                <Button
                  onClick={() => {
                    if (isRussian) {
                      navigate(`${localizedPath('/feedback', locale)}?tour=${encodeURIComponent(tour.title)}`);
                      return;
                    }
                    setShowBookingForm(true);
                  }}
                  className="w-full btn-micro btn-action mb-4"
                  data-track-event="tour_detail_request_open"
                  data-track-label={tour.title}
                >
                  {text.request}
                </Button>
              ) : (
                <BookingFlow tour={tour} onCancel={() => setShowBookingForm(false)} locale={locale} />
              )}

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
        </div>
      </div>
    </div>
  );
}

function BookingFlow({ tour, onCancel, locale }: { tour: Tour; onCancel: () => void; locale: SiteLocale }) {
  const { user, profile } = useAuth();
  const isRussian = locale === 'ru';
  const [step, setStep] = useState<'details' | 'done'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const detailsForm = useForm<BookingDetailsValues>({
    resolver: zodResolver(bookingDetailsSchema),
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

  const pricePerPerson = useMemo(() => {
    const values = tour.price
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number)
      .filter((value) => Number.isFinite(value) && value > 0);
    return values?.length ? Math.min(...values) : 0;
  }, [tour.price]);

  const participantsCount = Math.max(1, detailsForm.watch('participants') || 1);
  const totalPrice = pricePerPerson * participantsCount;

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

    if (!guestSubmissionBackendEnabled) {
      setErrorMessage('Backend is not configured. Please update your .env file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingPayload = {
        tourId: tour.id,
        tourTitle: tour.title,
        name: details.name,
        countryOfResidence: details.countryOfResidence,
        contactPreference: details.contactPreference,
        email: details.email || '',
        telegramUsername: details.telegramUsername || '',
        phone: details.phone || '',
        participants: participantsCount,
        startDate: details.startDate || '',
        endDate: details.endDate || '',
        dateFlexibility: details.dateFlexibility || '',
        notes: details.notes || '',
        pricePerPerson: tour.price,
        totalPrice: totalPrice ? `$${totalPrice}` : tour.price,
        userId: user?.uid,
      };
      await submitBookingRequest(bookingPayload);
      trackEvent('tour_request_submit_success', {
        label: tour.title,
        participants: participantsCount,
        hasTelegram: Boolean(details.telegramUsername?.trim()),
        hasPhone: Boolean(details.phone?.trim()),
        contactPreference: details.contactPreference,
      });
      appendLocalBooking({ ...bookingPayload, status: 'pending' });
      const existingProfile = loadLocalProfile();
      if (!existingProfile && details.email && details.name) {
        saveLocalProfile({ name: details.name, email: details.email, role: 'buyer' });
      }
      setStep('done');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to submit your booking request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="text-center py-6">
        <Check className="h-12 w-12 text-secondary mx-auto mb-4" />
        <h4 className="text-lg text-foreground mb-2">Thank you!</h4>
        <p className="text-sm text-muted-foreground mb-4">
          {isRussian
            ? 'Заявка отправлена в Go Kyrgyzstan Travel. Мы свяжемся с вами выбранным способом.'
            : 'Your request was sent to Go Kyrgyzstan Travel. We will contact you through the method you chose.'}
        </p>
        <Button onClick={onCancel} variant="outline" size="sm">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {step === 'details' && (
        <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Adilkan"
              {...detailsForm.register('name')}
            />
            {detailsForm.formState.errors.name && (
              <p className="text-xs text-red-600">
                {detailsForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="countryOfResidence">{isRussian ? 'Страна проживания *' : 'Country of residence *'}</Label>
            <Input
              id="countryOfResidence"
              list="booking-country-options"
              autoComplete="country-name"
              placeholder={isRussian ? 'Например, Кыргызстан' : 'For example, Kyrgyzstan'}
              {...detailsForm.register('countryOfResidence')}
            />
            <datalist id="booking-country-options">
              {countryOptions.map((country) => <option key={country.code} value={country.value} />)}
            </datalist>
            <p className="mt-1 text-xs text-muted-foreground">
              {isRussian ? 'Начните вводить название и выберите страну из списка.' : 'Start typing, then choose a country from the list.'}
            </p>
            {detailsForm.formState.errors.countryOfResidence && (
              <p className="text-xs text-red-600">{detailsForm.formState.errors.countryOfResidence.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contactPreference">{isRussian ? 'Как с вами связаться? *' : 'How should we contact you? *'}</Label>
            <select
              id="contactPreference"
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              {...detailsForm.register('contactPreference')}
            >
              <option value="" disabled>{isRussian ? 'Выберите способ связи' : 'Choose a contact method'}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {isRussian ? 'Предпочтительнее WhatsApp или Telegram. По email тоже можно вести переписку.' : 'WhatsApp or Telegram is preferred. Email also works well for written communication.'}
            </p>
            {detailsForm.formState.errors.contactPreference && (
              <p className="text-xs text-red-600">{detailsForm.formState.errors.contactPreference.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="telegramUsername">{isRussian ? 'Имя пользователя Telegram' : 'Telegram username'}</Label>
            <Input
              id="telegramUsername"
              placeholder="@adilkan_dev"
              {...detailsForm.register('telegramUsername')}
            />
          </div>
          <div>
            <Label htmlFor="phone">{isRussian ? 'Номер WhatsApp' : 'WhatsApp number'}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="+1 803 555 0123"
              {...detailsForm.register('phone')}
            />
            {detailsForm.formState.errors.phone && (
              <p className="text-xs text-red-600">
                {detailsForm.formState.errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...detailsForm.register('email')}
            />
            {detailsForm.formState.errors.email && (
              <p className="text-xs text-red-600">
                {detailsForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Preferred Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...detailsForm.register('startDate')}
              />
              {detailsForm.formState.errors.startDate && (
                <p className="text-xs text-red-600">
                  {detailsForm.formState.errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate">Preferred End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...detailsForm.register('endDate')}
              />
              {detailsForm.formState.errors.endDate && (
                <p className="text-xs text-red-600">
                  {detailsForm.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="dateFlexibility">Flexible Timing</Label>
            <Input
              id="dateFlexibility"
              placeholder="Any week in July, weekend only, or not sure yet"
              {...detailsForm.register('dateFlexibility')}
            />
          </div>
          <div>
            <Label htmlFor="participants">Number of Participants</Label>
            <Input
              id="participants"
              type="number"
              min="1"
              {...detailsForm.register('participants', { valueAsNumber: true })}
            />
            {detailsForm.formState.errors.participants && (
              <p className="text-xs text-red-600">
                {detailsForm.formState.errors.participants.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special requests, questions, or preferred contact time..."
              rows={3}
              {...detailsForm.register('notes')}
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="submit"
              className="flex-1 btn-micro btn-action"
              disabled={isSubmitting}
              data-track-event="tour_detail_request_submit"
              data-track-label={tour.title}
            >
              {isSubmitting ? 'Sending...' : 'Send Tour Request'}
            </Button>
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}
