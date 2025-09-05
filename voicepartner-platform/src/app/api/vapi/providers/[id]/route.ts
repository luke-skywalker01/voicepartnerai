import { NextRequest, NextResponse } from 'next/server'
import { VapiProvider } from '../route'

// Mock function to get provider by ID
const getProviderById = (id: string): VapiProvider | null => {
  // In production, this would query the database
  const mockProviders = [
    {
      id: 'provider_openai_llm',
      orgId: 'org_default',
      name: 'OpenAI GPT Models',
      type: 'llm' as const,
      provider: 'openai',
      status: 'active' as const,
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
          status: 'healthy' as const,
          lastCheck: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          responseTime: 1150
        },
        alerts: []
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastTested: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]
  
  return mockProviders.find(p => p.id === id) || null
}

// GET /api/vapi/providers/[id] - Get specific provider
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id
    
    const provider = getProviderById(providerId)
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(provider)
  } catch (error) {
    console.error('Error fetching provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/providers/[id] - Update specific provider
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id
    const body = await request.json()
    
    const existingProvider = getProviderById(providerId)
    
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Validate status if provided
    if (body.status) {
      const validStatuses = ['active', 'inactive', 'error', 'testing']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        )
      }
    }
    
    // Mask API key if provided
    if (body.configuration?.apiKey) {
      body.configuration.apiKey = '****' + body.configuration.apiKey.slice(-4)
    }
    
    // Update provider
    const updatedProvider: VapiProvider = {
      ...existingProvider,
      name: body.name || existingProvider.name,
      status: body.status || existingProvider.status,
      configuration: {
        ...existingProvider.configuration,
        ...body.configuration
      },
      capabilities: {
        ...existingProvider.capabilities,
        ...body.capabilities
      },
      updatedAt: new Date().toISOString()
    }
    
    // In production, this would update the provider in the database
    return NextResponse.json(updatedProvider)
  } catch (error) {
    console.error('Error updating provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/providers/[id] - Delete specific provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id
    
    const existingProvider = getProviderById(providerId)
    
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Check if provider is being used
    if (existingProvider.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active provider. Please deactivate it first.' },
        { status: 400 }
      )
    }
    
    // In production, this would:
    // 1. Check if provider is referenced by any assistants
    // 2. Check if provider is used in any workflows
    // 3. Delete the provider from the database
    
    return NextResponse.json({
      message: 'Provider deleted successfully',
      providerId: providerId
    })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/vapi/providers/[id] - Partial update provider (e.g., status change)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id
    const body = await request.json()
    
    const existingProvider = getProviderById(providerId)
    
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }
    
    // Handle status changes with validation
    if (body.status) {
      const validStatuses = ['active', 'inactive', 'error', 'testing']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        )
      }
      
      // Validate configuration before activating
      if (body.status === 'active') {
        const validation = validateProviderConfiguration(existingProvider)
        if (!validation.isValid) {
          return NextResponse.json(
            { error: 'Cannot activate provider: ' + validation.errors.join(', ') },
            { status: 400 }
          )
        }
      }
    }
    
    // Create partial update
    const updates: Partial<VapiProvider> = {
      updatedAt: new Date().toISOString()
    }
    
    if (body.status) updates.status = body.status
    if (body.name) updates.name = body.name
    
    // Handle configuration updates
    if (body.configurationUpdates) {
      updates.configuration = {
        ...existingProvider.configuration,
        ...body.configurationUpdates
      }
      
      // Mask API key
      if (updates.configuration.apiKey) {
        updates.configuration.apiKey = '****' + updates.configuration.apiKey.slice(-4)
      }
    }
    
    const updatedProvider = {
      ...existingProvider,
      ...updates
    }
    
    return NextResponse.json(updatedProvider)
  } catch (error) {
    console.error('Error partially updating provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate provider configuration
function validateProviderConfiguration(provider: VapiProvider): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if API key is configured
  if (!provider.configuration.apiKey || provider.configuration.apiKey.includes('****')) {
    errors.push('API key is required')
  }
  
  // Check if endpoint is configured
  if (!provider.configuration.endpoint) {
    errors.push('API endpoint is required')
  }
  
  // Type-specific validations
  switch (provider.type) {
    case 'llm':
      if (!provider.configuration.model) {
        errors.push('Model selection is required for LLM providers')
      }
      break
    case 'tts':
      if (!provider.capabilities.languages || provider.capabilities.languages.length === 0) {
        errors.push('At least one language must be supported for TTS providers')
      }
      break
    case 'stt':
      if (!provider.capabilities.languages || provider.capabilities.languages.length === 0) {
        errors.push('At least one language must be supported for STT providers')
      }
      break
    case 'telephony':
      if (!provider.configuration.region) {
        errors.push('Region is required for telephony providers')
      }
      break
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}