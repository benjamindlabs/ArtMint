/**
 * Performance utility functions
 */

import React, { useEffect } from 'react';

// Utility function to measure component render time
export function measureRenderTime(componentName: string) {
  return function <T extends React.ComponentType<any>>(Component: T): T {
    const MeasuredComponent = (props: any) => {
      useEffect(() => {
        const startTime = performance.now();

        return () => {
          const endTime = performance.now();
          console.log(`⏱️ ${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
        };
      });

      return React.createElement(Component, props);
    };

    MeasuredComponent.displayName = `Measured(${componentName})`;
    return MeasuredComponent as T;
  };
}

// Performance monitoring utilities
export const performanceUtils = {
  // Measure function execution time
  measureExecutionTime: <T extends (...args: any[]) => any>(
    fn: T,
    label?: string
  ): T => {
    return ((...args: any[]) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (label) {
        console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    }) as T;
  },

  // Get memory usage information
  getMemoryUsage: () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
    return null;
  },

  // Get connection information
  getConnectionInfo: () => {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }
};
