import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  progress,
  className = '',
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        
        <p className="text-gray-900 font-medium mb-2">{message}</p>
        
        {progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
        
        {progress !== undefined && (
          <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;