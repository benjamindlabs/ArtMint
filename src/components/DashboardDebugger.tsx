/**
 * Dashboard Debugging Component
 * This component helps debug dashboard issues by showing authentication state and database connectivity
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { FiUser, FiDatabase, FiCheck, FiX, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface DebugInfo {
  authState: {
    user: any;
    profile: any;
    loading: boolean;
  };
  databaseTest: {
    connected: boolean;
    profileExists: boolean;
    error?: string;
  };
  sessionInfo: {
    hasSession: boolean;
    sessionData?: any;
    error?: string;
  };
}

const DashboardDebugger: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    authState: { user: null, profile: null, loading: true },
    databaseTest: { connected: false, profileExists: false },
    sessionInfo: { hasSession: false }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runDiagnostics = async () => {
    setIsRefreshing(true);
    
    // Test 1: Check authentication state
    const authState = {
      user: user,
      profile: profile,
      loading: loading
    };

    // Test 2: Check database connectivity
    let databaseTest = { connected: false, profileExists: false, error: undefined };
    try {
      // Test basic database connection
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (testError) {
        databaseTest.error = testError.message;
      } else {
        databaseTest.connected = true;
      }

      // Test if current user's profile exists
      if (user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData && !profileError) {
          databaseTest.profileExists = true;
        } else if (profileError) {
          databaseTest.error = profileError.message;
        }
      }
    } catch (error: any) {
      databaseTest.error = error.message;
    }

    // Test 3: Check session info
    let sessionInfo = { hasSession: false, sessionData: undefined, error: undefined };
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        sessionInfo.error = sessionError.message;
      } else if (session) {
        sessionInfo.hasSession = true;
        sessionInfo.sessionData = {
          userId: session.user?.id,
          email: session.user?.email,
          expiresAt: session.expires_at
        };
      }
    } catch (error: any) {
      sessionInfo.error = error.message;
    }

    setDebugInfo({
      authState,
      databaseTest,
      sessionInfo
    });
    
    setIsRefreshing(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [user, profile, loading]);

  const createProfile = async () => {
    if (!user?.id || !user?.email) return;

    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          username: `user_${user.id.substring(0, 8)}`
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Profile created:', result.profile);
        alert('Profile created successfully!');
        runDiagnostics();
        // Refresh the page to reload the dashboard
        setTimeout(() => window.location.href = '/dashboard', 1000);
      } else {
        console.error('Error creating profile:', result.error);
        alert(`Error creating profile: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error creating profile:', error);
      alert(`Error creating profile: ${error.message}`);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | undefined }) => {
    if (status === undefined) return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
    return status ? <FiCheck className="w-5 h-5 text-green-500" /> : <FiX className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FiUser className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Diagnostics
            </h2>
          </div>
          
          <button
            onClick={runDiagnostics}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Authentication State */}
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <StatusIcon status={!!debugInfo.authState.user} />
            <span className="ml-2">Authentication State</span>
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">User Authenticated:</span>
              <span className={debugInfo.authState.user ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.authState.user ? 'Yes' : 'No'}
              </span>
            </div>
            
            {debugInfo.authState.user && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">
                    {debugInfo.authState.user.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-gray-900 dark:text-white">
                    {debugInfo.authState.user.email}
                  </span>
                </div>
              </>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Profile Loaded:</span>
              <span className={debugInfo.authState.profile ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.authState.profile ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Loading:</span>
              <span className={debugInfo.authState.loading ? 'text-yellow-600' : 'text-green-600'}>
                {debugInfo.authState.loading ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Connectivity */}
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <StatusIcon status={debugInfo.databaseTest.connected} />
            <span className="ml-2">Database Connectivity</span>
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Database Connected:</span>
              <span className={debugInfo.databaseTest.connected ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.databaseTest.connected ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Profile Exists:</span>
              <span className={debugInfo.databaseTest.profileExists ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.databaseTest.profileExists ? 'Yes' : 'No'}
              </span>
            </div>
            
            {debugInfo.databaseTest.error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <span className="text-red-600 dark:text-red-400 text-xs">
                  Error: {debugInfo.databaseTest.error}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Information */}
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <StatusIcon status={debugInfo.sessionInfo.hasSession} />
            <span className="ml-2">Session Information</span>
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Has Session:</span>
              <span className={debugInfo.sessionInfo.hasSession ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.sessionInfo.hasSession ? 'Yes' : 'No'}
              </span>
            </div>
            
            {debugInfo.sessionInfo.sessionData && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Session User ID:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">
                    {debugInfo.sessionInfo.sessionData.userId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Session Email:</span>
                  <span className="text-gray-900 dark:text-white">
                    {debugInfo.sessionInfo.sessionData.email}
                  </span>
                </div>
              </>
            )}
            
            {debugInfo.sessionInfo.error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <span className="text-red-600 dark:text-red-400 text-xs">
                  Error: {debugInfo.sessionInfo.error}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {debugInfo.authState.user && !debugInfo.databaseTest.profileExists && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Profile Missing
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Your user profile doesn't exist in the database. This might be why the dashboard isn't loading.
                </p>
              </div>
              <button
                onClick={createProfile}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardDebugger;
