/**
 * Security middleware for API routes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiter } from '../utils/validation';

// Rate limiter instances with different configurations
const rateLimiters = {
  general: new RateLimiter(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  auth: new RateLimiter(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  upload: new RateLimiter(10, 60 * 60 * 1000), // 10 requests per hour
  mint: new RateLimiter(20, 60 * 60 * 1000) // 20 requests per hour
};

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none';"
};

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_SITE_URL || 'https://artmint.com']
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// IP address extraction
export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress || 'unknown';
  
  return ip.trim();
}

// Rate limiting middleware
export function withRateLimit(
  type: keyof typeof rateLimiters = 'general',
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return function(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const ip = getClientIP(req);
      const identifier = `${type}_${ip}`;
      
      if (!rateLimiters[type].isAllowed(identifier)) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      return handler(req, res);
    };
  };
}

// CORS middleware
export function withCORS(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const origin = req.headers.origin;
    
    if (origin && corsConfig.origin.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials.toString());
    res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return handler(req, res);
  };
}

// Security headers middleware
export function withSecurityHeaders(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return handler(req, res);
  };
}

// Input validation middleware
export function withValidation(
  schema: Record<string, (value: any) => { isValid: boolean; errors: string[] }>
) {
  return function(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const errors: Record<string, string[]> = {};
      
      // Validate request body
      if (req.body && typeof req.body === 'object') {
        Object.entries(schema).forEach(([field, validator]) => {
          const result = validator(req.body[field]);
          if (!result.isValid) {
            errors[field] = result.errors;
          }
        });
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      return handler(req, res);
    };
  };
}

// Authentication middleware
export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required'
      });
    }

    try {
      // Verify JWT token (implement your JWT verification logic here)
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // req.user = decoded;
      
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  };
}

// CSRF protection middleware
export function withCSRF(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return handler(req, res);
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    const sessionToken = req.cookies['csrf-token'];

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid CSRF token'
      });
    }

    return handler(req, res);
  };
}

// Content type validation
export function withContentType(allowedTypes: string[]) {
  return function(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const contentType = req.headers['content-type'];
      
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
          return res.status(415).json({
            error: 'Unsupported Media Type',
            message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
          });
        }
      }

      return handler(req, res);
    };
  };
}

// Request size limitation
export function withSizeLimit(maxSize: number) {
  return function(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      
      if (contentLength > maxSize) {
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `Request size exceeds ${maxSize} bytes`
        });
      }

      return handler(req, res);
    };
  };
}

// Combine multiple middleware
export function withSecurity(
  options: {
    rateLimit?: { type?: keyof typeof rateLimiters; maxRequests?: number; windowMs?: number };
    auth?: boolean;
    csrf?: boolean;
    contentTypes?: string[];
    maxSize?: number;
    validation?: Record<string, (value: any) => { isValid: boolean; errors: string[] }>;
  } = {}
) {
  return function(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    let securedHandler = handler;

    // Apply middleware in reverse order (last applied = first executed)
    if (options.validation) {
      securedHandler = withValidation(options.validation)(securedHandler);
    }

    if (options.maxSize) {
      securedHandler = withSizeLimit(options.maxSize)(securedHandler);
    }

    if (options.contentTypes) {
      securedHandler = withContentType(options.contentTypes)(securedHandler);
    }

    if (options.csrf) {
      securedHandler = withCSRF(securedHandler);
    }

    if (options.auth) {
      securedHandler = withAuth(securedHandler);
    }

    if (options.rateLimit) {
      const { type, maxRequests, windowMs } = options.rateLimit;
      securedHandler = withRateLimit(type, maxRequests, windowMs)(securedHandler);
    }

    securedHandler = withSecurityHeaders(securedHandler);
    securedHandler = withCORS(securedHandler);

    return securedHandler;
  };
}

// Error handling wrapper
export function withErrorHandling(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Don't expose internal errors in production
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;

      res.status(500).json({
        error: 'Internal Server Error',
        message
      });
    }
  };
}

// Logging middleware
export function withLogging(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    const ip = getClientIP(req);
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${ip}`);
    
    await handler(req, res);
    
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  };
}
