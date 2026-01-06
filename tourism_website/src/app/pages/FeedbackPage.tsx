import { Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { SEO } from '../components/SEO';
import { fetchFeedbackEntries, submitFeedback } from '../lib/firestore';

interface FeedbackEntry {
  id: string;
  name: string;
  rating: number;
  comments: string;
  createdAt?: string;
  adminResponse?: string;
}

const feedbackSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  rating: z.number().min(1).max(5),
  comments: z.string().min(10, 'Please provide at least 10 characters.'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export function FeedbackPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      rating: 5,
      comments: '',
    },
  });

  const averageRating = useMemo(() => {
    if (entries.length === 0) {
      return 0;
    }
    const total = entries.reduce((sum, entry) => sum + entry.rating, 0);
    return Math.round((total / entries.length) * 10) / 10;
  }, [entries]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFeedbackEntries();
        setEntries(data);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to load feedback.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onSubmit = async (values: FeedbackFormValues) => {
    setErrorMessage(null);
    try {
      await submitFeedback({
        name: values.name,
        rating: values.rating,
        comments: values.comments,
      });
      const updated = await fetchFeedbackEntries();
      setEntries(updated);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to submit feedback.');
    }
    reset();
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Feedback"
        description="Share your Kyrgyz Riders experience and read recent traveler feedback."
      />
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl text-foreground mb-4">Share Your Experience</h1>
          <p className="text-muted-foreground mb-8">
            Tell us about your journey. Your feedback helps future travelers plan their
            adventures in Kyrgyzstan.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card border border-border rounded-lg p-4 sm:p-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="rating">Rating</Label>
              <select
                id="rating"
                className="w-full h-10 px-3 rounded-md border border-border bg-card text-sm"
                {...register('rating', { valueAsNumber: true })}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} stars
                  </option>
                ))}
              </select>
              {errors.rating && <p className="text-xs text-red-600">{errors.rating.message}</p>}
            </div>
            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                rows={5}
                placeholder="Share what you loved about the tour..."
                {...register('comments')}
              />
              {errors.comments && <p className="text-xs text-red-600">{errors.comments.message}</p>}
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <Button
              type="submit"
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="text-2xl text-foreground">Recent Feedback</h2>
            <p className="text-muted-foreground">
              Average rating: {averageRating || '-'} / 5
            </p>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading feedback...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">No feedback yet.</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(entry.rating)].map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-3">{entry.comments}</p>
                  {entry.adminResponse && (
                    <p className="text-sm text-foreground mb-2">
                      Admin response: {entry.adminResponse}
                    </p>
                  )}
                  <p className="text-sm text-foreground">{entry.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
