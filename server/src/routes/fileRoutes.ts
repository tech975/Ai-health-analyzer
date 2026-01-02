import express from 'express';
import { upload } from '../services/fileUploadService';
import { authenticate } from '../middleware/auth';
import {
  uploadFile,
  getFile,
  deleteFile,
  getUserFiles,
} from '../controllers/fileController';

const router = express.Router();

// Timeout middleware for long-running operations
const extendTimeout = (timeoutMs: number) => {
  return (req: any, res: any, next: any) => {
    req.setTimeout(timeoutMs);
    res.setTimeout(timeoutMs);
    next();
  };
};

// All file routes require authentication
router.use(authenticate);

// POST /api/files/upload - Upload a file - Extended timeout for large files
router.post('/upload', extendTimeout(300000), upload.single('file'), uploadFile); // 5 minutes

// GET /api/files - Get user's files with pagination
router.get('/', getUserFiles);

// GET /api/files/:id - Get specific file metadata
router.get('/:id', getFile);

// DELETE /api/files/:id - Delete a file
router.delete('/:id', deleteFile);

export default router;