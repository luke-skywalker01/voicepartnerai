import { EventEmitter } from 'events';
import { ComplianceSettings } from '../types';
export declare class SecurityManager extends EventEmitter {
    private logger;
    private redisClient;
    private rateLimiters;
    private auditLog;
    private encryptionKey;
    private complianceRules;
    constructor();
    private initializeRedis;
    private setupRateLimiters;
    private initializeComplianceRules;
    checkRateLimit(limitType: string, identifier: string, additionalPoints?: number): Promise<{
        allowed: boolean;
        remainingPoints?: number;
        resetTime?: Date;
    }>;
    encryptSensitiveData(data: string, context?: string): Promise<string>;
    decryptSensitiveData(encryptedData: string, context?: string): Promise<string>;
    detectAndRedactPII(text: string): Promise<{
        redacted: string;
        piiFound: string[];
    }>;
    validateAccess(userId: string, resource: string, action: string, context?: any): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    private getUserPermissions;
    private verifyOwnership;
    validateCompliance(action: string, data: any, complianceSettings: ComplianceSettings): Promise<ComplianceValidationResult>;
    private validateGDPR;
    private generateComplianceRecommendations;
    auditSecurityEvent(eventType: string, details: any): void;
    private getEventSeverity;
    performSecurityScan(scope?: 'system' | 'data' | 'network'): Promise<SecurityScanResult>;
    private scanSystemSecurity;
    private scanDataSecurity;
    private scanNetworkSecurity;
    private generateEncryptionKey;
    private generateEventId;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    getSecurityHeaders(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    destroy(): Promise<void>;
}
interface ComplianceViolation {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    action: string;
}
interface ComplianceValidationResult {
    compliant: boolean;
    violations: ComplianceViolation[];
    warnings: string[];
    recommendations: string[];
}
interface SecurityScanResult {
    scanId: string;
    scope: string;
    startTime: Date;
    endTime?: Date;
    vulnerabilities: SecurityVulnerability[];
    recommendations: string[];
    score: number;
    error?: string;
}
interface SecurityVulnerability {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    recommendation: string;
}
export {};
