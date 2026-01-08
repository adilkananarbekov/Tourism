import { ArrowLeft, Calendar, Check, CreditCard, MapPin, Tag, Users } from 'lucide-react';
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
import { submitBookingRequest } from '../lib/firestore';
import { appendLocalBooking, loadLocalProfile, saveLocalProfile } from '../lib/localStorage';
import { useAuth } from '../context/AuthContext';
import { firebaseEnabled } from '../lib/firebase';
import { MapSection } from './MapSection';

interface TourDetailProps {
  tour: Tour | null;
}

const bookingDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  phone: z.string().optional(),
  participants: z.coerce.number().min(1, 'Add at least 1 participant.'),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  cardName: z.string().min(1, 'Cardholder name is required.'),
  cardNumber: z.string().min(12, 'Card number looks too short.'),
  expiry: z.string().min(4, 'Expiry date is required.'),
  cvc: z.string().min(3, 'CVC is required.'),
});

type BookingDetailsValues = z.infer<typeof bookingDetailsSchema>;
type PaymentValues = z.infer<typeof paymentSchema>;

export function TourDetail({ tour }: TourDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('book') === 'true') {
      setShowBookingForm(true);
    }
  }, [location.search]);

  if (!tour) {
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-muted-foreground">Tour not found.</p>
        <Button onClick={() => navigate('/tours')} className="mt-4 btn-micro">
          Back to Tours
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative h-[320px] sm:h-[380px] md:h-[500px]">
        <img
          src={tour.image}
          alt={tour.title}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <Button
              onClick={() => navigate('/tours')}
              variant="outline"
              className="mb-6 bg-white/10 hover:bg-white/20 text-white border-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tours
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
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                  <TabsTrigger value="highlights">Highlights</TabsTrigger>
                  <TabsTrigger value="packing">Packing</TabsTrigger>
                  <TabsTrigger value="info">Practical Info</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl text-foreground mb-4">About This Tour</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {tour.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xl text-foreground mb-3">Tour Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                        <div>
                          <p className="text-sm text-muted-foreground/70">Duration</p>
                          <p>{tour.duration}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground/70">Season</p>
                          <p>{tour.season}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground/70">Tour Type</p>
                          <p>{tour.tourType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground/70">Difficulty</p>
                          <p>{tour.practicalInfo.difficulty}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="itinerary">
                  <h3 className="text-2xl text-foreground mb-6">Day by Day Itinerary</h3>
                  <div className="space-y-6">
                    {tour.itinerary.map((day) => (
                      <div key={day.day} className="border-l-4 border-primary pl-6 pb-6">
                        <h4 className="text-lg text-foreground mb-2">
                          Day {day.day}: {day.title}
                        </h4>
                        <p className="text-muted-foreground">{day.description}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="highlights">
                  <h3 className="text-2xl text-foreground mb-6">Tour Highlights</h3>
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
                  <h3 className="text-2xl text-foreground mb-6">What to Pack</h3>
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
                  <h3 className="text-2xl text-foreground mb-6">Practical Information</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg text-foreground mb-2">Accommodation</h4>
                      <p className="text-muted-foreground">{tour.practicalInfo.accommodation}</p>
                    </div>
                    <div>
                      <h4 className="text-lg text-foreground mb-2">Meals</h4>
                      <p className="text-muted-foreground">{tour.practicalInfo.meals}</p>
                    </div>
                    <div>
                      <h4 className="text-lg text-foreground mb-2">Group Size</h4>
                      <p className="text-muted-foreground">{tour.practicalInfo.groupSize}</p>
                    </div>
                    <div>
                      <h4 className="text-lg text-foreground mb-2">What's Included</h4>
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
                      <h4 className="text-lg text-foreground mb-2">Not Included</h4>
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
              <Accordion type="single" collapsible>
                <AccordionItem value="overview">
                  <AccordionTrigger>Overview</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl text-foreground mb-3">About This Tour</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {tour.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg text-foreground mb-3">Tour Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-muted-foreground">
                          <div>
                            <p className="text-sm text-muted-foreground/70">Duration</p>
                            <p>{tour.duration}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground/70">Season</p>
                            <p>{tour.season}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground/70">Tour Type</p>
                            <p>{tour.tourType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground/70">Difficulty</p>
                            <p>{tour.practicalInfo.difficulty}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="itinerary">
                  <AccordionTrigger>Itinerary</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      {tour.itinerary.map((day) => (
                        <div key={day.day} className="border-l-4 border-primary pl-4 pb-4">
                          <h4 className="text-foreground mb-2">
                            Day {day.day}: {day.title}
                          </h4>
                          <p className="text-muted-foreground text-sm">{day.description}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="highlights">
                  <AccordionTrigger>Highlights</AccordionTrigger>
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
                  <AccordionTrigger>Packing List</AccordionTrigger>
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
                  <AccordionTrigger>Practical Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-foreground mb-2">Accommodation</h4>
                        <p className="text-muted-foreground text-sm">{tour.practicalInfo.accommodation}</p>
                      </div>
                      <div>
                        <h4 className="text-foreground mb-2">Meals</h4>
                        <p className="text-muted-foreground text-sm">{tour.practicalInfo.meals}</p>
                      </div>
                      <div>
                        <h4 className="text-foreground mb-2">Group Size</h4>
                        <p className="text-muted-foreground text-sm">{tour.practicalInfo.groupSize}</p>
                      </div>
                      <div>
                        <h4 className="text-foreground mb-2">What's Included</h4>
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
                        <h4 className="text-foreground mb-2">Not Included</h4>
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
              <MapSection title={tour.title} locations={tour.locations} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 border border-border lg:sticky lg:top-24">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">Starting from</p>
                <p className="text-3xl sm:text-4xl text-foreground">{tour.price}</p>
                <p className="text-sm text-muted-foreground">per person</p>
              </div>

              {!showBookingForm ? (
                <Button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full btn-micro bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
                >
                  Book Now
                </Button>
              ) : (
                <BookingFlow tour={tour} onCancel={() => setShowBookingForm(false)} />
              )}

              <div className="border-t border-border pt-6 mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground">Group Size</p>
                    <p className="text-sm text-muted-foreground">{tour.practicalInfo.groupSize}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground">Best Season</p>
                    <p className="text-sm text-muted-foreground">{tour.season}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground">Difficulty</p>
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

function BookingFlow({ tour, onCancel }: { tour: Tour; onCancel: () => void }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [step, setStep] = useState<'details' | 'payment' | 'done'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const detailsForm = useForm<BookingDetailsValues>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || user?.email || '',
      phone: '',
      participants: 2,
      startDate: '',
      endDate: '',
      notes: '',
    },
  });
  const paymentForm = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardName: '',
      cardNumber: '',
      expiry: '',
      cvc: '',
    },
  });

  const pricePerPerson = useMemo(() => {
    const normalized = tour.price.replace(/[^0-9.]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
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

  const handleDetailsSubmit = (_values: BookingDetailsValues) => {
    setErrorMessage(null);

    if (!firebaseEnabled) {
      setErrorMessage('Backend is not configured. Please update your .env file.');
      return;
    }

    if (!user) {
      setErrorMessage('Please sign in to submit a booking request.');
      return;
    }

    setStep('payment');
  };

  const handlePaymentSubmit = async (_values: PaymentValues) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const details = detailsForm.getValues();
      const bookingPayload = {
        tourId: tour.id,
        tourTitle: tour.title,
        name: details.name,
        email: details.email,
        phone: details.phone || '',
        participants: participantsCount,
        startDate: details.startDate,
        endDate: details.endDate,
        notes: details.notes || '',
        pricePerPerson: tour.price,
        totalPrice: totalPrice ? `$${totalPrice}` : tour.price,
        userId: user?.uid,
      };
      await submitBookingRequest(bookingPayload);
      appendLocalBooking({ ...bookingPayload, status: 'pending' });
      const existingProfile = loadLocalProfile();
      if (!existingProfile && bookingData.email && bookingData.name) {
        saveLocalProfile({ name: bookingData.name, email: bookingData.email, role: 'buyer' });
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
          Your booking request has been received and is pending review.
        </p>
        <Button onClick={onCancel} variant="outline" size="sm">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!user && (
        <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
          <p className="text-foreground font-medium mb-2">Sign in required</p>
          <p className="mb-3">
            Create an account to submit a booking request and track status updates.
          </p>
          <Button asChild variant="outline">
            <Link to={`/auth?next=${encodeURIComponent(location.pathname + location.search)}`}>
              Sign In
            </Link>
          </Button>
        </div>
      )}
      {step === 'details' && (
        <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...detailsForm.register('name')}
            />
            {detailsForm.formState.errors.name && (
              <p className="text-xs text-red-600">
                {detailsForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...detailsForm.register('email')}
            />
            {detailsForm.formState.errors.email && (
              <p className="text-xs text-red-600">
                {detailsForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 234 567 8900"
              {...detailsForm.register('phone')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
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
              <Label htmlFor="endDate">End Date</Label>
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
              placeholder="Any special requests or questions..."
              rows={3}
              {...detailsForm.register('notes')}
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="submit"
              className="flex-1 btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Continue to Payment
            </Button>
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      )}

      {step === 'payment' && (
        <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
          <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            <p className="text-foreground font-medium mb-2">Booking Summary</p>
            <div className="space-y-1">
              <p>Tour: {tour.title}</p>
              <p>
                Dates: {detailsForm.watch('startDate')} to {detailsForm.watch('endDate')}
              </p>
              <p>Participants: {participantsCount}</p>
              <p>Price per person: {tour.price}</p>
              <p className="text-foreground font-semibold">Total: ${totalPrice}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 text-secondary" />
            <span>Enter card details to simulate payment (no real charge).</span>
          </div>

          <div>
            <Label htmlFor="cardName">Name on Card</Label>
            <Input
              id="cardName"
              placeholder="John Doe"
              {...paymentForm.register('cardName')}
            />
            {paymentForm.formState.errors.cardName && (
              <p className="text-xs text-red-600">
                {paymentForm.formState.errors.cardName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              {...paymentForm.register('cardNumber')}
            />
            {paymentForm.formState.errors.cardNumber && (
              <p className="text-xs text-red-600">
                {paymentForm.formState.errors.cardNumber.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                {...paymentForm.register('expiry')}
              />
              {paymentForm.formState.errors.expiry && (
                <p className="text-xs text-red-600">
                  {paymentForm.formState.errors.expiry.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                {...paymentForm.register('cvc')}
              />
              {paymentForm.formState.errors.cvc && (
                <p className="text-xs text-red-600">{paymentForm.formState.errors.cvc.message}</p>
              )}
            </div>
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="submit"
              className="flex-1 btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('details')}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
