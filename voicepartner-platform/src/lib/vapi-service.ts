// Comprehensive Vapi Service Implementation
// Mirrors Vapi.ai's workspace capabilities and API structure

export interface VapiAssistant {
  id: string
  name: string
  transcriber: {
    provider: 'deepgram' | 'assemblyai' | 'gladia' | 'speechmatics'
    model?: string
    language?: string
    smartFormat?: boolean
    keywords?: string[]
  }
  model: {
    provider: 'openai' | 'anthropic' | 'groq' | 'together-ai'
    model: string
    systemMessage: string
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    functions?: VapiFunction[]
    tools?: VapiTool[]
  }
  voice: {
    provider: 'elevenlabs' | 'playht' | 'rime-ai' | 'deepgram' | 'azure'
    voiceId: string
    optimizeStreamingLatency?: number
    stability?: number
    similarityBoost?: number
    style?: number
    useSpeakerBoost?: boolean
  }
  firstMessage?: string
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-waits-for-user'
  hipaaEnabled?: boolean
  clientMessages?: string[]
  serverMessages?: string[]
  silenceTimeoutSeconds?: number
  maxDurationSeconds?: number
  backgroundSound?: 'office' | 'nature' | 'none'
  backgroundSoundUrl?: string
  backchannelingEnabled?: boolean
  backgroundDenoisingEnabled?: boolean
  modelOutputInMessagesEnabled?: boolean
  transportConfigurationMaskIncomingPhoneNumber?: boolean
  responseDelaySeconds?: number
  llmRequestDelaySeconds?: number
  numWordsToInterruptAssistant?: number
  maxWordsPerSpokenResponse?: number
  voicemailDetection?: {
    provider: 'twilio'
    voicemailDetectionTypes?: string[]
    enabled?: boolean
    machineDetectionTimeout?: number
    machineDetectionSpeechThreshold?: number
    machineDetectionSpeechEndThreshold?: number
    machineDetectionSilenceTimeout?: number
  }
  voicemailMessage?: string
  endCallMessage?: string
  endCallPhrases?: string[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface VapiWorkflow {
  id: string
  name: string
  description?: string
  nodes: VapiWorkflowNode[]
  edges: VapiWorkflowEdge[]
  triggers: VapiWorkflowTrigger[]
  variables: VapiWorkflowVariable[]
  globalHandlers?: VapiGlobalHandler[]
  createdAt: string
  updatedAt: string
}

export interface VapiWorkflowNode {
  id: string
  type: 'start' | 'message' | 'condition' | 'function' | 'transfer' | 'end'
  position: { x: number; y: number }
  data: {
    label: string
    message?: string
    condition?: string
    functionName?: string
    transferTo?: string
    variables?: Record<string, any>
  }
}

export interface VapiWorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  condition?: string
}

export interface VapiWorkflowTrigger {
  type: 'phone' | 'web' | 'api'
  config: Record<string, any>
}

export interface VapiWorkflowVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object'
  defaultValue?: any
  description?: string
}

export interface VapiGlobalHandler {
  type: 'human_transfer' | 'end_call' | 'error'
  action: string
  config?: Record<string, any>
}

export interface VapiFunction {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
  async?: boolean
  url?: string
}

export interface VapiTool {
  type: 'function' | 'dtmf' | 'endCall' | 'voicemail' | 'transferCall'
  function?: VapiFunction
  dtmf?: {
    enabled: boolean
    timeoutSeconds?: number
  }
  endCall?: {
    enabled: boolean
  }
  voicemail?: {
    enabled: boolean
    detectProvider?: 'twilio'
  }
  transferCall?: {
    enabled: boolean
    destinations?: Array<{
      type: 'number' | 'assistant'
      value: string
    }>
  }
}

export interface VapiCall {
  id: string
  assistantId?: string
  workflowId?: string
  phoneNumber?: string
  customer?: {
    number?: string
    extension?: string
    name?: string
    email?: string
  }
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  type: 'inbound' | 'outbound' | 'web'
  transport: 'pstn' | 'sip' | 'web'
  startedAt?: string
  endedAt?: string
  cost?: number
  costBreakdown?: {
    transport?: number
    transcriber?: number
    model?: number
    voice?: number
    voicemail?: number
    total?: number
  }
  messages?: Array<{
    role: 'user' | 'assistant' | 'system'
    message: string
    time: number
    endTime?: number
    secondsFromStart: number
  }>
  recordingUrl?: string
  transcript?: string
  summary?: string
  analysis?: {
    successEvaluationPlan?: {
      rubric: 'NumericScale' | 'DescriptiveScale' | 'Checklist' | 'Matrix' | 'PercentageScale'
      successEvaluationPrompt?: string
      successEvaluationRubric?: string
    }
    structuredDataPlan?: {
      enabled?: boolean
      schema?: Record<string, any>
      prompt?: string
    }
  }
  stereoRecordingUrl?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface VapiPhoneNumber {
  id: string
  number: string
  twilioPhoneNumber?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  vonagePhoneNumber?: string
  vonageApplicationId?: string
  vonagePrivateKey?: string
  name?: string
  assistantId?: string
  workflowId?: string
  serverUrl?: string
  serverUrlSecret?: string
  createdAt: string
  updatedAt: string
}

export interface VapiSquad {
  id: string
  name: string
  members: Array<{
    assistantId?: string
    workflowId?: string
    assistantDestinations?: Array<{
      type: 'assistant'
      assistantName: string
      message?: string
      description?: string
    }>
    assistantOverrides?: Partial<VapiAssistant>
  }>
  memberOverrides?: {
    transcriber?: Partial<VapiAssistant['transcriber']>
    model?: Partial<VapiAssistant['model']>
    voice?: Partial<VapiAssistant['voice']>
  }
  createdAt: string
  updatedAt: string
}

export class VapiService {
  private apiKey: string
  private baseUrl: string
  private pipecat: any // Pipecat integration
  private n8n: any // N8N workflow integration

  constructor(apiKey: string, options?: { baseUrl?: string }) {
    this.apiKey = apiKey
    this.baseUrl = options?.baseUrl || 'https://api.vapi.ai'
  }

  // Assistant Management
  async createAssistant(assistant: Omit<VapiAssistant, 'id' | 'createdAt' | 'updatedAt'>): Promise<VapiAssistant> {
    const response = await this.makeRequest('POST', '/assistant', assistant)
    return response
  }

  async getAssistant(id: string): Promise<VapiAssistant> {
    const response = await this.makeRequest('GET', `/assistant/${id}`)
    return response
  }

  async updateAssistant(id: string, updates: Partial<VapiAssistant>): Promise<VapiAssistant> {
    const response = await this.makeRequest('PATCH', `/assistant/${id}`, updates)
    return response
  }

  async deleteAssistant(id: string): Promise<void> {
    await this.makeRequest('DELETE', `/assistant/${id}`)
  }

  async listAssistants(): Promise<VapiAssistant[]> {
    const response = await this.makeRequest('GET', '/assistant')
    return response
  }

  // Workflow Management
  async createWorkflow(workflow: Omit<VapiWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<VapiWorkflow> {
    const response = await this.makeRequest('POST', '/workflow', workflow)
    return response
  }

  async getWorkflow(id: string): Promise<VapiWorkflow> {
    const response = await this.makeRequest('GET', `/workflow/${id}`)
    return response
  }

  async updateWorkflow(id: string, updates: Partial<VapiWorkflow>): Promise<VapiWorkflow> {
    const response = await this.makeRequest('PATCH', `/workflow/${id}`, updates)
    return response
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.makeRequest('DELETE', `/workflow/${id}`)
  }

  async listWorkflows(): Promise<VapiWorkflow[]> {
    const response = await this.makeRequest('GET', '/workflow')
    return response
  }

  // Call Management
  async createCall(call: Partial<VapiCall>): Promise<VapiCall> {
    const response = await this.makeRequest('POST', '/call', call)
    return response
  }

  async getCall(id: string): Promise<VapiCall> {
    const response = await this.makeRequest('GET', `/call/${id}`)
    return response
  }

  async listCalls(filters?: {
    assistantId?: string
    workflowId?: string
    phoneNumberId?: string
    customerId?: string
    status?: VapiCall['status']
    type?: VapiCall['type']
    limit?: number
    createdAtGt?: string
    createdAtGte?: string
    createdAtLt?: string
    createdAtLte?: string
    updatedAtGt?: string
    updatedAtGte?: string
    updatedAtLt?: string
    updatedAtLte?: string
  }): Promise<VapiCall[]> {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const url = `/call${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.makeRequest('GET', url)
    return response
  }

  // Phone Number Management
  async createPhoneNumber(phoneNumber: Omit<VapiPhoneNumber, 'id' | 'createdAt' | 'updatedAt'>): Promise<VapiPhoneNumber> {
    const response = await this.makeRequest('POST', '/phone-number', phoneNumber)
    return response
  }

  async getPhoneNumber(id: string): Promise<VapiPhoneNumber> {
    const response = await this.makeRequest('GET', `/phone-number/${id}`)
    return response
  }

  async updatePhoneNumber(id: string, updates: Partial<VapiPhoneNumber>): Promise<VapiPhoneNumber> {
    const response = await this.makeRequest('PATCH', `/phone-number/${id}`, updates)
    return response
  }

  async deletePhoneNumber(id: string): Promise<void> {
    await this.makeRequest('DELETE', `/phone-number/${id}`)
  }

  async listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    const response = await this.makeRequest('GET', '/phone-number')
    return response
  }

  // Squad Management (for multi-assistant workflows)
  async createSquad(squad: Omit<VapiSquad, 'id' | 'createdAt' | 'updatedAt'>): Promise<VapiSquad> {
    const response = await this.makeRequest('POST', '/squad', squad)
    return response
  }

  async getSquad(id: string): Promise<VapiSquad> {
    const response = await this.makeRequest('GET', `/squad/${id}`)
    return response
  }

  async updateSquad(id: string, updates: Partial<VapiSquad>): Promise<VapiSquad> {
    const response = await this.makeRequest('PATCH', `/squad/${id}`, updates)
    return response
  }

  async deleteSquad(id: string): Promise<void> {
    await this.makeRequest('DELETE', `/squad/${id}`)
  }

  async listSquads(): Promise<VapiSquad[]> {
    const response = await this.makeRequest('GET', '/squad')
    return response
  }

  // Web Call Integration
  async startWebCall(config: {
    assistantId?: string
    workflowId?: string
    metadata?: Record<string, any>
  }): Promise<{
    webCallUrl: string
    callId: string
  }> {
    const response = await this.makeRequest('POST', '/call/web', config)
    return response
  }

  // Metrics and Analytics
  async getCallMetrics(filters?: {
    range?: 'day' | 'week' | 'month' | 'year'
    assistantId?: string
    workflowId?: string
  }): Promise<{
    totalCalls: number
    successfulCalls: number
    averageDuration: number
    totalCost: number
    costByProvider: Record<string, number>
  }> {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const url = `/metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.makeRequest('GET', url)
    return response
  }

  // Pipecat Integration
  async integratePipecat(config: {
    assistantId: string
    pipecatConfig: {
      transport: 'daily' | 'webrtc' | 'websocket'
      stt: 'deepgram' | 'whisper' | 'speechmatics'
      tts: 'elevenlabs' | 'azure' | 'openai'
      llm: 'openai' | 'anthropic' | 'groq'
    }
  }): Promise<{
    pipecatEndpoint: string
    sessionId: string
  }> {
    // This would integrate with the actual Pipecat service
    // For now, we'll simulate the integration
    return {
      pipecatEndpoint: `wss://pipecat.yourdomain.com/${config.assistantId}`,
      sessionId: `session_${Date.now()}`
    }
  }

  // N8N Workflow Integration
  async createN8NWorkflow(config: {
    name: string
    triggers: Array<{
      type: 'webhook' | 'schedule' | 'manual'
      config: Record<string, any>
    }>
    nodes: Array<{
      type: string
      parameters: Record<string, any>
    }>
  }): Promise<{
    workflowId: string
    webhookUrl?: string
  }> {
    // This would integrate with N8N API
    // For now, we'll simulate the integration
    return {
      workflowId: `n8n_workflow_${Date.now()}`,
      webhookUrl: config.triggers.some(t => t.type === 'webhook') 
        ? `https://your-n8n.yourdomain.com/webhook/${Date.now()}`
        : undefined
    }
  }

  // Provider Configuration Helpers
  getProviderDefaults() {
    return {
      transcribers: {
        deepgram: {
          model: 'nova-2',
          language: 'en',
          smartFormat: true
        },
        assemblyai: {
          model: 'best',
          language: 'en'
        },
        gladia: {
          model: 'fast',
          language: 'en'
        }
      },
      models: {
        openai: {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 250
        },
        anthropic: {
          model: 'claude-3-haiku-20240307',
          temperature: 0.7,
          maxTokens: 250
        },
        groq: {
          model: 'llama-3.1-70b-versatile',
          temperature: 0.1,
          maxTokens: 250
        }
      },
      voices: {
        elevenlabs: {
          voiceId: 'ErXwobaYiN019PkySvjV',
          optimizeStreamingLatency: 1,
          stability: 0.75,
          similarityBoost: 0.75
        },
        playht: {
          voiceId: 'jennifer',
          temperature: 0.7,
          quality: 'premium'
        },
        'rime-ai': {
          voiceId: 'aurora',
          speed: 1.0
        }
      }
    }
  }

  // Error Handling and Validation
  validateAssistant(assistant: Partial<VapiAssistant>): string[] {
    const errors: string[] = []
    
    if (!assistant.name) errors.push('Assistant name is required')
    if (!assistant.transcriber?.provider) errors.push('Transcriber provider is required')
    if (!assistant.model?.provider) errors.push('Model provider is required')
    if (!assistant.model?.model) errors.push('Model name is required')
    if (!assistant.model?.systemMessage) errors.push('System message is required')
    if (!assistant.voice?.provider) errors.push('Voice provider is required')
    if (!assistant.voice?.voiceId) errors.push('Voice ID is required')
    
    return errors
  }

  validateWorkflow(workflow: Partial<VapiWorkflow>): string[] {
    const errors: string[] = []
    
    if (!workflow.name) errors.push('Workflow name is required')
    if (!workflow.nodes || workflow.nodes.length === 0) errors.push('Workflow must have at least one node')
    if (!workflow.nodes?.some(n => n.type === 'start')) errors.push('Workflow must have a start node')
    
    return errors
  }

  // Private helper methods
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Vapi API Error: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Request failed: ${error}`)
    }
  }
}

// Factory function to create Vapi service
export function createVapiService(apiKey: string, options?: { baseUrl?: string }): VapiService {
  return new VapiService(apiKey, options)
}

// Preset configurations for common use cases
export const VapiPresets = {
  customerSupport: {
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-2',
      language: 'en',
      smartFormat: true
    },
    model: {
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      systemMessage: 'You are a helpful customer support agent. Be concise, professional, and always try to resolve the customer\'s issue.',
      temperature: 0.3,
      maxTokens: 200
    },
    voice: {
      provider: 'elevenlabs' as const,
      voiceId: 'ErXwobaYiN019PkySvjV',
      optimizeStreamingLatency: 1,
      stability: 0.8,
      similarityBoost: 0.75
    },
    firstMessage: 'Hello! I\'m here to help you with any questions or concerns you might have. How can I assist you today?',
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600
  },
  
  appointmentBooking: {
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-2',
      language: 'en',
      smartFormat: true,
      keywords: ['appointment', 'booking', 'schedule', 'calendar', 'time', 'date']
    },
    model: {
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      systemMessage: 'You are an appointment booking assistant. Help users schedule appointments by collecting their name, phone number, preferred date and time, and service type. Be friendly and efficient.',
      temperature: 0.3,
      maxTokens: 200,
      functions: [{
        name: 'book_appointment',
        description: 'Book an appointment with the collected information',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name' },
            phone: { type: 'string', description: 'Customer phone number' },
            service: { type: 'string', description: 'Type of service requested' },
            date: { type: 'string', description: 'Preferred date' },
            time: { type: 'string', description: 'Preferred time' }
          },
          required: ['name', 'phone', 'service', 'date', 'time']
        }
      }]
    },
    voice: {
      provider: 'elevenlabs' as const,
      voiceId: 'ErXwobaYiN019PkySvjV',
      optimizeStreamingLatency: 1,
      stability: 0.75,
      similarityBoost: 0.75
    },
    firstMessage: 'Hi! I\'d be happy to help you schedule an appointment. May I start by getting your name?',
    silenceTimeoutSeconds: 20,
    maxDurationSeconds: 300
  },

  salesQualification: {
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-2',
      language: 'en',
      smartFormat: true
    },
    model: {
      provider: 'anthropic' as const,
      model: 'claude-3-haiku-20240307',
      systemMessage: 'You are a sales qualification agent. Your goal is to understand the prospect\'s needs, budget, timeline, and decision-making process. Be consultative and build rapport.',
      temperature: 0.5,
      maxTokens: 250
    },
    voice: {
      provider: 'elevenlabs' as const,
      voiceId: 'ErXwobaYiN019PkySvjV',
      optimizeStreamingLatency: 1,
      stability: 0.7,
      similarityBoost: 0.8
    },
    firstMessage: 'Hello! Thanks for your interest in our services. I\'d love to learn more about your business and how we might be able to help. Could you tell me a bit about what you\'re looking for?',
    silenceTimeoutSeconds: 25,
    maxDurationSeconds: 900
  }
}