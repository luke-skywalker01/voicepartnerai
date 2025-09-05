import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { createHmac } from 'crypto';
export class IntegrationPlatform extends EventEmitter {
    constructor() {
        super();
        this.activeIntegrations = new Map();
        this.webhookHandlers = new Map();
        this.logger = new Logger('IntegrationPlatform');
        this.prisma = new PrismaClient();
        this.initializeIntegrationHandlers();
        this.loadActiveIntegrations();
    }
    initializeIntegrationHandlers() {
        // Register integration handlers
        this.registerHandler('webhook', new WebhookIntegrationHandler());
        this.registerHandler('zapier', new ZapierIntegrationHandler());
        this.registerHandler('make', new MakeIntegrationHandler());
        this.registerHandler('n8n', new N8NIntegrationHandler());
        this.registerHandler('custom', new CustomIntegrationHandler());
        this.logger.info('Integration handlers initialized');
    }
    async loadActiveIntegrations() {
        try {
            const integrations = await this.prisma.integration.findMany({
                where: { isActive: true }
            });
            for (const integration of integrations) {
                await this.activateIntegration(integration);
            }
            this.logger.info('Active integrations loaded', { count: integrations.length });
        }
        catch (error) {
            this.logger.error('Failed to load active integrations', { error });
        }
    }
    registerHandler(type, handler) {
        handler.setLogger(this.logger);
        handler.setPlatform(this);
        this.activeIntegrations.set(type, handler);
    }
    async createIntegration(userId, name, type, configuration) {
        try {
            // Validate configuration
            const handler = this.activeIntegrations.get(type);
            if (!handler) {
                throw new Error(`Unsupported integration type: ${type}`);
            }
            await handler.validateConfiguration(configuration);
            // Create integration in database
            const integration = await this.prisma.integration.create({
                data: {
                    name,
                    type: type,
                    configuration,
                    isActive: true,
                    userId
                }
            });
            // Activate integration
            await this.activateIntegration(integration);
            this.logger.info('Integration created', {
                integrationId: integration.id,
                type,
                userId
            });
            this.emit('integration_created', integration);
            return integration;
        }
        catch (error) {
            this.logger.error('Failed to create integration', { name, type, error });
            throw error;
        }
    }
    async updateIntegration(integrationId, updates) {
        try {
            const integration = await this.prisma.integration.update({
                where: { id: integrationId },
                data: updates
            });
            // Reactivate if configuration changed
            if (updates.configuration || updates.isActive !== undefined) {
                await this.deactivateIntegration(integrationId);
                if (integration.isActive) {
                    await this.activateIntegration(integration);
                }
            }
            this.logger.info('Integration updated', { integrationId });
            this.emit('integration_updated', integration);
            return integration;
        }
        catch (error) {
            this.logger.error('Failed to update integration', { integrationId, error });
            throw error;
        }
    }
    async deleteIntegration(integrationId) {
        try {
            await this.deactivateIntegration(integrationId);
            await this.prisma.integration.delete({
                where: { id: integrationId }
            });
            this.logger.info('Integration deleted', { integrationId });
            this.emit('integration_deleted', integrationId);
        }
        catch (error) {
            this.logger.error('Failed to delete integration', { integrationId, error });
            throw error;
        }
    }
    async activateIntegration(integration) {
        const handler = this.activeIntegrations.get(integration.type);
        if (!handler) {
            this.logger.error('No handler for integration type', { type: integration.type });
            return;
        }
        try {
            await handler.activate(integration);
            this.logger.info('Integration activated', { integrationId: integration.id });
        }
        catch (error) {
            this.logger.error('Failed to activate integration', {
                integrationId: integration.id,
                error
            });
        }
    }
    async deactivateIntegration(integrationId) {
        try {
            const integration = await this.prisma.integration.findUnique({
                where: { id: integrationId }
            });
            if (!integration)
                return;
            const handler = this.activeIntegrations.get(integration.type);
            if (handler) {
                await handler.deactivate(integration);
            }
            this.logger.info('Integration deactivated', { integrationId });
        }
        catch (error) {
            this.logger.error('Failed to deactivate integration', { integrationId, error });
        }
    }
    async triggerIntegration(integrationId, eventType, eventData) {
        try {
            const integration = await this.prisma.integration.findUnique({
                where: { id: integrationId, isActive: true }
            });
            if (!integration) {
                this.logger.warn('Integration not found or inactive', { integrationId });
                return;
            }
            const handler = this.activeIntegrations.get(integration.type);
            if (!handler) {
                this.logger.error('No handler for integration type', { type: integration.type });
                return;
            }
            await handler.trigger(integration, eventType, eventData);
            this.logger.info('Integration triggered', {
                integrationId,
                eventType,
                type: integration.type
            });
        }
        catch (error) {
            this.logger.error('Failed to trigger integration', {
                integrationId,
                eventType,
                error
            });
        }
    }
    async handleWebhook(integrationId, requestBody, headers) {
        try {
            const integration = await this.prisma.integration.findUnique({
                where: { id: integrationId, isActive: true }
            });
            if (!integration) {
                throw new Error('Integration not found or inactive');
            }
            const handler = this.activeIntegrations.get(integration.type);
            if (!handler) {
                throw new Error(`No handler for integration type: ${integration.type}`);
            }
            // Verify webhook signature if configured
            if (integration.configuration.webhookSecret) {
                this.verifyWebhookSignature(requestBody, headers, integration.configuration.webhookSecret);
            }
            const result = await handler.handleWebhook(integration, requestBody, headers);
            this.logger.info('Webhook handled', {
                integrationId,
                type: integration.type
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to handle webhook', {
                integrationId,
                error
            });
            throw error;
        }
    }
    verifyWebhookSignature(body, headers, secret) {
        const signature = headers['x-hub-signature-256'] || headers['x-signature'];
        if (!signature) {
            throw new Error('Missing webhook signature');
        }
        const expectedSignature = createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');
        const providedSignature = signature.replace('sha256=', '');
        if (expectedSignature !== providedSignature) {
            throw new Error('Invalid webhook signature');
        }
    }
    async testIntegration(integrationId) {
        try {
            const integration = await this.prisma.integration.findUnique({
                where: { id: integrationId }
            });
            if (!integration) {
                return { success: false, message: 'Integration not found' };
            }
            const handler = this.activeIntegrations.get(integration.type);
            if (!handler) {
                return { success: false, message: `No handler for type: ${integration.type}` };
            }
            const result = await handler.test(integration);
            return result;
        }
        catch (error) {
            return {
                success: false,
                message: `Test failed: ${error.message}`
            };
        }
    }
    // Event handlers for different platform events
    async onCallStarted(callSession) {
        await this.broadcastEvent('call_started', {
            sessionId: callSession.id,
            phoneNumber: callSession.phoneNumber,
            direction: callSession.direction,
            assistantId: callSession.assistantId,
            startTime: callSession.startTime
        });
    }
    async onCallCompleted(callSession) {
        await this.broadcastEvent('call_completed', {
            sessionId: callSession.id,
            phoneNumber: callSession.phoneNumber,
            duration: callSession.duration,
            status: callSession.status,
            endTime: callSession.endTime,
            transcript: callSession.transcript?.slice(-5) // Last 5 entries for context
        });
    }
    async onAssistantResponse(sessionId, assistantId, response, confidence) {
        await this.broadcastEvent('assistant_response', {
            sessionId,
            assistantId,
            response,
            confidence,
            timestamp: new Date()
        });
    }
    async onInformationExtracted(sessionId, extractedData) {
        await this.broadcastEvent('information_extracted', {
            sessionId,
            data: extractedData,
            timestamp: new Date()
        });
    }
    async broadcastEvent(eventType, eventData) {
        const integrations = await this.prisma.integration.findMany({
            where: { isActive: true }
        });
        const promises = integrations.map(integration => this.triggerIntegration(integration.id, eventType, eventData));
        await Promise.allSettled(promises);
    }
}
// Base Integration Handler
class IntegrationHandler {
    setLogger(logger) {
        this.logger = logger;
    }
    setPlatform(platform) {
        this.platform = platform;
    }
}
// Webhook Integration Handler
class WebhookIntegrationHandler extends IntegrationHandler {
    async validateConfiguration(config) {
        if (!config.webhookUrl) {
            throw new Error('Webhook URL is required');
        }
        // Validate URL format
        try {
            new URL(config.webhookUrl);
        }
        catch {
            throw new Error('Invalid webhook URL format');
        }
    }
    async activate(integration) {
        // No activation needed for webhooks
        this.logger.info('Webhook integration activated', { integrationId: integration.id });
    }
    async deactivate(integration) {
        // No deactivation needed for webhooks
        this.logger.info('Webhook integration deactivated', { integrationId: integration.id });
    }
    async trigger(integration, eventType, eventData) {
        const { webhookUrl, headers = {} } = integration.configuration;
        try {
            const payload = {
                event: eventType,
                data: eventData,
                timestamp: new Date().toISOString(),
                integrationId: integration.id
            };
            await axios.post(webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'VoicePartnerAI-Webhook/1.0',
                    ...headers
                },
                timeout: 10000
            });
        }
        catch (error) {
            this.logger.error('Webhook trigger failed', {
                integrationId: integration.id,
                webhookUrl,
                error
            });
        }
    }
    async handleWebhook(integration, body, headers) {
        // Process incoming webhook from external service
        this.logger.info('Webhook received', {
            integrationId: integration.id,
            body: typeof body === 'object' ? JSON.stringify(body).substring(0, 200) : body
        });
        // Return acknowledgment
        return { success: true, message: 'Webhook processed' };
    }
    async test(integration) {
        try {
            const testPayload = {
                event: 'test',
                data: { message: 'Test webhook from VoicePartnerAI' },
                timestamp: new Date().toISOString()
            };
            const response = await axios.post(integration.configuration.webhookUrl, testPayload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'VoicePartnerAI-Test/1.0'
                }
            });
            if (response.status >= 200 && response.status < 300) {
                return { success: true, message: 'Webhook test successful' };
            }
            else {
                return { success: false, message: `Webhook returned status ${response.status}` };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Webhook test failed: ${error.message}`
            };
        }
    }
}
// Zapier Integration Handler
class ZapierIntegrationHandler extends IntegrationHandler {
    async validateConfiguration(config) {
        if (!config.webhookUrl) {
            throw new Error('Zapier webhook URL is required');
        }
        // Validate Zapier webhook URL format
        if (!config.webhookUrl.includes('hooks.zapier.com')) {
            throw new Error('Invalid Zapier webhook URL');
        }
    }
    async activate(integration) {
        this.logger.info('Zapier integration activated', { integrationId: integration.id });
    }
    async deactivate(integration) {
        this.logger.info('Zapier integration deactivated', { integrationId: integration.id });
    }
    async trigger(integration, eventType, eventData) {
        const { webhookUrl } = integration.configuration;
        try {
            // Format data for Zapier
            const zapierPayload = {
                voicepartnerai_event: eventType,
                timestamp: new Date().toISOString(),
                ...this.flattenObject(eventData)
            };
            await axios.post(webhookUrl, zapierPayload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
        }
        catch (error) {
            this.logger.error('Zapier trigger failed', {
                integrationId: integration.id,
                error
            });
        }
    }
    async handleWebhook(integration, body, headers) {
        // Process incoming data from Zapier
        return { success: true, message: 'Zapier webhook processed' };
    }
    async test(integration) {
        try {
            const testData = {
                voicepartnerai_event: 'test',
                test_message: 'Test from VoicePartnerAI',
                timestamp: new Date().toISOString()
            };
            const response = await axios.post(integration.configuration.webhookUrl, testData, {
                timeout: 5000
            });
            return { success: true, message: 'Zapier test successful' };
        }
        catch (error) {
            return {
                success: false,
                message: `Zapier test failed: ${error.message}`
            };
        }
    }
    flattenObject(obj, prefix = '') {
        const flattened = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            }
            else {
                flattened[newKey] = value;
            }
        }
        return flattened;
    }
}
// Make.com Integration Handler
class MakeIntegrationHandler extends IntegrationHandler {
    async validateConfiguration(config) {
        if (!config.webhookUrl) {
            throw new Error('Make.com webhook URL is required');
        }
        // Validate Make.com webhook URL format
        if (!config.webhookUrl.includes('hook.integromat.com') &&
            !config.webhookUrl.includes('hook.make.com')) {
            throw new Error('Invalid Make.com webhook URL');
        }
    }
    async activate(integration) {
        this.logger.info('Make.com integration activated', { integrationId: integration.id });
    }
    async deactivate(integration) {
        this.logger.info('Make.com integration deactivated', { integrationId: integration.id });
    }
    async trigger(integration, eventType, eventData) {
        const { webhookUrl } = integration.configuration;
        try {
            // Format data for Make.com
            const payload = {
                eventType,
                timestamp: new Date().toISOString(),
                data: eventData
            };
            await axios.post(webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
        }
        catch (error) {
            this.logger.error('Make.com trigger failed', {
                integrationId: integration.id,
                error
            });
        }
    }
    async handleWebhook(integration, body, headers) {
        // Process incoming data from Make.com
        return { success: true, message: 'Make.com webhook processed' };
    }
    async test(integration) {
        try {
            const testData = {
                eventType: 'test',
                data: { message: 'Test from VoicePartnerAI' },
                timestamp: new Date().toISOString()
            };
            await axios.post(integration.configuration.webhookUrl, testData, {
                timeout: 5000
            });
            return { success: true, message: 'Make.com test successful' };
        }
        catch (error) {
            return {
                success: false,
                message: `Make.com test failed: ${error.message}`
            };
        }
    }
}
// n8n Integration Handler
class N8NIntegrationHandler extends IntegrationHandler {
    async validateConfiguration(config) {
        if (!config.webhookUrl) {
            throw new Error('n8n webhook URL is required');
        }
        if (!config.webhookUrl.includes('/webhook/')) {
            throw new Error('Invalid n8n webhook URL format');
        }
    }
    async activate(integration) {
        this.logger.info('n8n integration activated', { integrationId: integration.id });
    }
    async deactivate(integration) {
        this.logger.info('n8n integration deactivated', { integrationId: integration.id });
    }
    async trigger(integration, eventType, eventData) {
        const { webhookUrl, authType = 'none', apiKey } = integration.configuration;
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            // Add authentication if configured
            if (authType === 'api_key' && apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            const payload = {
                event: eventType,
                timestamp: new Date().toISOString(),
                ...eventData
            };
            await axios.post(webhookUrl, payload, {
                headers,
                timeout: 10000
            });
        }
        catch (error) {
            this.logger.error('n8n trigger failed', {
                integrationId: integration.id,
                error
            });
        }
    }
    async handleWebhook(integration, body, headers) {
        // Process incoming data from n8n
        return { success: true, message: 'n8n webhook processed' };
    }
    async test(integration) {
        try {
            const testData = {
                event: 'test',
                message: 'Test from VoicePartnerAI',
                timestamp: new Date().toISOString()
            };
            await axios.post(integration.configuration.webhookUrl, testData, {
                timeout: 5000
            });
            return { success: true, message: 'n8n test successful' };
        }
        catch (error) {
            return {
                success: false,
                message: `n8n test failed: ${error.message}`
            };
        }
    }
}
// Custom Integration Handler
class CustomIntegrationHandler extends IntegrationHandler {
    async validateConfiguration(config) {
        if (!config.webhookUrl && !config.apiEndpoint) {
            throw new Error('Either webhook URL or API endpoint is required');
        }
    }
    async activate(integration) {
        this.logger.info('Custom integration activated', { integrationId: integration.id });
    }
    async deactivate(integration) {
        this.logger.info('Custom integration deactivated', { integrationId: integration.id });
    }
    async trigger(integration, eventType, eventData) {
        const config = integration.configuration;
        const endpoint = config.webhookUrl || config.apiEndpoint;
        if (!endpoint)
            return;
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...config.headers
            };
            // Add authentication
            if (config.authType === 'api_key' && config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }
            else if (config.authType === 'basic' && config.username && config.password) {
                const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
                headers['Authorization'] = `Basic ${credentials}`;
            }
            // Apply custom mapping if configured
            let payload = { event: eventType, data: eventData };
            if (config.mapping) {
                payload = this.applyMapping(payload, config.mapping);
            }
            await axios.post(endpoint, payload, {
                headers,
                timeout: config.timeout || 10000
            });
        }
        catch (error) {
            this.logger.error('Custom integration trigger failed', {
                integrationId: integration.id,
                error
            });
        }
    }
    async handleWebhook(integration, body, headers) {
        // Process custom webhook
        return { success: true, message: 'Custom webhook processed' };
    }
    async test(integration) {
        const config = integration.configuration;
        const endpoint = config.webhookUrl || config.apiEndpoint;
        if (!endpoint) {
            return { success: false, message: 'No endpoint configured' };
        }
        try {
            const testData = { event: 'test', message: 'Test from VoicePartnerAI' };
            await axios.post(endpoint, testData, {
                timeout: 5000,
                headers: config.headers || {}
            });
            return { success: true, message: 'Custom integration test successful' };
        }
        catch (error) {
            return {
                success: false,
                message: `Custom integration test failed: ${error.message}`
            };
        }
    }
    applyMapping(data, mapping) {
        const mapped = {};
        for (const [targetKey, sourcePath] of Object.entries(mapping)) {
            const value = this.getNestedValue(data, sourcePath);
            if (value !== undefined) {
                this.setNestedValue(mapped, targetKey, value);
            }
        }
        return mapped;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key])
                current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
}
//# sourceMappingURL=IntegrationPlatform.js.map