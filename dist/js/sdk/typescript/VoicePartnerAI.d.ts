import WebSocket from 'ws';
import { EventEmitter } from 'events';
export declare class VoicePartnerAI extends EventEmitter {
    private apiKey;
    private baseUrl;
    private client;
    private wsConnections;
    constructor(apiKey: string, options?: VoicePartnerAIOptions);
    private setupInterceptors;
    get assistants(): {
        list: (params?: ListAssistantsParams) => Promise<PaginatedResponse<Assistant>>;
        create: (data: CreateAssistantData) => Promise<Assistant>;
        get: (id: string) => Promise<Assistant>;
        update: (id: string, data: Partial<CreateAssistantData>) => Promise<Assistant>;
        delete: (id: string) => Promise<void>;
        test: (id: string, message: string, phoneNumber?: string) => Promise<TestResult>;
        duplicate: (id: string, name?: string) => Promise<Assistant>;
        analytics: (id: string, params?: AnalyticsParams) => Promise<AssistantAnalytics>;
    };
    get workflows(): {
        list: (params?: ListWorkflowsParams) => Promise<PaginatedResponse<Workflow>>;
        create: (data: CreateWorkflowData) => Promise<Workflow>;
        get: (id: string) => Promise<Workflow>;
        update: (id: string, data: Partial<CreateWorkflowData>) => Promise<Workflow>;
        delete: (id: string) => Promise<void>;
        publish: (id: string) => Promise<Workflow>;
        execute: (id: string, context: WorkflowExecutionContext) => Promise<WorkflowExecutionResult>;
    };
    get squads(): {
        list: (params?: ListSquadsParams) => Promise<PaginatedResponse<Squad>>;
        create: (data: CreateSquadData) => Promise<Squad>;
        get: (id: string) => Promise<Squad>;
        update: (id: string, data: Partial<CreateSquadData>) => Promise<Squad>;
        delete: (id: string) => Promise<void>;
    };
    get calls(): {
        list: (params?: ListCallsParams) => Promise<PaginatedResponse<CallSession>>;
        create: (data: CreateCallData) => Promise<CallSession>;
        get: (id: string) => Promise<CallSession>;
        end: (id: string) => Promise<void>;
        transfer: (id: string, phoneNumber: string) => Promise<void>;
        transcript: (id: string) => Promise<TranscriptEntry[]>;
        recording: (id: string) => Promise<string | null>;
    };
    get phoneNumbers(): {
        list: () => Promise<PhoneNumber[]>;
        provision: (data: ProvisionPhoneNumberData) => Promise<PhoneNumber>;
        get: (id: string) => Promise<PhoneNumber>;
        update: (id: string, data: Partial<ProvisionPhoneNumberData>) => Promise<PhoneNumber>;
        release: (id: string) => Promise<void>;
    };
    get testing(): {
        suites: {
            list: () => Promise<VoiceTestSuite[]>;
            create: (data: CreateTestSuiteData) => Promise<VoiceTestSuite>;
            get: (id: string) => Promise<VoiceTestSuite>;
            run: (id: string) => Promise<TestSuiteResult>;
            results: (id: string) => Promise<TestResult[]>;
        };
        runTest: (testData: RunTestData) => Promise<TestResult>;
    };
    get analytics(): {
        dashboard: (timeRange?: string) => Promise<AnalyticsDashboard>;
        calls: (params?: AnalyticsCallsParams) => Promise<CallAnalytics[]>;
        performance: (params?: AnalyticsPerformanceParams) => Promise<PerformanceMetrics>;
        export: (params: AnalyticsExportParams) => Promise<Blob>;
    };
    get integrations(): {
        list: () => Promise<Integration[]>;
        create: (data: CreateIntegrationData) => Promise<Integration>;
        get: (id: string) => Promise<Integration>;
        update: (id: string, data: Partial<CreateIntegrationData>) => Promise<Integration>;
        delete: (id: string) => Promise<void>;
        test: (id: string) => Promise<{
            success: boolean;
            message: string;
        }>;
    };
    voice(sessionId?: string): {
        connect: (options?: VoiceConnectOptions) => VoiceConnection;
        disconnect: (sessionId: string) => void;
    };
    ping(): Promise<{
        success: boolean;
        latency: number;
    }>;
    getAccount(): Promise<Account>;
    getUsage(params?: UsageParams): Promise<UsageStats>;
}
export declare class VoiceConnection extends EventEmitter {
    private ws;
    private client;
    constructor(ws: WebSocket, client: VoicePartnerAI);
    private setupEventHandlers;
    private handleMessage;
    sendAudio(audioData: Buffer): void;
    sendMessage(message: any): void;
    close(): void;
}
export declare class VoicePartnerAIError extends Error {
    statusCode?: number;
    response?: any;
    constructor(error: any);
}
export interface VoicePartnerAIOptions {
    baseUrl?: string;
    timeout?: number;
}
export interface Assistant {
    id: string;
    name: string;
    description?: string;
    systemPrompt: string;
    firstMessage?: string;
    voiceConfig: VoiceConfig;
    modelConfig: ModelConfig;
    transcriptionConfig: TranscriptionConfig;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateAssistantData {
    name: string;
    description?: string;
    systemPrompt: string;
    firstMessage?: string;
    voiceConfig: VoiceConfig;
    modelConfig: ModelConfig;
    transcriptionConfig: TranscriptionConfig;
    analyticsConfig?: AnalyticsConfig;
    complianceSettings?: ComplianceSettings;
}
export interface VoiceConfig {
    provider: 'elevenlabs' | 'openai' | 'azure' | 'google' | 'murf';
    voiceId: string;
    language: string;
    speed?: number;
    pitch?: number;
}
export interface ModelConfig {
    provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
    model: string;
    temperature?: number;
    maxTokens?: number;
}
export interface TranscriptionConfig {
    provider: 'deepgram' | 'assemblyai' | 'openai' | 'google' | 'azure';
    model: string;
    language: string;
}
export interface AnalyticsConfig {
    enableCallRecording: boolean;
    enableSentimentAnalysis: boolean;
    retentionDays: number;
}
export interface ComplianceSettings {
    dataRetentionDays: number;
    enablePIIRedaction: boolean;
    region: 'EU' | 'US' | 'APAC';
}
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    version: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables: WorkflowVariable[];
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowNode {
    id: string;
    type: 'start' | 'conversation' | 'api_request' | 'transfer_call' | 'end_call' | 'tool' | 'condition';
    position: {
        x: number;
        y: number;
    };
    data: any;
}
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    condition?: any;
}
export interface WorkflowVariable {
    name: string;
    type: string;
    defaultValue?: any;
}
export interface CreateWorkflowData {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables?: WorkflowVariable[];
}
export interface Squad {
    id: string;
    name: string;
    description?: string;
    assistants: SquadAssistant[];
    routingRules: RoutingRule[];
    transferSettings: TransferSettings;
    createdAt: Date;
    updatedAt: Date;
}
export interface SquadAssistant {
    id: string;
    assistantId: string;
    role: string;
    priority: number;
}
export interface RoutingRule {
    id: string;
    condition: any;
    targetAssistantId: string;
}
export interface TransferSettings {
    enableContextPreservation: boolean;
    transferTimeout: number;
}
export interface CreateSquadData {
    name: string;
    description?: string;
    assistants: Omit<SquadAssistant, 'id'>[];
    routingRules?: Omit<RoutingRule, 'id'>[];
    transferSettings?: TransferSettings;
}
export interface CallSession {
    id: string;
    assistantId?: string;
    workflowId?: string;
    phoneNumber: string;
    direction: 'inbound' | 'outbound';
    status: 'ringing' | 'in_progress' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    transcript: TranscriptEntry[];
    metadata: any;
}
export interface TranscriptEntry {
    id: string;
    timestamp: Date;
    speaker: 'assistant' | 'user';
    text: string;
    confidence: number;
}
export interface CreateCallData {
    phoneNumber: string;
    assistantId?: string;
    workflowId?: string;
    metadata?: any;
}
export interface PhoneNumber {
    id: string;
    number: string;
    country: string;
    type: 'local' | 'toll_free' | 'mobile';
    status: 'active' | 'inactive' | 'suspended';
    capabilities: {
        voice: boolean;
        sms: boolean;
        mms: boolean;
    };
    createdAt: Date;
}
export interface ProvisionPhoneNumberData {
    country?: string;
    type?: 'local' | 'toll_free' | 'mobile';
    assignedTo?: string;
}
export interface VoiceTestSuite {
    id: string;
    name: string;
    description?: string;
    tests: VoiceTest[];
    results: TestResult[];
    createdAt: Date;
    updatedAt: Date;
}
export interface VoiceTest {
    id: string;
    name: string;
    script: TestScript;
    expectedOutcomes: TestOutcome[];
    targetAssistantId?: string;
    targetWorkflowId?: string;
}
export interface TestScript {
    steps: TestStep[];
    variables?: Record<string, any>;
}
export interface TestStep {
    id: string;
    action: 'speak' | 'wait' | 'expect' | 'verify';
    content: string;
    timeout?: number;
    validation?: TestValidation;
}
export interface TestValidation {
    type: 'contains' | 'matches' | 'not_contains' | 'sentiment' | 'duration';
    value: string | number;
    tolerance?: number;
}
export interface TestOutcome {
    metric: string;
    expectedValue: any;
    tolerance?: number;
    critical?: boolean;
}
export interface TestResult {
    id: string;
    testId: string;
    status: 'passed' | 'failed' | 'running' | 'cancelled';
    score: number;
    details: TestResultDetail[];
    executionTime: number;
    timestamp: Date;
}
export interface TestResultDetail {
    stepId: string;
    status: 'passed' | 'failed' | 'skipped';
    actualValue?: any;
    expectedValue?: any;
    error?: string;
}
export interface CreateTestSuiteData {
    name: string;
    description?: string;
    tests: Omit<VoiceTest, 'id'>[];
}
export interface RunTestData {
    assistantId?: string;
    workflowId?: string;
    script: TestScript;
    expectedOutcomes?: TestOutcome[];
}
export interface TestSuiteResult {
    testSuiteId: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageScore: number;
    executionTime: number;
    results: TestResult[];
    timestamp: Date;
}
export interface AnalyticsDashboard {
    timeRange: string;
    totalCalls: number;
    completedCalls: number;
    successRate: number;
    averageDuration: number;
    averageSentiment: number;
    topKeywords: string[];
    systemHealth: {
        averageLatency: number;
        activeCalls: number;
        errorRate: number;
        systemLoad: any;
    };
}
export interface CallAnalytics {
    totalDuration: number;
    talkTime: number;
    silenceTime: number;
    interruptionCount: number;
    sentimentScore: number;
    keywordsDetected: string[];
    successMetrics: any;
}
export interface PerformanceMetrics {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
}
export interface Integration {
    id: string;
    name: string;
    type: 'webhook' | 'zapier' | 'make' | 'n8n' | 'custom';
    configuration: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateIntegrationData {
    name: string;
    type: 'webhook' | 'zapier' | 'make' | 'n8n' | 'custom';
    configuration: any;
}
export interface Account {
    id: string;
    email: string;
    name: string;
    plan: string;
    usage: {
        calls: number;
        minutes: number;
        storage: number;
    };
    limits: {
        calls: number;
        minutes: number;
        storage: number;
    };
}
export interface UsageStats {
    period: string;
    calls: number;
    minutes: number;
    costs: number;
    breakdown: any;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    metadata: {
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}
export interface ListAssistantsParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}
export interface ListWorkflowsParams {
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean;
}
export interface ListSquadsParams {
    page?: number;
    limit?: number;
    search?: string;
}
export interface ListCallsParams {
    page?: number;
    limit?: number;
    status?: string;
    direction?: string;
    from?: string;
    to?: string;
}
export interface AnalyticsParams {
    from?: string;
    to?: string;
}
export interface AnalyticsCallsParams {
    from?: string;
    to?: string;
    assistantId?: string;
    status?: string;
}
export interface AnalyticsPerformanceParams {
    from?: string;
    to?: string;
    metric?: string;
}
export interface AnalyticsExportParams {
    format: 'csv' | 'json' | 'xlsx';
    from?: string;
    to?: string;
    includeTranscripts?: boolean;
}
export interface UsageParams {
    from?: string;
    to?: string;
}
export interface VoiceConnectOptions {
    assistantId?: string;
    workflowId?: string;
    autoStart?: boolean;
}
export interface WorkflowExecutionContext {
    variables?: Record<string, any>;
    metadata?: any;
}
export interface WorkflowExecutionResult {
    success: boolean;
    executionId: string;
    result?: any;
    error?: string;
    executionTime: number;
}
export interface AssistantAnalytics {
    totalCalls: number;
    completedCalls: number;
    successRate: number;
    averageDuration: number;
    recentSessions: any[];
}
export default VoicePartnerAI;
