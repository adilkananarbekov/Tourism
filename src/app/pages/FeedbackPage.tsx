import { Check, Instagram, MessageCircle, Phone, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useForm, type FieldErrors } from 'react-hook-form';
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
  INSTAGRAM_URL,
  TELEGRAM_URL,
  TELEGRAM_USERNAME,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../lib/contact';

const contactRequestSchema = (isRussian: boolean) => z
  .object({
    name: z.string().trim().min(1, isRussian ? 'Укажите ваше имя.' : 'Enter your name.')
      .max(160, isRussian ? 'Используйте не более 160 символов.' : 'Use no more than 160 characters.'),
    countryOfResidence: z.string().trim().min(1, isRussian ? 'Укажите страну проживания.' : 'Enter your country of residence.'),
    contactPreference: z.string().refine((value) => ['whatsapp', 'telegram', 'email'].includes(value),
      isRussian ? 'Выберите способ связи.' : 'Choose a contact method.'),
    telegramUsername: z.string(),
    phone: z.string(),
    email: z.string(),
    selectedTour: z.string().max(160, isRussian ? 'Используйте не более 160 символов.' : 'Use no more than 160 characters.'),
    groupSize: z.number({ error: isRussian ? 'Укажите число гостей от 1 до 100.' : 'Enter the number of guests, from 1 to 100.' })
      .int(isRussian ? 'Укажите целое число гостей.' : 'Use a whole number of guests.')
      .min(1, isRussian ? 'Укажите хотя бы 1 гостя.' : 'Add at least 1 guest.')
      .max(100, isRussian ? 'Для группы больше 100 человек напишите нам напрямую.' : 'For more than 100 guests, please contact us directly.'),
    travelTime: z.string().max(240, isRussian ? 'Используйте не более 240 символов.' : 'Use no more than 240 characters.'),
    message: z.string().max(2000, isRussian ? 'Используйте не более 2000 символов.' : 'Use no more than 2,000 characters.'),
  })
  .superRefine((values, ctx) => {
    if (values.contactPreference === 'whatsapp') {
      const phone = values.phone.replace(/[\s()-]/g, '');
      if (!phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: isRussian ? 'Укажите номер WhatsApp с кодом страны.' : 'Add your WhatsApp number with its country code.',
        });
      } else if (!/^\+\d{7,15}$/.test(phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: isRussian ? 'Используйте международный формат, например +996 700 123 456.' : 'Use international format, for example +1 803 555 0123.',
        });
      }
    }
    if (values.contactPreference === 'telegram') {
      const username = values.telegramUsername.trim();
      if (!/^@?[A-Za-z0-9_]{1,32}$/.test(username)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['telegramUsername'],
          message: isRussian ? 'Укажите имя пользователя, например @username, без пробелов.' : 'Enter your username, for example @username, without spaces.',
        });
      }
    }
    if (values.contactPreference === 'email' && !z.string().email().safeParse(values.email.trim()).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: isRussian ? 'Укажите корректный email, например you@example.com.' : 'Enter a valid email address, for example you@example.com.',
      });
    }
  });

type ContactRequestValues = z.infer<ReturnType<typeof contactRequestSchema>>;

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
        eyebrow: 'Планируем вместе', title: 'Ваша поездка по Кыргызстану',
        intro: 'Расскажите о датах, компании и местах, которые хотите увидеть. Инсан или наша местная команда помогут подобрать маршрут и рассчитать стоимость.',
        websiteRequest: '1. Ваши пожелания', websiteRequestText: 'Выберите один удобный канал связи. Если маршрут или даты пока не определены, это нормально.',
        followUp: '2. Программа и расчёт', followUpText: 'Обсудим поездку в переписке: маршрут, итоговую цену, включённые услуги и дополнительные расходы.',
        confirmation: '3. Подтверждение', confirmationText: 'До подтверждения согласуем письменно программу, оплату и условия отмены. Отправка этой формы не списывает деньги и не бронирует места.',
        contacts: 'Прямые контакты основателя', browse: 'Сначала посмотреть туры', send: 'Отправить заявку',
        formIntro: 'Нужен только один контакт для переписки. Поля со звёздочкой обязательны; маршрут и даты можно уточнить позже.',
        name: 'Имя *', country: 'Страна проживания *', countryHint: 'Начните вводить название страны. Можно выбрать из списка или вписать свою.', contactPreference: 'Как с вами связаться? *', contactHint: 'Предпочтительнее WhatsApp или Telegram. Email тоже подходит. Мы общаемся в переписке, без международных звонков.',
        whatsapp: 'WhatsApp', telegramOption: 'Telegram', emailOption: 'Email', telegram: 'Имя пользователя Telegram *', phone: 'Номер WhatsApp *', email: 'Email *',
        tour: 'Тур или маршрут — необязательно', guests: 'Количество гостей', travelTime: 'Даты поездки — необязательно', message: 'Вопросы и пожелания — необязательно',
        tourPlaceholder: 'Сон-Куль, Ала-Арча, Иссык-Куль…', travelPlaceholder: 'Точные даты, гибкий месяц или пока не определились',
        messagePlaceholder: 'Что хотите увидеть, уровень комфорта, бюджет или вопросы…', sending: 'Отправляем…', submit: 'Запросить маршрут и стоимость',
        legal: 'Как проходит бронирование и согласование условий', privacy: 'Как мы используем ваши данные',
        noPayment: 'Это запрос, не оплата и не подтверждённая бронь.',
        requestError: 'Не удалось подтвердить отправку. Проверьте соединение и попробуйте ещё раз или напишите нам в WhatsApp / Telegram.',
      }
    : {
        eyebrow: 'Let’s plan together', title: 'Your trip to Kyrgyzstan',
        intro: 'Tell us when you would like to travel, who is coming, and what you want to see. Insan or our local team will help shape your route and prepare a quote.',
        websiteRequest: '1. Your travel ideas', websiteRequestText: 'Choose one way for us to reach you. It is fine if you have not decided on a route or dates yet.',
        followUp: '2. Itinerary and quote', followUpText: 'We discuss your route in writing, including the total price, included services, and any additional costs.',
        confirmation: '3. Confirmation', confirmationText: 'We agree the itinerary, payment, and cancellation terms in writing before confirmation. This form does not take payment or reserve places.',
        contacts: 'Direct founder contacts', browse: 'Browse tours first', send: 'Send Request',
        formIntro: 'We only need one contact for a written reply. Fields marked * are required; your route and dates can be decided later.',
        name: 'Name *', country: 'Country of residence *', countryHint: 'Start typing your country. Choose from the list or enter your own.', contactPreference: 'How should we contact you? *', contactHint: 'WhatsApp or Telegram is preferred; email works too. We reply in writing, without international calls.',
        whatsapp: 'WhatsApp', telegramOption: 'Telegram', emailOption: 'Email', telegram: 'Telegram username *', phone: 'WhatsApp number *', email: 'Email *',
        tour: 'Tour or route — optional', guests: 'Guests', travelTime: 'Travel time — optional', message: 'Questions and preferences — optional',
        tourPlaceholder: 'Song-Kul, Ala-Archa, Issyk-Kul...', travelPlaceholder: 'Exact dates, flexible month, or not sure yet',
        messagePlaceholder: 'What you would like to see, comfort level, budget, or questions…', sending: 'Sending…', submit: 'Request an itinerary and quote',
        legal: 'How booking and agreeing the terms work', privacy: 'How we use your details',
        noPayment: 'An enquiry only — no payment or confirmed reservation.',
        requestError: 'We could not confirm that your request was sent. Check your connection and try again, or message us on WhatsApp / Telegram.',
      };
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedVia, setSubmittedVia] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!submittedVia && !errorMessage) return;
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [submittedVia, errorMessage]);
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const requestedTour = new URLSearchParams(search).get('tour') || '';
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactRequestValues>({
    resolver: zodResolver(contactRequestSchema(isRussian)),
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
  const contactPreference = watch('contactPreference');

  const onInvalid = (invalidFields: FieldErrors<ContactRequestValues>) => {
    setSubmittedVia('');
    setErrorMessage(null);
    const fields = Object.keys(invalidFields).filter((field) => [
      'name', 'countryOfResidence', 'contactPreference', 'telegramUsername', 'phone',
      'email', 'selectedTour', 'groupSize', 'travelTime', 'message',
    ].includes(field)).sort().join(',');
    trackEvent('request_form_validation_error', { fields });
  };

  const onSubmit = async (values: ContactRequestValues) => {
    setErrorMessage(null);
    setSubmittedVia('');
    trackEvent('request_form_valid_attempt');

    if (!guestSubmissionBackendEnabled) {
      setErrorMessage(text.requestError);
      trackEvent('request_form_submit_error', { code: 'service_unavailable' });
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
        email: values.contactPreference === 'email' ? values.email.trim() : '',
        telegramUsername: values.contactPreference === 'telegram' ? normalizeTelegramUsername(values.telegramUsername) : '',
        phone: values.contactPreference === 'whatsapp' ? values.phone.trim() : '',
        budget: '',
        specialRequests: [
          selectedTour ? `Selected tour: ${selectedTour}` : '',
          values.travelTime.trim() ? `Travel time: ${values.travelTime.trim()}` : '',
          message ? `Guest message: ${message}` : '',
        ].filter(Boolean).join('\n'),
        userId: user?.uid,
      });

      trackEvent('request_form_submit_success', {
        label: 'Direct request form',
      });
      reset();
      setSubmittedVia(values.contactPreference === 'email' ? 'email' : values.contactPreference === 'telegram' ? 'Telegram' : 'WhatsApp');
    } catch {
      setErrorMessage(text.requestError);
      trackEvent('request_form_submit_error', { code: 'request_failed' });
    }
  };

  return (
    <section className="request-editorial-page bg-background px-4 py-16 sm:px-6 lg:px-8">
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
      <div className="mx-auto grid max-w-6xl gap-6 sm:gap-10 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="self-start lg:col-start-1 lg:row-start-1">
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

        </div>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="self-start space-y-5 rounded-md border border-border bg-card p-5 shadow-sm sm:p-6 lg:col-start-2 lg:row-start-1 lg:row-span-2"
        >
          <div>
            <h2 className="text-2xl text-foreground">{text.send}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {text.formIntro}
            </p>
          </div>

          {submittedVia && (
            <div
              id="feedback-form-success"
              ref={resultRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 rounded-md border border-secondary/30 bg-secondary/10 p-4 text-sm text-foreground"
            >
              <Check className="mt-0.5 h-5 w-5 text-secondary" />
              <p>
                {isRussian
                  ? `Заявка отправлена. Мы ответим вам ${submittedVia === 'email' ? 'по email' : `в ${submittedVia}`} и обсудим маршрут и стоимость. Бронь подтверждается отдельно после согласования условий.`
                  : `Request sent. We will reply ${submittedVia === 'email' ? 'by email' : `on ${submittedVia}`} to discuss your itinerary and quote. Your booking is confirmed separately after the terms are agreed.`}
              </p>
            </div>
          )}
          {errorMessage && (
            <div id="feedback-form-error" ref={resultRef} tabIndex={-1} role="alert" className="space-y-2 text-sm text-red-600">
              <p>{errorMessage}</p>
              <p className="flex gap-4">
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">WhatsApp</a>
                <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">Telegram</a>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="name">{text.name}</Label>
            <Input
              id="name"
              autoComplete="name"
              maxLength={160}
              aria-required="true"
              placeholder={isRussian ? 'Ваше имя' : 'Your name'}
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
              maxLength={240}
              aria-required="true"
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
              aria-required="true"
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

          {contactPreference === 'telegram' && (
            <div>
              <Label htmlFor="telegramUsername">{text.telegram}</Label>
              <Input
                id="telegramUsername"
                placeholder="@username"
                maxLength={33}
                autoCapitalize="none"
                spellCheck={false}
                aria-required="true"
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
          )}
          {contactPreference === 'whatsapp' && (
            <div>
              <Label htmlFor="phone">{text.phone}</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={80}
                aria-required="true"
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
          )}

          {contactPreference === 'email' && (<div>
            <Label htmlFor="email">{text.email}</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={240}
              aria-required="true"
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
          </div>)}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="selectedTour">{text.tour}</Label>
              <Input
                id="selectedTour"
                maxLength={160}
                placeholder={text.tourPlaceholder}
                aria-invalid={Boolean(errors.selectedTour)}
                aria-describedby={errors.selectedTour ? 'feedback-tour-error' : undefined}
                {...register('selectedTour')}
              />
              {errors.selectedTour && <p id="feedback-tour-error" className="text-xs text-red-600">{errors.selectedTour.message}</p>}
            </div>
            <div>
              <Label htmlFor="groupSize">{text.guests}</Label>
              <Input
                id="groupSize"
                type="number"
                min="1"
                max="100"
                step="1"
                inputMode="numeric"
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
              maxLength={240}
              placeholder={text.travelPlaceholder}
              aria-invalid={Boolean(errors.travelTime)}
              aria-describedby={errors.travelTime ? 'feedback-travel-time-error' : undefined}
              {...register('travelTime')}
            />
            {errors.travelTime && <p id="feedback-travel-time-error" className="text-xs text-red-600">{errors.travelTime.message}</p>}
          </div>

          <div>
            <Label htmlFor="message">{text.message}</Label>
            <Textarea
              id="message"
              rows={4}
              maxLength={2000}
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
          <div className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>{text.noPayment}</p>
            <p>
              <Link className="underline underline-offset-4 hover:text-foreground" to={`${localizedPath('/terms-of-use', locale)}#booking`}>
                {text.legal}
              </Link>
              {' · '}
              <Link className="underline underline-offset-4 hover:text-foreground" to={localizedPath('/privacy-policy', locale)}>
                {text.privacy}
              </Link>
            </p>
          </div>
        </form>

        <div className="self-start space-y-6 lg:col-start-1 lg:row-start-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-4">
              <Send className="mb-3 h-5 w-5 text-secondary" />
              <h2 className="mb-2 text-lg text-foreground">{text.websiteRequest}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{text.websiteRequestText}</p>
            </div>
            <div className="rounded-md border border-border bg-card p-4">
              <MessageCircle className="mb-3 h-5 w-5 text-secondary" />
              <h2 className="mb-2 text-lg text-foreground">{text.followUp}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{text.followUpText}</p>
            </div>
            <div className="rounded-md border border-border bg-card p-4 sm:col-span-2">
              <Check className="mb-3 h-5 w-5 text-secondary" />
              <h2 className="mb-2 text-lg text-foreground">{text.confirmation}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{text.confirmationText}</p>
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
      </div>
    </section>
  );
}
