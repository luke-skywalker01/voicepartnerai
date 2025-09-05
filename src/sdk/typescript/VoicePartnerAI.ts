import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class VoicePartnerAI extends EventEmitter {
  private apiKey: string;
  private baseUrl: string;
  private client: AxiosInstance;
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor(apiKey: string, options: VoicePartnerAIOptions = {}) {
    super();
    
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.voicepartnerai.de/v1';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'VoicePartnerAI-TypeScript-SDK/1.0.0'
      },
      timeout: options.timeout || 30000
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.emit('request', { method: config.method, url: config.url });
        return config;
      },
      (error) => {
        this.emit('error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.emit('response', { status: response.status, url: response.config.url });
        return response;
      },
      (error) => {
        this.emit('error', error);
        return Promise.reject(new VoicePartnerAIError(error));
      }
    );
  }

  // Assistants API
  get assistants() {
    return {
      list: async (params?: ListAssistantsParams): Promise<PaginatedResponse<Assistant>> => {
        const response = await this.client.get('/assistants', { params });
        return response.data;
      },

      create: async (data: CreateAssistantData): Promise<Assistant> => {
        const response = await this.client.post('/assistants', data);
        return response.data.data;
      },

      get: async (id: string): Promise<Assistant> => {
        const response = await this.client.get(`/assistants/${id}`);
        return response.data.data;
      },

      update: async (id: string, data: Partial<CreateAssistantData>): Promise<Assistant> => {
        const response = await this.client.put(`/assistants/${id}`, data);
        return response.data.data;
      },

      delete: async (id: string): Promise<void> => {
        await this.client.delete(`/assistants/${id}`);
      },

      test: async (id: string, message: string, phoneNumber?: string): Promise<TestResult> => {
        const response = await this.client.post(`/assistants/${id}/test`, {
          message,
          phoneNumber
        });
        return response.data.data;
      },

      duplicate: async (id: string, name?: string): Promise<Assistant> => {
        const response = await this.client.post(`/assistants/${id}/duplicate`, { name });
        return response.data.data;
      },

      analytics: async (id: string, params?: AnalyticsParams): Promise<AssistantAnalytics> => {
        const response = await this.client.get(`/assistants/${id}/analytics`, { params });
        return response.data.data;
      }
    };
  }

  // Workflows API
  get workflows() {
    return {
      list: async (params?: ListWorkflowsParams): Promise<PaginatedResponse<Workflow>> => {
        const response = await this.client.get('/workflows', { params });
        return response.data;
      },

      create: async (data: CreateWorkflowData): Promise<Workflow> => {
        const response = await this.client.post('/workflows', data);
        return response.data.data;
      },

      get: async (id: string): Promise<Workflow> => {
        const response = await this.client.get(`/workflows/${id}`);
        return response.data.data;
      },

      update: async (id: string, data: Partial<CreateWorkflowData>): Promise<Workflow> => {
        const response = await this.client.put(`/workflows/${id}`, data);
        return response.data.data;
      },

      delete: async (id: string): Promise<void> => {
        await this.client.delete(`/workflows/${id}`);
      },

      publish: async (id: string): Promise<Workflow> => {
        const response = await this.client.post(`/workflows/${id}/publish`);
        return response.data.data;
      },

      execute: async (id: string, context: WorkflowExecutionContext): Promise<WorkflowExecutionResult> => {
        const response = await this.client.post(`/workflows/${id}/execute`, context);
        return response.data.data;
      }
    };
  }

  // Squads API
  get squads() {
    return {
      list: async (params?: ListSquadsParams): Promise<PaginatedResponse<Squad>> => {
        const response = await this.client.get('/squads', { params });
        return response.data;
      },

      create: async (data: CreateSquadData): Promise<Squad> => {
        const response = await this.client.post('/squads', data);
        return response.data.data;
      },

      get: async (id: string): Promise<Squad> => {
        const response = await this.client.get(`/squads/${id}`);
        return response.data.data;
      },

      update: async (id: string, data: Partial<CreateSquadData>): Promise<Squad> => {
        const response = await this.client.put(`/squads/${id}`, data);
        return response.data.data;
      },

      delete: async (id: string): Promise<void> => {
        await this.client.delete(`/squads/${id}`);
      }
    };
  }

  // Calls API
  get calls() {
    return {
      list: async (params?: ListCallsParams): Promise<PaginatedResponse<CallSession>> => {
        const response = await this.client.get('/calls', { params });
        return response.data;
      },

      create: async (data: CreateCallData): Promise<CallSession> => {
        const response = await this.client.post('/calls', data);
        return response.data.data;
      },

      get: async (id: string): Promise<CallSession> => {
        const response = await this.client.get(`/calls/${id}`);
        return response.data.data;
      },

      end: async (id: string): Promise<void> => {
        await this.client.post(`/calls/${id}/end`);
      },

      transfer: async (id: string, phoneNumber: string): Promise<void> => {
        await this.client.post(`/calls/${id}/transfer`, { phoneNumber });
      },

      transcript: async (id: string): Promise<TranscriptEntry[]> => {
        const response = await this.client.get(`/calls/${id}/transcript`);
        return response.data.data;
      },

      recording: async (id: string): Promise<string | null> => {
        const response = await this.client.get(`/calls/${id}/recording`);
        return response.data.data;
      }
    };
  }

  // Phone Numbers API
  get phoneNumbers() {
    return {
      list: async (): Promise<PhoneNumber[]> => {
        const response = await this.client.get('/phone-numbers');
        return response.data.data;
      },

      provision: async (data: ProvisionPhoneNumberData): Promise<PhoneNumber> => {
        const response = await this.client.post('/phone-numbers', data);
        return response.data.data;
      },

      get: async (id: string): Promise<PhoneNumber> => {
        const response = await this.client.get(`/phone-numbers/${id}`);
        return response.data.data;
      },

      update: async (id: string, data: Partial<ProvisionPhoneNumberData>): Promise<PhoneNumber> => {
        const response = await this.client.put(`/phone-numbers/${id}`, data);
        return response.data.data;
      },

      release: async (id: string): Promise<void> => {
        await this.client.delete(`/phone-numbers/${id}`);
      }
    };
  }

  // Testing API
  get testing() {
    return {
      suites: {
        list: async (): Promise<VoiceTestSuite[]> => {
          const response = await this.client.get('/test-suites');
          return response.data.data;
        },

        create: async (data: CreateTestSuiteData): Promise<VoiceTestSuite> => {
          const response = await this.client.post('/test-suites', data);
          return response.data.data;
        },

        get: async (id: string): Promise<VoiceTestSuite> => {
          const response = await this.client.get(`/test-suites/${id}`);
          return response.data.data;
        },

        run: async (id: string): Promise<TestSuiteResult> => {
          const response = await this.client.post(`/test-suites/${id}/run`);
          return response.data.data;
        },

        results: async (id: string): Promise<TestResult[]> => {
          const response = await this.client.get(`/test-suites/${id}/results`);
          return response.data.data;
        }
      },

      runTest: async (testData: RunTestData): Promise<TestResult> => {
        const response = await this.client.post('/test/run', testData);
        return response.data.data;
      }
    };
  }

  // Analytics API
  get analytics() {
    return {
      dashboard: async (timeRange?: string): Promise<AnalyticsDashboard> => {
        const response = await this.client.get('/analytics/dashboard', {
          params: { timeRange }
        });
        return response.data.data;
      },

      calls: async (params?: AnalyticsCallsParams): Promise<CallAnalytics[]> => {
        const response = await this.client.get('/analytics/calls', { params });
        return response.data.data;
      },

      performance: async (params?: AnalyticsPerformanceParams): Promise<PerformanceMetrics> => {
        const response = await this.client.get('/analytics/performance', { params });
        return response.data.data;
      },

      export: async (params: AnalyticsExportParams): Promise<Blob> => {
        const response = await this.client.get('/analytics/export', {
          params,
          responseType: 'blob'
        });
        return response.data;
      }
    };
  }

  // Integrations API
  get integrations() {
    return {
      list: async (): Promise<Integration[]> => {
        const response = await this.client.get('/integrations');
        return response.data.data;
      },

      create: async (data: CreateIntegrationData): Promise<Integration> => {
        const response = await this.client.post('/integrations', data);
        return response.data.data;
      },

      get: async (id: string): Promise<Integration> => {
        const response = await this.client.get(`/integrations/${id}`);
        return response.data.data;
      },

      update: async (id: string, data: Partial<CreateIntegrationData>): Promise<Integration> => {
        const response = await this.client.put(`/integrations/${id}`, data);
        return response.data.data;
      },

      delete: async (id: string): Promise<void> => {
        await this.client.delete(`/integrations/${id}`);
      },

      test: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await this.client.post(`/integrations/${id}/test`);
        return response.data.data;
      }
    };
  }

  // Real-time Voice API
  voice(sessionId?: string) {
    return {
      connect: (options?: VoiceConnectOptions): VoiceConnection => {
        const wsUrl = `${this.baseUrl.replace('http', 'ws')}/voice/${sessionId || 'new'}`;
        const ws = new WebSocket(wsUrl, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (sessionId) {
          this.wsConnections.set(sessionId, ws);
        }

        return new VoiceConnection(ws, this);
      },

      disconnect: (sessionId: string): void => {
        const ws = this.wsConnections.get(sessionId);
        if (ws) {
          ws.close();
          this.wsConnections.delete(sessionId);
        }
      }
    };
  }

  // Utility methods
  async ping(): Promise<{ success: boolean; latency: number }> {
    const startTime = Date.now();
    try {
      await this.client.get('/ping');
      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime
      };
    }
  }

  async getAccount(): Promise<Account> {
    const response = await this.client.get('/account');
    return response.data.data;
  }

  async getUsage(params?: UsageParams): Promise<UsageStats> {
    const response = await this.client.get('/usage', { params });
    return response.data.data;
  }
}

// Voice Connection Class
export class VoiceConnection extends EventEmitter {
  private ws: WebSocket;
  private client: VoicePartnerAI;

  constructor(ws: WebSocket, client: VoicePartnerAI) {
    super();
    this.ws = ws;
    this.client = client;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.ws.on('open', () => {
      this.emit('connected');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        this.emit('error', error);
      }
    });

    this.ws.on('close', () => {
      this.emit('disconnected');
    });

    this.ws.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'audio':
        this.emit('audio', message.data);
        break;
      case 'transcript':
        this.emit('transcript', message.data);
        break;
      case 'status':
        this.emit('status', message.data);
        break;
      case 'error':
        this.emit('error', new Error(message.error));
        break;
      default:
        this.emit('message', message);
    }
  }

  sendAudio(audioData: Buffer): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }

  sendMessage(message: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  close(): void {
    this.ws.close();
  }
}

// Error Class
export class VoicePartnerAIError extends Error {
  public statusCode?: number;
  public response?: any;

  constructor(error: any) {
    super(error.response?.data?.error?.message || error.message || 'Unknown error');
    
    this.name = 'VoicePartnerAIError';
    this.statusCode = error.response?.status;
    this.response = error.response?.data;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VoicePartnerAIError);
    }
  }
}

// Type Definitions
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
  position: { x: number; y: number };
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

// API Parameter Interfaces
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

// Export default
export default VoicePartnerAI;