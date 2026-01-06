import { useEffect, useState } from 'react';
import { firebaseEnabled } from '../lib/firebase';
import { fetchTours } from '../lib/firestore';
import { tours as fallbackTours, type Tour } from '../components/tour-data';

export function useToursData() {
  const [tours, setTours] = useState<Tour[]>(firebaseEnabled ? [] : fallbackTours);
  const [loading, setLoading] = useState(firebaseEnabled);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(!firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled) {
      return;
    }

    let isActive = true;

    const loadTours = async () => {
      try {
        const data = await fetchTours();
        if (!isActive) {
          return;
        }
        if (data.length === 0) {
          setTours(fallbackTours);
          setUsingFallback(true);
        } else {
          setTours(data);
          setUsingFallback(false);
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to load tours.');
        setTours(fallbackTours);
        setUsingFallback(true);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadTours();

    return () => {
      isActive = false;
    };
  }, []);

  return { tours, loading, error, usingFallback };
}
