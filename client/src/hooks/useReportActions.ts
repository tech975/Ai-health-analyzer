import { useState } from 'react';
import { reportApi } from '../services/api';

interface UseReportActionsProps {
  reportId: string;
}

interface ShareResult {
  shareUrl: string;
  expiresAt: string;
}

export const useReportActions = ({ reportId }: UseReportActionsProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadReport = async (format: 'pdf' | 'word') => {
    try {
      setIsDownloading(true);
      setError(null);

      const blob = await reportApi.downloadReport(reportId, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format with current date
      const extension = format === 'pdf' ? 'pdf' : 'docx';
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      link.download = `health-report-${currentDate}.${extension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Download failed:', err);
      setError(`Failed to download ${format.toUpperCase()} report. Please try again.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareReport = async () => {
    try {
      setIsSharing(true);
      setError(null);

      const result = await reportApi.shareReport(reportId);
      setShareResult(result);

      // Copy to clipboard
      await navigator.clipboard.writeText(result.shareUrl);
      
      // Show success message (you might want to use a toast notification here)
      alert('Share link copied to clipboard!');
      
    } catch (err) {
      console.error('Share failed:', err);
      setError('Failed to generate share link. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const clearError = () => setError(null);
  const clearShareResult = () => setShareResult(null);

  return {
    downloadReport,
    shareReport,
    isDownloading,
    isSharing,
    shareResult,
    error,
    clearError,
    clearShareResult,
  };
};