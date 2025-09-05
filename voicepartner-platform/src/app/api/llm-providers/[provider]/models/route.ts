import { NextRequest, NextResponse } from 'next/server'

// LLM Provider model configurations
const llmProviderModels = {
  openai: [
    {
      model_id: 'gpt-4-turbo-preview',
      name: 'GPT-4 Turbo',
      category: 'flagship',
      description: 'Most capable model, best for complex reasoning',
      max_tokens: 128000,
      pricing: {
        input: 0.01,
        output: 0.03,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code', 'analysis'],
      context_window: 128000,
      training_data: '2023-12'
    },
    {
      model_id: 'gpt-4',
      name: 'GPT-4',
      category: 'flagship',
      description: 'High-performance model for complex tasks',
      max_tokens: 8192,
      pricing: {
        input: 0.03,
        output: 0.06,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code', 'analysis'],
      context_window: 8192,
      training_data: '2023-09'
    },
    {
      model_id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      category: 'efficient',
      description: 'Fast and cost-effective for most tasks',
      max_tokens: 4096,
      pricing: {
        input: 0.0015,
        output: 0.002,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'conversation', 'basic-reasoning'],
      context_window: 16385,
      training_data: '2021-09'
    },
    {
      model_id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5 Turbo 16K',
      category: 'efficient',
      description: 'Extended context version of GPT-3.5 Turbo',
      max_tokens: 4096,
      pricing: {
        input: 0.003,
        output: 0.004,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'conversation', 'basic-reasoning'],
      context_window: 16385,
      training_data: '2021-09'
    }
  ],
  anthropic: [
    {
      model_id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      category: 'flagship',
      description: 'Most capable model for complex reasoning and analysis',
      max_tokens: 4096,
      pricing: {
        input: 0.015,
        output: 0.075,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code', 'analysis', 'creative-writing'],
      context_window: 200000,
      training_data: '2023-08'
    },
    {
      model_id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      category: 'balanced',
      description: 'Balanced performance and speed for most tasks',
      max_tokens: 4096,
      pricing: {
        input: 0.003,
        output: 0.015,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code', 'analysis'],
      context_window: 200000,
      training_data: '2023-08'
    },
    {
      model_id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      category: 'efficient',
      description: 'Fastest and most cost-effective option',
      max_tokens: 4096,
      pricing: {
        input: 0.00025,
        output: 0.00125,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'conversation', 'basic-reasoning'],
      context_window: 200000,
      training_data: '2023-08'
    }
  ],
  google: [
    {
      model_id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      category: 'flagship',
      description: 'Google\'s most capable multimodal model',
      max_tokens: 8192,
      pricing: {
        input: 0.00125,
        output: 0.00375,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code', 'multimodal'],
      context_window: 2000000,
      training_data: '2024-02'
    },
    {
      model_id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      category: 'efficient',
      description: 'Optimized for speed and efficiency',
      max_tokens: 8192,
      pricing: {
        input: 0.000075,
        output: 0.0003,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'conversation', 'basic-reasoning'],
      context_window: 1000000,
      training_data: '2024-02'
    },
    {
      model_id: 'gemini-pro',
      name: 'Gemini Pro',
      category: 'balanced',
      description: 'Balanced model for various tasks',
      max_tokens: 32768,
      pricing: {
        input: 0.0005,
        output: 0.0015,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code'],
      context_window: 32768,
      training_data: '2023-12'
    }
  ],
  mistral: [
    {
      model_id: 'mistral-large-latest',
      name: 'Mistral Large',
      category: 'flagship',
      description: 'Flagship model with top-tier reasoning capabilities',
      max_tokens: 32768,
      pricing: {
        input: 0.004,
        output: 0.012,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code', 'multilingual'],
      context_window: 32768,
      training_data: '2024-02'
    },
    {
      model_id: 'mistral-medium-latest',
      name: 'Mistral Medium',
      category: 'balanced',
      description: 'Balanced model for intermediate complexity tasks',
      max_tokens: 32768,
      pricing: {
        input: 0.0025,
        output: 0.0075,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'code', 'multilingual'],
      context_window: 32768,
      training_data: '2024-02'
    },
    {
      model_id: 'mistral-small-latest',
      name: 'Mistral Small',
      category: 'efficient',
      description: 'Cost-effective model for simple tasks',
      max_tokens: 32768,
      pricing: {
        input: 0.001,
        output: 0.003,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'conversation', 'basic-reasoning'],
      context_window: 32768,
      training_data: '2024-02'
    }
  ],
  cohere: [
    {
      model_id: 'command-r-plus',
      name: 'Command R+',
      category: 'flagship',
      description: 'Advanced model for complex reasoning and RAG',
      max_tokens: 4096,
      pricing: {
        input: 0.003,
        output: 0.015,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'rag', 'multilingual'],
      context_window: 128000,
      training_data: '2024-03'
    },
    {
      model_id: 'command-r',
      name: 'Command R',
      category: 'balanced',
      description: 'Versatile model for various enterprise tasks',
      max_tokens: 4096,
      pricing: {
        input: 0.0005,
        output: 0.0015,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'reasoning', 'rag', 'multilingual'],
      context_window: 128000,
      training_data: '2024-03'
    },
    {
      model_id: 'command-light',
      name: 'Command Light',
      category: 'efficient',
      description: 'Lightweight model for simple generation tasks',
      max_tokens: 4096,
      pricing: {
        input: 0.0003,
        output: 0.0006,
        currency: 'USD',
        per_token: 1000
      },
      capabilities: ['text', 'conversation'],
      context_window: 4096,
      training_data: '2024-03'
    }
  ]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // Filter by category: flagship, balanced, efficient
    const capability = searchParams.get('capability') // Filter by capability
    
    // Validate provider
    const validProviders = ['openai', 'anthropic', 'google', 'mistral', 'cohere']
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid provider. Supported providers: ${validProviders.join(', ')}` 
        },
        { status: 400 }
      )
    }

    const providerKey = provider.toLowerCase() as keyof typeof llmProviderModels
    let models = llmProviderModels[providerKey] || []

    // Apply filters
    if (category) {
      models = models.filter(model => model.category === category.toLowerCase())
    }

    if (capability) {
      models = models.filter(model => 
        model.capabilities.includes(capability.toLowerCase())
      )
    }

    // For production, you might want to make real API calls to get latest models:
    // if (provider.toLowerCase() === 'openai') {
    //   const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    //   if (apiKey) {
    //     const response = await fetch('https://api.openai.com/v1/models', {
    //       headers: { 'Authorization': `Bearer ${apiKey}` }
    //     })
    //     const data = await response.json()
    //     return NextResponse.json({ success: true, data: { models: data.data } })
    //   }
    // }

    // Add metadata about available filters
    const availableCategories = [...new Set(models.map(m => m.category))]
    const availableCapabilities = [...new Set(models.flatMap(m => m.capabilities))]

    return NextResponse.json({
      success: true,
      data: {
        provider: provider.toLowerCase(),
        models: models,
        total_count: models.length,
        filters: {
          categories: availableCategories,
          capabilities: availableCapabilities
        }
      }
    })

  } catch (error: any) {
    console.error(`LLM Provider models API error:`, error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}