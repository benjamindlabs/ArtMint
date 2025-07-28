/**
 * Performance monitoring component for development and analytics
 */

import React, { useState, useEffect } from 'react';
import { usePerformance, useMemoryMonitor, useNetworkStatus } from '../hooks/usePerformance';
import { FiActivity, FiWifi, FiWifiOff, FiMonitor, FiClock } from 'react-icons/fi';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showInProduction = false,
  position = 'bottom-right',
  minimized = true
}) => {
  // Temporarily disabled to fix Fast Refresh issues
  // Always call hooks first, then return early if needed
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!minimized);
  const { metrics, webVitals } = usePerformance();
  const memoryUsage = useMemoryMonitor();
  const { isOnline, connectionType } = useNetworkStatus();

  // Only show in development unless explicitly enabled for production
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    setIsVisible(isDevelopment || showInProduction);
  }, [showInProduction]);

  // Return null after hooks are called
  return null;

  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const getScoreColor = (score: number, thresholds: { good: number; needs_improvement: number }) => {
    if (score <= thresholds.good) return 'text-green-500';
    if (score <= thresholds.needs_improvement) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatTime = (time: number | null) => {
    if (time === null) return 'N/A';
    return `${time.toFixed(0)}ms`;
  };

  const formatMemory = (memory: number) => {
    return `${memory.toFixed(1)}MB`;
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <div className="bg-black/90 text-white rounded-lg shadow-lg backdrop-blur-sm border border-gray-700">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <FiActivity className="w-4 h-4" />
            <span className="text-sm font-medium">Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Network status indicator */}
            {isOnline ? (
              <FiWifi className="w-4 h-4 text-green-500" />
            ) : (
              <FiWifiOff className="w-4 h-4 text-red-500" />
            )}
            {/* Memory usage indicator */}
            {memoryUsage && (
              <div className={`w-2 h-2 rounded-full ${
                memoryUsage.percentage > 80 ? 'bg-red-500' : 
                memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
            )}
            <span className="text-xs">
              {isExpanded ? '−' : '+'}
            </span>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 text-xs">
            {/* Web Vitals */}
            <div>
              <h4 className="font-medium mb-2 text-gray-300">Web Vitals</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">LCP:</span>
                  <span className={`ml-1 ${getScoreColor(webVitals.LCP || 0, { good: 2500, needs_improvement: 4000 })}`}>
                    {formatTime(webVitals.LCP)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">FID:</span>
                  <span className={`ml-1 ${getScoreColor(webVitals.FID || 0, { good: 100, needs_improvement: 300 })}`}>
                    {formatTime(webVitals.FID)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">CLS:</span>
                  <span className={`ml-1 ${getScoreColor(webVitals.CLS || 0, { good: 0.1, needs_improvement: 0.25 })}`}>
                    {webVitals.CLS?.toFixed(3) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">FCP:</span>
                  <span className={`ml-1 ${getScoreColor(webVitals.FCP || 0, { good: 1800, needs_improvement: 3000 })}`}>
                    {formatTime(webVitals.FCP)}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="font-medium mb-2 text-gray-300">Performance</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Load Time:</span>
                  <span>{formatTime(metrics.loadTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Render Time:</span>
                  <span>{formatTime(metrics.renderTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interaction:</span>
                  <span>{formatTime(metrics.interactionTime)}</span>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            {memoryUsage && (
              <div>
                <h4 className="font-medium mb-2 text-gray-300">Memory</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Used:</span>
                    <span>{formatMemory(memoryUsage.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span>{formatMemory(memoryUsage.total)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${
                        memoryUsage.percentage > 80 ? 'bg-red-500' : 
                        memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(memoryUsage.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Network Info */}
            <div>
              <h4 className="font-medium mb-2 text-gray-300">Network</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="capitalize">{connectionType}</span>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div>
              <h4 className="font-medium mb-2 text-gray-300">Tips</h4>
              <div className="space-y-1 text-gray-400">
                {webVitals.LCP && webVitals.LCP > 2500 && (
                  <div className="flex items-center space-x-1">
                    <FiClock className="w-3 h-3" />
                    <span>Optimize LCP with image preloading</span>
                  </div>
                )}
                {webVitals.CLS && webVitals.CLS > 0.1 && (
                  <div className="flex items-center space-x-1">
                    <FiMonitor className="w-3 h-3" />
                    <span>Reduce layout shifts</span>
                  </div>
                )}
                {memoryUsage && memoryUsage.percentage > 80 && (
                  <div className="flex items-center space-x-1">
                    <FiActivity className="w-3 h-3" />
                    <span>High memory usage detected</span>
                  </div>
                )}
                {connectionType === 'slow-2g' && (
                  <div className="flex items-center space-x-1">
                    <FiWifi className="w-3 h-3" />
                    <span>Optimize for slow connection</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



export default PerformanceMonitor;
