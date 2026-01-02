import React, { createContext, useContext, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface AppError {
  id: string;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  handleApiError: (error: any) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = (errorData: Omit<AppError, 'id' | 'timestamp'>) => {
    const error: AppError = {
      ...errorData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setErrors(prev => [...prev, error]);

    // Show toast notification based on severity
    const toastOptions = {
      duration: getSeverityDuration(error.severity),
      style: getSeverityStyle(error.severity),
    };

    switch (error.severity) {
      case 'critical':
        toast.error(error.message, toastOptions);
        break;
      case 'high':
        toast.error(error.message, toastOptions);
        break;
      case 'medium':
        toast(error.message, toastOptions);
        break;
      case 'low':
        toast(error.message, toastOptions);
        break;
    }

    // Auto-remove low severity errors after some time
    if (error.severity === 'low') {
      setTimeout(() => {
        removeError(error.id);
      }, 10000);
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('🚨 Application Error:', error);
    }
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const handleApiError = (error: any) => {
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    let severity: AppError['severity'] = 'medium';

    if (error.response?.data?.error) {
      // API error response
      const apiError = error.response.data.error;
      errorMessage = apiError.message || errorMessage;
      errorCode = apiError.code || errorCode;
      
      // Determine severity based on status code
      const statusCode = error.response.status;
      if (statusCode >= 500) {
        severity = 'critical';
      } else if (statusCode >= 400) {
        severity = 'high';
      }
    } else if (error.message) {
      // Network or other errors
      errorMessage = error.message;
      errorCode = error.code || 'NETWORK_ERROR';
      severity = 'high';
    }

    // Handle specific error types
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      errorMessage = 'Network connection failed. Please check your internet connection.';
      errorCode = 'NETWORK_ERROR';
      severity = 'high';
    }

    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
      errorCode = 'UNAUTHORIZED';
      severity = 'high';
    }

    if (error.response?.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
      errorCode = 'FORBIDDEN';
      severity = 'medium';
    }

    if (error.response?.status === 404) {
      errorMessage = 'The requested resource was not found.';
      errorCode = 'NOT_FOUND';
      severity = 'medium';
    }

    addError({
      code: errorCode,
      message: errorMessage,
      details: error.response?.data || error,
      severity,
    });
  };

  const getSeverityDuration = (severity: AppError['severity']): number => {
    switch (severity) {
      case 'critical': return 8000;
      case 'high': return 6000;
      case 'medium': return 4000;
      case 'low': return 3000;
      default: return 4000;
    }
  };

  const getSeverityStyle = (severity: AppError['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          background: '#dc2626',
          color: '#fff',
        };
      case 'high':
        return {
          background: '#ea580c',
          color: '#fff',
        };
      case 'medium':
        return {
          background: '#d97706',
          color: '#fff',
        };
      case 'low':
        return {
          background: '#363636',
          color: '#fff',
        };
      default:
        return {
          background: '#363636',
          color: '#fff',
        };
    }
  };

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    handleApiError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};