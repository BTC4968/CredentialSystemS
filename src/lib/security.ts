import { NextRequest } from 'next/server';
import { auditLogger, createAuditEntry, auditActions, auditResources } from './audit';

interface SecurityContext {
  user: {
    id: string;
    email: string;
    role: string;
  };
  request: NextRequest;
}

export class SecurityManager {
  /**
   * Validate user access to a resource
   */
  static async validateAccess(
    context: SecurityContext,
    resource: string,
    resourceId?: string,
    action: string = 'access'
  ): Promise<boolean> {
    const { user } = context;

    try {
      // Admin has full access to everything
      if (user.role === 'ADMIN') {
        return true;
      }

      // For regular users, check if they own the resource
      if (resource === 'CREDENTIAL' || resource === 'CLIENT') {
        // This will be validated in the specific API endpoints
        // by checking the createdById field
        return true;
      }

      // Default deny
      return false;
    } catch (error) {
      await auditLogger.log(createAuditEntry(
        user,
        auditActions.SECURITY_VIOLATION,
        resource,
        { 
          resourceId, 
          action, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
        false,
        'Access validation failed',
        { ip: context.request.headers.get('x-forwarded-for') || context.request.headers.get('x-real-ip') || 'unknown', headers: Object.fromEntries(context.request.headers) }
      ));
      return false;
    }
  }

  /**
   * Sanitize input data to prevent injection attacks
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[;]/g, '') // Remove semicolons
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if user can decrypt credentials
   */
  static canDecryptCredentials(
    user: { id: string; role: string },
    credentialOwnerId: string
  ): boolean {
    // Admin can decrypt all credentials
    if (user.role === 'ADMIN') {
      return true;
    }
    
    // Users can only decrypt their own credentials
    return user.id === credentialOwnerId;
  }

  /**
   * Check if user can view credentials
   */
  static canViewCredentials(
    user: { id: string; role: string },
    credentialOwnerId: string
  ): boolean {
    // Admin can view all credentials
    if (user.role === 'ADMIN') {
      return true;
    }
    
    // Users can only view their own credentials
    return user.id === credentialOwnerId;
  }

  /**
   * Check if user can export data
   */
  static canExportData(user: { role: string }): boolean {
    // Both admin and users can export their accessible data
    return user.role === 'ADMIN' || user.role === 'USER';
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    user: { id: string; email: string; role: string },
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string,
    request?: NextRequest
  ): Promise<void> {
    await auditLogger.log(createAuditEntry(
      user,
      action,
      auditResources.SYSTEM,
      details,
      success,
      errorMessage,
      request ? { ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', headers: Object.fromEntries(request.headers) } : undefined
    ));
  }

  /**
   * Rate limiting check (basic implementation)
   */
  static checkRateLimit(
    ip: string,
    action: string,
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 10
  ): boolean {
    // This is a basic implementation
    // In production, you'd want to use Redis or a proper rate limiting service
    const key = `${ip}:${action}`;
    const now = Date.now();
    
    // For now, just return true (no rate limiting)
    // In production, implement proper rate limiting
    return true;
  }
}