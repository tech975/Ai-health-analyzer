import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'http';
import { connectDatabase, getDbStats } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { performanceMiddleware, performanceMonitor } from './middleware/performanceMonitor';
import { generalRateLimit, authRateLimit, uploadRateLimit, analysisRateLimit } from './middleware/rateLimiter';
import { validateCloudinaryConfig } from './config/cloudinary';
import { cacheService } from './services/cacheService';
import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import fileRoutes from './routes/fileRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Server instance for graceful shutdown
let server: Server;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security and performance middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Performance monitoring
app.use(performanceMiddleware);

// Request ID for tracing
app.use(requestIdMiddleware);

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// Health check endpoint with detailed status
app.get('/api/health', async (_req, res) => {
  const dbStats = await getDbStats();
  const cacheStats = cacheService.getStats();
  const performanceStats = performanceMonitor.getStats();
  
  res.json({ 
    status: 'OK', 
    message: 'AI Health Analyzer API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbStats,
    cache: cacheStats,
    performance: performanceStats,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Performance monitoring endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/metrics', (_req, res) => {
    res.json({
      performance: performanceMonitor.getStats(),
      cache: cacheService.getStats(),
      slowRequests: performanceMonitor.getSlowRequests(500)
    });
  });
}

// Apply rate limiting to routes
app.use('/api/auth/login', authRateLimit.middleware);
app.use('/api/auth/register', authRateLimit.middleware);
app.use('/api/files/upload', uploadRateLimit.middleware);
app.use('/api/reports/analyze', analysisRateLimit.middleware);
app.use('/api', generalRateLimit.middleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/files', fileRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    // Stop accepting new connections
    server.close((err?: Error) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Start server
const startServer = async () => {
  try {
    // Validate Cloudinary configuration
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is invalid');
    }
    
    await connectDatabase();
    
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`☁️ Cloudinary configured successfully`);
      console.log(`⚡ Performance monitoring enabled`);
      console.log(`🛡️ Rate limiting enabled`);
      console.log(`💾 Caching enabled`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;