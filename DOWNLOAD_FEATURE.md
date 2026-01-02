# Health Report Download Feature

## Overview
The AI Health Analyzer now supports downloading health reports in both PDF and Word formats with exact formatting and decoration matching the web interface.

## Features

### ✅ Exact Formatting Match
- **Ultra-compact layout** that fits on one page
- **Color-coded sections** with matching backgrounds and borders
- **Numbered bullet points** with colored circles
- **Styled tables** for abnormal values with red headers
- **Patient details** displayed inline with separators
- **Same typography** and spacing as the web interface

### ✅ Supported Formats
- **PDF**: High-quality PDF with preserved colors and formatting
- **Word (DOCX)**: Microsoft Word document with structured content

### ✅ Smart Filename Generation
- Format: `health-report-{patient-name}-{date}.{extension}`
- Example: `health-report-John-Doe-2025-01-02.pdf`
- Special characters are sanitized for file system compatibility

## Technical Implementation

### Backend (Server)
- **Document Generation Service**: `server/src/services/documentGenerationService.ts`
  - Uses Puppeteer for PDF generation with exact HTML/CSS matching
  - Uses docx library for Word document generation
  - Ultra-compact styling optimized for single-page output

- **Download Controller**: `server/src/controllers/reportController.ts`
  - Handles download requests with proper error handling
  - Validates user permissions and report status
  - Sets appropriate headers for file downloads

### Frontend (Client)
- **Download Hook**: `client/src/hooks/useReportActions.ts`
  - Manages download state and error handling
  - Creates blob URLs and triggers browser downloads
  - Provides loading states for UI feedback

- **Report Viewer**: `client/src/components/ReportViewer.tsx`
  - Download buttons integrated into the report interface
  - Supports both PDF and Word download options
  - Shows loading states during generation

## Usage

### From the Web Interface
1. Navigate to any completed health report
2. Click "Download PDF" or "Download Word" buttons
3. File will be generated and downloaded automatically

### API Endpoint
```http
POST /api/reports/:id/download
Content-Type: application/json

{
  "format": "pdf" | "word"
}
```

## Styling Details

The downloaded documents match the web interface exactly:

### Color Scheme
- **Explanation**: Blue theme (#2563eb)
- **Abnormal Values**: Red theme (#dc2626) with red table headers
- **Diseases**: Orange theme (#ea580c)
- **Causes**: Purple theme (#7c3aed)
- **Symptoms**: Pink theme (#db2777)
- **Lifestyle**: Green theme (#16a34a)
- **Medicines**: Indigo theme (#4f46e5)

### Layout Features
- **Ultra-compact spacing** for single-page fit
- **Numbered circles** for list items
- **Inline patient details** with bullet separators
- **Colored section backgrounds** matching web interface
- **Professional typography** with proper font weights

## Error Handling

The system handles various error scenarios:
- **Authentication errors**: User must be logged in
- **Permission errors**: User can only download their own reports
- **Report status errors**: Only completed reports can be downloaded
- **Generation timeouts**: Graceful handling of long generation times
- **Memory errors**: Proper error messages for resource constraints

## Performance Optimizations

- **Minimal margins** for maximum content space
- **Compressed styling** to reduce generation time
- **Efficient HTML structure** for faster PDF rendering
- **Proper resource cleanup** to prevent memory leaks

## Browser Compatibility

The download feature works across all modern browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## File Size Expectations

- **PDF files**: Typically 50-200KB depending on content
- **Word files**: Typically 20-100KB depending on content
- **Generation time**: 2-5 seconds for most reports

## Security Features

- **User authentication** required for all downloads
- **Report ownership** validation
- **Secure filename** generation with sanitization
- **No sensitive data** in temporary files