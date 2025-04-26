import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/apiClient';
import type { paths } from '../../types/openapi';

/**
 * React hook to fetch beats from the FreestyleFiend API.
 * Uses type-safe API client generated from OpenAPI spec.
 * Handles loading, error, and data states.
 */
export function useBeats() {
  const [beats, setBeats] = useState<paths['/beats']['get']['responses']['200']['content']['application/json'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const api = getApiClient();
    api.GET('/beats')
      .then(({ data, error }) => {
        if (error) {
          setError(error);
          setBeats(null);
        } else {
          setBeats(data ?? null);
        }
        setLoading(false);
      });
  }, []);

  return { beats, loading, error };
}
