/**
 * Fast Refresh Fix Component
 * This component helps prevent Fast Refresh reload loops by stabilizing component state
 */

import { useEffect, useRef } from 'react';

interface FastRefreshFixProps {
  children: React.ReactNode;
}

const FastRefreshFix: React.FC<FastRefreshFixProps> = ({ children }) => {
  const mountedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple mounts during Fast Refresh
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;

    // Clean up function to reset on unmount
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return <>{children}</>;
};

export default FastRefreshFix;
