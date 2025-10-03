import { InvocationContext } from '@azure/functions';

export enum AuditAction {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    INVITE = 'INVITE',
    REGISTER = 'REGISTER',
}

export enum AuditResource {
    USER = 'USER',
    CASE = 'CASE',
    PATIENT = 'PATIENT',
    MEDICATION = 'MEDICATION',
    EMERGENCY_CONTACT = 'EMERGENCY_CONTACT',
    NOTIFICATION_PREFERENCE = 'NOTIFICATION_PREFERENCE',
    INVITED_USER = 'INVITED_USER',
}

export interface AuditLogEntry {
    timestamp: Date;
    userId?: number;
    userOid?: string;
    email?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string | number;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
}

export class AuditLogger {
    private static logs: AuditLogEntry[] = [];
    private static readonly MAX_LOGS_IN_MEMORY = 1000;

    /**
     * Log an audit event
     */
    static log(entry: Omit<AuditLogEntry, 'timestamp'>, context?: InvocationContext): void {
        const auditEntry: AuditLogEntry = {
            ...entry,
            timestamp: new Date(),
        };

        // Add to in-memory logs
        this.logs.push(auditEntry);

        // Keep only recent logs in memory
        if (this.logs.length > this.MAX_LOGS_IN_MEMORY) {
            this.logs.shift();
        }

        // Log to context if available
        if (context) {
            const logMessage = this.formatLogMessage(auditEntry);
            if (auditEntry.success) {
                context.log(`[AUDIT] ${logMessage}`);
            } else {
                context.warn(`[AUDIT] ${logMessage}`);
            }
        }

        // TODO: In production, send to Application Insights or external logging service
        // Example: applicationInsights.trackEvent({ name: 'AuditLog', properties: auditEntry });
    }

    /**
     * Format audit log message
     */
    private static formatLogMessage(entry: AuditLogEntry): string {
        const parts = [
            `Action: ${entry.action}`,
            `Resource: ${entry.resource}`,
        ];

        if (entry.userId) {
            parts.push(`UserId: ${entry.userId}`);
        }

        if (entry.userOid) {
            parts.push(`UserOid: ${entry.userOid}`);
        }

        if (entry.resourceId) {
            parts.push(`ResourceId: ${entry.resourceId}`);
        }

        if (entry.ipAddress) {
            parts.push(`IP: ${entry.ipAddress}`);
        }

        if (!entry.success && entry.errorMessage) {
            parts.push(`Error: ${entry.errorMessage}`);
        }

        return parts.join(' | ');
    }

    /**
     * Log successful operation
     */
    static logSuccess(
        action: AuditAction,
        resource: AuditResource,
        userId?: number,
        resourceId?: string | number,
        details?: Record<string, any>,
        context?: InvocationContext
    ): void {
        this.log({
            userId,
            action,
            resource,
            resourceId,
            details,
            success: true,
        }, context);
    }

    /**
     * Log failed operation
     */
    static logFailure(
        action: AuditAction,
        resource: AuditResource,
        errorMessage: string,
        userId?: number,
        resourceId?: string | number,
        details?: Record<string, any>,
        context?: InvocationContext
    ): void {
        this.log({
            userId,
            action,
            resource,
            resourceId,
            details,
            success: false,
            errorMessage,
        }, context);
    }

    /**
     * Get recent audit logs (for debugging/admin purposes)
     */
    static getRecentLogs(limit: number = 100): AuditLogEntry[] {
        return this.logs.slice(-limit);
    }

    /**
     * Get audit logs for a specific user
     */
    static getUserLogs(userId: number, limit: number = 50): AuditLogEntry[] {
        return this.logs
            .filter(log => log.userId === userId)
            .slice(-limit);
    }

    /**
     * Get audit logs for a specific resource
     */
    static getResourceLogs(resource: AuditResource, resourceId: string | number, limit: number = 50): AuditLogEntry[] {
        return this.logs
            .filter(log => log.resource === resource && log.resourceId === resourceId)
            .slice(-limit);
    }

    /**
     * Clear audit logs (for testing only)
     */
    static clear(): void {
        this.logs = [];
    }

    /**
     * Export audit logs as JSON
     */
    static export(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}
