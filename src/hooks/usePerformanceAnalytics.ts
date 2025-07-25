import { useEffect } from 'react';
import { usePerformance } from './usePerformance';

// Performance analytics hook for sending data to analytics services
const usePerformanceAnalytics = () => {
  const { metrics, webVitals } = usePerformance();

  useEffect(() => {
    // Send performance data to analytics service
    const sendAnalytics = () => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        // Google Analytics 4 custom events
        (window as any).gtag('event', 'web_vitals', {
          custom_map: {
            metric_lcp: 'largest_contentful_paint',
            metric_fid: 'first_input_delay',
            metric_cls: 'cumulative_layout_shift',
            metric_fcp: 'first_contentful_paint'
          },
          metric_lcp: webVitals.LCP,
          metric_fid: webVitals.FID,
          metric_cls: webVitals.CLS,
          metric_fcp: webVitals.FCP
        });

        (window as any).gtag('event', 'performance_metrics', {
          custom_map: {
            metric_memory: 'memory_usage',
            metric_connection: 'connection_type',
            metric_load_time: 'page_load_time'
          },
          metric_memory: metrics.memoryUsage,
          metric_connection: metrics.connectionType,
          metric_load_time: metrics.loadTime
        });
      }

      // Send to custom analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'performance',
            metrics,
            webVitals,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
          })
        }).catch(console.error);
      }
    };

    // Send analytics after a delay to ensure metrics are collected
    const timer = setTimeout(sendAnalytics, 5000);
    return () => clearTimeout(timer);
  }, [metrics, webVitals]);
};

export default usePerformanceAnalytics;
