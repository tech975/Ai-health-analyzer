import React from 'react';
import { Loader2, FileText, Brain, CheckCircle } from 'lucide-react';

interface AnalysisProgressProps {
  stage: 'uploading' | 'processing' | 'analyzing' | 'completed';
  message?: string;
  progress?: number;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  stage,
  message,
  progress
}) => {
  const stages = [
    {
      key: 'uploading',
      label: 'Uploading File',
      icon: FileText,
      description: 'Uploading your health report...'
    },
    {
      key: 'processing',
      label: 'Processing Document',
      icon: FileText,
      description: 'Extracting text from your report...'
    },
    {
      key: 'analyzing',
      label: 'AI Analysis',
      icon: Brain,
      description: 'Analyzing your health data with AI...'
    },
    {
      key: 'completed',
      label: 'Analysis Complete',
      icon: CheckCircle,
      description: 'Your health report is ready!'
    }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing Your Health Report
        </h3>
        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}
      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stage Indicators */}
      <div className="space-y-4">
        {stages.map((stageInfo, index) => {
          const Icon = stageInfo.icon;
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          return (
            <div 
              key={stageInfo.key}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-blue-50 border border-blue-200' : 
                isCompleted ? 'bg-green-50 border border-green-200' : 
                'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 ${
                isActive ? 'text-blue-600' : 
                isCompleted ? 'text-green-600' : 
                'text-gray-400'
              }`}>
                {isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-blue-900' : 
                  isCompleted ? 'text-green-900' : 
                  'text-gray-500'
                }`}>
                  {stageInfo.label}
                </p>
                <p className={`text-xs ${
                  isActive ? 'text-blue-700' : 
                  isCompleted ? 'text-green-700' : 
                  'text-gray-400'
                }`}>
                  {stageInfo.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeout Warning */}
      {stage === 'analyzing' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Large files may take up to 3 minutes to analyze. 
            If analysis takes longer, you'll be redirected to try again with a smaller file.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisProgress;