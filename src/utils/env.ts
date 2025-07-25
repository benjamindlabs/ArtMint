/**
 * Environment variable validation and configuration
 */

// Required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK || 'localhost',
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '31337',
} as const;

// Validation functions
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidKey = (key: string | undefined): boolean => {
  return typeof key === 'string' && key.length > 0;
};

// Validate environment variables
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required variables
  if (!isValidUrl(requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL)) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or invalid');
  }

  if (!isValidKey(requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid');
  }

  // Validate optional URL if provided
  if (optionalEnvVars.NEXT_PUBLIC_APP_URL && !isValidUrl(optionalEnvVars.NEXT_PUBLIC_APP_URL)) {
    errors.push('NEXT_PUBLIC_APP_URL is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export validated environment variables
export const env = {
  ...requiredEnvVars,
  ...optionalEnvVars,
  isDevelopment: optionalEnvVars.NODE_ENV === 'development',
  isProduction: optionalEnvVars.NODE_ENV === 'production',
} as const;

// Type for environment variables
export type Environment = typeof env;

// Validate on module load in development
if (typeof window === 'undefined' && env.isDevelopment) {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('Environment validation warnings:', validation.errors);
  }
}
