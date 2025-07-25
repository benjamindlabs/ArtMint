/**
 * Centralized error handling utilities
 */

import { toast } from 'react-toastify';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userMessage?: string;
}

export class CustomError extends Error {
  code: string;
  details?: any;
  userMessage?: string;

  constructor(code: string, message: string, details?: any, userMessage?: string) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.userMessage = userMessage;
  }
}

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Database errors
  DB_CONNECTION: 'DB_CONNECTION',
  DB_QUERY: 'DB_QUERY',
  DB_NOT_FOUND: 'DB_NOT_FOUND',
  DB_CONSTRAINT: 'DB_CONSTRAINT',
  
  // Blockchain errors
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WALLET_REJECTED: 'WALLET_REJECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  
  // File/Upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // General errors
  UNKNOWN: 'UNKNOWN',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_REQUIRED]: 'Please sign in to continue',
  [ERROR_CODES.AUTH_INVALID]: 'Invalid credentials. Please try again',
  [ERROR_CODES.AUTH_EXPIRED]: 'Your session has expired. Please sign in again',
  
  [ERROR_CODES.DB_CONNECTION]: 'Unable to connect to the database. Please try again later',
  [ERROR_CODES.DB_QUERY]: 'Database error occurred. Please try again',
  [ERROR_CODES.DB_NOT_FOUND]: 'The requested item was not found',
  [ERROR_CODES.DB_CONSTRAINT]: 'Data validation error. Please check your input',
  
  [ERROR_CODES.WALLET_NOT_CONNECTED]: 'Please connect your wallet to continue',
  [ERROR_CODES.WALLET_REJECTED]: 'Transaction was rejected by your wallet',
  [ERROR_CODES.TRANSACTION_FAILED]: 'Transaction failed. Please try again',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds to complete this transaction',
  
  [ERROR_CODES.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file',
  [ERROR_CODES.FILE_INVALID_TYPE]: 'Invalid file type. Please choose a supported format',
  [ERROR_CODES.UPLOAD_FAILED]: 'File upload failed. Please try again',
  
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again',
  
  [ERROR_CODES.VALIDATION_FAILED]: 'Please check your input and try again',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  
  [ERROR_CODES.UNKNOWN]: 'An unexpected error occurred. Please try again',
  [ERROR_CODES.PERMISSION_DENIED]: 'You do not have permission to perform this action'
};

/**
 * Create a standardized error object
 */
export function createError(
  code: string,
  message: string,
  details?: any,
  userMessage?: string
): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
    userMessage: userMessage || ERROR_MESSAGES[code] || message
  };
}

/**
 * Handle and log errors consistently
 */
export function handleError(error: any, context?: string): AppError {
  let appError: AppError;

  if (error instanceof CustomError) {
    appError = createError(error.code, error.message, error.details, error.userMessage);
  } else if (error?.code && ERROR_MESSAGES[error.code]) {
    appError = createError(error.code, error.message || 'Unknown error', error, ERROR_MESSAGES[error.code]);
  } else {
    // Try to categorize common errors
    const errorMessage = error?.message || String(error);
    let code: string = ERROR_CODES.UNKNOWN;

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      code = ERROR_CODES.NETWORK_ERROR;
    } else if (errorMessage.includes('timeout')) {
      code = ERROR_CODES.TIMEOUT;
    } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
      code = ERROR_CODES.AUTH_INVALID;
    } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      code = ERROR_CODES.PERMISSION_DENIED;
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      code = ERROR_CODES.VALIDATION_FAILED;
    }

    appError = createError(code, errorMessage, error);
  }

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error in ${context || 'Unknown Context'}`);
    console.error('Code:', appError.code);
    console.error('Message:', appError.message);
    console.error('User Message:', appError.userMessage);
    if (appError.details) {
      console.error('Details:', appError.details);
    }
    console.error('Timestamp:', appError.timestamp);
    console.groupEnd();
  }

  return appError;
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: AppError | any, fallbackMessage?: string) {
  const message = error?.userMessage || error?.message || fallbackMessage || 'An error occurred';
  toast.error(message);
}

/**
 * Handle async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  showToast = true
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = handleError(error, context);
    if (showToast) {
      showErrorToast(appError);
    }
    return { data: null, error: appError };
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  context?: string
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw handleError(error, context);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

/**
 * Validate required fields
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new CustomError(
      ERROR_CODES.VALIDATION_FAILED,
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields },
      `Please fill in all required fields: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Error boundary helper - returns class constructor for creating error boundaries
 */
export function createErrorBoundaryClass(fallbackComponent: any) {
  return class ErrorBoundary {
    constructor(props: { children: any }) {
      // This is a helper function that returns a class constructor
      // The actual implementation should be done in a .tsx file
    }
  };
}

/**
 * Type guard for checking if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error && typeof error === 'object' && 'code' in error && 'message' in error && 'timestamp' in error;
}
