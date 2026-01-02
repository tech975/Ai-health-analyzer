import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Report } from '../types';
import { reportApi } from '../services/api';
import { useReportActions } from '../hooks/useReportActions';
import ReportViewer from '../components/ReportViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { useErrorHandler } from '../hooks/useErrorHandler';

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    downloadReport,
    isDownloading,
    error: actionError,
    clearError,
  } = useReportActions({ reportId: id || '' });

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) {
        setError('Report ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const reportData = await reportApi.getReport(id);
        setReport(reportData);
      } catch (err: any) {
        console.error('Failed to fetch report:', err);
        handleError(err, 'Failed to load report');
        if (err.response?.status === 404) {
          setError('Report not found');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this report');
        } else {
          setError('Failed to load report. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleDownload = async (format: 'pdf' | 'word') => {
    await downloadReport(format);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Loading Report</h2>
          <p className="text-gray-600">Please wait while we fetch your health report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert
          type="error"
          title="Unable to Load Report"
          message={error}
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }
  // Report not found
  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert
          type="error"
          title="Report Not Found"
          message="The requested report could not be found."
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  // Report still processing
  if (report?.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Report</h3>
          <p className="text-gray-600 mb-4">
            Your health report is being analyzed by AI. This usually takes a few moments.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Report failed
  if (report?.status === 'failed') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert
          type="error"
          title="Analysis Failed"
          message="We encountered an error while analyzing your health report. Please try uploading the report again."
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upload New Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        {/* Action Error Display */}
        {actionError && (
          <div className="mb-6">
            <Alert
              type="error"
              message={actionError}
              onClose={clearError}
            />
          </div>
        )}

        <ReportViewer
          report={report!}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />
      </div>
    </div>
  );
};

export default ReportPage;