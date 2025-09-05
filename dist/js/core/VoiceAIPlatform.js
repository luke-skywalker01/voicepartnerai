import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { SpeechToTextProvider } from './providers/SpeechToTextProvider';
import { TextToSpeechProvider } from './providers/TextToSpeechProvider';
import { LLMProvider } from './providers/LLMProvider';
import { CallManager } from './CallManager';
import { WorkflowEngine } from './WorkflowEngine';
import { SquadOrchestrator } from './SquadOrchestrator';
import { AnalyticsCollector } from './AnalyticsCollector';
import { Logger } from '../utils/Logger';
export class VoiceAIPlatform extends EventEmitter {
    constructor() {
        super();
        this.activeSessions = new Map();
        this.performanceMetrics = {
            averageLatency: 0,
            totalCalls: 0,
            activeCalls: 0,
            errorRate: 0
        };
        this.initializeProviders();
        this.setupEventHandlers();
        this.logger = new Logger('VoiceAIPlatform');
        this.logger.info('VoiceAI Platform initialized');
    }
    initializeProviders() {
        this.sttProvider = new SpeechToTextProvider();
        this.ttsProvider = new TextToSpeechProvider();
        this.llmProvider = new LLMProvider();
        this.callManager = new CallManager();
        this.workflowEngine = new WorkflowEngine();
        this.squadOrchestrator = new SquadOrchestrator();
        this.analyticsCollector = new AnalyticsCollector();
    }
    setupEventHandlers() {
        this.callManager.on('incoming_call', this.handleIncomingCall.bind(this));
        this.callManager.on('call_ended', this.handleCallEnded.bind(this));
        this.workflowEngine.on('workflow_completed', this.handleWorkflowCompleted.bind(this));
        this.workflowEngine.on('workflow_error', this.handleWorkflowError.bind(this));
    }
    async processVoiceCall(audioStream, session) {
        const startTime = Date.now();
        try {
            this.performanceMetrics.activeCalls++;
            this.emit('call_processing_started', session.id);
            // Step 1: Speech-to-Text (Target: <100ms)
            const transcription = await this.sttProvider.transcribe(audioStream, session.assistantId ?
                await this.getAssistantTranscriptionConfig(session.assistantId) :
                undefined);
            // Step 2: LLM Processing (Target: <300ms)
            let response;
            if (session.workflowId) {
                response = await this.processWorkflow(transcription, session);
            }
            else if (session.assistantId) {
                response = await this.processAssistant(transcription, session);
            }
            else {
                throw new Error('No assistant or workflow specified for session');
            }
            // Step 3: Text-to-Speech (Target: <200ms)
            const audioResponse = await this.ttsProvider.synthesize(response, session.assistantId ?
                await this.getAssistantVoiceConfig(session.assistantId) :
                undefined);
            const endTime = Date.now();
            const latency = endTime - startTime;
            // Update performance metrics
            this.updatePerformanceMetrics(latency);
            // Log transcript entry
            await this.logTranscriptEntry(session.id, transcription, response);
            // Emit success event
            this.emit('call_processing_completed', {
                sessionId: session.id,
                latency,
                transcription,
                response
            });
            return {
                success: true,
                audioResponse,
                transcription,
                response,
                latency,
                metadata: {
                    sttLatency: await this.sttProvider.getLastLatency(),
                    llmLatency: await this.llmProvider.getLastLatency(),
                    ttsLatency: await this.ttsProvider.getLastLatency()
                }
            };
        }
        catch (error) {
            this.performanceMetrics.errorRate =
                (this.performanceMetrics.errorRate * this.performanceMetrics.totalCalls + 1) /
                    (this.performanceMetrics.totalCalls + 1);
            this.logger.error('Voice processing error', { sessionId: session.id, error });
            this.emit('call_processing_error', { sessionId: session.id, error });
            return {
                success: false,
                error: error,
                latency: Date.now() - startTime
            };
        }
        finally {
            this.performanceMetrics.activeCalls--;
            this.performanceMetrics.totalCalls++;
        }
    }
    async processWorkflow(transcription, session) {
        const workflow = await this.getWorkflow(session.workflowId);
        const context = await this.buildWorkflowContext(session, transcription);
        const result = await this.workflowEngine.executeNode(workflow.nodes[0], // Start node
        context);
        return result.response;
    }
    async processAssistant(transcription, session) {
        const assistant = await this.getAssistant(session.assistantId);
        // Check if part of a squad
        if (session.metadata.squadId) {
            return await this.squadOrchestrator.processMessage(session.metadata.squadId, transcription, session);
        }
        // Single assistant processing
        const context = await this.buildAssistantContext(session, transcription);
        return await this.llmProvider.generateResponse(assistant, context);
    }
    async createRealTimeConnection(sessionId) {
        const ws = new WebSocket(`wss://localhost:8080/voice/${sessionId}`);
        ws.on('open', () => {
            this.logger.info(`Real-time connection established for session ${sessionId}`);
        });
        ws.on('message', async (data) => {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                ws.close(1000, 'Session not found');
                return;
            }
            try {
                // Process real-time audio data
                const result = await this.processVoiceCall(this.createStreamFromBuffer(data), session);
                if (result.success && result.audioResponse) {
                    ws.send(result.audioResponse);
                }
            }
            catch (error) {
                this.logger.error('Real-time processing error', { sessionId, error });
                ws.send(JSON.stringify({ error: 'Processing failed' }));
            }
        });
        ws.on('close', () => {
            this.logger.info(`Real-time connection closed for session ${sessionId}`);
            this.activeSessions.delete(sessionId);
        });
        return ws;
    }
    async makeOutboundCall(phoneNumber, assistant, options) {
        const assistantId = typeof assistant === 'string' ? assistant : assistant.id;
        const session = {
            id: this.generateSessionId(),
            assistantId,
            phoneNumber,
            direction: 'outbound',
            status: 'ringing',
            startTime: new Date(),
            transcript: [],
            metadata: options?.metadata || {},
            analytics: this.initializeCallAnalytics()
        };
        this.activeSessions.set(session.id, session);
        try {
            await this.callManager.initiateOutboundCall(phoneNumber, session);
            session.status = 'in_progress';
            this.emit('outbound_call_started', session);
            return session;
        }
        catch (error) {
            session.status = 'failed';
            this.logger.error('Outbound call failed', { sessionId: session.id, error });
            throw error;
        }
    }
    async handleIncomingCall(phoneNumber, metadata) {
        const session = {
            id: this.generateSessionId(),
            phoneNumber,
            direction: 'inbound',
            status: 'ringing',
            startTime: new Date(),
            transcript: [],
            metadata,
            analytics: this.initializeCallAnalytics()
        };
        // Route to appropriate assistant or workflow
        const routing = await this.determineRouting(phoneNumber, metadata);
        session.assistantId = routing.assistantId;
        session.workflowId = routing.workflowId;
        this.activeSessions.set(session.id, session);
        session.status = 'in_progress';
        this.emit('inbound_call_started', session);
    }
    async handleCallEnded(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        session.status = 'completed';
        session.endTime = new Date();
        session.duration = session.endTime.getTime() - session.startTime.getTime();
        // Finalize analytics
        await this.analyticsCollector.processCallAnalytics(session);
        this.emit('call_completed', session);
        this.activeSessions.delete(sessionId);
    }
    async handleWorkflowCompleted(workflowId, result) {
        this.logger.info('Workflow completed', { workflowId, result });
    }
    async handleWorkflowError(workflowId, error) {
        this.logger.error('Workflow error', { workflowId, error });
    }
    updatePerformanceMetrics(latency) {
        const total = this.performanceMetrics.totalCalls;
        this.performanceMetrics.averageLatency =
            (this.performanceMetrics.averageLatency * total + latency) / (total + 1);
    }
    createStreamFromBuffer(buffer) {
        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    initializeCallAnalytics() {
        return {
            totalDuration: 0,
            talkTime: 0,
            silenceTime: 0,
            interruptionCount: 0,
            sentimentScore: 0,
            keywordsDetected: [],
            successMetrics: {}
        };
    }
    // Helper methods (implement based on your data layer)
    async getAssistant(id) {
        // TODO: Implement database lookup
        throw new Error('Not implemented');
    }
    async getWorkflow(id) {
        // TODO: Implement database lookup  
        throw new Error('Not implemented');
    }
    async getAssistantTranscriptionConfig(assistantId) {
        // TODO: Implement
        throw new Error('Not implemented');
    }
    async getAssistantVoiceConfig(assistantId) {
        // TODO: Implement
        throw new Error('Not implemented');
    }
    async buildWorkflowContext(session, transcription) {
        // TODO: Implement
        throw new Error('Not implemented');
    }
    async buildAssistantContext(session, transcription) {
        // TODO: Implement
        throw new Error('Not implemented');
    }
    async logTranscriptEntry(sessionId, input, output) {
        // TODO: Implement transcript logging
    }
    async determineRouting(phoneNumber, metadata) {
        // TODO: Implement routing logic
        return {};
    }
    // Public API methods
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    getActiveSessionsCount() {
        return this.activeSessions.size;
    }
    async getSessionAnalytics(sessionId) {
        const session = this.activeSessions.get(sessionId);
        return session?.analytics || null;
    }
}
//# sourceMappingURL=VoiceAIPlatform.js.map