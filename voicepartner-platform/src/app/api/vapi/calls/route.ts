import { NextRequest, NextResponse } from 'next/server'

export interface VapiCall {
  id: string
  orgId: string
  createdAt: string
  updatedAt: string
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall'
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  phoneCallProvider?: 'twilio' | 'vonage' | 'vapi'
  phoneCallProviderBypassEnabled?: boolean
  phoneCallTransport?: 'sip' | 'pstn'
  assistantId?: string
  squadId?: string
  phoneNumberId?: string
  customer?: {
    number?: string
    sipUri?: string
    name?: string
    extension?: string
  }
  phoneCallProviderId?: string
  startedAt?: string
  endedAt?: string
  duration?: number // in seconds
  endedReason?: 'assistant-ended' | 'customer-ended' | 'assistant-forwarded-call' | 'assistant-join-timeout' | 'exceeded-max-duration' | 'exceeded-silence-threshold' | 'machine-detected' | 'pipeline-error-openai-llm-failed' | 'pipeline-error-azure-voice-failed' | 'pipeline-error-elevenlabs-voice-failed' | 'pipeline-error-custom-voice-failed' | 'pipeline-error-deepgram-transcriber-failed' | 'pipeline-error-gladia-transcriber-failed' | 'pipeline-error-custom-transcriber-failed' | 'pipeline-error-twilio-failed' | 'pipeline-error-vonage-failed' | 'pipeline-error-vapi-failed' | 'pipeline-error-unknown' | 'silence-timed-out' | 'reached-max-duration' | 'reached-inactivity-timeout' | 'machine-detected-human-answer-required' | 'machine-detected-machine-answer-ok' | 'voice-mail-detected' | 'unknown'
  costs?: Array<{
    type: 'model' | 'transcriber' | 'voice' | 'vapi' | 'total'
    timestampMs?: number
    cost: number
    currency: 'usd'
    duration?: number
  }>
  costBreakdown?: {
    llm: number
    stt: number
    tts: number
    vapi: number
    total: number
    llmPromptTokens: number
    llmCompletionTokens: number
    ttsCharacters: number
    sttSeconds: number
    vapiSeconds: number
  }
  messages?: Array<{
    type: string
    timestamp: string
    message: any
  }>
  recordingUrl?: string
  recordingProvider?: 'deepgram' | 'twilio' | 'custom'
  stereoRecordingUrl?: string
  transcript?: string
  artifact?: {
    messagesOpenAIFormatted?: Array<{
      role: 'system' | 'user' | 'assistant' | 'function' | 'tool'
      content: string
      name?: string
      function_call?: any
      tool_calls?: any
    }>
    recordingUrl?: string
    stereoRecordingUrl?: string
    videoRecordingUrl?: string
    transcript?: string
    recordingS3PathWav?: string
    recordingS3PathMp3?: string
    stereoRecordingS3PathWav?: string
    stereoRecordingS3PathMp3?: string
    videoRecordingS3Path?: string
  }
  analysis?: {
    summary?: string
    structuredData?: any
    successEvaluation?: string
    sentiment?: 'positive' | 'negative' | 'neutral'
    callScoreExplanation?: string
  }
  monitor?: {
    listenUrl?: string
    controlUrl?: string
  }
  webCallUrl?: string
}

interface CreateCallRequest {
  phoneNumberId?: string
  customer?: VapiCall['customer']
  assistantId?: string
  squadId?: string
  assistantOverrides?: any
  squadOverrides?: any
  phoneCallProvider?: VapiCall['phoneCallProvider']
  phoneCallProviderBypassEnabled?: boolean
  phoneCallTransport?: VapiCall['phoneCallTransport']
  phoneCallProviderId?: string
}

// Mock database
const calls: VapiCall[] = []

// GET /api/vapi/calls - List all calls
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const cursor = url.searchParams.get('cursor')
    const assistantId = url.searchParams.get('assistantId')
    const phoneNumberId = url.searchParams.get('phoneNumberId')
    const status = url.searchParams.get('status')
    
    let filteredCalls = calls
    
    // Apply filters
    if (assistantId) {
      filteredCalls = filteredCalls.filter(call => call.assistantId === assistantId)
    }
    
    if (phoneNumberId) {
      filteredCalls = filteredCalls.filter(call => call.phoneNumberId === phoneNumberId)
    }
    
    if (status) {
      filteredCalls = filteredCalls.filter(call => call.status === status)
    }
    
    // Sort by most recent first
    filteredCalls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Paginate
    const paginatedCalls = filteredCalls.slice(0, limit)
    
    return NextResponse.json({
      calls: paginatedCalls,
      pagination: {
        limit,
        cursor: cursor || null,
        hasMore: filteredCalls.length > limit
      }
    })
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/calls - Create outbound call
export async function POST(request: NextRequest) {
  try {
    const body: CreateCallRequest = await request.json()
    
    // Validate required fields for outbound calls
    if (!body.phoneNumberId && !body.customer?.number) {
      return NextResponse.json(
        { error: 'Either phoneNumberId or customer.number is required' },
        { status: 400 }
      )
    }
    
    if (!body.assistantId && !body.squadId) {
      return NextResponse.json(
        { error: 'Either assistantId or squadId is required' },
        { status: 400 }
      )
    }
    
    // Create new call
    const newCall: VapiCall = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orgId: 'org_default', // In production, get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'outboundPhoneCall',
      status: 'queued',
      phoneCallProvider: body.phoneCallProvider || 'vapi',
      phoneCallProviderBypassEnabled: body.phoneCallProviderBypassEnabled ?? false,
      phoneCallTransport: body.phoneCallTransport || 'pstn',
      assistantId: body.assistantId,
      squadId: body.squadId,
      phoneNumberId: body.phoneNumberId,
      customer: body.customer,
      phoneCallProviderId: body.phoneCallProviderId,
      costs: [],
      costBreakdown: {
        llm: 0,
        stt: 0,
        tts: 0,
        vapi: 0,
        total: 0,
        llmPromptTokens: 0,
        llmCompletionTokens: 0,
        ttsCharacters: 0,
        sttSeconds: 0,
        vapiSeconds: 0
      },
      messages: [],
      analysis: {
        sentiment: 'neutral'
      }
    }
    
    // Add to mock database
    calls.push(newCall)
    
    // Simulate call progression
    setTimeout(() => updateCallStatus(newCall.id, 'ringing'), 1000)
    setTimeout(() => updateCallStatus(newCall.id, 'in-progress'), 3000)
    setTimeout(() => updateCallStatus(newCall.id, 'ended'), 30000)
    
    return NextResponse.json(newCall, { status: 201 })
  } catch (error) {
    console.error('Error creating call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to update call status
function updateCallStatus(callId: string, status: VapiCall['status']) {
  const callIndex = calls.findIndex(call => call.id === callId)
  if (callIndex !== -1) {
    calls[callIndex].status = status
    calls[callIndex].updatedAt = new Date().toISOString()
    
    if (status === 'in-progress' && !calls[callIndex].startedAt) {
      calls[callIndex].startedAt = new Date().toISOString()
    }
    
    if (status === 'ended') {
      calls[callIndex].endedAt = new Date().toISOString()
      calls[callIndex].endedReason = 'assistant-ended'
      calls[callIndex].duration = Math.floor(Math.random() * 300) + 30 // 30-330 seconds
      
      // Add mock cost breakdown
      const duration = calls[callIndex].duration || 0
      calls[callIndex].costBreakdown = {
        llm: duration * 0.002,
        stt: duration * 0.001,
        tts: duration * 0.003,
        vapi: duration * 0.005,
        total: duration * 0.011,
        llmPromptTokens: Math.floor(duration * 10),
        llmCompletionTokens: Math.floor(duration * 15),
        ttsCharacters: Math.floor(duration * 50),
        sttSeconds: duration,
        vapiSeconds: duration
      }
    }
  }
}