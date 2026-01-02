import React from 'react';
import { Report } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { EyeIcon, TrashIcon, UserIcon, PhoneIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getReportId } from '../utils/reportUtils';

interface ReportListProps {
  reports: Report[];
  selectedReports: string[];
  onSelectReport: (reportId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  isLoading?: boolean;
}

const ReportList: React.FC<ReportListProps> = ({
  reports,
  selectedReports,
  onSelectReport,
  onSelectAll,
  onViewReport,
  onDeleteReport,
  isLoading = false,
}) => {
  const allSelected = reports.length > 0 && selectedReports.length === reports.length;
  const someSelected = selectedReports.length > 0 && selectedReports.length < reports.length;

  if (isLoading) {
    return (
      <div className="animate-pulse p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 sm:h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-gray-400 text-lg mb-2">No reports found</div>
        <p className="text-gray-500">Upload your first health report to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Report ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => {
              const reportId = getReportId(report);
              return (
              <tr key={reportId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(reportId)}
                    onChange={() => onSelectReport(reportId)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {reportId?.slice(-8) || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.patientInfo.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.patientInfo.phoneNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.patientInfo.age}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {report.patientInfo.gender}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewReport(reportId)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                      title="View Report"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteReport(reportId)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                      title="Delete Report"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {/* Select All Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              aria-label={allSelected ? 'Deselect all reports' : 'Select all reports'}
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedReports.length > 0 ? `${selectedReports.length} selected` : 'Select all'}
            </span>
          </div>
          <span className="text-sm text-gray-500" aria-live="polite">{reports.length} reports</span>
        </div>

        {/* Report Cards */}
        <div className="divide-y divide-gray-200" role="list" aria-label="Health reports">
          {reports.map((report) => {
            const reportId = getReportId(report);
            return (
            <article key={reportId} className="p-4 hover:bg-gray-50" role="listitem">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedReports.includes(reportId)}
                  onChange={() => onSelectReport(reportId)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  aria-label={`Select report for ${report.patientInfo.name}`}
                />
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {report.patientInfo.name}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      aria-label={`Report status: ${report.status}`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" aria-hidden="true" />
                      <span>{report.patientInfo.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" aria-hidden="true" />
                        <time dateTime={report.createdAt}>
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span>{report.patientInfo.age} years</span>
                        <span className="capitalize">{report.patientInfo.gender}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {reportId?.slice(-8) || 'N/A'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2" role="group" aria-label={`Actions for ${report.patientInfo.name}'s report`}>
                    <button
                      onClick={() => onViewReport(reportId)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-label={`View report for ${report.patientInfo.name}`}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                      View
                    </button>
                    <button
                      onClick={() => onDeleteReport(reportId)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      aria-label={`Delete report for ${report.patientInfo.name}`}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportList;