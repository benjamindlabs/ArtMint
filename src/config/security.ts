/**
 * Security configuration and constants
 */

// Environment-based configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    GENERAL: {
      maxRequests: process.env.NODE_ENV === 'production' ? 100 : 1000,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    AUTH: {
      maxRequests: process.env.NODE_ENV === 'production' ? 5 : 50,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    UPLOAD: {
      maxRequests: process.env.NODE_ENV === 'production' ? 10 : 100,
      windowMs: 60 * 60 * 1000 // 1 hour
    },
    MINT: {
      maxRequests: process.env.NODE_ENV === 'production' ? 20 : 200,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  },

  // File upload limits
  FILE_LIMITS: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'model/gltf+json',
      'model/gltf-binary'
    ],
    ALLOWED_EXTENSIONS: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'mp4', 'webm', 'mov',
      'mp3', 'wav', 'ogg',
      'gltf', 'glb'
    ]
  },

  // Content Security Policy
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js
      "'unsafe-inline'", // Required for some libraries
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'https://picsum.photos',
      'https://ipfs.io',
      'https://gateway.pinata.cloud',
      'https://cloudflare-ipfs.com'
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https:',
      'wss:',
      'https://api.coingecko.com',
      'https://mainnet.infura.io',
      'https://polygon-rpc.com'
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // Trusted domains
  TRUSTED_DOMAINS: [
    'localhost',
    'artmint.com',
    'www.artmint.com',
    ...(process.env.NEXT_PUBLIC_TRUSTED_DOMAINS?.split(',') || [])
  ],

  // API security
  API: {
    MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_CONTENT_TYPES: [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded'
    ],
    JWT_EXPIRY: '24h',
    REFRESH_TOKEN_EXPIRY: '7d'
  },

  // Blockchain security
  BLOCKCHAIN: {
    ALLOWED_NETWORKS: [
      1, // Ethereum Mainnet
      5, // Goerli Testnet
      137, // Polygon Mainnet
      80001, // Polygon Mumbai Testnet
      ...(process.env.ALLOWED_NETWORKS?.split(',').map(Number) || [])
    ],
    MAX_GAS_PRICE: '100000000000', // 100 Gwei
    MIN_CONFIRMATIONS: process.env.NODE_ENV === 'production' ? 3 : 1
  }
};

// Security headers configuration
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),
  
  // HSTS (only in production with HTTPS)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }),
  
  // Content Security Policy
  'Content-Security-Policy': Object.entries(SECURITY_CONFIG.CSP)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
};

// Input validation rules
export const VALIDATION_RULES = {
  // User input
  USERNAME: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
    blacklist: [
      'admin', 'root', 'system', 'null', 'undefined',
      'api', 'www', 'mail', 'ftp', 'test'
    ]
  },
  
  EMAIL: {
    maxLength: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  PASSWORD: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },
  
  // NFT data
  NFT_NAME: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_#]+$/
  },
  
  NFT_DESCRIPTION: {
    maxLength: 1000
  },
  
  NFT_PRICE: {
    min: 0,
    max: 1000000,
    decimals: 18
  },
  
  ROYALTY_PERCENTAGE: {
    min: 0,
    max: 50 // Maximum 50%
  },
  
  // Blockchain data
  ETHEREUM_ADDRESS: {
    pattern: /^0x[a-fA-F0-9]{40}$/
  },
  
  TRANSACTION_HASH: {
    pattern: /^0x[a-fA-F0-9]{64}$/
  },
  
  IPFS_HASH: {
    pattern: /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
  }
};

// Sensitive data patterns to redact from logs
export const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /private/i,
  /auth/i,
  /session/i,
  /cookie/i,
  /0x[a-fA-F0-9]{64}/, // Private keys
  /[A-Za-z0-9+/]{40,}={0,2}/ // Base64 encoded secrets
];

// Security event types for logging
export const SECURITY_EVENTS = {
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  FILE_UPLOAD_REJECTED: 'file_upload_rejected',
  INVALID_INPUT: 'invalid_input',
  CSRF_TOKEN_MISMATCH: 'csrf_token_mismatch',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt'
};

// Utility functions
export const SecurityUtils = {
  // Check if domain is trusted
  isTrustedDomain: (domain: string): boolean => {
    return SECURITY_CONFIG.TRUSTED_DOMAINS.includes(domain);
  },
  
  // Check if network is allowed
  isAllowedNetwork: (networkId: number): boolean => {
    return SECURITY_CONFIG.BLOCKCHAIN.ALLOWED_NETWORKS.includes(networkId);
  },
  
  // Redact sensitive data from logs
  redactSensitiveData: (data: any): any => {
    if (typeof data === 'string') {
      let redacted = data;
      SENSITIVE_PATTERNS.forEach(pattern => {
        redacted = redacted.replace(pattern, '[REDACTED]');
      });
      return redacted;
    }
    
    if (typeof data === 'object' && data !== null) {
      const redacted: any = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = SecurityUtils.redactSensitiveData(value);
        }
      }
      
      return redacted;
    }
    
    return data;
  },
  
  // Generate secure random string
  generateSecureRandom: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for server-side
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  },
  
  // Hash sensitive data
  hashSensitiveData: async (data: string): Promise<string> => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback - not cryptographically secure
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
};

export default SECURITY_CONFIG;
