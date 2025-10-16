// Simple encryption utility for credential storage
// In a production environment, you would use more robust encryption methods

const ENCRYPTION_KEY = 'credential-manager-key-2024'; // In production, this should be environment-based

/**
 * Simple encryption function using base64 encoding
 * In production, use proper encryption libraries like crypto-js or Web Crypto API
 */
export function encrypt(text: string): string {
  try {
    // Simple XOR encryption with base64 encoding
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
  } catch (error) {
    return text; // Fallback to plain text if encryption fails
  }
}

/**
 * Simple decryption function
 */
export function decrypt(encryptedText: string): string {
  try {
    const encrypted = atob(encryptedText);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch (error) {
    return encryptedText; // Fallback to encrypted text if decryption fails
  }
}

/**
 * Hash a password for storage (one-way)
 */
export function hashPassword(password: string): string {
  // Simple hash function - in production, use proper hashing like bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
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
