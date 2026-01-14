import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [extractedPatientData, setExtractedPatientData] = useState<Partial<PatientFormData> | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'processing'>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setExtractedPatientData(null);
    setUploadProgress(0);
    setFileId(null);
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      await withLoading('uploadAndExtract', async () => {
        setError(null);
        setUploadProgress(0);

        // Step 1: Upload file
        setProcessingStep('Uploading file...');
        const fileUploadResult = await fileApi.uploadFile(selectedFile, (progress) => {
          setUploadProgress(Math.min(progress, 90)); // Cap at 90% until extraction completes
        });
        setFileId(fileUploadResult.fileId);

        // Step 2: Extract patient info from PDF
        setProcessingStep('Extracting patient information from PDF...');
        const extractionResult = await fileApi.extractPatientInfo(fileUploadResult.fileId);
        
        setUploadProgress(100);
        setExtractedPatientData(extractionResult.extractedPatientInfo);
        setCurrentStep('review');
        setProcessingStep('');
      });
    } catch (err: any) {
      console.error('Error uploading and extracting:', err);
      handleError(err, 'Failed to upload file and extract patient information');
      setProcessingStep('');
      setUploadProgress(0);
    }
  };

  const handlePatientDataChange = (field: keyof PatientFormData, value: any) => {
    setExtractedPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePatientData = (): boolean => {
    if (!extractedPatientData) return false;
    
    const { name, age, gender } = extractedPatientData;
    
    if (!name || name.toString().trim().length < 2) {
      setError('Patient name is required');
      return false;
    }
    
    if (!age || age <= 0 || age > 150) {
      setError('Valid age is required');
      return false;
    }
    
    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      setError('Valid gender is required');
      return false;
    }
    
    return true;
  };

  const handleSubmitReport = async () => {
    if (!validatePatientData() || !fileId) {
      return;
    }

    try {
      await withLoading('submitReport', async () => {
        setCurrentStep('processing');
        setError(null);
        setUploadProgress(0);

        // Analyze report with extracted patient data
        setProcessingStep('Analyzing with AI...');
        const patientData = extractedPatientData as PatientFormData;
        const analyzedReport = await reportApi.analyzeReport(fileId, patientData);

        showSuccess('Health report analyzed successfully!');
        navigate(`/report/${analyzedReport.id || analyzedReport._id}`);
      });
    } catch (err: any) {
      console.error('Error processing report:', err);
      handleError(err, 'Failed to process health report');
      setCurrentStep('review');
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
              currentStep === 'upload' ? 'text-blue-600' : 
              fileId ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' :
                fileId ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Upload</span>
              <span className="text-xs font-medium xs:hidden">Upload</span>
            </div>
            
            <div className={`w-8 sm:w-16 h-0.5 ${
              fileId ? 'bg-green-600' : 'bg-gray-200'
            }`}></div>
            
            <div className={`flex items-center space-x-1 sm:space-x-2 ${
              currentStep === 'review' ? 'text-blue-600' : 
              extractedPatientData ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'review' ? 'bg-blue-600 text-white' :
                extractedPatientData ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Review Info</span>
              <span className="text-xs font-medium xs:hidden">Review</span>
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
        {currentStep === 'upload' && (
          <section aria-labelledby="file-upload-heading">
            <h2 id="file-upload-heading" className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
              Upload Health Report
            </h2>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              isLoading={isLoading('uploadAndExtract')}
              uploadProgress={uploadProgress}
              error={error || undefined}
            />
            
            {selectedFile && (
              <div className="mt-6 flex justify-end">
                <LoadingButton
                  onClick={handleUploadAndExtract}
                  isLoading={isLoading('uploadAndExtract')}
                  loadingText="Uploading & Extracting..."
                  className="w-full sm:w-auto px-6 py-3"
                >
                  Upload & Extract Info
                </LoadingButton>
              </div>
            )}
          </section>
        )}

        {currentStep === 'review' && extractedPatientData && (
          <section aria-labelledby="review-heading">
            <h2 id="review-heading" className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
              Review Extracted Patient Information
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                ℹ️ We've automatically extracted patient information from your PDF. Please review and correct any information if needed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Patient Name */}
              <div className="sm:col-span-2 md:col-span-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={extractedPatientData.name || ''}
                  onChange={(e) => handlePatientDataChange('name', e.target.value)}
                  disabled={isLoading('submitReport')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter patient's full name"
                />
              </div>

              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  value={extractedPatientData.age || ''}
                  onChange={(e) => handlePatientDataChange('age', e.target.value ? parseInt(e.target.value) : 0)}
                  disabled={isLoading('submitReport')}
                  min="1"
                  max="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter age"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  value={extractedPatientData.gender || ''}
                  onChange={(e) => handlePatientDataChange('gender', e.target.value)}
                  disabled={isLoading('submitReport')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => {
                  setCurrentStep('upload');
                  handleFileRemove();
                }}
                disabled={isLoading('submitReport')}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                ← Back to Upload
              </button>
              <LoadingButton
                onClick={handleSubmitReport}
                isLoading={isLoading('submitReport')}
                loadingText="Analyzing..."
                className="px-6 py-2"
              >
                Analyze Report
              </LoadingButton>
            </div>
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
                    label={uploadProgress < 100 ? "Processing..." : "Complete"}
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