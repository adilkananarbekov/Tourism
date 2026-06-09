import { useEffect, useState } from 'react';
import { apiEnabled } from '../lib/api';
import { fetchTours } from '../lib/dataStore';
import { tours as fallbackTours, type Tour } from '../components/tour-data';

function isPermissionError(err: unknown) {
  const message = err instanceof Error ? err.message.toLowerCase() : '';
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code?: unknown }).code).toLowerCase()
      : '';

  return (
    code === 'permission-denied' ||
    message.includes('missing or insufficient permissions') ||
    message.includes('permission-denied')
  );
}

export function useToursData() {
  const [tours, setTours] = useState<Tour[]>(fallbackTours);
  const [loading, setLoading] = useState(apiEnabled);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
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
        if (!isPermissionError(err) && fallbackTours.length === 0) {
          setError('Unable to load tours.');
        } else {
          setError(null);
        }
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
