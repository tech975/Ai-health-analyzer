import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface ClientInfo {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private clients = new Map<string, ClientInfo>();
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options
    };

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const clientId = this.getClientId(req);
    const now = Date.now();
    
    let clientInfo = this.clients.get(clientId);
    
    // Initialize or reset if window has passed
    if (!clientInfo || now > clientInfo.resetTime) {
      clientInfo = {
        count: 0,
        resetTime: now + this.options.windowMs
      };
      this.clients.set(clientId, clientInfo);
    }

    // Check if limit exceeded
    if (clientInfo.count >= this.options.maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: this.options.message,
          retryAfter: Math.ceil((clientInfo.resetTime - now) / 1000)
        }
      });
      return;
    }

    // Increment counter
    clientInfo.count++;

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': this.options.maxRequests.toString(),
      'X-RateLimit-Remaining': (this.options.maxRequests - clientInfo.count).toString(),
      'X-RateLimit-Reset': new Date(clientInfo.resetTime).toISOString()
    });

    // Handle response to potentially skip counting
    const originalSend = res.send;
    const self = this;
    res.send = function(this: Response, body: any): Response {
      const statusCode = res.statusCode;
      
      // Decrement counter if we should skip this request
      if (
        (statusCode >= 200 && statusCode < 300 && self.options.skipSuccessfulRequests) ||
        (statusCode >= 400 && self.options.skipFailedRequests)
      ) {
        clientInfo!.count--;
      }
      
      return originalSend.call(this, body);
    };

    next();
  };

  private getClientId(req: Request): string {
    // Use IP address as client identifier
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [clientId, clientInfo] of this.clients.entries()) {
      if (now > clientInfo.resetTime) {
        this.clients.delete(clientId);
      }
    }
  }

  getStats(): { totalClients: number; activeClients: number } {
    const now = Date.now();
    let activeClients = 0;
    
    for (const clientInfo of this.clients.values()) {
      if (now <= clientInfo.resetTime) {
        activeClients++;
      }
    }

    return {
      totalClients: this.clients.size,
      activeClients
    };
  }
}

// Pre-configured rate limiters
export const generalRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.'
});

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

export const uploadRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
  message: 'Too many file uploads, please wait before uploading again.'
});

export const analysisRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 analysis requests per minute
  message: 'Too many analysis requests, please wait before requesting another analysis.'
});

export { RateLimiter };