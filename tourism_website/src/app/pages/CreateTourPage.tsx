import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { SEO } from '../components/SEO';
import { submitSellerTour } from '../lib/firestore';
import { appendLocalSubmission, loadLocalProfile, saveLocalProfile } from '../lib/localStorage';
import { useAuth } from '../context/AuthContext';
import { firebaseEnabled } from '../lib/firebase';
import { uploadImage } from '../lib/storage';

const sellerTourSchema = z.object({
  title: z.string().min(1, 'Tour title is required.'),
  duration: z.string().min(1, 'Duration is required.'),
  price: z.string().min(1, 'Price is required.'),
  season: z.string().optional(),
  tourType: z.string().optional(),
  description: z.string().optional(),
  highlights: z.string().optional(),
  itinerary: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  contactName: z.string().min(1, 'Contact name is required.'),
  contactEmail: z.string().email('Valid email required.'),
});

type SellerTourFormData = z.infer<typeof sellerTourSchema>;

const INITIAL_DATA: SellerTourFormData = {
  title: '',
  duration: '',
  price: '',
  season: '',
  tourType: '',
  description: '',
  highlights: '',
  itinerary: '',
  image: '',
  contactName: '',
  contactEmail: '',
};

export function CreateTourPage() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const totalSteps = 4;
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<SellerTourFormData>({
    resolver: zodResolver(sellerTourSchema),
    defaultValues: INITIAL_DATA,
  });
  const formValues = watch();

  useEffect(() => {
    if (!firebaseEnabled) {
      return;
    }
    if (!formValues.contactName && profile?.name) {
      setValue('contactName', profile.name, { shouldDirty: false });
    }
    if (!formValues.contactEmail && (profile?.email || user?.email)) {
      setValue('contactEmail', profile?.email || user?.email || '', { shouldDirty: false });
    }
  }, [
    formValues.contactEmail,
    formValues.contactName,
    profile?.email,
    profile?.name,
    setValue,
    user?.email,
  ]);

  const handleNext = async () => {
    setErrorMessage(null);
    const fieldsToValidate: Array<keyof SellerTourFormData> =
      step === 1 ? ['title', 'duration', 'price'] : [];
    if (fieldsToValidate.length) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) {
        setErrorMessage('Please complete the required fields before continuing.');
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (values: SellerTourFormData) => {
    setErrorMessage(null);

    setIsSubmitting(true);
    try {
      let imageUrl = values.image || '';
      if (imageFile) {
        if (!firebaseEnabled) {
          throw new Error('Firebase Storage is not configured.');
        }
        imageUrl = await uploadImage(imageFile, 'seller-submissions');
      }

      if (firebaseEnabled) {
        if (!user) {
          throw new Error('Please sign in to submit a tour.');
        }
        await submitSellerTour({
          ...values,
          image: imageUrl,
          highlights: (values.highlights || '').split('\n').filter(Boolean),
          itinerary: (values.itinerary || '').split('\n').filter(Boolean),
          ownerId: user.uid,
        });
      }
      appendLocalSubmission({
        ...values,
        image: imageUrl,
        highlights: (values.highlights || '').split('\n').filter(Boolean),
        itinerary: (values.itinerary || '').split('\n').filter(Boolean),
      });
      const existingProfile = loadLocalProfile();
      if (!existingProfile && values.contactEmail && values.contactName) {
        saveLocalProfile({
          name: values.contactName,
          email: values.contactEmail,
          role: 'seller',
        });
      }
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to submit your tour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <SEO
          title="Submit Tour"
          description="Submit a tour proposal to the Kyrgyz Riders marketplace."
        />
        <div className="min-h-[70vh] flex items-center justify-center px-4 bg-muted">
          <div className="bg-card rounded-lg shadow-md p-6 sm:p-8 max-w-lg text-center">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-2xl sm:text-3xl text-foreground mb-4">Tour Submitted</h1>
            <p className="text-muted-foreground mb-6">
              Thanks for sharing your experience. Your tour is pending admin approval.
            </p>
            <Button
              onClick={() => navigate('/tours')}
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Back to Tours
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
      <SEO
        title="Submit Tour"
        description="Create a tour listing and submit it for admin approval."
      />
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl sm:text-4xl text-foreground mb-3">Submit a Tour</h1>
          <p className="text-muted-foreground">
            Share your tour idea with our team. Approved submissions go live after review.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-lg shadow-md p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <div className="flex-1 h-1 bg-muted">
              <div
                className="h-1 bg-primary"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Tour Title</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Alpine Horse Trek"
                  required
                />
                {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  {...register('duration')}
                  placeholder="e.g., 5 days"
                  required
                />
                {errors.duration && (
                  <p className="text-xs text-red-600">{errors.duration.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="price">Price per Person</Label>
                <Input
                  id="price"
                  {...register('price')}
                  placeholder="$950"
                  required
                />
                {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
              </div>
              <div>
                <Label htmlFor="season">Best Season</Label>
                <Input
                  id="season"
                  {...register('season')}
                  placeholder="Spring - Autumn"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="tourType">Tour Type</Label>
                <Input
                  id="tourType"
                  {...register('tourType')}
                  placeholder="Trekking, cultural, horse riding..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  placeholder="Describe the experience and key highlights."
                />
              </div>
              <div>
                <Label htmlFor="highlights">Highlights (one per line)</Label>
                <Textarea
                  id="highlights"
                  {...register('highlights')}
                  rows={4}
                  placeholder="Camp at Song Kol\nMeet nomadic families\nHorseback riding"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label htmlFor="itinerary">Itinerary (one line per day)</Label>
              <Textarea
                id="itinerary"
                {...register('itinerary')}
                rows={6}
                placeholder="Day 1: Arrival and city tour\nDay 2: Mountain hike\nDay 3: Yurt stay"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="image">Cover Image URL</Label>
                <Input
                  id="image"
                  {...register('image')}
                  placeholder="https://..."
                />
                {errors.image && <p className="text-xs text-red-600">{errors.image.message}</p>}
              </div>
              <div>
                <Label htmlFor="imageFile">Or Upload an Image</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded files will replace the URL above when submitted.
                </p>
              </div>
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  {...register('contactName')}
                  placeholder="Your full name"
                  required
                />
                {errors.contactName && (
                  <p className="text-xs text-red-600">{errors.contactName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail')}
                  placeholder="you@example.com"
                  required
                />
                {errors.contactEmail && (
                  <p className="text-xs text-red-600">{errors.contactEmail.message}</p>
                )}
              </div>
            </div>
          )}

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < totalSteps ? (
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
                disabled={isSubmitting}
                className="flex-1 btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Tour'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
