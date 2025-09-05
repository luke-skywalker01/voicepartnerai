import { EventEmitter } from 'events';
import { Integration, IntegrationConfig, CallSession } from '../types';
export declare class IntegrationPlatform extends EventEmitter {
    private logger;
    private prisma;
    private activeIntegrations;
    private webhookHandlers;
    constructor();
    private initializeIntegrationHandlers;
    private loadActiveIntegrations;
    private registerHandler;
    createIntegration(userId: string, name: string, type: string, configuration: IntegrationConfig): Promise<Integration>;
    updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration>;
    deleteIntegration(integrationId: string): Promise<void>;
    private activateIntegration;
    private deactivateIntegration;
    triggerIntegration(integrationId: string, eventType: string, eventData: any): Promise<void>;
    handleWebhook(integrationId: string, requestBody: any, headers: Record<string, string>): Promise<any>;
    private verifyWebhookSignature;
    testIntegration(integrationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    onCallStarted(callSession: CallSession): Promise<void>;
    onCallCompleted(callSession: CallSession): Promise<void>;
    onAssistantResponse(sessionId: string, assistantId: string, response: string, confidence: number): Promise<void>;
    onInformationExtracted(sessionId: string, extractedData: Record<string, any>): Promise<void>;
    private broadcastEvent;
}
