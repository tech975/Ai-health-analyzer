import { Request, Response } from 'express';
import { FileRecord } from '../models/FileRecord';
import { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  validateFile,
  getFileInfo 
} from '../services/fileUploadService';
import patientInfoExtractionService from '../services/patientInfoExtractionService';
import { AuthRequest } from '../types';

// Upload file endpoint
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if file is provided
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file provided',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate file
    const validation = validateFile(req.file);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: validation.error,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'health-reports'
    );

    // Save file metadata to database
    const fileRecord = new FileRecord({
      userId: req.user.id,
      originalName: req.file.originalname,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      fileSize: uploadResult.bytes,
      mimeType: req.file.mimetype,
    });

    await fileRecord.save();

    res.status(201).json({
      success: true,
      data: {
        fileId: fileRecord._id,
        originalName: fileRecord.originalName,
        url: fileRecord.cloudinaryUrl,
        size: fileRecord.fileSize,
        sizeMB: fileRecord.fileSizeMB,
        uploadedAt: fileRecord.uploadedAt,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'File upload failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// Get file metadata endpoint
export const getFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;

    // Find file record
    const fileRecord = await FileRecord.findOne({
      _id: id,
      userId: req.user.id, // Ensure user can only access their own files
    });

    if (!fileRecord) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        fileId: fileRecord._id,
        originalName: fileRecord.originalName,
        url: fileRecord.cloudinaryUrl,
        size: fileRecord.fileSize,
        sizeMB: fileRecord.fileSizeMB,
        mimeType: fileRecord.mimeType,
        uploadedAt: fileRecord.uploadedAt,
        reportId: fileRecord.reportId,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FILE_FAILED',
        message: 'Failed to retrieve file',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// Delete file endpoint
export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;

    // Find file record
    const fileRecord = await FileRecord.findOne({
      _id: id,
      userId: req.user.id, // Ensure user can only delete their own files
    });

    if (!fileRecord) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(fileRecord.cloudinaryPublicId);

    // Delete from database
    await FileRecord.findByIdAndDelete(fileRecord._id);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete file',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// Extract patient info from uploaded PDF
export const extractPatientInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { fileId } = req.body;

    if (!fileId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE_ID',
          message: 'File ID is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Find the file record
    const fileRecord = await FileRecord.findOne({
      _id: fileId,
      userId: req.user.id,
    });

    if (!fileRecord) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Download file from Cloudinary
    const fileBuffer = await downloadFileFromCloudinary(fileRecord.cloudinaryUrl);

    // Extract patient info from PDF
    const extractedInfo = await patientInfoExtractionService.extractPatientInfoFromPDF(fileBuffer);

    res.status(200).json({
      success: true,
      data: {
        fileId: fileRecord._id,
        extractedPatientInfo: extractedInfo,
        fileName: fileRecord.originalName,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Extract patient info error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to extract patient information',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// Helper function to download file from Cloudinary
async function downloadFileFromCloudinary(url: string): Promise<Buffer> {
  try {
    const rawUrl = url.replace('/image/upload/', '/raw/upload/');
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('File download timeout')), 30000);
    });
    
    const downloadPromise = fetch(rawUrl, {
      headers: { 'User-Agent': 'AI-Health-Analyzer/1.0' }
    });
    
    const response = await Promise.race([downloadPromise, timeoutPromise]);
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    const originalDownloadPromise = fetch(url, {
      headers: { 'User-Agent': 'AI-Health-Analyzer/1.0' }
    });
    
    const originalResponse = await Promise.race([originalDownloadPromise, timeoutPromise]);
    
    if (originalResponse.ok) {
      const arrayBuffer = await originalResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    throw new Error('Failed to download file from Cloudinary');
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// Get user's files endpoint
export const getUserFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get user's files with pagination
    const files = await FileRecord.find({ userId: req.user.id })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const totalFiles = await FileRecord.countDocuments({ userId: req.user.id });
    const totalPages = Math.ceil(totalFiles / limit);

    res.status(200).json({
      success: true,
      data: {
        files: files.map(file => ({
          fileId: file._id,
          originalName: file.originalName,
          url: file.cloudinaryUrl,
          size: file.fileSize,
          sizeMB: file.fileSizeMB,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
          reportId: file.reportId,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalFiles,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FILES_FAILED',
        message: 'Failed to retrieve files',
      },
      timestamp: new Date().toISOString(),
    });
  }
};