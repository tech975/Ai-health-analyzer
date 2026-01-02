import { cloudinary } from '../config/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['.pdf'];

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter function for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only PDF files are allowed'));
  }

  // Check file extension
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return cb(new Error('Only PDF files are allowed'));
  }

  cb(null, true);
};

// Multer upload configuration
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

// Interface for upload result
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  bytes: number;
  format: string;
  resource_type: string;
}

// Upload file to Cloudinary
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  originalName: string,
  folder: string = 'health-reports'
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'raw' as const, // Use 'raw' for PDF files
      public_id: `${folder}/${Date.now()}-${originalName.replace(/\.[^/.]+$/, '')}`,
      access_mode: 'public' as const, // Ensure public access
      type: 'upload' as const,
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            original_filename: originalName,
            bytes: result.bytes,
            format: result.format,
            resource_type: result.resource_type,
          });
        } else {
          reject(new Error('Unknown error occurred during upload'));
        }
      }
    ).end(fileBuffer);
  });
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto',
    });
    
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete file: ${result.result}`);
    }
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validate file before upload
export const validateFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { isValid: false, error: 'Only PDF files are allowed' };
  }

  // Check file extension
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return { isValid: false, error: 'Only PDF files are allowed' };
  }

  return { isValid: true };
};

// Get file info from Cloudinary
export const getFileInfo = async (publicId: string) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'auto',
    });
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      bytes: result.bytes,
      format: result.format,
      created_at: result.created_at,
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};