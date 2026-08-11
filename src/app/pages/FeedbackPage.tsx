import { Check, Instagram, MessageCircle, Phone, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { SEO } from '../components/SEO';
import { submitCustomTourRequest } from '../lib/dataStore';
import { guestSubmissionBackendEnabled } from '../lib/backend';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/eventTracker';
import { breadcrumbJsonLd } from '../lib/seo';
import { localeAlternates, localizedPath, useSiteLocale } from '../lib/locale';
import { getCountryOptions } from '../lib/countries';
import {
  FOUNDER_NAME,
  INSTAGRAM_URL,
  TELEGRAM_URL,
  TELEGRAM_USERNAME,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../lib/contact';

const formString = z.string();
const requiredFormString = (message: string) => formString.pipe(z.string().trim().min(1, message));
const optionalEmail = formString.pipe(
  z.string().refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Use a valid email or leave it empty.',
  })
);

const contactRequestSchema = z
  .object({
    name: requiredFormString('Name is required.'),
    countryOfResidence: requiredFormString('Choose your country of residence.'),
    contactPreference: requiredFormString('Choose how we should contact you.'),
    telegramUsername: formString,
    phone: formString,
    email: optionalEmail,
    selectedTour: formString,
    groupSize: z.number().min(1, 'Add at least 1 guest.'),
    travelTime: formString,
    message: requiredFormString('Add a short message so we know what you need.'),
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
  });

type ContactRequestValues = z.infer<typeof contactRequestSchema>;

function normalizeTelegramUsername(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function FeedbackPage() {
  const { user } = useAuth();
  const { search } = useLocation();
  const locale = useSiteLocale();
  const isRussian = locale === 'ru';
  const text = isRussian
    ? {
        eyebrow: 'Прямая заявка', title: `Выберите тур, оставьте контакты — ${FOUNDER_NAME} напишет вам лично.`,
        intro: 'Это авторский сайт туров по Кыргызстану. Форма не подтверждает оплату: она отправляет заявку команде, а затем мы уточняем детали в Telegram, WhatsApp или по email.',
        websiteRequest: 'Заявка с сайта', websiteRequestText: 'Данные о туре и контакты поступают владельцу сайта через защищённый сервер.',
        followUp: 'Личная связь', followUpText: `${FOUNDER_NAME} или менеджер связывается с гостем до окончательного подтверждения.`,
        contacts: 'Прямые контакты основателя', browse: 'Сначала посмотреть туры', send: 'Отправить заявку',
        formIntro: 'Укажите страну проживания и выберите удобный способ связи. Предпочтительнее WhatsApp или Telegram; по email также можно вести переписку.', sent: 'Заявка отправлена. Мы свяжемся с вами по выбранному каналу.',
        name: 'Имя *', country: 'Страна проживания *', countryHint: 'Начните вводить название и выберите страну из списка.', contactPreference: 'Как с вами связаться? *', contactHint: 'Предпочтительнее WhatsApp или Telegram. Если выберете email, ответим письмом.',
        whatsapp: 'WhatsApp', telegramOption: 'Telegram', emailOption: 'Email', telegram: 'Имя пользователя Telegram', phone: 'Номер WhatsApp', email: 'Email',
        tour: 'Тур или маршрут', guests: 'Количество гостей', travelTime: 'Даты поездки', message: 'Сообщение *',
        tourPlaceholder: 'Сон-Куль, Ала-Арча, Иссык-Куль…', travelPlaceholder: 'Точные даты, гибкий месяц или пока не определились',
        messagePlaceholder: 'Что хотите увидеть, уровень комфорта, бюджет или вопросы…', sending: 'Отправляем…', submit: 'Отправить в Go Kyrgyzstan Travel',
      }
    : {
        eyebrow: 'Direct request', title: `Choose a tour, leave your contact, and ${FOUNDER_NAME} will write to you directly.`,
        intro: 'This is my author site for Kyrgyzstan tours. The form does not confirm payment automatically. It sends your request to the team, then we contact you in Telegram, WhatsApp, or by email to confirm details.',
        websiteRequest: 'Website request', websiteRequestText: 'Tour and contact details go to the site owner through the configured backend.',
        followUp: 'Personal follow-up', followUpText: `${FOUNDER_NAME} or a manager contacts the guest personally before any final confirmation.`,
        contacts: 'Direct founder contacts', browse: 'Browse tours first', send: 'Send Request',
        formIntro: 'Tell us your country of residence and choose how we should contact you. WhatsApp or Telegram is preferred; email also works well for written communication.', sent: 'Request sent. We will contact you through the method you chose.',
        name: 'Name *', country: 'Country of residence *', countryHint: 'Start typing, then choose a country from the list.', contactPreference: 'How should we contact you? *', contactHint: 'WhatsApp or Telegram is preferred. If you choose email, we will reply by email.',
        whatsapp: 'WhatsApp', telegramOption: 'Telegram', emailOption: 'Email', telegram: 'Telegram username', phone: 'WhatsApp number', email: 'Email',
        tour: 'Tour or route', guests: 'Guests', travelTime: 'Travel time', message: 'Message *',
        tourPlaceholder: 'Song-Kul, Ala-Archa, Issyk-Kul...', travelPlaceholder: 'Exact dates, flexible month, or not sure yet',
        messagePlaceholder: 'Tell me what you want to see, comfort level, budget, or questions...', sending: 'Sending...', submit: 'Send to Go Kyrgyzstan Travel',
      };
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const requestedTour = new URLSearchParams(search).get('tour') || '';
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactRequestValues>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: {
      name: '',
      countryOfResidence: '',
      contactPreference: '',
      telegramUsername: '',
      phone: '',
      email: '',
      selectedTour: requestedTour,
      groupSize: 1,
      travelTime: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactRequestValues) => {
    setErrorMessage(null);
    setSubmitted(false);

    if (!guestSubmissionBackendEnabled) {
      setErrorMessage('Backend is not configured.');
      return;
    }

    try {
      const selectedTour = values.selectedTour.trim();
      const message = values.message.trim();

      await submitCustomTourRequest({
        groupSize: values.groupSize,
        startDate: '',
        endDate: '',
        dateFlexibility: values.travelTime.trim(),
        startLocation: 'bishkek',
        endLocation: 'bishkek',
        sights: selectedTour ? [selectedTour] : [],
        activities: [],
        pace: 'not specified',
        accommodation: 'not specified',
        name: values.name.trim(),
        countryOfResidence: values.countryOfResidence.trim(),
        contactPreference: values.contactPreference.trim(),
        email: values.email.trim(),
        telegramUsername: normalizeTelegramUsername(values.telegramUsername),
        phone: values.phone.trim(),
        budget: '',
        specialRequests: [
          selectedTour ? `Selected tour: ${selectedTour}` : '',
          values.travelTime.trim() ? `Travel time: ${values.travelTime.trim()}` : '',
          message ? `Guest message: ${message}` : '',
        ].filter(Boolean).join('\n'),
        userId: user?.uid,
      });

      trackEvent('request_form_submit_success', {
        label: selectedTour || 'Direct request',
        hasTelegram: Boolean(values.telegramUsername.trim()),
        hasPhone: Boolean(values.phone.trim()),
        contactPreference: values.contactPreference,
        hasTravelTime: Boolean(values.travelTime.trim()),
      });
      reset();
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send request.');
    }
  };

  return (
    <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
      <SEO
        title={isRussian ? 'Заявка на тур по Кыргызстану' : 'Request a Kyrgyzstan Tour'}
        description={isRussian ? 'Оставьте заявку на частный или групповой тур по Кыргызстану: даты, размер группы и контакты для личной связи.' : 'Request a private Kyrgyzstan tour or small-group trip. Send dates, group size, and contact details for personal follow-up from Go Kyrgyzstan Travel.'}
        path={localizedPath('/feedback', locale)}
        language={locale}
        alternates={localeAlternates('/feedback')}
        jsonLd={breadcrumbJsonLd([
          { name: isRussian ? 'Главная' : 'Home', path: localizedPath('/', locale) },
          { name: isRussian ? 'Заявка на тур' : 'Request a Tour', path: localizedPath('/feedback', locale) },
        ])}
      />
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              {text.eyebrow}
            </p>
            <h1 className="mb-5 text-3xl text-foreground sm:text-4xl lg:text-5xl">
              {text.title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {text.intro}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-4">
              <Send className="mb-3 h-5 w-5 text-secondary" />
              <h2 className="mb-2 text-lg text-foreground">{text.websiteRequest}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {text.websiteRequestText}
              </p>
            </div>
            <div className="rounded-md border border-border bg-card p-4">
              <MessageCircle className="mb-3 h-5 w-5 text-secondary" />
              <h2 className="mb-2 text-lg text-foreground">{text.followUp}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {text.followUpText}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="mb-3 text-lg text-foreground">{text.contacts}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-accent"
                data-track-event="request_page_telegram_click"
                data-track-label={TELEGRAM_USERNAME}
              >
                <MessageCircle className="h-4 w-4" />
                Telegram
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-accent"
                data-track-event="request_page_whatsapp_click"
                data-track-label={WHATSAPP_DISPLAY}
              >
                <Phone className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-accent"
                data-track-event="request_page_instagram_click"
                data-track-label="jakypbekovv1"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>

          <Button asChild variant="outline" className="btn-micro btn-action-outline">
            <Link
              to={localizedPath('/tours', locale)}
              data-track-event="request_page_browse_tours_click"
              data-track-label="Request page browse tours"
            >
              {text.browse}
            </Link>
          </Button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-md border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 className="text-2xl text-foreground">{text.send}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {text.formIntro}
            </p>
          </div>

          {submitted && (
            <div
              id="feedback-form-success"
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 rounded-md border border-secondary/30 bg-secondary/10 p-4 text-sm text-foreground"
            >
              <Check className="mt-0.5 h-5 w-5 text-secondary" />
              <p>
                {text.sent}
              </p>
            </div>
          )}
          {errorMessage && (
            <p id="feedback-form-error" role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <div>
            <Label htmlFor="name">{text.name}</Label>
            <Input
              id="name"
              placeholder="Adilkan"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'feedback-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="feedback-name-error" className="text-xs text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="countryOfResidence">{text.country}</Label>
            <Input
              id="countryOfResidence"
              list="country-options"
              autoComplete="country-name"
              placeholder={isRussian ? 'Например, Кыргызстан' : 'For example, Kyrgyzstan'}
              aria-invalid={Boolean(errors.countryOfResidence)}
              aria-describedby={errors.countryOfResidence
                ? 'feedback-country-hint feedback-country-error'
                : 'feedback-country-hint'}
              {...register('countryOfResidence')}
            />
            <datalist id="country-options">
              {countryOptions.map((country) => <option key={country.code} value={country.value} />)}
            </datalist>
            <p id="feedback-country-hint" className="mt-1 text-xs text-muted-foreground">{text.countryHint}</p>
            {errors.countryOfResidence && (
              <p id="feedback-country-error" className="text-xs text-red-600">
                {errors.countryOfResidence.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="contactPreference">{text.contactPreference}</Label>
            <select
              id="contactPreference"
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              aria-invalid={Boolean(errors.contactPreference)}
              aria-describedby={errors.contactPreference
                ? 'feedback-contact-hint feedback-contact-error'
                : 'feedback-contact-hint'}
              {...register('contactPreference')}
            >
              <option value="" disabled>{isRussian ? 'Выберите способ связи' : 'Choose a contact method'}</option>
              <option value="whatsapp">{text.whatsapp}</option>
              <option value="telegram">{text.telegramOption}</option>
              <option value="email">{text.emailOption}</option>
            </select>
            <p id="feedback-contact-hint" className="mt-1 text-xs text-muted-foreground">{text.contactHint}</p>
            {errors.contactPreference && (
              <p id="feedback-contact-error" className="text-xs text-red-600">
                {errors.contactPreference.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="telegramUsername">{text.telegram}</Label>
              <Input
                id="telegramUsername"
                placeholder="@username"
                aria-invalid={Boolean(errors.telegramUsername)}
                aria-describedby={errors.telegramUsername ? 'feedback-telegram-error' : undefined}
                {...register('telegramUsername')}
              />
              {errors.telegramUsername && (
                <p id="feedback-telegram-error" className="text-xs text-red-600">
                  {errors.telegramUsername.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">{text.phone}</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+1 803 555 0123"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'feedback-phone-error' : undefined}
                {...register('phone')}
              />
              {errors.phone && (
                <p id="feedback-phone-error" className="text-xs text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">{text.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'feedback-email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="feedback-email-error" className="text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="selectedTour">{text.tour}</Label>
              <Input
                id="selectedTour"
                placeholder={text.tourPlaceholder}
                {...register('selectedTour')}
              />
            </div>
            <div>
              <Label htmlFor="groupSize">{text.guests}</Label>
              <Input
                id="groupSize"
                type="number"
                min="1"
                aria-invalid={Boolean(errors.groupSize)}
                aria-describedby={errors.groupSize ? 'feedback-group-size-error' : undefined}
                {...register('groupSize', { valueAsNumber: true })}
              />
              {errors.groupSize && (
                <p id="feedback-group-size-error" className="text-xs text-red-600">
                  {errors.groupSize.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="travelTime">{text.travelTime}</Label>
            <Input
              id="travelTime"
              placeholder={text.travelPlaceholder}
              {...register('travelTime')}
            />
          </div>

          <div>
            <Label htmlFor="message">{text.message}</Label>
            <Textarea
              id="message"
              rows={4}
              placeholder={text.messagePlaceholder}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'feedback-message-error' : undefined}
              {...register('message')}
            />
            {errors.message && (
              <p id="feedback-message-error" className="text-xs text-red-600">
                {errors.message.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full btn-micro btn-action"
            disabled={isSubmitting}
            data-track-event="request_form_submit_click"
            data-track-label="Direct request form"
          >
            {isSubmitting ? text.sending : text.submit}
          </Button>
        </form>
      </div>
    </section>
  );
}
