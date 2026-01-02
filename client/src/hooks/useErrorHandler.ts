import { useCallback } from 'react';
import { useError } from '../context/ErrorContext';

export const useErrorHandler = () => {
  const { handleApiError, addError } = useError();

  const handleError = useCallback((error: any, context?: string) => {
    // Add context to error if provided
    if (context && error.response?.data?.error) {
      error.response.data.error.context = context;
    }

    handleApiError(error);
  }, [handleApiError]);

  const showError = useCallback((message: string, code?: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    addError({
      code: code || 'USER_ERROR',
      message,
      severity,
    });
  }, [addError]);

  const showSuccess = useCallback((message: string) => {
    addError({
      code: 'SUCCESS',
      message,
      severity: 'low',
    });
  }, [addError]);

  return {
    handleError,
    showError,
    showSuccess,
  };
};