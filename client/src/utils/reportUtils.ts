import { Report } from '../types';

/**
 * Get the report ID, handling both _id and id fields
 */
export const getReportId = (report: Report): string => {
  return report._id || report.id;
};

/**
 * Normalize report data to ensure consistent ID field
 */
export const normalizeReport = (report: any): Report => {
  return {
    ...report,
    id: report._id || report.id,
    _id: report._id || report.id,
  };
};

/**
 * Normalize array of reports
 */
export const normalizeReports = (reports: any[]): Report[] => {
  return reports.map(normalizeReport);
};