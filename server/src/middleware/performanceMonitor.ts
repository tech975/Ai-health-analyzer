import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number;

  constructor(maxMetrics: number = 1000) {
    this.maxMetrics = maxMetrics;
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    const self = this;

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(this: Response, ...args: any[]): Response {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const endMemory = process.memoryUsage();

      // Record metrics
      const metric: PerformanceMetrics = {
        endpoint: req.route?.path || req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        timestamp: new Date(),
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        }
      };

      self.recordMetric(metric);

      // Log slow requests in development
      if (process.env.NODE_ENV === 'development' && responseTime > 1000) {
        console.warn(`🐌 Slow request detected: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
      }

      // Add performance headers
      res.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);

      return (originalEnd as any).apply(this, args);
    };

    next();
  };

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageResponseTime(endpoint?: string): number {
    let filteredMetrics = this.metrics;
    
    if (endpoint) {
      filteredMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    }

    if (filteredMetrics.length === 0) return 0;

    const total = filteredMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return total / filteredMetrics.length;
  }

  getSlowRequests(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.responseTime > threshold);
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;

    const errorCount = this.metrics.filter(metric => metric.statusCode >= 400).length;
    return (errorCount / this.metrics.length) * 100;
  }

  getStats(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequests: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      totalRequests: this.metrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      slowRequests: this.getSlowRequests().length,
      memoryUsage: process.memoryUsage()
    };
  }

  reset(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware function
export const performanceMiddleware = performanceMonitor.middleware;