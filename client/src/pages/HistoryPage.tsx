import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reportApi } from '../services/api';
import { Report, ReportFilters } from '../types';
import ReportList from '../components/ReportList';
import SearchFilter from '../components/SearchFilter';
import BulkActions from '../components/BulkActions';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useLoadingState } from '../hooks/useLoadingState';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();
  const { isLoading, withLoading } = useLoadingState();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<ReportFilters>({
    page: 1,
    limit: 10,
  });
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    reportId?: string;
  }>({
    isOpen: false,
    type: 'single',
  });

  // Fetch reports when filters change
  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, filters]);

  // Auto-refresh reports every 30 seconds to catch new analyses
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Only refresh if we're not currently loading
      if (!isLoading('fetchReports')) {
        fetchReports();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, isLoading]);

  const fetchReports = async (clearCache = false) => {
    if (!user) return;

    try {
      await withLoading('fetchReports', async () => {
        // Clear cache if requested
        if (clearCache) {
          // Clear API cache for user reports
          const params = new URLSearchParams();
          if (filters?.search) params.append('search', filters.search);
          if (filters?.age) params.append('age', filters.age.toString());
          if (filters?.gender) params.append('gender', filters.gender);
          if (filters?.page) params.append('page', filters.page.toString());
          if (filters?.limit) params.append('limit', filters.limit.toString());
          
          const cacheKey = `user-reports:${user.id}:${params.toString()}`;
          // Clear specific cache entry
          import('../services/api').then(({ cacheUtils }) => {
            cacheUtils.delete(cacheKey);
            cacheUtils.clear(); // Clear all cache to be safe
          });
        }

        const response = await reportApi.getUserReports(user.id, filters);
        
        console.log('API Response:', response); // Debug log
        
        // The response structure is: { reports: [...], pagination: {...}, filters: {...} }
        if (response && response.reports && Array.isArray(response.reports)) {
          setReports(response.reports);
          setPagination(response.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        } else {
          console.warn('Unexpected API response structure:', response);
          setReports([]);
          setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
        }
        
        setError(null);
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      handleError(error, 'Failed to load reports');
      setError('Failed to load reports. Please try again.');
      // Ensure reports is always an array even on error
      setReports([]);
    }
  };

  const handleFiltersChange = (newFilters: ReportFilters) => {
    setFilters(newFilters);
    setSelectedReports([]); // Clear selection when filters change
  };

  const handleClearFilters = () => {
    setFilters({ page: 1, limit: 10 });
    setSelectedReports([]);
  };

  const handleRefresh = () => {
    fetchReports(true); // Force refresh with cache clear
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && reports) {
      setSelectedReports(reports.map(report => report._id).filter((id): id is string => id !== undefined));
    } else {
      setSelectedReports([]);
    }
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/report/${reportId}`);
  };

  const handleDeleteReport = (reportId: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      reportId,
    });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'bulk',
    });
  };

  const confirmDelete = async () => {
    try {
      await withLoading('deleteReports', async () => {
        if (confirmDialog.type === 'single' && confirmDialog.reportId) {
          try {
            await reportApi.deleteReport(confirmDialog.reportId);
            showSuccess('Report deleted successfully');
          } catch (error: any) {
            // Treat 404 as success for delete operations (report already gone)
            if (error.response?.status === 404) {
              showSuccess('Report deleted successfully');
            } else {
              throw error; // Re-throw other errors
            }
          }
        } else if (confirmDialog.type === 'bulk') {
          try {
            await reportApi.deleteMultipleReports(selectedReports);
            showSuccess(`${selectedReports.length} reports deleted successfully`);
          } catch (error: any) {
            // For bulk delete, some reports might not exist, but still show success
            if (error.response?.status === 404) {
              showSuccess(`Reports deleted successfully`);
            } else {
              throw error; // Re-throw other errors
            }
          }
          setSelectedReports([]);
        }

        // Refresh the reports list after a small delay to ensure cache is cleared
        setTimeout(async () => {
          await fetchReports();
        }, 500);
      });
    } catch (error) {
      console.error('Error deleting reports:', error);
      handleError(error, 'Failed to delete reports');
    } finally {
      setConfirmDialog({ isOpen: false, type: 'single' });
    }
  };

  const cancelDelete = () => {
    setConfirmDialog({ isOpen: false, type: 'single' });
  };

  const getConfirmDialogContent = () => {
    if (confirmDialog.type === 'single') {
      return {
        title: 'Delete Report',
        message: 'Are you sure you want to delete this report? This action cannot be undone.',
      };
    } else {
      return {
        title: 'Delete Multiple Reports',
        message: `Are you sure you want to delete ${selectedReports.length} selected reports? This action cannot be undone.`,
      };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Report History
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          View and manage your previous health report analyses.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        </div>
      )}

      {/* Search and Filter */}
      <SearchFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        onRefresh={handleRefresh}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedReports.length}
        onBulkDelete={handleBulkDelete}
        isLoading={isLoading('deleteReports')}
      />

      {/* Loading State */}
      {isLoading('fetchReports') && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your reports...</p>
        </div>
      )}

      {/* Reports List */}
      {!isLoading('fetchReports') && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <ReportList
            reports={reports}
            selectedReports={selectedReports}
            onSelectReport={handleSelectReport}
            onSelectAll={handleSelectAll}
            onViewReport={handleViewReport}
            onDeleteReport={handleDeleteReport}
            isLoading={isLoading('deleteReports')}
          />

          {/* Pagination */}
          {reports && reports.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
            />
          )}

          {/* Empty State */}
          {reports && reports.length === 0 && !error && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No reports found. Upload your first health report to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={getConfirmDialogContent().title}
        message={getConfirmDialogContent().message}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isLoading('deleteReports')}
        type="danger"
      />
    </div>
  );
};

export default HistoryPage;