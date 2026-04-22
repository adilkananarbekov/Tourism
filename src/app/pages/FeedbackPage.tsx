import { Check, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { SEO } from '../components/SEO';
import { submitCustomTourRequest } from '../lib/firestore';
import { guestSubmissionBackendEnabled } from '../lib/backend';

const formString = z.preprocess((value) => (value == null ? '' : value), z.string());
const requiredFormString = (message: string) => formString.pipe(z.string().trim().min(1, message));
const optionalEmail = formString.pipe(
  z.string().refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Use a valid email or leave it empty.',
  })
);

const contactRequestSchema = z
  .object({
    name: requiredFormString('Name is required.'),
    telegramUsername: formString,
    phone: formString,
    email: optionalEmail,
    selectedTour: formString,
    groupSize: z.coerce.number().min(1, 'Add at least 1 guest.'),
    travelTime: formString,
    message: formString,
  })
  .superRefine((values, ctx) => {
    if (!values.telegramUsername?.trim() && !values.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Add a Telegram username or phone number.',
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactRequestValues>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: {
      name: '',
      telegramUsername: '',
      phone: '',
      email: '',
      selectedTour: '',
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
        email: values.email.trim(),
        telegramUsername: normalizeTelegramUsername(values.telegramUsername),
        phone: values.phone.trim(),
        budget: '',
        specialRequests: [
          selectedTour ? `Selected tour: ${selectedTour}` : '',
          values.travelTime.trim() ? `Travel time: ${values.travelTime.trim()}` : '',
          message ? `Guest message: ${message}` : '',
        ].filter(Boolean).join('\n'),
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
        title="Send a Tour Request"
        description="Choose a tour or send a custom request. Kyrgyz Riders will contact you directly by Telegram or phone."
      />
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">
              Direct request
            </p>
            <h1 className="mb-5 text-3xl text-foreground sm:text-4xl lg:text-5xl">
              Choose a tour, leave your contact, and I will write to you directly.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              This is my author site for Kyrgyzstan tours. The form does not confirm payment
              automatically. It sends your request to me, then I or my managers contact you in
              Telegram, WhatsApp, or by phone to confirm details.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-4">
              <Send className="mb-3 h-5 w-5 text-secondary" />
              <h2 className="mb-2 text-lg text-foreground">Website request</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Tour and contact details go to the owner Telegram chat through Supabase.
              </p>
            </div>
            <div className="rounded-md border border-border bg-card p-4">
              <MessageCircle className="mb-3 h-5 w-5 text-secondary" />
              <h2 className="mb-2 text-lg text-foreground">Personal follow-up</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                A manager contacts the guest personally before any final confirmation.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" className="btn-micro border-primary text-primary">
            <Link to="/tours">Browse tours first</Link>
          </Button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-md border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 className="text-2xl text-foreground">Send Request</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Surname is optional. Telegram username or phone number is enough.
            </p>
          </div>

          {submitted && (
            <div className="flex items-start gap-3 rounded-md border border-secondary/30 bg-secondary/10 p-4 text-sm text-foreground">
              <Check className="mt-0.5 h-5 w-5 text-secondary" />
              <p>
                Request sent. I or my managers will contact you using the details you provided.
              </p>
            </div>
          )}
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Adilkan" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="telegramUsername">Telegram Username</Label>
              <Input
                id="telegramUsername"
                placeholder="@username"
                {...register('telegramUsername')}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone or WhatsApp</Label>
              <Input
                id="phone"
                placeholder="+996..., 0..., or any format"
                {...register('phone')}
              />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="selectedTour">Tour or route</Label>
              <Input
                id="selectedTour"
                placeholder="Song-Kul, Ala-Archa, custom route..."
                {...register('selectedTour')}
              />
            </div>
            <div>
              <Label htmlFor="groupSize">Guests</Label>
              <Input
                id="groupSize"
                type="number"
                min="1"
                {...register('groupSize', { valueAsNumber: true })}
              />
              {errors.groupSize && (
                <p className="text-xs text-red-600">{errors.groupSize.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="travelTime">Travel time</Label>
            <Input
              id="travelTime"
              placeholder="Exact dates, flexible month, or not sure yet"
              {...register('travelTime')}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={4}
              placeholder="Tell me what you want to see, comfort level, budget, or questions..."
              {...register('message')}
            />
          </div>

          <Button
            type="submit"
            className="w-full btn-micro bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send to Kyrgyz Riders'}
          </Button>
        </form>
      </div>
    </section>
  );
}
