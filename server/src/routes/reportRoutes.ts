import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/fileUploadService';
import { 
  uploadReport,
  analyzeReport, 
  getReport, 
  getUserReports,
  searchReports,
  downloadReport,
  shareReport,
  getSharedReport,
  deleteReport 
} from '../controllers/reportController';

const router = Router();

// Timeout middleware for long-running operations
const extendTimeout = (timeoutMs: number) => {
  return (req: any, res: any, next: any) => {
    req.setTimeout(timeoutMs);
    res.setTimeout(timeoutMs);
    next();
  };
};

// Public route for shared reports (no authentication required)
router.get('/shared/:token', getSharedReport);

// All other report routes are protected with authentication
router.use(authenticate);

// POST /api/reports/upload - Create report with uploaded file (protected)
router.post('/upload', uploadReport);

// POST /api/reports/analyze - Analyze health report with AI (protected) - Extended timeout
router.post('/analyze', extendTimeout(180000), analyzeReport); // 3 minutes

// GET /api/reports/search - Search reports with advanced filtering (protected)
router.get('/search', searchReports);

// POST /api/reports/:id/download - Generate download link for report (protected) - Extended timeout
router.post('/:id/download', extendTimeout(60000), downloadReport); // 1 minute

// POST /api/reports/:id/share - Generate shareable link for report (protected)
router.post('/:id/share', shareReport);

// GET /api/reports/:id - Get specific report (protected)
router.get('/:id', getReport);

// GET /api/reports/user/:userId - Get user's reports (protected)
router.get('/user/:userId', getUserReports);

// DELETE /api/reports/:id - Delete report (protected)
router.delete('/:id', deleteReport);

export default router;