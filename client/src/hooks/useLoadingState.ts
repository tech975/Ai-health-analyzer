import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

export const useLoadingState = (initialState: LoadingState = {}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState);

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFunction: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  const clearLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    clearLoading,
  };
};