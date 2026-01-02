import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface TimeoutHandlerProps {
  show: boolean;
  onRetry?: () => void;
  message?: string;
}

const TimeoutHandler: React.FC<TimeoutHandlerProps> = ({
  show,
  onRetry,
  message = "Please try again. Large content takes time for analysis."
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (show) {
      // Auto-redirect to home after 10 seconds
      const timer = setTimeout(() => {
        navigate('/');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [show, navigate]);

  if (!show) return null;

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analysis Timeout
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 mb-6">
            {message}
          </p>

          {/* Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Suggestions:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1 text-left">
              <li>• Try with a smaller file (under 5MB)</li>
              <li>• Ensure your PDF contains readable text</li>
              <li>• Check your internet connection</li>
              <li>• Simplify complex medical reports</li>
            </ul>
          </div>

          {/* Auto-redirect notice */}
          <p className="text-xs text-gray-500 mb-4">
            You will be redirected to home page in 10 seconds
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {onRetry && (
              <button
                onClick={handleRetry}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            )}
            
            <button
              onClick={handleGoHome}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeoutHandler;