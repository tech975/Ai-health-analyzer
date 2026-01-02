// In-memory caching service for backend performance optimization

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Clean up expired items every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const iterator = this.cache.keys();
      const oldestKey = iterator.next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  // Cache wrapper for async functions
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const cacheKeys = {
  userReports: (userId: string, filters?: any) => 
    `user-reports:${userId}:${JSON.stringify(filters || {})}`,
  report: (reportId: string) => `report:${reportId}`,
  userProfile: (userId: string) => `user:${userId}`,
  reportAnalysis: (reportId: string) => `analysis:${reportId}`,
};