import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientForm from '../components/PatientForm';
import FileUpload from '../components/FileUpload';
import LoadingButton from '../components/LoadingButton';
import LoadingOverlay from '../components/LoadingOverlay';
import Alert from '../components/Alert';
import ProgressBar from '../components/ProgressBar';
import { PatientFormData } from '../types';
import { fileApi, reportApi } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useLoadingState } from '../hooks/useLoadingState';

const HomePage = () => {
  const navigate = useNavigate();
  const { handleError, showSuccess } = useErrorHandler();
  const { isLoading, withLoading } = useLoadingState();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientData, setPatientData] = useState<PatientFormData | null>(null);
  const [currentStep, setCurrentStep] = useState<'patient' | 'file' | 'processing'>('patient');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handlePatientFormSubmit = (data: PatientFormData) => {
    setPatientData(data);
    setCurrentStep('file');
    setError(null);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleBackToPatientForm = () => {
    setCurrentStep('patient');
    setError(null);
  };

  const handleSubmitReport = async () => {
    if (!patientData || !selectedFile) {
      setError('Please complete both patient information and file upload');
      return;
    }

    try {
      await withLoading('submitReport', async () => {
        setCurrentStep('processing');
        setError(null);
        setUploadProgress(0);

        // Step 1: Upload file
        setProcessingStep('Uploading file...');
        const fileUploadResult = await fileApi.uploadFile(selectedFile, (progress) => {
          setUploadProgress(progress);
        });

        // Step 2: Start AI analysis directly
        setProcessingStep('Analyzing with AI...');
        setUploadProgress(100);
        const analyzedReport = await reportApi.analyzeReport(fileUploadResult.fileId, patientData);

        // Success feedback
        showSuccess('Health report analyzed successfully!');
        
        // Navigate to report page using the correct reportId from the response
        navigate(`/report/${analyzedReport.reportId}`);
      });
    } catch (err: any) {
      console.error('Error processing report:', err);
      handleError(err, 'Failed to process health report');
      setCurrentStep('file');
      setProcessingStep('');
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          AI Health Report Analyzer
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
          Upload your health reports and get intelligent AI-powered analysis with 
          easy-to-understand explanations and actionable recommendations.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-8">
            <div className={`flex items-center space-x-1 sm:space-x-2 ${
              currentStep === 'patient' ? 'text-blue-600' : 
              patientData ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'patient' ? 'bg-blue-600 text-white' :
                patientData ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Patient Info</span>
              <span className="text-xs font-medium xs:hidden">Info</span>
            </div>
            
            <div className={`w-8 sm:w-16 h-0.5 ${
              patientData ? 'bg-green-600' : 'bg-gray-200'
            }`}></div>
            
            <div className={`flex items-center space-x-1 sm:space-x-2 ${
              currentStep === 'file' ? 'text-blue-600' : 
              selectedFile ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'file' ? 'bg-blue-600 text-white' :
                selectedFile ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Upload File</span>
              <span className="text-xs font-medium xs:hidden">Upload</span>
            </div>
            
            <div className={`w-8 sm:w-16 h-0.5 ${
              currentStep === 'processing' ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            
            <div className={`flex items-center space-x-1 sm:space-x-2 ${
              currentStep === 'processing' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Analysis</span>
              <span className="text-xs font-medium xs:hidden">Analysis</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'patient' && (
          <section aria-labelledby="patient-info-heading">
            <h2 id="patient-info-heading" className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
              Patient Information
            </h2>
            <PatientForm onSubmit={handlePatientFormSubmit} isLoading={isLoading('submitReport')} />
          </section>
        )}

        {currentStep === 'file' && (
          <section aria-labelledby="file-upload-heading">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
              <h2 id="file-upload-heading" className="text-lg sm:text-xl font-semibold text-gray-900">
                Upload Health Report
              </h2>
              <button
                onClick={handleBackToPatientForm}
                disabled={isLoading('submitReport')}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 self-start sm:self-auto"
                aria-label="Go back to patient information form"
              >
                ← Back to Patient Info
              </button>
            </div>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              isLoading={isLoading('submitReport')}
              uploadProgress={uploadProgress}
              error={error || undefined}
            />
            
            {selectedFile && (
              <div className="mt-6 flex justify-end">
                <LoadingButton
                  onClick={handleSubmitReport}
                  isLoading={isLoading('submitReport')}
                  loadingText="Processing..."
                  className="w-full sm:w-auto px-6 py-3"
                  aria-describedby={selectedFile ? 'file-selected-description' : undefined}
                >
                  Generate Analysis
                </LoadingButton>
                {selectedFile && (
                  <div id="file-selected-description" className="sr-only">
                    File {selectedFile.name} is ready for analysis
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {currentStep === 'processing' && (
          <section aria-labelledby="processing-heading" aria-live="polite">
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4" role="status" aria-label="Processing your health report"></div>
              <h2 id="processing-heading" className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Analyzing Your Health Report
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                {processingStep || 'Our AI is carefully reviewing your health data and generating insights...'}
              </p>
              
              {uploadProgress > 0 && (
                <div className="max-w-xs mx-auto px-4 mb-4">
                  <ProgressBar
                    progress={uploadProgress}
                    label={uploadProgress < 100 ? "Uploading file..." : "Upload complete"}
                    showPercentage={true}
                    color={uploadProgress < 100 ? "blue" : "green"}
                  />
                </div>
              )}
              
              <p className="text-xs sm:text-sm text-gray-500 mt-4 px-4">
                This usually takes 30-60 seconds
              </p>
            </div>
          </section>
        )}

        {/* Error Display */}
        {error && currentStep !== 'processing' && (
          <div className="mt-6">
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {/* Loading Overlay for processing */}
        <LoadingOverlay
          isVisible={isLoading('submitReport') && currentStep === 'processing'}
          message={processingStep || 'Processing your health report...'}
          progress={uploadProgress > 0 ? uploadProgress : undefined}
        />
      </div>
    </div>
  );
};

export default HomePage;