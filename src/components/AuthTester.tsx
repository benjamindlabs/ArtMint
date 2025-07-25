/**
 * Authentication Testing Component
 * This component helps test and debug authentication functionality
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { isValidEmail, isValidPassword, isValidUsername, authRateLimiter } from '../utils/validation';
import { FiCheck, FiX, FiAlertCircle, FiUser, FiDatabase, FiShield } from 'react-icons/fi';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: string;
}

const AuthTester: React.FC = () => {
  const { user, signUp, signIn, signOut } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testEmail] = useState(`test${Date.now()}@example.com`);
  const [testPassword] = useState('TestPassword123!');
  const [testUsername] = useState(`testuser${Date.now()}`);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Validation Functions
  const testValidationFunctions = async () => {
    addResult({
      name: 'Email Validation',
      status: isValidEmail('test@example.com') ? 'pass' : 'fail',
      message: isValidEmail('test@example.com') ? 'Valid email accepted' : 'Valid email rejected'
    });

    addResult({
      name: 'Invalid Email Rejection',
      status: !isValidEmail('invalid-email') ? 'pass' : 'fail',
      message: !isValidEmail('invalid-email') ? 'Invalid email rejected' : 'Invalid email accepted'
    });

    const passwordTest = isValidPassword(testPassword);
    addResult({
      name: 'Password Validation',
      status: passwordTest.isValid ? 'pass' : 'fail',
      message: passwordTest.isValid ? 'Strong password accepted' : `Password rejected: ${passwordTest.errors.join(', ')}`
    });

    const weakPasswordTest = isValidPassword('weak');
    addResult({
      name: 'Weak Password Rejection',
      status: !weakPasswordTest.isValid ? 'pass' : 'fail',
      message: !weakPasswordTest.isValid ? 'Weak password rejected' : 'Weak password accepted'
    });

    const usernameTest = isValidUsername(testUsername);
    addResult({
      name: 'Username Validation',
      status: usernameTest.isValid ? 'pass' : 'fail',
      message: usernameTest.isValid ? 'Valid username accepted' : `Username rejected: ${usernameTest.errors.join(', ')}`
    });
  };

  // Test 2: Rate Limiting
  const testRateLimiting = async () => {
    const testKey = 'test_rate_limit';
    
    // Clear any existing rate limit for this test
    authRateLimiter.isAllowed(testKey);
    
    let attempts = 0;
    let blocked = false;
    
    // Try to exceed rate limit
    for (let i = 0; i < 7; i++) {
      if (authRateLimiter.isAllowed(testKey)) {
        attempts++;
      } else {
        blocked = true;
        break;
      }
    }

    addResult({
      name: 'Rate Limiting',
      status: blocked ? 'pass' : 'warning',
      message: blocked ? `Rate limiting active after ${attempts} attempts` : 'Rate limiting may not be working properly',
      details: `Allowed ${attempts} attempts before blocking`
    });
  };

  // Test 3: Supabase Connection
  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      addResult({
        name: 'Supabase Connection',
        status: !error ? 'pass' : 'fail',
        message: !error ? 'Successfully connected to Supabase' : `Connection error: ${error.message}`
      });

      // Test database access
      try {
        const { error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        addResult({
          name: 'Database Access',
          status: !dbError ? 'pass' : 'fail',
          message: !dbError ? 'Database accessible' : `Database error: ${dbError.message}`,
          details: dbError ? `Error code: ${dbError.code}` : undefined
        });
      } catch (dbError: any) {
        addResult({
          name: 'Database Access',
          status: 'fail',
          message: `Database connection failed: ${dbError.message}`
        });
      }
    } catch (error: any) {
      addResult({
        name: 'Supabase Connection',
        status: 'fail',
        message: `Failed to connect: ${error.message}`
      });
    }
  };

  // Test 4: User Registration
  const testUserRegistration = async () => {
    try {
      const result = await signUp(testEmail, testPassword, testUsername);
      
      if (result.error) {
        addResult({
          name: 'User Registration',
          status: 'fail',
          message: `Registration failed: ${result.error.message}`
        });
      } else {
        addResult({
          name: 'User Registration',
          status: result.emailConfirmationSent ? 'pass' : 'warning',
          message: result.emailConfirmationSent 
            ? 'Registration successful, confirmation email sent' 
            : 'Registration completed but no confirmation email'
        });
      }
    } catch (error: any) {
      addResult({
        name: 'User Registration',
        status: 'fail',
        message: `Registration error: ${error.message}`
      });
    }
  };

  // Test 5: Input Sanitization
  const testInputSanitization = async () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      '"><script>alert("xss")</script>'
    ];

    let sanitizationWorking = true;
    
    for (const input of maliciousInputs) {
      const emailTest = isValidEmail(input);
      const usernameTest = isValidUsername(input);
      
      if (emailTest || usernameTest.isValid) {
        sanitizationWorking = false;
        break;
      }
    }

    addResult({
      name: 'Input Sanitization',
      status: sanitizationWorking ? 'pass' : 'fail',
      message: sanitizationWorking 
        ? 'Malicious inputs properly rejected' 
        : 'Some malicious inputs were accepted'
    });
  };

  // Test 6: Authentication State
  const testAuthenticationState = async () => {
    addResult({
      name: 'Authentication State',
      status: user ? 'pass' : 'warning',
      message: user 
        ? `User authenticated: ${user.email}` 
        : 'No user currently authenticated',
      details: user ? `User ID: ${user.id}` : undefined
    });
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    addResult({
      name: 'Test Suite Started',
      status: 'pending',
      message: 'Running comprehensive authentication tests...'
    });

    await testValidationFunctions();
    await testRateLimiting();
    await testSupabaseConnection();
    await testInputSanitization();
    await testAuthenticationState();
    
    // Only test registration if not already signed in
    if (!user) {
      await testUserRegistration();
    }

    addResult({
      name: 'Test Suite Completed',
      status: 'pass',
      message: 'All tests completed. Review results above.'
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <FiX className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'fail':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'pending':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FiShield className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Authentication Test Suite
            </h2>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start space-x-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {result.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {testResults.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Click "Run All Tests" to start the authentication test suite
          </div>
        )}

        {/* Current User Info */}
        {user && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <FiUser className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Current User</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Email: {user.email}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              ID: {user.id}
            </p>
            <button
              onClick={signOut}
              className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthTester;
