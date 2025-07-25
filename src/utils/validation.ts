/**
 * Input validation utilities for security and data integrity
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Password validation
export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Username validation
export const isValidUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 30) {
    errors.push('Username must be less than 30 characters');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  if (/^[_-]/.test(username) || /[_-]$/.test(username)) {
    errors.push('Username cannot start or end with underscore or hyphen');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ETH price validation
export const isValidEthPrice = (price: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!price || price.trim() === '') {
    errors.push('Price is required');
    return { isValid: false, errors };
  }
  
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice)) {
    errors.push('Price must be a valid number');
  } else {
    if (numPrice <= 0) {
      errors.push('Price must be greater than 0');
    }
    
    if (numPrice > 1000000) {
      errors.push('Price cannot exceed 1,000,000 ETH');
    }
    
    // Check for reasonable decimal places (max 8)
    const decimalPlaces = (price.split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      errors.push('Price cannot have more than 8 decimal places');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// NFT name validation
export const isValidNFTName = (name: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!name || name.trim() === '') {
    errors.push('NFT name is required');
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 1) {
    errors.push('NFT name cannot be empty');
  }
  
  if (trimmedName.length > 100) {
    errors.push('NFT name cannot exceed 100 characters');
  }
  
  // Check for potentially harmful content
  if (/<script|javascript:|data:/i.test(trimmedName)) {
    errors.push('NFT name contains invalid content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// NFT description validation
export const isValidNFTDescription = (description: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (description && description.length > 1000) {
    errors.push('Description cannot exceed 1000 characters');
  }
  
  // Check for potentially harmful content
  if (/<script|javascript:|data:/i.test(description)) {
    errors.push('Description contains invalid content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation for NFT uploads
export const isValidNFTFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB in bytes
  if (file.size > maxSize) {
    errors.push('File size cannot exceed 100MB');
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not supported. Please use JPG, PNG, GIF, WebP, MP4, or WebM');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize string input to prevent XSS
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Validate Ethereum address
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Rate limiting helper (for client-side)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const timeUntilReset = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, timeUntilReset);
  }
}

// Create rate limiter instances
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const generalRateLimiter = new RateLimiter(10, 60 * 1000); // 10 attempts per minute
