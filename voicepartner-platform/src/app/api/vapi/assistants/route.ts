import { NextRequest, NextResponse } from 'next/server'

export interface VapiAssistant {
  id: string
  orgId: string
  createdAt: string
  updatedAt: string
  name: string
  firstMessage?: string
  systemPrompt?: string
  model: {
    provider: 'openai' | 'anthropic' | 'groq' | 'together-ai'
    model: string
    temperature?: number
    maxTokens?: number
    emotionRecognitionEnabled?: boolean
    numFastTurns?: number
  }
  voice: {
    provider: 'azure' | 'elevenlabs' | 'openai' | 'rime-ai' | 'playht'
    voiceId: string
    speed?: number
    chunkPlan?: {
      enabled: boolean
      minCharacters?: number
      punctuationBoundaries?: string[]
    }
  }
  transcriber: {
    provider: 'azure' | 'deepgram' | 'gladia' | 'openai' | 'speechmatics'
    model?: string
    language?: string
    smartFormat?: boolean
    languageDetectionEnabled?: boolean
    keywords?: string[]
  }
  clientMessages?: string[]
  serverMessages?: string[]
  silenceTimeoutSeconds?: number
  maxDurationSeconds?: number
  backgroundSound?: 'office' | 'nature' | 'music' | 'none'
  backchannelingEnabled?: boolean
  backgroundDenoisingEnabled?: boolean
  modelOutputInMessagesEnabled?: boolean
  transportConfigurations?: Array<{
    provider: 'twilio' | 'vonage' | 'vapi'
    timeout?: number
    record?: boolean
    recordingChannels?: 'mono' | 'dual'
  }>
  responseDelaySeconds?: number
  llmRequestDelaySeconds?: number
  startSpeakingPlan?: {
    waitSeconds?: number
    smartEndpointingEnabled?: boolean
    transcriptionEndpointingPlan?: {
      onPunctuationSeconds?: number
      onNoPunctuationSeconds?: number
      onNumberSeconds?: number
    }
  }
  stopSpeakingPlan?: {
    numWords?: number
    voiceSeconds?: number
    backoffSeconds?: number
  }
  credentialIds?: string[]
  monitor?: {
    listenEnabled?: boolean
    controlEnabled?: boolean
  }
  hipaaEnabled?: boolean
}

interface CreateAssistantRequest {
  name: string
  firstMessage?: string
  systemPrompt?: string
  model: VapiAssistant['model']
  voice: VapiAssistant['voice']
  transcriber?: VapiAssistant['transcriber']
  clientMessages?: string[]
  serverMessages?: string[]
  silenceTimeoutSeconds?: number
  maxDurationSeconds?: number
  backgroundSound?: VapiAssistant['backgroundSound']
  backchannelingEnabled?: boolean
  backgroundDenoisingEnabled?: boolean
  modelOutputInMessagesEnabled?: boolean
  transportConfigurations?: VapiAssistant['transportConfigurations']
  responseDelaySeconds?: number
  llmRequestDelaySeconds?: number
  startSpeakingPlan?: VapiAssistant['startSpeakingPlan']
  stopSpeakingPlan?: VapiAssistant['stopSpeakingPlan']
  credentialIds?: string[]
  monitor?: VapiAssistant['monitor']
  hipaaEnabled?: boolean
}

// Mock database - in production, use your actual database
const assistants: VapiAssistant[] = []

// GET /api/vapi/assistants - List all assistants
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const cursor = url.searchParams.get('cursor')
    
    // In production, implement proper pagination
    const paginatedAssistants = assistants.slice(0, limit)
    
    return NextResponse.json({
      assistants: paginatedAssistants,
      pagination: {
        limit,
        cursor: cursor || null,
        hasMore: assistants.length > limit
      }
    })
  } catch (error) {
    console.error('Error fetching assistants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/assistants - Create new assistant
export async function POST(request: NextRequest) {
  try {
    const body: CreateAssistantRequest = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    if (!body.model) {
      return NextResponse.json(
        { error: 'Model configuration is required' },
        { status: 400 }
      )
    }
    
    if (!body.voice) {
      return NextResponse.json(
        { error: 'Voice configuration is required' },
        { status: 400 }
      )
    }
    
    // Create new assistant
    const newAssistant: VapiAssistant = {
      id: `asst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orgId: 'org_default', // In production, get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: body.name,
      firstMessage: body.firstMessage || "Hi! How can I help you today?",
      systemPrompt: body.systemPrompt || "You are a helpful AI assistant.",
      model: {
        provider: body.model.provider || 'openai',
        model: body.model.model || 'gpt-3.5-turbo',
        temperature: body.model.temperature ?? 0.7,
        maxTokens: body.model.maxTokens ?? 512,
        emotionRecognitionEnabled: body.model.emotionRecognitionEnabled ?? false,
        numFastTurns: body.model.numFastTurns ?? 0
      },
      voice: {
        provider: body.voice.provider || 'elevenlabs',
        voiceId: body.voice.voiceId || 'rachel',
        speed: body.voice.speed ?? 1.0,
        chunkPlan: body.voice.chunkPlan ?? {
          enabled: true,
          minCharacters: 30,
          punctuationBoundaries: ['.', '!', '?', ',', ';']
        }
      },
      transcriber: body.transcriber ?? {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
        smartFormat: true,
        languageDetectionEnabled: false
      },
      clientMessages: body.clientMessages ?? [
        'conversation-update',
        'function-call',
        'hang',
        'model-output',
        'speech-update',
        'status-update',
        'transcript',
        'tool-calls',
        'user-interrupted',
        'voice-input'
      ],
      serverMessages: body.serverMessages ?? [
        'conversation-update',
        'end-of-call-report',
        'function-call',
        'hang',
        'model-output',
        'speech-update',
        'status-update',
        'tool-calls',
        'transfer-update',
        'transcript',
        'user-interrupted',
        'voice-input'
      ],
      silenceTimeoutSeconds: body.silenceTimeoutSeconds ?? 30,
      maxDurationSeconds: body.maxDurationSeconds ?? 1800, // 30 minutes
      backgroundSound: body.backgroundSound ?? 'none',
      backchannelingEnabled: body.backchannelingEnabled ?? false,
      backgroundDenoisingEnabled: body.backgroundDenoisingEnabled ?? false,
      modelOutputInMessagesEnabled: body.modelOutputInMessagesEnabled ?? false,
      transportConfigurations: body.transportConfigurations ?? [],
      responseDelaySeconds: body.responseDelaySeconds ?? 0.4,
      llmRequestDelaySeconds: body.llmRequestDelaySeconds ?? 0.1,
      startSpeakingPlan: body.startSpeakingPlan ?? {
        waitSeconds: 0.4,
        smartEndpointingEnabled: true,
        transcriptionEndpointingPlan: {
          onPunctuationSeconds: 0.1,
          onNoPunctuationSeconds: 1.5,
          onNumberSeconds: 0.5
        }
      },
      stopSpeakingPlan: body.stopSpeakingPlan ?? {
        numWords: 0,
        voiceSeconds: 0.2,
        backoffSeconds: 1
      },
      credentialIds: body.credentialIds ?? [],
      monitor: body.monitor ?? {
        listenEnabled: false,
        controlEnabled: false
      },
      hipaaEnabled: body.hipaaEnabled ?? false
    }
    
    // Add to mock database
    assistants.push(newAssistant)
    
    return NextResponse.json(newAssistant, { status: 201 })
  } catch (error) {
    console.error('Error creating assistant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}