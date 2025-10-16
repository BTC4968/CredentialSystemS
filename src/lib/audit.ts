import { MongoClient, ObjectId } from 'mongodb';

interface AuditLogEntry {
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  private client: MongoClient | null = null;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private async getClient(): Promise<MongoClient> {
    if (!this.client) {
      this.client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
      await this.client.connect();
    }
    return this.client;
  }

  public async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const client = await this.getClient();
      const db = client.db('credential_manager');
      const auditCollection = db.collection('audit_logs');

      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date()
      };

      await auditCollection.insertOne(auditEntry);
    } catch (error) {
      // Don't throw errors from audit logging to avoid breaking the main functionality
      // Silently fail to avoid breaking the main functionality
    }
  }

  public async getAuditLogs(
    userId?: string,
    action?: string,
    resource?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const client = await this.getClient();
      const db = client.db('credential_manager');
      const auditCollection = db.collection('audit_logs');

      const filter: any = {};
      if (userId) filter.userId = userId;
      if (action) filter.action = action;
      if (resource) filter.resource = resource;

      const logs = await auditCollection
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      return logs.map(log => ({
        ...log,
        _id: log._id.toString()
      })) as unknown as AuditLogEntry[];
    } catch (error) {
      return [];
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Helper functions for common audit actions
export const auditActions = {
  // Authentication actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // User management actions
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  UPDATE_USER_ROLE: 'UPDATE_USER_ROLE',
  
  // Client management actions
  CREATE_CLIENT: 'CREATE_CLIENT',
  UPDATE_CLIENT: 'UPDATE_CLIENT',
  DELETE_CLIENT: 'DELETE_CLIENT',
  VIEW_CLIENT: 'VIEW_CLIENT',
  
  // Credential management actions
  CREATE_CREDENTIAL: 'CREATE_CREDENTIAL',
  UPDATE_CREDENTIAL: 'UPDATE_CREDENTIAL',
  DELETE_CREDENTIAL: 'DELETE_CREDENTIAL',
  VIEW_CREDENTIAL: 'VIEW_CREDENTIAL',
  DECRYPT_CREDENTIAL: 'DECRYPT_CREDENTIAL',
  
  // Export actions
  EXPORT_PDF: 'EXPORT_PDF',
  EXPORT_DATA: 'EXPORT_DATA',
  
  // System actions
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION'
} as const;

export const auditResources = {
  USER: 'USER',
  CLIENT: 'CLIENT',
  CREDENTIAL: 'CREDENTIAL',
  SYSTEM: 'SYSTEM',
  AUTH: 'AUTH'
} as const;

// Helper function to create audit log entry
export function createAuditEntry(
  user: { id: string; email: string; role: string },
  action: string,
  resource: string,
  details: Record<string, any> = {},
  success: boolean = true,
  errorMessage?: string,
  request?: { ip?: string; headers?: Record<string, string> }
): Omit<AuditLogEntry, 'timestamp'> {
  return {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action,
    resource,
    details,
    ipAddress: request?.ip,
    userAgent: request?.headers?.['user-agent'],
    success,
    errorMessage
  };
}
