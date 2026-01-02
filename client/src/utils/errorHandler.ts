import { AxiosError } from 'axios';

export interface TimeoutError {
  isTimeout: boolean;
  message: string;
  shouldRedirect: boolean;
}

export const handleApiError = (error: any): TimeoutError => {
  // Check if it's an axios timeout error
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      isTimeout: true,
      message: 'Please try again. Large content takes time for analysis.',
      shouldRedirect: true
    };
  }

  // Check if it's our custom timeout response
  if (error?.response?.status === 408 || error?.response?.data?.error?.code === 'ANALYSIS_TIMEOUT') {
    return {
      isTimeout: true,
      message: error?.response?.data?.error?.message || 'Please try again. Large content takes time for analysis.',
      shouldRedirect: true
    };
  }

  // Check for other timeout-related errors
  if (error?.response?.data?.error?.timeout) {
    return {
      isTimeout: true,
      message: 'Please try again. Large content takes time for analysis.',
      shouldRedirect: true
    };
  }

  // Not a timeout error
  return {
    isTimeout: false,
    message: error?.response?.data?.error?.message || error?.message || 'An unexpected error occurred',
    shouldRedirect: false
  };
};

export const isTimeoutError = (error: any): boolean => {
  return handleApiError(error).isTimeout;
};

export const getErrorMessage = (error: any): string => {
  return handleApiError(error).message;
};

export const shouldRedirectOnError = (error: any): boolean => {
  return handleApiError(error).shouldRedirect;
};