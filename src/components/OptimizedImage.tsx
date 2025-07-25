/**
 * Optimized Image Component with lazy loading, error handling, and performance features
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiImage, FiAlertCircle } from 'react-icons/fi';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  onLoad,
  onError,
  fallbackSrc,
  showLoadingSpinner = true,
  aspectRatio = 'auto'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
    
    // Try fallback image if provided
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageError(false);
      return;
    }
  };

  // Generate blur placeholder
  const generateBlurDataURL = (width: number = 10, height: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL();
  };

  // Get aspect ratio classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case '4:3':
        return 'aspect-[4/3]';
      case '16:9':
        return 'aspect-video';
      default:
        return '';
    }
  };

  // Container classes
  const containerClasses = `
    relative overflow-hidden bg-gray-100 dark:bg-gray-800
    ${!fill && aspectRatio !== 'auto' ? getAspectRatioClass() : ''}
    ${className}
  `.trim();

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="flex flex-col items-center space-y-2">
        {showLoadingSpinner && (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        )}
        <FiImage className="w-8 h-8 text-gray-400" />
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
      <div className="flex flex-col items-center space-y-2 text-gray-500 dark:text-gray-400">
        <FiAlertCircle className="w-8 h-8" />
        <span className="text-sm font-medium">Failed to load image</span>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className={containerClasses}>
      {/* Loading state */}
      {!imageLoaded && !imageError && <LoadingSpinner />}

      {/* Error state */}
      {imageError && <ErrorState />}

      {/* Image */}
      {isInView && !imageError && (
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined)}
          sizes={sizes}
          className={`
            transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            ${fill ? 'object-cover' : ''}
          `}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Overlay for additional effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

// Preset configurations for common use cases
export const NFTImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'sizes'>> = (props) => (
  <OptimizedImage
    {...props}
    aspectRatio="square"
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  />
);

export const ProfileImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'sizes'>> = (props) => (
  <OptimizedImage
    {...props}
    aspectRatio="square"
    sizes="(max-width: 640px) 20vw, 10vw"
    className={`rounded-full ${props.className || ''}`}
  />
);

export const BannerImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'sizes'>> = (props) => (
  <OptimizedImage
    {...props}
    aspectRatio="16:9"
    sizes="100vw"
  />
);

export const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'aspectRatio' | 'sizes'>> = (props) => (
  <OptimizedImage
    {...props}
    aspectRatio="square"
    sizes="(max-width: 640px) 25vw, 15vw"
    quality={60}
  />
);

// Image preloader utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Image compression utility (client-side)
export const compressImage = (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Generate responsive image sizes
export const generateImageSizes = (breakpoints: { [key: string]: string }) => {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .join(', ');
};

export default OptimizedImage;
