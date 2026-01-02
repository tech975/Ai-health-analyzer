// Image optimization utilities

export interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

// Lazy loading intersection observer
export const createLazyLoadObserver = (callback: (entry: IntersectionObserverEntry) => void) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback(entry);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }
  return null;
};

// Image preloading utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Responsive image source generator
export const generateResponsiveImageSrc = (
  baseUrl: string, 
  width: number, 
  options: ImageOptimizationOptions = {}
): string => {
  const { quality = 80, format = 'webp' } = options;
  
  // For Cloudinary URLs, add transformation parameters
  if (baseUrl.includes('cloudinary.com')) {
    const transformations = [
      `w_${width}`,
      `q_${quality}`,
      `f_${format}`,
      'c_limit'
    ].join(',');
    
    return baseUrl.replace('/upload/', `/upload/${transformations}/`);
  }
  
  return baseUrl;
};

// Image compression utility for file uploads
export const compressImage = (
  file: File, 
  options: ImageOptimizationOptions = {}
): Promise<File> => {
  return new Promise((resolve) => {
    const { quality = 0.8, maxWidth = 1920, maxHeight = 1080 } = options;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};