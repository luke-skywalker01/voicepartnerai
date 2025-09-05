import { NextRequest, NextResponse } from 'next/server'

export interface VapiProvider {
  id: string
  orgId: string
  name: string
  type: 'llm' | 'stt' | 'tts' | 'telephony'
  provider: string
  status: 'active' | 'inactive' | 'error' | 'testing'
  configuration: {
    apiKey?: string
    endpoint?: string
    region?: string
    model?: string
    version?: string
    customSettings?: Record<string, any>
  }
  capabilities: {
    languages?: string[]
    models?: Array<{
      id: string
      name: string
      description: string
      pricing?: {
        inputTokens?: number
        outputTokens?: number
        perSecond?: number
        perCharacter?: number
        currency: string
      }
    }>
    features?: string[]
    limits?: {
      maxTokens?: number
      maxDuration?: number
      rateLimit?: number
    }
  }
  usage: {
    totalRequests: number
    totalCost: number
    averageLatency: number
    errorRate: number
    lastUsed?: string
  }
  monitoring: {
    healthCheck: {
      status: 'healthy' | 'degraded' | 'down' | 'unknown'
      lastCheck: string
      responseTime: number
    }
    alerts: Array<{
      type: 'error' | 'warning' | 'info'
      message: string
      timestamp: string
      resolved: boolean
    }>
  }
  createdAt: string
  updatedAt: string
  lastTested?: string
}

// Mock providers data
const generateMockProviders = (): VapiProvider[] => {
  return [
    {
      id: 'provider_openai_llm',
      orgId: 'org_default',
      name: 'OpenAI GPT Models',
      type: 'llm',
      provider: 'openai',
      status: 'active',
      configuration: {
        apiKey: 'sk-proj-****************************',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        version: 'v1',
        customSettings: {
          temperature: 0.7,
          maxTokens: 4096,
          topP: 1.0,
          presencePenalty: 0.0,
          frequencyPenalty: 0.0
        }
      },
      capabilities: {
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
        models: [
          {
            id: 'gpt-4',
            name: 'GPT-4',
            description: 'Most capable model, great for complex reasoning',
            pricing: {
              inputTokens: 0.01,
              outputTokens: 0.03,
              currency: 'USD'
            }
          },
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            description: 'Faster and more cost-effective than GPT-4',
            pricing: {
              inputTokens: 0.01,
              outputTokens: 0.03,
              currency: 'USD'
            }
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            description: 'Fast and cost-effective for simpler tasks',
            pricing: {
              inputTokens: 0.0015,
              outputTokens: 0.002,
              currency: 'USD'
            }
          }
        ],
        features: ['function_calling', 'json_mode', 'vision', 'streaming'],
        limits: {
          maxTokens: 128000,
          rateLimit: 10000
        }
      },
      usage: {
        totalRequests: 15420,
        totalCost: 234.67,
        averageLatency: 1250,
        errorRate: 0.8,
        lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      monitoring: {
        healthCheck: {
          status: 'healthy',
          lastCheck: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          responseTime: 1150
        },
        alerts: [
          {
            type: 'warning',
            message: 'Rate limit approaching 80% of quota',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            resolved: false
          }
        ]
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastTested: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'provider_elevenlabs_tts',
      orgId: 'org_default',
      name: 'ElevenLabs Text-to-Speech',
      type: 'tts',
      provider: 'elevenlabs',
      status: 'active',
      configuration: {
        apiKey: 'xl_****************************',
        endpoint: 'https://api.elevenlabs.io/v1',
        model: 'eleven_multilingual_v2',
        customSettings: {
          stability: 0.75,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true
        }
      },
      capabilities: {
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'hi', 'ar', 'zh', 'ja', 'ko'],
        models: [
          {
            id: 'eleven_multilingual_v2',
            name: 'Multilingual V2',
            description: 'Latest multilingual model with improved quality',
            pricing: {
              perCharacter: 0.00022,
              currency: 'USD'
            }
          },
          {
            id: 'eleven_monolingual_v1',
            name: 'English V1',
            description: 'High-quality English-only model',
            pricing: {
              perCharacter: 0.00022,
              currency: 'USD'
            }
          },
          {
            id: 'eleven_turbo_v2',
            name: 'Turbo V2',
            description: 'Fastest model with good quality',
            pricing: {
              perCharacter: 0.00018,
              currency: 'USD'
            }
          }
        ],
        features: ['voice_cloning', 'emotion_control', 'streaming', 'ssml'],
        limits: {
          maxDuration: 300,
          rateLimit: 100
        }
      },
      usage: {
        totalRequests: 8934,
        totalCost: 87.23,
        averageLatency: 2100,
        errorRate: 1.2,
        lastUsed: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      monitoring: {
        healthCheck: {
          status: 'healthy',
          lastCheck: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          responseTime: 1980
        },
        alerts: []
      },
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastTested: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'provider_deepgram_stt',
      orgId: 'org_default',
      name: 'Deepgram Speech-to-Text',
      type: 'stt',
      provider: 'deepgram',
      status: 'active',
      configuration: {
        apiKey: 'dk_****************************',
        endpoint: 'https://api.deepgram.com/v1',
        model: 'nova-2',
        customSettings: {
          language: 'en-US',
          punctuate: true,
          diarize: true,
          numerals: true,
          profanityFilter: false,
          redact: ['pci', 'ssn']
        }
      },
      capabilities: {
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'hi', 'ar'],
        models: [
          {
            id: 'nova-2',
            name: 'Nova-2',
            description: 'Latest and most accurate general-purpose model',
            pricing: {
              perSecond: 0.0043,
              currency: 'USD'
            }
          },
          {
            id: 'nova',
            name: 'Nova',
            description: 'High-accuracy model for conversational AI',
            pricing: {
              perSecond: 0.0043,
              currency: 'USD'
            }
          },
          {
            id: 'enhanced',
            name: 'Enhanced',
            description: 'Optimized for phone call audio',
            pricing: {
              perSecond: 0.0055,
              currency: 'USD'
            }
          },
          {
            id: 'base',
            name: 'Base',
            description: 'Cost-effective option for simple use cases',
            pricing: {
              perSecond: 0.0025,
              currency: 'USD'
            }
          }
        ],
        features: ['real_time', 'batch', 'diarization', 'punctuation', 'profanity_filter', 'redaction'],
        limits: {
          maxDuration: 3600,
          rateLimit: 200
        }
      },
      usage: {
        totalRequests: 12847,
        totalCost: 156.78,
        averageLatency: 850,
        errorRate: 0.5,
        lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      monitoring: {
        healthCheck: {
          status: 'healthy',
          lastCheck: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          responseTime: 820
        },
        alerts: []
      },
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastTested: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'provider_anthropic_llm',
      orgId: 'org_default',
      name: 'Anthropic Claude',
      type: 'llm',
      provider: 'anthropic',
      status: 'testing',
      configuration: {
        apiKey: 'sk-ant-****************************',
        endpoint: 'https://api.anthropic.com/v1',
        model: 'claude-3-sonnet-20240229',
        version: 'v1',
        customSettings: {
          maxTokens: 4096,
          temperature: 0.7,
          topP: 1.0
        }
      },
      capabilities: {
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
        models: [
          {
            id: 'claude-3-opus-20240229',
            name: 'Claude 3 Opus',
            description: 'Anthropics most powerful model for complex tasks',
            pricing: {
              inputTokens: 0.015,
              outputTokens: 0.075,
              currency: 'USD'
            }
          },
          {
            id: 'claude-3-sonnet-20240229',
            name: 'Claude 3 Sonnet',
            description: 'Balanced performance and speed',
            pricing: {
              inputTokens: 0.003,
              outputTokens: 0.015,
              currency: 'USD'
            }
          },
          {
            id: 'claude-3-haiku-20240307',
            name: 'Claude 3 Haiku',
            description: 'Fastest model for simple tasks',
            pricing: {
              inputTokens: 0.00025,
              outputTokens: 0.00125,
              currency: 'USD'
            }
          }
        ],
        features: ['function_calling', 'vision', 'streaming', 'system_prompts'],
        limits: {
          maxTokens: 200000,
          rateLimit: 5000
        }
      },
      usage: {
        totalRequests: 234,
        totalCost: 12.45,
        averageLatency: 1800,
        errorRate: 2.1,
        lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      monitoring: {
        healthCheck: {
          status: 'healthy',
          lastCheck: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          responseTime: 1650
        },
        alerts: [
          {
            type: 'info',
            message: 'Provider added for testing',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            resolved: false
          }
        ]
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      lastTested: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'provider_twilio_telephony',
      orgId: 'org_default',
      name: 'Twilio Voice',
      type: 'telephony',
      provider: 'twilio',
      status: 'active',
      configuration: {
        apiKey: 'AC****************************',
        endpoint: 'https://api.twilio.com/2010-04-01',
        region: 'us1',
        customSettings: {
          recordCalls: true,
          transcribeAudio: true,
          sipDomain: 'your-app.sip.twilio.com'
        }
      },
      capabilities: {
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
        features: ['voice_calls', 'sms', 'sip', 'webrtc', 'recording', 'transcription'],
        limits: {
          rateLimit: 1000
        }
      },
      usage: {
        totalRequests: 5672,
        totalCost: 89.34,
        averageLatency: 650,
        errorRate: 0.3,
        lastUsed: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      },
      monitoring: {
        healthCheck: {
          status: 'healthy',
          lastCheck: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          responseTime: 580
        },
        alerts: []
      },
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastTested: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ]
}

// GET /api/vapi/providers - List all providers
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // Filter by provider type
    const status = url.searchParams.get('status') // Filter by status
    const provider = url.searchParams.get('provider') // Filter by provider name
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const includeUsage = url.searchParams.get('includeUsage') === 'true'
    
    let providers = generateMockProviders()
    
    // Apply filters
    if (type) {
      providers = providers.filter(p => p.type === type)
    }
    
    if (status) {
      providers = providers.filter(p => p.status === status)
    }
    
    if (provider) {
      providers = providers.filter(p => p.provider === provider)
    }
    
    // Apply pagination
    const paginatedProviders = providers.slice(offset, offset + limit)
    
    // Optionally exclude usage data for lighter responses
    const responseProviders = includeUsage 
      ? paginatedProviders 
      : paginatedProviders.map(provider => {
          const { usage, monitoring, ...providerWithoutUsage } = provider
          return providerWithoutUsage
        })
    
    return NextResponse.json({
      providers: responseProviders,
      pagination: {
        total: providers.length,
        limit,
        offset,
        hasMore: offset + limit < providers.length
      },
      summary: {
        byType: {
          llm: providers.filter(p => p.type === 'llm').length,
          stt: providers.filter(p => p.type === 'stt').length,
          tts: providers.filter(p => p.type === 'tts').length,
          telephony: providers.filter(p => p.type === 'telephony').length
        },
        byStatus: {
          active: providers.filter(p => p.status === 'active').length,
          inactive: providers.filter(p => p.status === 'inactive').length,
          error: providers.filter(p => p.status === 'error').length,
          testing: providers.filter(p => p.status === 'testing').length
        },
        totalCost: providers.reduce((sum, p) => sum + p.usage.totalCost, 0),
        totalRequests: providers.reduce((sum, p) => sum + p.usage.totalRequests, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/providers - Add new provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type || !body.provider) {
      return NextResponse.json(
        { error: 'Name, type, and provider are required' },
        { status: 400 }
      )
    }
    
    const validTypes = ['llm', 'stt', 'tts', 'telephony']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      )
    }
    
    const newProvider: VapiProvider = {
      id: `provider_${body.provider}_${body.type}_${Date.now()}`,
      orgId: 'org_default',
      name: body.name,
      type: body.type,
      provider: body.provider,
      status: 'inactive', // Start as inactive until tested
      configuration: {
        ...body.configuration,
        apiKey: body.configuration?.apiKey ? '****' + body.configuration.apiKey.slice(-4) : undefined
      },
      capabilities: body.capabilities || {
        languages: [],
        models: [],
        features: [],
        limits: {}
      },
      usage: {
        totalRequests: 0,
        totalCost: 0,
        averageLatency: 0,
        errorRate: 0
      },
      monitoring: {
        healthCheck: {
          status: 'unknown',
          lastCheck: new Date().toISOString(),
          responseTime: 0
        },
        alerts: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(newProvider, { status: 201 })
  } catch (error) {
    console.error('Error creating provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/providers - Bulk update providers
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerIds, updates } = body
    
    if (!Array.isArray(providerIds) || !updates) {
      return NextResponse.json(
        { error: 'providerIds array and updates object are required' },
        { status: 400 }
      )
    }
    
    // In production, this would update multiple providers in the database
    const updatedProviders = providerIds.map(id => ({
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
    
    return NextResponse.json({
      updated: updatedProviders.length,
      providers: updatedProviders
    })
  } catch (error) {
    console.error('Error bulk updating providers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/providers - Bulk delete providers
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const providerIds = url.searchParams.get('ids')?.split(',') || []
    
    if (providerIds.length === 0) {
      return NextResponse.json(
        { error: 'No provider IDs provided' },
        { status: 400 }
      )
    }
    
    // In production, this would:
    // 1. Check if providers are being used by assistants or other resources
    // 2. Delete providers from the database
    
    return NextResponse.json({
      deleted: providerIds.length,
      providerIds
    })
  } catch (error) {
    console.error('Error bulk deleting providers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}