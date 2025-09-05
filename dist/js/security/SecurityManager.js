import { EventEmitter } from 'events';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import helmet from 'helmet';
import { Logger } from '../utils/Logger';
const scryptAsync = promisify(scrypt);
export class SecurityManager extends EventEmitter {
    constructor() {
        super();
        this.rateLimiters = new Map();
        this.auditLog = [];
        this.complianceRules = new Map();
        this.logger = new Logger('SecurityManager');
        this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || this.generateEncryptionKey(), 'hex');
        this.initializeRedis();
        this.setupRateLimiters();
        this.initializeComplianceRules();
    }
    async initializeRedis() {
        try {
            this.redisClient = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            this.redisClient.on('error', (error) => {
                this.logger.error('Redis security client error', { error });
            });
            await this.redisClient.connect();
            this.logger.info('Security Redis client connected');
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis for security', { error });
        }
    }
    setupRateLimiters() {
        // API Rate Limiter - 100 requests per minute
        this.rateLimiters.set('api', new RateLimiterRedis({
            storeClient: this.redisClient,
            keyPrefix: 'rate_limit_api',
            points: 100, // Number of requests
            duration: 60, // Per 60 seconds
            blockDuration: 60, // Block for 60 seconds if limit exceeded
        }));
        // Login Rate Limiter - 5 attempts per 15 minutes
        this.rateLimiters.set('login', new RateLimiterRedis({
            storeClient: this.redisClient,
            keyPrefix: 'rate_limit_login',
            points: 5,
            duration: 900, // 15 minutes
            blockDuration: 1800, // Block for 30 minutes
        }));
        // Voice Call Rate Limiter - 50 calls per hour
        this.rateLimiters.set('voice_calls', new RateLimiterRedis({
            storeClient: this.redisClient,
            keyPrefix: 'rate_limit_calls',
            points: 50,
            duration: 3600, // 1 hour
            blockDuration: 3600,
        }));
        // Test Suite Rate Limiter - 10 test runs per hour
        this.rateLimiters.set('test_suite', new RateLimiterRedis({
            storeClient: this.redisClient,
            keyPrefix: 'rate_limit_tests',
            points: 10,
            duration: 3600,
            blockDuration: 3600,
        }));
        this.logger.info('Rate limiters configured');
    }
    initializeComplianceRules() {
        // GDPR Compliance Rules
        this.complianceRules.set('GDPR', {
            name: 'General Data Protection Regulation',
            region: 'EU',
            rules: {
                dataRetentionDays: 365,
                consentRequired: true,
                rightToErasure: true,
                dataPortability: true,
                piiRedaction: true,
                auditTrail: true
            },
            violations: []
        });
        // SOC 2 Type II Compliance
        this.complianceRules.set('SOC2', {
            name: 'SOC 2 Type II',
            region: 'GLOBAL',
            rules: {
                accessControls: true,
                auditLogging: true,
                dataEncryption: true,
                incidentResponse: true,
                vulnerabilityManagement: true,
                changeManagement: true
            },
            violations: []
        });
        // HIPAA Compliance
        this.complianceRules.set('HIPAA', {
            name: 'Health Insurance Portability and Accountability Act',
            region: 'US',
            rules: {
                phiEncryption: true,
                accessAudit: true,
                minimumNecessary: true,
                businessAssociateAgreement: true,
                breachNotification: true,
                dataBackup: true
            },
            violations: []
        });
        // PCI DSS Compliance
        this.complianceRules.set('PCI', {
            name: 'Payment Card Industry Data Security Standard',
            region: 'GLOBAL',
            rules: {
                cardDataEncryption: true,
                accessRestriction: true,
                networkSecurity: true,
                vulnerabilityScanning: true,
                securityTesting: true,
                informationSecurityPolicy: true
            },
            violations: []
        });
        this.logger.info('Compliance rules initialized');
    }
    // Rate Limiting
    async checkRateLimit(limitType, identifier, additionalPoints = 1) {
        const limiter = this.rateLimiters.get(limitType);
        if (!limiter) {
            this.logger.warn('Unknown rate limiter type', { limitType });
            return { allowed: true };
        }
        try {
            const result = await limiter.consume(identifier, additionalPoints);
            return {
                allowed: true,
                remainingPoints: result.remainingHits,
                resetTime: new Date(Date.now() + result.msBeforeNext)
            };
        }
        catch (rateLimiterRes) {
            if (rateLimiterRes instanceof Error) {
                this.logger.error('Rate limiter error', { error: rateLimiterRes });
                return { allowed: true }; // Fail open
            }
            // Rate limit exceeded
            this.auditSecurityEvent('RATE_LIMIT_EXCEEDED', {
                limitType,
                identifier,
                resetTime: new Date(Date.now() + rateLimiterRes.msBeforeNext)
            });
            return {
                allowed: false,
                resetTime: new Date(Date.now() + rateLimiterRes.msBeforeNext)
            };
        }
    }
    // Data Encryption
    async encryptSensitiveData(data, context = 'general') {
        try {
            const iv = randomBytes(16);
            const cipher = require('crypto').createCipher('aes-256-gcm', this.encryptionKey);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            const result = {
                iv: iv.toString('hex'),
                encrypted,
                authTag: authTag.toString('hex'),
                context
            };
            this.auditSecurityEvent('DATA_ENCRYPTED', { context, dataLength: data.length });
            return Buffer.from(JSON.stringify(result)).toString('base64');
        }
        catch (error) {
            this.logger.error('Data encryption failed', { context, error });
            throw new Error('Encryption failed');
        }
    }
    async decryptSensitiveData(encryptedData, context = 'general') {
        try {
            const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
            const decipher = require('crypto').createDecipher('aes-256-gcm', this.encryptionKey);
            decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
            let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            this.auditSecurityEvent('DATA_DECRYPTED', { context });
            return decrypted;
        }
        catch (error) {
            this.logger.error('Data decryption failed', { context, error });
            throw new Error('Decryption failed');
        }
    }
    // PII Detection and Redaction
    async detectAndRedactPII(text) {
        const piiPatterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(?:\+49|0)[1-9][0-9]{1,14}/g,
            germanSsn: /\b\d{4}\s?\d{6}\b/g, // German social security format
            iban: /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b/g,
            creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
            germanId: /\b[A-Z][0-9]{8}\b/g, // German ID card format
            address: /\b\d{5}\s+[A-Za-z\s]+(?:straße|str\.|platz|weg|gasse)\b/gi
        };
        let redactedText = text;
        const foundPII = [];
        for (const [type, pattern] of Object.entries(piiPatterns)) {
            const matches = text.match(pattern);
            if (matches) {
                foundPII.push(...matches.map(match => `${type}: ${match.substring(0, 4)}***`));
                redactedText = redactedText.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
            }
        }
        if (foundPII.length > 0) {
            this.auditSecurityEvent('PII_DETECTED', {
                types: foundPII.map(pii => pii.split(':')[0]),
                count: foundPII.length
            });
        }
        return { redacted: redactedText, piiFound: foundPII };
    }
    // Access Control
    async validateAccess(userId, resource, action, context) {
        try {
            // Basic role-based access control
            const userPermissions = await this.getUserPermissions(userId);
            const requiredPermission = `${resource}:${action}`;
            const hasPermission = userPermissions.includes(requiredPermission) ||
                userPermissions.includes(`${resource}:*`) ||
                userPermissions.includes('*:*');
            if (!hasPermission) {
                this.auditSecurityEvent('ACCESS_DENIED', {
                    userId,
                    resource,
                    action,
                    reason: 'insufficient_permissions'
                });
                return { allowed: false, reason: 'Insufficient permissions' };
            }
            // Additional context-based validations
            if (context?.requireOwnership) {
                const isOwner = await this.verifyOwnership(userId, resource, context.resourceId);
                if (!isOwner) {
                    this.auditSecurityEvent('ACCESS_DENIED', {
                        userId,
                        resource,
                        action,
                        reason: 'not_owner'
                    });
                    return { allowed: false, reason: 'Resource ownership required' };
                }
            }
            this.auditSecurityEvent('ACCESS_GRANTED', { userId, resource, action });
            return { allowed: true };
        }
        catch (error) {
            this.logger.error('Access validation failed', { userId, resource, action, error });
            return { allowed: false, reason: 'Validation error' };
        }
    }
    async getUserPermissions(userId) {
        // In production, this would query the database
        // For now, return default permissions based on user role
        const defaultPermissions = [
            'assistants:read',
            'assistants:create',
            'assistants:update',
            'assistants:delete',
            'calls:read',
            'calls:create',
            'workflows:read',
            'workflows:create',
            'analytics:read'
        ];
        return defaultPermissions;
    }
    async verifyOwnership(userId, resource, resourceId) {
        // In production, this would verify resource ownership
        return true; // Simplified for now
    }
    // Compliance Monitoring
    async validateCompliance(action, data, complianceSettings) {
        const violations = [];
        const warnings = [];
        // Check GDPR compliance
        if (complianceSettings.region === 'EU') {
            const gdprRule = this.complianceRules.get('GDPR');
            if (gdprRule) {
                const gdprViolations = await this.validateGDPR(action, data, complianceSettings);
                violations.push(...gdprViolations);
            }
        }
        // Check data retention
        if (data.createdAt) {
            const age = Date.now() - new Date(data.createdAt).getTime();
            const maxAge = complianceSettings.dataRetentionDays * 24 * 60 * 60 * 1000;
            if (age > maxAge) {
                violations.push({
                    type: 'DATA_RETENTION',
                    severity: 'HIGH',
                    description: `Data exceeds retention period of ${complianceSettings.dataRetentionDays} days`,
                    action: 'DELETE_REQUIRED'
                });
            }
        }
        // Check PII handling
        if (data.transcript || data.personalInfo) {
            const textToCheck = data.transcript?.map((t) => t.text).join(' ') ||
                JSON.stringify(data.personalInfo);
            const { piiFound } = await this.detectAndRedactPII(textToCheck);
            if (piiFound.length > 0 && !complianceSettings.enablePIIRedaction) {
                violations.push({
                    type: 'PII_HANDLING',
                    severity: 'HIGH',
                    description: `PII detected but redaction not enabled: ${piiFound.length} instances`,
                    action: 'ENABLE_REDACTION'
                });
            }
        }
        // Log compliance check
        this.auditSecurityEvent('COMPLIANCE_CHECK', {
            action,
            region: complianceSettings.region,
            violationsCount: violations.length,
            warningsCount: warnings.length
        });
        return {
            compliant: violations.length === 0,
            violations,
            warnings,
            recommendations: this.generateComplianceRecommendations(violations)
        };
    }
    async validateGDPR(action, data, settings) {
        const violations = [];
        // Check consent requirement
        if (action === 'data_collection' && !data.consentGiven) {
            violations.push({
                type: 'GDPR_CONSENT',
                severity: 'HIGH',
                description: 'Data collection requires explicit user consent under GDPR',
                action: 'OBTAIN_CONSENT'
            });
        }
        // Check data processing lawfulness
        if (action === 'data_processing' && !data.lawfulBasis) {
            violations.push({
                type: 'GDPR_LAWFUL_BASIS',
                severity: 'HIGH',
                description: 'Data processing requires documented lawful basis under GDPR',
                action: 'DOCUMENT_BASIS'
            });
        }
        return violations;
    }
    generateComplianceRecommendations(violations) {
        const recommendations = [];
        for (const violation of violations) {
            switch (violation.type) {
                case 'DATA_RETENTION':
                    recommendations.push('Implement automated data deletion policies');
                    break;
                case 'PII_HANDLING':
                    recommendations.push('Enable automatic PII detection and redaction');
                    break;
                case 'GDPR_CONSENT':
                    recommendations.push('Implement consent management system');
                    break;
                case 'GDPR_LAWFUL_BASIS':
                    recommendations.push('Document lawful basis for data processing');
                    break;
                default:
                    recommendations.push('Review compliance policies and procedures');
            }
        }
        return [...new Set(recommendations)]; // Remove duplicates
    }
    // Security Monitoring and Auditing
    auditSecurityEvent(eventType, details) {
        const event = {
            id: this.generateEventId(),
            type: eventType,
            timestamp: new Date(),
            details,
            severity: this.getEventSeverity(eventType),
            source: 'VoicePartnerAI-Security'
        };
        this.auditLog.push(event);
        // Keep only last 10000 events in memory
        if (this.auditLog.length > 10000) {
            this.auditLog.shift();
        }
        // Emit for external monitoring systems
        this.emit('security_event', event);
        // Log high-severity events
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
            this.logger.warn('Security event', event);
        }
    }
    getEventSeverity(eventType) {
        const severityMap = {
            'RATE_LIMIT_EXCEEDED': 'MEDIUM',
            'ACCESS_DENIED': 'HIGH',
            'ACCESS_GRANTED': 'LOW',
            'DATA_ENCRYPTED': 'LOW',
            'DATA_DECRYPTED': 'LOW',
            'PII_DETECTED': 'MEDIUM',
            'COMPLIANCE_CHECK': 'LOW',
            'SECURITY_SCAN': 'LOW',
            'VULNERABILITY_DETECTED': 'HIGH',
            'BREACH_ATTEMPT': 'CRITICAL'
        };
        return severityMap[eventType] || 'LOW';
    }
    // Security Scanning
    async performSecurityScan(scope = 'system') {
        this.auditSecurityEvent('SECURITY_SCAN', { scope, startTime: new Date() });
        const results = {
            scanId: this.generateEventId(),
            scope,
            startTime: new Date(),
            vulnerabilities: [],
            recommendations: [],
            score: 0
        };
        try {
            switch (scope) {
                case 'system':
                    await this.scanSystemSecurity(results);
                    break;
                case 'data':
                    await this.scanDataSecurity(results);
                    break;
                case 'network':
                    await this.scanNetworkSecurity(results);
                    break;
            }
            // Calculate security score (0-100)
            const criticalCount = results.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
            const highCount = results.vulnerabilities.filter(v => v.severity === 'HIGH').length;
            const mediumCount = results.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
            results.score = Math.max(0, 100 - (criticalCount * 30) - (highCount * 15) - (mediumCount * 5));
            results.endTime = new Date();
            this.auditSecurityEvent('SECURITY_SCAN_COMPLETED', {
                scanId: results.scanId,
                score: results.score,
                vulnerabilityCount: results.vulnerabilities.length
            });
            return results;
        }
        catch (error) {
            this.logger.error('Security scan failed', { scope, error });
            results.endTime = new Date();
            results.error = error.message;
            return results;
        }
    }
    async scanSystemSecurity(results) {
        // Check environment variables
        const requiredEnvVars = [
            'DATABASE_URL',
            'ENCRYPTION_KEY',
            'JWT_SECRET',
            'REDIS_URL'
        ];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                results.vulnerabilities.push({
                    type: 'MISSING_ENV_VAR',
                    severity: 'HIGH',
                    description: `Required environment variable ${envVar} is not set`,
                    recommendation: `Set ${envVar} environment variable`
                });
            }
        }
        // Check encryption key strength
        if (process.env.ENCRYPTION_KEY && Buffer.from(process.env.ENCRYPTION_KEY, 'hex').length < 32) {
            results.vulnerabilities.push({
                type: 'WEAK_ENCRYPTION',
                severity: 'CRITICAL',
                description: 'Encryption key is too weak (less than 256 bits)',
                recommendation: 'Generate a new 256-bit encryption key'
            });
        }
    }
    async scanDataSecurity(results) {
        // Check for unencrypted sensitive data
        // This would typically scan database for unencrypted PII
        // Simulate data security checks
        results.recommendations.push('Implement field-level encryption for sensitive data');
        results.recommendations.push('Enable database encryption at rest');
        results.recommendations.push('Set up automated data retention policies');
    }
    async scanNetworkSecurity(results) {
        // Check network security configurations
        results.recommendations.push('Enable HTTPS for all endpoints');
        results.recommendations.push('Configure proper CORS policies');
        results.recommendations.push('Implement API rate limiting');
    }
    // Utility Methods
    generateEncryptionKey() {
        return randomBytes(32).toString('hex');
    }
    generateEventId() {
        return `sec_${Date.now()}_${randomBytes(4).toString('hex')}`;
    }
    async hashPassword(password) {
        const salt = randomBytes(16);
        const derivedKey = await scryptAsync(password, salt, 64);
        return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
    }
    async verifyPassword(password, hashedPassword) {
        const [salt, derivedKey] = hashedPassword.split(':');
        const derivedKeyBuffer = Buffer.from(derivedKey, 'hex');
        const passwordBuffer = await scryptAsync(password, Buffer.from(salt, 'hex'), 64);
        return timingSafeEqual(derivedKeyBuffer, passwordBuffer);
    }
    // Helmet middleware configuration for Express
    getSecurityHeaders() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "https:"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }
    // Cleanup
    async destroy() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
    }
}
//# sourceMappingURL=SecurityManager.js.map