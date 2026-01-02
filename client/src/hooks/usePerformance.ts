import { useEffect, useRef } from 'react';
import { measurePerformance, trackMemoryUsage } from '../utils/performance';

// Hook for measuring component render performance
export const useRenderPerformance = (componentName: string) => {
  const renderStart = useRef<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart.current;
    
    if (import.meta.env.DEV && renderTime > 16) { // Warn if render takes more than 16ms
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });
};

// Hook for measuring async operations
export const useAsyncPerformance = () => {
  const measureAsync = async <T>(
    name: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const end = performance.now();
      
      if (import.meta.env.DEV) {
        console.log(`📊 ${name} completed in ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      
      if (import.meta.env.DEV) {
        console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms`, error);
      }
      
      throw error;
    }
  };

  return { measureAsync };
};

// Hook for memory monitoring
export const useMemoryMonitoring = (interval: number = 30000) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const intervalId = setInterval(() => {
        trackMemoryUsage();
      }, interval);

      return () => clearInterval(intervalId);
    }
  }, [interval]);
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) => {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(callback);
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};