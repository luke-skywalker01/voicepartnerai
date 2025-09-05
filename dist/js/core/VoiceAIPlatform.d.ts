import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { VoiceAssistant, CallSession } from '../types';
export declare class VoiceAIPlatform extends EventEmitter {
    private sttProvider;
    private ttsProvider;
    private llmProvider;
    private callManager;
    private workflowEngine;
    private squadOrchestrator;
    private analyticsCollector;
    private logger;
    private activeSessions;
    private performanceMetrics;
    constructor();
    private initializeProviders;
    private setupEventHandlers;
    processVoiceCall(audioStream: NodeJS.ReadableStream, session: CallSession): Promise<ProcessingResult>;
    private processWorkflow;
    private processAssistant;
    createRealTimeConnection(sessionId: string): Promise<WebSocket>;
    makeOutboundCall(phoneNumber: string, assistant: VoiceAssistant | string, options?: OutboundCallOptions): Promise<CallSession>;
    private handleIncomingCall;
    private handleCallEnded;
    private handleWorkflowCompleted;
    private handleWorkflowError;
    private updatePerformanceMetrics;
    private createStreamFromBuffer;
    private generateSessionId;
    private initializeCallAnalytics;
    private getAssistant;
    private getWorkflow;
    private getAssistantTranscriptionConfig;
    private getAssistantVoiceConfig;
    private buildWorkflowContext;
    private buildAssistantContext;
    private logTranscriptEntry;
    private determineRouting;
    getPerformanceMetrics(): PerformanceMetrics;
    getActiveSessionsCount(): number;
    getSessionAnalytics(sessionId: string): Promise<any>;
}
interface ProcessingResult {
    success: boolean;
    audioResponse?: Buffer;
    transcription?: string;
    response?: string;
    latency: number;
    error?: Error;
    metadata?: Record<string, any>;
}
interface PerformanceMetrics {
    averageLatency: number;
    totalCalls: number;
    activeCalls: number;
    errorRate: number;
}
interface OutboundCallOptions {
    metadata?: Record<string, any>;
    timeout?: number;
    retries?: number;
}
export {};
