import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'; // More secure than CBC
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits for GCM

// Get encryption key from environment or generate a default (for development)
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    // Generate a consistent key for development
    return crypto.scryptSync('default-dev-key', 'salt', KEY_LENGTH);
  }
  
  // Ensure the key is exactly 32 bytes for AES-256
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    return crypto.scryptSync('default-dev-key', 'salt', KEY_LENGTH);
  }
  
  return keyBuffer;
};

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt sensitive data using AES-256-GCM (more secure than CBC)
 */
export function encrypt(text: string): string {
  try {
    if (!text || text.trim() === '') {
      throw new Error('Cannot encrypt empty text');
    }
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine IV, tag, and encrypted data
    const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decrypt(encryptedData: string): string {
  try {
    if (!encryptedData || encryptedData.trim() === '') {
      throw new Error('Cannot decrypt empty data');
    }
    
    const combined = Buffer.from(encryptedData, 'base64').toString('hex');
    const parts = combined.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format - expected IV:tag:encrypted');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain numbers');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain special characters');
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
}

/**
 * Generate a secure encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Hash a password for storage (one-way)
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}
