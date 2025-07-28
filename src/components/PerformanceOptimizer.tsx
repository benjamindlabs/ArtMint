import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface PerformanceOptimizerProps {
  enableLogging?: boolean;
  enableOptimizations?: boolean;
}

export default function PerformanceOptimizer({
  enableLogging = process.env.NODE_ENV === 'development',
  enableOptimizations = true
}: PerformanceOptimizerProps) {
  // Always call hooks first, then return early if needed
  const router = useRouter();
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const navigationStartTime = useRef<number>(0);

  // Track page navigation performance
  useEffect(() => {
    const handleRouteChangeStart = () => {
      navigationStartTime.current = performance.now();
    };

    const handleRouteChangeComplete = () => {
      const loadTime = performance.now() - navigationStartTime.current;
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
      
      if (enableLogging) {
        console.log(`🚀 Page loaded in ${loadTime.toFixed(2)}ms`);
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router, enableLogging]);

  // Collect Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, firstContentfulPaint: entry.startTime }));
              if (enableLogging) {
                console.log(`🎨 First Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
              }
            }
            break;
          
          case 'largest-contentful-paint':
            setMetrics(prev => ({ ...prev, largestContentfulPaint: entry.startTime }));
            if (enableLogging) {
              console.log(`🖼️ Largest Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
            }
            break;
          
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              setMetrics(prev => ({ 
                ...prev, 
                cumulativeLayoutShift: (prev.cumulativeLayoutShift || 0) + (entry as any).value 
              }));
            }
            break;
          
          case 'first-input':
            setMetrics(prev => ({ ...prev, firstInputDelay: (entry as any).processingStart - entry.startTime }));
            if (enableLogging) {
              console.log(`⚡ First Input Delay: ${((entry as any).processingStart - entry.startTime).toFixed(2)}ms`);
            }
            break;
        }
      }
    });

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => observer.disconnect();
  }, [enableLogging]);

  // Performance optimizations
  useEffect(() => {
    if (!enableOptimizations || typeof window === 'undefined') return;

    // Preload critical resources
    const preloadCriticalResources = () => {
      const criticalImages = document.querySelectorAll('img[data-priority="high"]');
      criticalImages.forEach((img) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = (img as HTMLImageElement).src;
        document.head.appendChild(link);
      });
    };

    // Optimize images
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-optimize="true"]');
      images.forEach((img) => {
        const htmlImg = img as HTMLImageElement;
        if (!htmlImg.loading) {
          htmlImg.loading = 'lazy';
        }
        if (!htmlImg.decoding) {
          htmlImg.decoding = 'async';
        }
      });
    };

    // Defer non-critical scripts
    const deferNonCriticalScripts = () => {
      const scripts = document.querySelectorAll('script[data-defer="true"]');
      scripts.forEach((script) => {
        const htmlScript = script as HTMLScriptElement;
        if (!htmlScript.defer && !htmlScript.async) {
          htmlScript.defer = true;
        }
      });
    };

    // Apply optimizations
    preloadCriticalResources();
    optimizeImages();
    deferNonCriticalScripts();

    // Set up intersection observer for lazy loading
    const lazyElements = document.querySelectorAll('[data-lazy="true"]');
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          element.classList.add('lazy-loaded');
          lazyObserver.unobserve(element);
        }
      });
    }, { rootMargin: '50px' });

    lazyElements.forEach((element) => lazyObserver.observe(element));

    return () => lazyObserver.disconnect();
  }, [enableOptimizations]);

  // Log performance summary
  useEffect(() => {
    if (!enableLogging) return;

    const logPerformanceSummary = () => {
      console.group('📊 Performance Metrics');
      console.log('Page Load Time:', metrics.pageLoadTime?.toFixed(2) + 'ms' || 'N/A');
      console.log('First Contentful Paint:', metrics.firstContentfulPaint?.toFixed(2) + 'ms' || 'N/A');
      console.log('Largest Contentful Paint:', metrics.largestContentfulPaint?.toFixed(2) + 'ms' || 'N/A');
      console.log('Cumulative Layout Shift:', metrics.cumulativeLayoutShift?.toFixed(4) || 'N/A');
      console.log('First Input Delay:', metrics.firstInputDelay?.toFixed(2) + 'ms' || 'N/A');
      console.groupEnd();

      // Performance recommendations
      const recommendations = [];
      if (metrics.pageLoadTime && metrics.pageLoadTime > 3000) {
        recommendations.push('⚠️ Page load time is slow (>3s). Consider code splitting and lazy loading.');
      }
      if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 1800) {
        recommendations.push('⚠️ First Contentful Paint is slow (>1.8s). Optimize critical rendering path.');
      }
      if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
        recommendations.push('⚠️ Largest Contentful Paint is slow (>2.5s). Optimize images and fonts.');
      }
      if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
        recommendations.push('⚠️ High Cumulative Layout Shift (>0.1). Add size attributes to images and containers.');
      }
      if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
        recommendations.push('⚠️ High First Input Delay (>100ms). Reduce JavaScript execution time.');
      }

      if (recommendations.length > 0) {
        console.group('💡 Performance Recommendations');
        recommendations.forEach(rec => console.log(rec));
        console.groupEnd();
      }
    };

    const timer = setTimeout(logPerformanceSummary, 5000);
    return () => clearTimeout(timer);
  }, [metrics, enableLogging]);

  // Resource hints for better performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add DNS prefetch for external domains
    const externalDomains = [
      'picsum.photos',
      'ipfs.io',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com'
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect to critical third-party origins
    const criticalOrigins = [
      'https://ipfs.io',
      'https://gateway.pinata.cloud'
    ];

    criticalOrigins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, []);

  // This component doesn't render anything visible
  return null;
}

// Hook for accessing performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const newMetrics: Partial<PerformanceMetrics> = {};
      
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              newMetrics.firstContentfulPaint = entry.startTime;
            }
            break;
          case 'largest-contentful-paint':
            newMetrics.largestContentfulPaint = entry.startTime;
            break;
          case 'first-input':
            newMetrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
            break;
        }
      }

      setMetrics(prev => ({ ...prev, ...newMetrics }));
    });

    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] });
    } catch (error) {
      console.warn('Performance Observer not supported');
    }

    return () => observer.disconnect();
  }, []);

  return metrics;
}


