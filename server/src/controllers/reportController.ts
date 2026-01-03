import { Request, Response } from 'express';
import { AuthRequest, PatientInfo } from '../types';
import { Report } from '../models/Report';
import { FileRecord } from '../models/FileRecord';
import aiAnalysisService from '../services/aiAnalysisService';
import documentGenerationService from '../services/documentGenerationService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { uploadToCloudinary, validateFile } from '../services/fileUploadService';
import { cacheService, cacheKeys } from '../services/cacheService';
import Joi from 'joi';

/**
 * Validation schema for upload report request
 */
const uploadReportSchema = Joi.object({
  patientInfo: Joi.object({
    name: Joi.string().trim().max(100).required(),
    age: Joi.number().integer().min(0).max(150).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    phoneNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required()
  }).required(),
  fileId: Joi.string().required()
});

/**
 * Create report with uploaded file (but don't save until analysis is complete)
 * POST /api/reports/upload
 */
export const uploadReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    // Validate request body
    const { error, value } = Joi.object({
      patientInfo: Joi.object({
        name: Joi.string().trim().max(100).required(),
        age: Joi.number().integer().min(0).max(150).required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        phoneNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required()
      }).required(),
      fileId: Joi.string().required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', error.details[0].message)
      );
    }

    const { patientInfo, fileId } = value;

    // Find the uploaded file
    const fileRecord = await FileRecord.findOne({ _id: fileId, userId });
    
    if (!fileRecord) {
      return res.status(404).json(
        createErrorResponse('FILE_NOT_FOUND', 'Uploaded file not found')
      );
    }

    // Return file info for immediate analysis (don't save report yet)
    return res.status(200).json(
      createSuccessResponse({
        fileId: fileRecord._id,
        patientInfo,
        fileInfo: {
          originalName: fileRecord.originalName,
          cloudinaryUrl: fileRecord.cloudinaryUrl,
          cloudinaryPublicId: fileRecord.cloudinaryPublicId,
          fileSize: fileRecord.fileSize
        },
        status: 'ready_for_analysis'
      }, 'File ready for analysis')
    );

  } catch (error) {
    console.error('Upload Report Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to prepare file for analysis')
    );
  }
};

/**
 * Analyze health report directly from file (creates report only on success)
 * POST /api/reports/analyze
 */
export const analyzeReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log("🔍 Starting direct analysis, request body:", JSON.stringify(req.body, null, 2));

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    // Validate request body with Joi
    const analyzeSchema = Joi.object({
      fileId: Joi.string().required(),
      patientInfo: Joi.object({
        name: Joi.string().trim().max(100).required(),
        age: Joi.number().integer().min(0).max(150).required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        phoneNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required()
      }).required()
    });

    const { error, value } = analyzeSchema.validate(req.body);

    if (error) {
      console.log("❌ Validation error:", error.details[0].message);
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', error.details[0].message)
      );
    }

    const { fileId, patientInfo } = value;
    console.log("✅ Validation passed for fileId:", fileId);

    // Find the uploaded file
    const fileRecord = await FileRecord.findOne({ _id: fileId, userId });

    if (!fileRecord) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'File not found')
      );
    }

    try {
      console.log("📥 Downloading file from Cloudinary...");
      // Download file from Cloudinary for analysis
      const fileBuffer = await downloadFileFromCloudinary(fileRecord.cloudinaryUrl);
      console.log("✅ File downloaded successfully, size:", fileBuffer.length, "bytes");
      
      console.log("🤖 Starting AI analysis...");
      // Perform AI analysis with 3-minute timeout
      const analysis = await aiAnalysisService.analyzeHealthReport(fileBuffer, patientInfo);
      console.log("✅ AI analysis completed successfully");
      
      // Only create report AFTER successful analysis
      const report = new Report({
        userId,
        patientInfo,
        fileInfo: {
          originalName: fileRecord.originalName,
          cloudinaryUrl: fileRecord.cloudinaryUrl,
          cloudinaryPublicId: fileRecord.cloudinaryPublicId,
          fileSize: fileRecord.fileSize
        },
        analysis,
        status: 'completed'
      });

      await report.save();
      console.log("💾 Report saved with analysis results");

      // Update file record with report ID
      fileRecord.reportId = report._id;
      await fileRecord.save();

      // Clear cache
      cacheService.clear();

      return res.status(201).json(
        createSuccessResponse({
          reportId: report._id,
          id: report._id, // Add explicit id field
          analysis,
          status: 'completed',
          patientInfo,
          fileInfo: {
            originalName: fileRecord.originalName,
            size: fileRecord.fileSize
          },
          createdAt: report.createdAt
        }, 'Health report analyzed successfully')
      );

    } catch (analysisError) {
      console.error('❌ AI Analysis Error:', analysisError);
      
      // Clean up file if analysis fails completely
      try {
        await FileRecord.findByIdAndDelete(fileId);
        console.log("🗑️ Cleaned up file record after analysis failure");
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      // Check if it's a timeout error
      const isTimeout = analysisError instanceof Error && 
        (analysisError.message.includes('timeout') || analysisError.message.includes('exceeded'));
      
      if (isTimeout) {
        return res.status(408).json(
          createErrorResponse(
            'ANALYSIS_TIMEOUT', 
            'Please try again. Large content takes time for analysis.',
            { 
              timeout: true,
              message: 'Analysis took longer than 3 minutes',
              suggestion: 'Try with a smaller file or simpler content'
            }
          )
        );
      }
      
      return res.status(500).json(
        createErrorResponse(
          'ANALYSIS_FAILED', 
          'Failed to analyze health report. Please try again or contact support.',
          { 
            error: analysisError instanceof Error ? analysisError.message : 'Unknown error'
          }
        )
      );
    }

  } catch (error) {
    console.error('❌ Report Analysis Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred during analysis')
    );
  }
};

/**
 * Get specific report by ID
 * GET /api/reports/:id
 */
export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    // Try to get from cache first
    const cacheKey = cacheKeys.report(id);
    const cachedReport = cacheService.get(cacheKey);
    
    if (cachedReport && (cachedReport as any).userId?.toString() === userId) {
      return res.status(200).json(
        createSuccessResponse(cachedReport, 'Report retrieved successfully (cached)')
      );
    }

    const report = await Report.findOne({ _id: id, userId });

    if (!report) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Report not found')
      );
    }

    // Convert to JSON to ensure _id is transformed to id
    const reportData = report.toJSON();

    // Cache the report for 10 minutes
    cacheService.set(cacheKey, reportData, 600000);

    return res.status(200).json(
      createSuccessResponse(reportData, 'Report retrieved successfully')
    );

  } catch (error) {
    console.error('Get Report Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve report')
    );
  }
};

/**
 * Get user's report history
 * GET /api/reports/user/:userId
 */
export const getUserReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      age,
      ageFilter, 
      gender,
      genderFilter,
      startDate,
      endDate
    } = req.query;

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    // Create cache key based on filters
    const filters = { page, limit, search, age: age || ageFilter, gender: gender || genderFilter, startDate, endDate };
    const cacheKey = cacheKeys.userReports(userId, filters);
    
    // Try to get from cache first
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      return res.status(200).json(
        createSuccessResponse(cachedResult, 'Reports retrieved successfully (cached)')
      );
    }

    // Build query filters
    const query: any = { userId };

    // Search by patient name (case-insensitive)
    if (search) {
      query['patientInfo.name'] = { $regex: search, $options: 'i' };
    }

    // Filter by age - support both 'age' and 'ageFilter' parameters
    const ageValue = age || ageFilter;
    if (ageValue) {
      const ageNum = parseInt(ageValue as string);
      if (!isNaN(ageNum)) {
        query['patientInfo.age'] = ageNum;
      }
    }

    // Filter by gender - support both 'gender' and 'genderFilter' parameters
    const genderValue = gender || genderFilter;
    if (genderValue && ['male', 'female', 'other'].includes(genderValue as string)) {
      query['patientInfo.gender'] = genderValue;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          query.createdAt.$gte = start;
        }
      }
      
      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          // Set to end of day
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Get reports with pagination - optimized query
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-analysis') // Exclude analysis for list view to improve performance
        .lean(), // Use lean() for better performance
      Report.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const result = {
      reports: reports.map(report => {
        const reportData = report.toJSON ? report.toJSON() : report;
        return {
          id: reportData.id || reportData._id,
          patientInfo: reportData.patientInfo,
          fileInfo: {
            originalName: reportData.fileInfo.originalName,
            size: reportData.fileInfo.fileSize
          },
          status: reportData.status,
          createdAt: reportData.createdAt,
          updatedAt: reportData.updatedAt
        };
      }),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        search: search || null,
        age: ageValue ? parseInt(ageValue as string) : null,
        gender: genderValue || null,
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    // Cache the result for 3 minutes
    cacheService.set(cacheKey, result, 180000);

    return res.status(200).json(
      createSuccessResponse(result, 'Reports retrieved successfully')
    );

  } catch (error) {
    console.error('Get User Reports Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve reports')
    );
  }
};

/**
 * Search reports with advanced filtering
 * GET /api/reports/search
 */
export const searchReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { 
      q, // General search query
      patientName,
      age,
      ageMin,
      ageMax,
      gender,
      status,
      startDate,
      endDate,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    // Build search query
    const query: any = { userId };

    // General search across patient name and phone number
    if (q) {
      query.$or = [
        { 'patientInfo.name': { $regex: q, $options: 'i' } },
        { 'patientInfo.phoneNumber': { $regex: q, $options: 'i' } }
      ];
    }

    // Specific patient name search
    if (patientName) {
      query['patientInfo.name'] = { $regex: patientName, $options: 'i' };
    }

    // Age filtering
    if (age) {
      const ageNum = parseInt(age as string);
      if (!isNaN(ageNum)) {
        query['patientInfo.age'] = ageNum;
      }
    } else if (ageMin || ageMax) {
      query['patientInfo.age'] = {};
      if (ageMin) {
        const minAge = parseInt(ageMin as string);
        if (!isNaN(minAge)) {
          query['patientInfo.age'].$gte = minAge;
        }
      }
      if (ageMax) {
        const maxAge = parseInt(ageMax as string);
        if (!isNaN(maxAge)) {
          query['patientInfo.age'].$lte = maxAge;
        }
      }
    }

    // Gender filtering
    if (gender && ['male', 'female', 'other'].includes(gender as string)) {
      query['patientInfo.gender'] = gender;
    }

    // Status filtering
    if (status && ['pending', 'completed', 'failed'].includes(status as string)) {
      query.status = status;
    }

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          query.createdAt.$gte = start;
        }
      }
      
      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const validSortFields = ['createdAt', 'updatedAt', 'patientInfo.name', 'patientInfo.age', 'status'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Execute search
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .select('-analysis')
        .lean(),
      Report.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json(
      createSuccessResponse({
        reports: reports.map(report => {
          const reportData = report.toJSON ? report.toJSON() : report;
          return {
            id: reportData.id || reportData._id,
            patientInfo: reportData.patientInfo,
            fileInfo: {
              originalName: reportData.fileInfo.originalName,
              size: reportData.fileInfo.fileSize
            },
            status: reportData.status,
            createdAt: reportData.createdAt,
            updatedAt: reportData.updatedAt
          };
        }),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        searchParams: {
          q: q || null,
          patientName: patientName || null,
          age: age ? parseInt(age as string) : null,
          ageMin: ageMin ? parseInt(ageMin as string) : null,
          ageMax: ageMax ? parseInt(ageMax as string) : null,
          gender: gender || null,
          status: status || null,
          startDate: startDate || null,
          endDate: endDate || null,
          sortBy: sortField,
          sortOrder: sortOrder
        }
      }, `Found ${total} reports matching search criteria`)
    );

  } catch (error) {
    console.error('Search Reports Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to search reports')
    );
  }
};

/**
 * Download report in PDF or Word format
 * POST /api/reports/:id/download
 */
export const downloadReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    // Validate format
    if (!['pdf', 'word', 'docx'].includes(format.toLowerCase())) {
      return res.status(400).json(
        createErrorResponse('INVALID_FORMAT', 'Format must be pdf, word, or docx')
      );
    }

    // Find the report
    const report = await Report.findOne({ _id: id, userId });

    if (!report) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Report not found')
      );
    }

    if (report.status !== 'completed') {
      return res.status(400).json(
        createErrorResponse('REPORT_NOT_READY', 'Report analysis is not completed yet')
      );
    }

    try {
      let fileBuffer: Buffer;
      let mimeType: string;
      let fileExtension: string;

      // Generate the actual file
      if (format.toLowerCase() === 'pdf') {
        console.log('🔄 Generating PDF document...');
        fileBuffer = await documentGenerationService.generatePDF(report);
        mimeType = 'application/pdf';
        fileExtension = 'pdf';
        console.log('✅ PDF generated successfully, size:', fileBuffer.length, 'bytes');
      } else {
        console.log('🔄 Generating Word document...');
        fileBuffer = await documentGenerationService.generateWord(report);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        console.log('✅ Word document generated successfully, size:', fileBuffer.length, 'bytes');
      }

      // Generate filename with patient name and date
      const patientName = (report.analysis.patientDetails?.name || report.patientInfo.name)
        .replace(/[^a-zA-Z0-9]/g, '-') // Replace special characters with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const fileName = `health-report-${patientName}-${currentDate}.${fileExtension}`;

      // Set response headers for file download
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log('📤 Sending file:', fileName);
      // Send the file
      return res.send(fileBuffer);

    } catch (generationError) {
      console.error('❌ File generation error:', generationError);
      
      // Check if it's a specific error type
      if (generationError instanceof Error) {
        if (generationError.message.includes('timeout')) {
          return res.status(408).json(
            createErrorResponse('GENERATION_TIMEOUT', 'Document generation took too long. Please try again.')
          );
        }
        
        if (generationError.message.includes('memory')) {
          return res.status(507).json(
            createErrorResponse('INSUFFICIENT_STORAGE', 'Not enough memory to generate document. Please try again later.')
          );
        }
      }
      
      return res.status(500).json(
        createErrorResponse('GENERATION_FAILED', 'Failed to generate document file. Please try again.')
      );
    }

  } catch (error) {
    console.error('❌ Download Report Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to generate download')
    );
  }
};

/**
 * Generate shareable link for report
 * POST /api/reports/:id/share
 */
export const shareReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expiresIn = 7 } = req.body; // Default 7 days
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    // Validate expiration days
    const expirationDays = Math.min(30, Math.max(1, parseInt(expiresIn))); // 1-30 days

    // Find the report
    const report = await Report.findOne({ _id: id, userId });

    if (!report) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Report not found')
      );
    }

    if (report.status !== 'completed') {
      return res.status(400).json(
        createErrorResponse('REPORT_NOT_READY', 'Report analysis is not completed yet')
      );
    }

    // Generate secure sharing token
    const shareToken = generateShareToken(report._id.toString(), userId);
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
    
    // In a real implementation, you would store the share token in database
    // For now, we'll create a shareable URL
    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/shared-report/${shareToken}`;

    return res.status(200).json(
      createSuccessResponse({
        shareUrl,
        shareToken,
        expiresAt,
        expiresIn: expirationDays,
        reportId: report._id,
        patientName: report.patientInfo.name
      }, 'Shareable link generated successfully')
    );

  } catch (error) {
    console.error('Share Report Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to generate shareable link')
    );
  }
};

/**
 * Access shared report (public endpoint)
 * GET /api/reports/shared/:token
 */
export const getSharedReport = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json(
        createErrorResponse('INVALID_TOKEN', 'Share token is required')
      );
    }

    // Verify and decode share token
    const { reportId, userId } = verifyShareToken(token);

    if (!reportId || !userId) {
      return res.status(401).json(
        createErrorResponse('INVALID_TOKEN', 'Invalid or expired share token')
      );
    }

    // Find the report
    const report = await Report.findOne({ _id: reportId, userId });

    if (!report) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Shared report not found or has been removed')
      );
    }

    if (report.status !== 'completed') {
      return res.status(400).json(
        createErrorResponse('REPORT_NOT_READY', 'Report is not available for sharing')
      );
    }

    // Return report data (excluding sensitive user information)
    const reportData = report.toJSON();
    return res.status(200).json(
      createSuccessResponse({
        id: reportData.id,
        patientInfo: reportData.patientInfo,
        analysis: reportData.analysis,
        fileInfo: {
          originalName: reportData.fileInfo.originalName,
          size: reportData.fileInfo.fileSize
        },
        createdAt: reportData.createdAt,
        sharedAt: new Date()
      }, 'Shared report retrieved successfully')
    );

  } catch (error) {
    console.error('Get Shared Report Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve shared report')
    );
  }
};

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'User authentication required')
      );
    }

    const report = await Report.findOneAndDelete({ _id: id, userId });

    if (!report) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Report not found')
      );
    }

    // Clear related cache entries
    cacheService.delete(cacheKeys.report(id));
    
    // Clear all user reports cache entries (since pagination and filters create different cache keys)
    cacheService.clear(); // For now, clear all cache to ensure consistency

    return res.status(200).json(
      createSuccessResponse(null, 'Report deleted successfully')
    );

  } catch (error) {
    console.error('Delete Report Error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to delete report')
    );
  }
};

/**
 * Helper function to download file from Cloudinary
 */
async function downloadFileFromCloudinary(url: string): Promise<Buffer> {
  try {
    console.log('📥 Original URL:', url);
    
    // Convert image/upload URL to raw/upload URL for PDF files
    const rawUrl = url.replace('/image/upload/', '/raw/upload/');
    console.log('🔄 Trying raw URL:', rawUrl);
    
    // Create timeout promise (30 seconds for file download)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('File download timeout after 30 seconds')), 30000);
    });
    
    // Try the raw URL first (for PDF files)
    const downloadPromise = fetch(rawUrl, {
      headers: {
        'User-Agent': 'AI-Health-Analyzer/1.0'
      }
    });
    
    const response = await Promise.race([downloadPromise, timeoutPromise]);
    
    if (response.ok) {
      console.log('✅ Successfully downloaded from raw URL');
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    console.log('🔄 Raw URL failed, trying original URL');
    // If raw URL fails, try the original URL
    const originalDownloadPromise = fetch(url, {
      headers: {
        'User-Agent': 'AI-Health-Analyzer/1.0'
      }
    });
    
    const originalResponse = await Promise.race([originalDownloadPromise, timeoutPromise]);
    
    if (originalResponse.ok) {
      console.log('✅ Successfully downloaded from original URL');
      const arrayBuffer = await originalResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error('❌ Download error details:', error);
    throw new Error(`Failed to download file from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to generate secure share token
 */
function generateShareToken(reportId: string, userId: string): string {
  // In a real implementation, you would use JWT or similar secure token generation
  // For now, create a simple encoded token
  const payload = {
    reportId,
    userId,
    timestamp: Date.now()
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Helper function to verify and decode share token
 */
function verifyShareToken(token: string): { reportId: string; userId: string } | { reportId: null; userId: null } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const payload = JSON.parse(decoded);
    
    // Check if token is not too old (30 days max)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (Date.now() - payload.timestamp > maxAge) {
      return { reportId: null, userId: null };
    }
    
    return {
      reportId: payload.reportId,
      userId: payload.userId
    };
  } catch (error) {
    return { reportId: null, userId: null };
  }
}