import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  }

  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry found';
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Handle Multer errors (file upload)
  if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if ((error as any).code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = 'File upload error';
    }
  }

  // Handle Cloudinary errors
  if (error.message?.includes('cloudinary')) {
    statusCode = 500;
    code = 'STORAGE_ERROR';
    message = 'File storage service error';
  }

  // Handle AI service errors
  if (error.message?.includes('AI') || error.message?.includes('Gemini')) {
    statusCode = 503;
    code = 'AI_SERVICE_ERROR';
    message = 'AI analysis service temporarily unavailable';
  }

  // Log error details
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      code,
      isOperational: error.isOperational || false,
    },
    requestId: req.headers['x-request-id'] || 'unknown',
  };

  // Log error based on environment and severity
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', errorLog);
  } else {
    // In production, log to external service (e.g., Winston, Sentry)
    if (statusCode >= 500) {
      console.error('🚨 Server Error:', errorLog);
    } else {
      console.warn('⚠️ Client Error:', errorLog);
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.details,
        stack: error.stack 
      })
    },
    timestamp: new Date().toISOString(),
    requestId: errorLog.requestId,
  });
};

// Create operational error
export const createError = (
  message: string,
  statusCode: number = 400,
  code?: string,
  details?: any
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code || 'OPERATIONAL_ERROR';
  error.details = details;
  error.isOperational = true;
  return error;
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};