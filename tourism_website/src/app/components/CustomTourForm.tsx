import { ArrowLeft, ArrowRight, Calendar, Check, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { SEO } from './SEO';
import { submitCustomTourRequest } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import { firebaseEnabled } from '../lib/firebase';

const customTourSchema = z.object({
  groupSize: z.coerce.number().min(1, 'Group size is required.'),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
  startLocation: z.string().min(1),
  endLocation: z.string().min(1),
  sights: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  pace: z.string().min(1),
  accommodation: z.string().min(1),
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone is required.'),
  budget: z.string().optional(),
  specialRequests: z.string().optional(),
});

type CustomTourFormData = z.infer<typeof customTourSchema>;

export function CustomTourForm() {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const totalSteps = 4;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CustomTourFormData>({
    resolver: zodResolver(customTourSchema),
    defaultValues: {
      groupSize: 1,
      startDate: '',
      endDate: '',
      startLocation: 'bishkek',
      endLocation: 'bishkek',
      sights: [],
      activities: [],
      pace: 'moderate',
      accommodation: 'mix',
      name: '',
      email: '',
      phone: '',
      budget: '',
      specialRequests: '',
    },
  });
  const formValues = watch();

  useEffect(() => {
    if (!formValues.name && profile?.name) {
      setValue('name', profile.name, { shouldDirty: false });
    }
    if (!formValues.email && (profile?.email || user?.email)) {
      setValue('email', profile?.email || user?.email || '', { shouldDirty: false });
    }
  }, [
    formValues.email,
    formValues.name,
    profile?.email,
    profile?.name,
    setValue,
    user?.email,
  ]);

  const sightsOptions = [
    { id: 'song-kul', label: 'Song-Kul Lake' },
    { id: 'issyk-kul', label: 'Issyk-Kul Lake' },
    { id: 'ala-archa', label: 'Ala-Archa National Park' },
    { id: 'tash-rabat', label: 'Tash Rabat Caravanserai' },
    { id: 'jeti-oguz', label: 'Jeti-Oguz (Seven Bulls)' },
    { id: 'skazka', label: 'Skazka Canyon' },
    { id: 'burana', label: 'Burana Tower' },
    { id: 'osh', label: 'Osh & Solomon\'s Throne' },
  ];

  const activitiesOptions = [
    { id: 'trekking', label: 'Trekking & Hiking' },
    { id: 'horse-riding', label: 'Horse Riding' },
    { id: 'yurt-stay', label: 'Yurt Stay Experience' },
    { id: 'cultural', label: 'Cultural Activities' },
    { id: 'wildlife', label: 'Wildlife Watching' },
    { id: 'photography', label: 'Photography Tours' },
    { id: 'mountaineering', label: 'Mountaineering' },
    { id: 'cycling', label: 'Mountain Biking' },
  ];

  const handleSightToggle = (sightId: string) => {
    const current = formValues.sights || [];
    const next = current.includes(sightId)
      ? current.filter((id) => id !== sightId)
      : [...current, sightId];
    setValue('sights', next, { shouldDirty: true });
  };

  const handleActivityToggle = (activityId: string) => {
    const current = formValues.activities || [];
    const next = current.includes(activityId)
      ? current.filter((id) => id !== activityId)
      : [...current, activityId];
    setValue('activities', next, { shouldDirty: true });
  };

  const handleNext = async () => {
    setErrorMessage(null);
    const fieldsToValidate: Array<keyof CustomTourFormData> =
      currentStep === 1
        ? ['groupSize', 'startDate', 'endDate']
        : currentStep === 4
          ? ['name', 'email', 'phone']
          : [];
    if (fieldsToValidate.length) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) {
        setErrorMessage('Please complete the required fields before continuing.');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (values: CustomTourFormData) => {
    setErrorMessage(null);

    if (!firebaseEnabled) {
      setErrorMessage('Firebase is not configured. Please update your .env file.');
      return;
    }

    if (!user) {
      setErrorMessage('Please sign in to submit a custom tour request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCustomTourRequest({
        ...values,
        sights: values.sights || [],
        activities: values.activities || [],
        userId: user.uid,
      });
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to submit your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <SEO
          title="Custom Tour Request"
          description="Submit a custom tour request and build a tailored Kyrgyzstan journey."
        />
        <div className="min-h-screen bg-muted py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-md p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="text-2xl sm:text-3xl text-foreground mb-4">
                Custom Tour Request Submitted!
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Thank you for your interest in creating a custom tour. Our team will review your
                requirements and get back to you within 24-48 hours with a personalized itinerary
                and pricing.
              </p>
              <div className="bg-accent rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg text-foreground mb-4">What happens next?</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                    <span>Our tour specialists will design a custom itinerary based on your preferences</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                    <span>We'll send you a detailed proposal with day-by-day activities and pricing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                    <span>You can request modifications until the itinerary perfectly fits your needs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                    <span>Once confirmed, we'll handle all bookings and logistics</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => navigate('/')}
                className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <SEO
        title="Custom Tour"
        description="Design a custom Kyrgyzstan itinerary with your preferred dates and activities."
      />
      <div className="max-w-4xl mx-auto">
        {!user && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-foreground font-medium mb-2">Sign in required</p>
            <p>Please sign in before submitting a custom tour request.</p>
          </div>
            <Button variant="outline" onClick={() => navigate('/auth?next=/custom-tour')}>
              Sign In
            </Button>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/tours')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tours
          </Button>
          <h1 className="text-3xl sm:text-4xl text-foreground mb-4">
            Create Your Custom Tour
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Design your perfect adventure in Kyrgyzstan with our help
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:flex sm:justify-between sm:text-sm">
            <span>Basics</span>
            <span>Destinations</span>
            <span>Preferences</span>
            <span>Contact</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-lg shadow-md p-6 sm:p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl text-foreground mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="groupSize">
                    <Users className="h-4 w-4 inline mr-2" />
                    Group Size
                  </Label>
                  <Input
                    id="groupSize"
                    type="number"
                    min="1"
                    placeholder="e.g., 4"
                    {...register('groupSize', { valueAsNumber: true })}
                  />
                  {errors.groupSize && (
                    <p className="text-xs text-red-600">{errors.groupSize.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="budget">Approximate Budget (USD)</Label>
                  <Input
                    id="budget"
                    placeholder="e.g., $2000 per person"
                    {...register('budget')}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate')}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDate">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register('endDate')}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-red-600">{errors.endDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="startLocation">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Starting Location
                  </Label>
                  <select
                    id="startLocation"
                    className="w-full h-10 px-3 rounded-md border border-border bg-card text-sm"
                    {...register('startLocation')}
                  >
                    <option value="bishkek">Bishkek</option>
                    <option value="osh">Osh</option>
                    <option value="karakol">Karakol</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="endLocation">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Ending Location
                  </Label>
                  <select
                    id="endLocation"
                    className="w-full h-10 px-3 rounded-md border border-border bg-card text-sm"
                    {...register('endLocation')}
                  >
                    <option value="bishkek">Bishkek</option>
                    <option value="osh">Osh</option>
                    <option value="karakol">Karakol</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Destinations & Sights */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl text-foreground mb-2">Destinations & Sights</h2>
                <p className="text-muted-foreground mb-6">Select the places you'd like to visit</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sightsOptions.map((sight) => (
                  <div
                    key={sight.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      (formValues.sights || []).includes(sight.id)
                        ? 'border-primary bg-accent'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSightToggle(sight.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={(formValues.sights || []).includes(sight.id)}
                        onCheckedChange={() => handleSightToggle(sight.id)}
                      />
                      <label className="cursor-pointer flex-1">{sight.label}</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Activities & Preferences */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl text-foreground mb-2">Activities & Preferences</h2>
                <p className="text-muted-foreground mb-6">
                  Choose your preferred activities and tour style
                </p>
              </div>

              <div>
                <h3 className="text-lg text-foreground mb-4">Desired Activities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activitiesOptions.map((activity) => (
                    <div
                      key={activity.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      (formValues.activities || []).includes(activity.id)
                        ? 'border-primary bg-accent'
                        : 'border-border hover:border-primary/50'
                    }`}
                      onClick={() => handleActivityToggle(activity.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={(formValues.activities || []).includes(activity.id)}
                          onCheckedChange={() => handleActivityToggle(activity.id)}
                        />
                        <label className="cursor-pointer flex-1">{activity.label}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg text-foreground mb-4">Tour Pace</h3>
                <RadioGroup
                  value={formValues.pace}
                  onValueChange={(value) => setValue('pace', value, { shouldDirty: true })}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <RadioGroupItem value="relaxed" id="relaxed" />
                      <div className="flex-1">
                        <Label htmlFor="relaxed" className="cursor-pointer">
                          Relaxed
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Easy pace with plenty of rest time and flexibility
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <div className="flex-1">
                        <Label htmlFor="moderate" className="cursor-pointer">
                          Moderate
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Balanced pace with mix of activities and rest
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <RadioGroupItem value="active" id="active" />
                      <div className="flex-1">
                        <Label htmlFor="active" className="cursor-pointer">
                          Active
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Fast-paced with maximum activities and sights
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-lg text-foreground mb-4">Accommodation Type</h3>
                <RadioGroup
                  value={formValues.accommodation}
                  onValueChange={(value) => setValue('accommodation', value, { shouldDirty: true })}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <RadioGroupItem value="hotels" id="hotels" />
                      <div className="flex-1">
                        <Label htmlFor="hotels" className="cursor-pointer">
                          Hotels & Guesthouses
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Comfortable hotels and local guesthouses
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <RadioGroupItem value="mix" id="mix" />
                      <div className="flex-1">
                        <Label htmlFor="mix" className="cursor-pointer">
                          Mix (Hotels + Yurts)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Combination of hotels and traditional yurt stays
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <RadioGroupItem value="camping" id="camping" />
                      <div className="flex-1">
                        <Label htmlFor="camping" className="cursor-pointer">
                          Camping & Yurts
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Authentic outdoor experience with camping and yurts
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 4: Contact Information */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl text-foreground mb-2">Contact Information</h2>
                <p className="text-muted-foreground mb-6">
                  Let us know how to reach you with your custom itinerary
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 8900"
                    {...register('phone')}
                  />
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
                </div>

                <div>
                  <Label htmlFor="specialRequests">
                    Special Requests or Additional Information
                  </Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Any dietary restrictions, accessibility needs, or special interests..."
                    rows={5}
                    {...register('specialRequests')}
                  />
                </div>
              </div>

              <div className="bg-accent rounded-lg p-6 mt-6">
                <h3 className="text-lg text-foreground mb-3">Tour Summary</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Group Size:</strong> {formValues.groupSize || 'Not specified'} people
                  </p>
                  <p>
                    <strong>Dates:</strong> {formValues.startDate || 'Not specified'} to{' '}
                    {formValues.endDate || 'Not specified'}
                  </p>
                  <p>
                    <strong>Route:</strong> {formValues.startLocation} to {formValues.endLocation}
                  </p>
                  <p>
                    <strong>Selected Sights:</strong>{' '}
                    {(formValues.sights || []).length > 0
                      ? `${formValues.sights?.length} locations`
                      : 'None selected'}
                  </p>
                  <p>
                    <strong>Activities:</strong>{' '}
                    {(formValues.activities || []).length > 0
                      ? `${formValues.activities?.length} activities`
                      : 'None selected'}
                  </p>
                  <p>
                    <strong>Pace:</strong> {formValues.pace}
                  </p>
                  <p>
                    <strong>Accommodation:</strong> {formValues.accommodation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t">
            {currentStep > 1 && (
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="flex-1 btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </div>
          {errorMessage && (
            <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}
