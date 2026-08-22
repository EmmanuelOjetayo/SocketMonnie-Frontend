import { useEffect, useState, useCallback } from "react";

/**
 * Runs an async fetcher on mount (and whenever deps change), tracking
 * loading/error/data state. Use for every page-level data fetch instead
 * of hand-rolling the same three useState calls each time.
 *
 * @param {Function} fetcher - async function that returns data
 * @param {Array} deps - dependency array for useEffect
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useAsync(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetcher()
      .then((res) => setData(res))
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, isLoading, error, refetch: run };
}