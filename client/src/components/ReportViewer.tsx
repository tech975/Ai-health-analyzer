import React from 'react';
import { Report } from '../types';
import { cn } from '../utils/cn';

interface ReportViewerProps {
  report: Report;
  onDownload?: (format: 'pdf' | 'word') => void;
  isDownloading?: boolean;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onDownload,
  isDownloading = false,
}) => {
  const { analysis, createdAt } = report;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Action Buttons - Top Right */}
      <div className="flex justify-end gap-2 mb-6 print:hidden">
        {onDownload && (
          <>
            <button
              onClick={() => onDownload('pdf')}
              disabled={isDownloading}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md border transition-colors",
                "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={() => onDownload('word')}
              disabled={isDownloading}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md border transition-colors",
                "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isDownloading ? 'Downloading...' : 'Download Word'}
            </button>
          </>
        )}
      </div>

      {/* Report Content - Ultra Compact Layout */}
      <div className="bg-white border border-gray-300 rounded p-2 shadow-sm text-xs leading-tight">
        {/* Header - Ultra Compact */}
        <div className="text-center mb-2">
          <h1 className="text-lg font-bold text-gray-900 mb-0.5">Health Report Summary</h1>
          <p className="text-xs text-gray-600">{formatDate(createdAt)}</p>
        </div>

        {/* Patient Details - Ultra Compact Inline */}
        <div className="mb-2 bg-gray-100 p-1 rounded text-center text-xs">
          <span className="font-bold">{analysis.patientDetails?.name || report.patientInfo.name}</span>
          <span className="mx-1">•</span>
          <span className="font-bold">{analysis.patientDetails?.age || report.patientInfo.age}y</span>
          <span className="mx-1">•</span>
          <span className="font-bold capitalize">{analysis.patientDetails?.gender || report.patientInfo.gender}</span>
        </div>

        {/* 1. Explanation - Ultra Compact */}
        <div className="mb-2">
          <h2 className="text-xs font-bold text-blue-900 mb-1 border-b border-blue-200">
            1. Explanation
          </h2>
          <div className="bg-blue-50 p-1 rounded">
            {analysis.simpleExplanation.split('.').filter(sentence => sentence.trim()).slice(0, 3).map((sentence, index) => (
              <div key={index} className="flex items-start mb-0.5">
                <span className="inline-block w-3 h-3 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center mr-1 mt-0.5 flex-shrink-0 text-[8px]">
                  {index + 1}
                </span>
                <p className="text-xs text-gray-800 font-bold leading-tight">{sentence.trim()}.</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Abnormal Values - Ultra Compact */}
        {analysis.abnormalValues && analysis.abnormalValues.length > 0 && (
          <div className="mb-2">
            <h2 className="text-xs font-bold text-red-900 mb-1 border-b border-red-200">
              2. Abnormal Values
            </h2>
            <div className="bg-red-50 p-1 rounded">
              <table className="w-full border-collapse text-xs bg-white">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="border px-1 py-0.5 text-left font-bold text-xs">Test</th>
                    <th className="border px-1 py-0.5 text-left font-bold text-xs">Value</th>
                    <th className="border px-1 py-0.5 text-left font-bold text-xs">Normal</th>
                    <th className="border px-1 py-0.5 text-left font-bold text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.abnormalValues.slice(0, 3).map((value, index) => (
                    <tr key={index}>
                      <td className="border px-1 py-0.5 font-medium text-xs">{value.parameter}</td>
                      <td className="border px-1 py-0.5 font-bold text-red-700 text-xs">{value.value}</td>
                      <td className="border px-1 py-0.5 text-xs">{value.normalRange}</td>
                      <td className="border px-1 py-0.5 text-xs">
                        <span className={cn(
                          "px-1 rounded text-xs font-bold",
                          value.severity === 'critical' ? 'bg-red-600 text-white' :
                          value.severity === 'high' ? 'bg-orange-500 text-white' :
                          value.severity === 'low' ? 'bg-yellow-500 text-black' :
                          'bg-gray-500 text-white'
                        )}>
                          {value.severity === 'critical' ? 'CRIT' :
                           value.severity === 'high' ? 'HIGH' :
                           value.severity === 'low' ? 'LOW' : 'NORM'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Diseases - Ultra Compact */}
        {analysis.detectedDiseases && analysis.detectedDiseases.length > 0 && (
          <div className="mb-2">
            <h2 className="text-xs font-bold text-orange-900 mb-1 border-b border-orange-200">
              3. Diseases
            </h2>
            <div className="bg-orange-50 p-1 rounded">
              {analysis.detectedDiseases.slice(0, 3).map((disease, index) => (
                <div key={index} className="flex items-start mb-0.5">
                  <span className="inline-block w-3 h-3 bg-orange-600 text-white font-bold rounded-full flex items-center justify-center mr-1 mt-0.5 flex-shrink-0 text-[8px]">
                    {index + 1}
                  </span>
                  <p className="text-xs text-gray-800 font-bold leading-tight">{disease}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Causes - Ultra Compact */}
        {analysis.possibleCauses && analysis.possibleCauses.length > 0 && (
          <div className="mb-2">
            <h2 className="text-xs font-bold text-purple-900 mb-1 border-b border-purple-200">
              4. Causes
            </h2>
            <div className="bg-purple-50 p-1 rounded">
              {analysis.possibleCauses.slice(0, 3).map((cause, index) => (
                <div key={index} className="flex items-start mb-0.5">
                  <span className="inline-block w-3 h-3 bg-purple-600 text-white font-bold rounded-full flex items-center justify-center mr-1 mt-0.5 flex-shrink-0 text-[8px]">
                    {index + 1}
                  </span>
                  <p className="text-xs text-gray-800 font-bold leading-tight">{cause}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Symptoms - Ultra Compact */}
        {analysis.symptoms && analysis.symptoms.length > 0 && (
          <div className="mb-2">
            <h2 className="text-xs font-bold text-pink-900 mb-1 border-b border-pink-200">
              5. Symptoms
            </h2>
            <div className="bg-pink-50 p-1 rounded">
              {analysis.symptoms.slice(0, 3).map((symptom, index) => (
                <div key={index} className="flex items-start mb-0.5">
                  <span className="inline-block w-3 h-3 bg-pink-600 text-white font-bold rounded-full flex items-center justify-center mr-1 mt-0.5 flex-shrink-0 text-[8px]">
                    {index + 1}
                  </span>
                  <p className="text-xs text-gray-800 font-bold leading-tight">{symptom}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Lifestyle - Ultra Compact */}
        {analysis.lifestyleRecommendations && analysis.lifestyleRecommendations.length > 0 && (
          <div className="mb-2">
            <h2 className="text-xs font-bold text-green-900 mb-1 border-b border-green-200">
              6. Lifestyle
            </h2>
            <div className="bg-green-50 p-1 rounded">
              {analysis.lifestyleRecommendations.slice(0, 2).map((recommendation, index) => (
                <div key={index} className="flex items-start mb-0.5">
                  <span className="inline-block w-3 h-3 bg-green-600 text-white font-bold rounded-full flex items-center justify-center mr-1 mt-0.5 flex-shrink-0 text-[8px]">
                    {index + 1}
                  </span>
                  <p className="text-xs text-gray-800 font-bold leading-tight">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Medicines - Ultra Compact */}
        <div className="mb-1">
          <h2 className="text-xs font-bold text-indigo-900 mb-1 border-b border-indigo-200">
            7. Medicines
          </h2>
          <div className="bg-indigo-50 p-1 rounded">
            {/* Medicine Recommendations */}
            {analysis.medicineRecommendations && analysis.medicineRecommendations.length > 0 && (
              <div>
                {analysis.medicineRecommendations.slice(0, 3).map((medicine, index) => (
                  <div key={index} className="flex items-start mb-0.5">
                    <span className="inline-block w-3 h-3 bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center mr-1 mt-0.5 flex-shrink-0 text-[8px]">
                      {index + 1}
                    </span>
                    <p className="text-xs text-gray-800 font-bold leading-tight">{medicine}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Doctor Recommendations - Ultra Compact */}
            {analysis.doctorRecommendations && analysis.doctorRecommendations.length > 0 && (
              <div className="mt-1 pt-1 border-t border-indigo-200">
                <h3 className="text-xs font-bold text-indigo-800 mb-0.5">Doctor:</h3>
                {analysis.doctorRecommendations.slice(0, 1).map((recommendation, index) => (
                  <p key={index} className="text-xs text-gray-700 font-bold leading-tight">{recommendation}</p>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportViewer;