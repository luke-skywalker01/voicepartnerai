import { NextRequest, NextResponse } from 'next/server'

// Enhanced assistant data structure
interface Assistant {
  id: string
  name: string
  description?: string
  system_prompt: string
  
  // AI Model Configuration
  llm_provider: string
  llm_model: string
  temperature: number
  max_tokens: number
  
  // Voice Configuration
  voice_provider: string
  voice_id: string
  voice_speed: number
  voice_pitch: number
  voice_stability: number
  
  // Language Settings
  language: string
  fallback_language: string
  first_message?: string
  
  // Voice Settings
  interruption_sensitivity: string
  silence_timeout: number
  response_delay: number
  
  // Status and Configuration
  status: 'draft' | 'testing' | 'deployed'
  is_active: boolean
  capabilities?: Record<string, any>
  
  // Relations
  tool_ids: string[]
  file_ids: string[]
  
  // Metadata
  owner_id: string
  created_at: string
  updated_at: string
}

// Mock assistants storage (in production, use database)
let assistants: Assistant[] = [
  {
    id: 'assistant_1',
    name: 'Terminbuchung Assistant',
    description: 'Professioneller Assistant für Terminbuchungen und Kundenservice',
    system_prompt: 'Du bist ein freundlicher und effizienter Terminbuchungsassistent. Hilf Kunden dabei, Termine zu buchen, zu ändern oder zu stornieren. Sei immer höflich und professionell.',
    
    // AI Model Configuration
    llm_provider: 'OpenAI',
    llm_model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1000,
    
    // Voice Configuration
    voice_provider: 'ElevenLabs',
    voice_id: 'german-female-professional',
    voice_speed: 1.0,
    voice_pitch: 1.0,
    voice_stability: 0.75,
    
    // Language Settings
    language: 'de-DE',
    fallback_language: 'en-US',
    first_message: 'Guten Tag! Ich helfe Ihnen gerne bei der Terminbuchung. Wie kann ich Sie unterstützen?',
    
    // Voice Settings
    interruption_sensitivity: 'medium',
    silence_timeout: 3000,
    response_delay: 500,
    
    // Status
    status: 'deployed',
    is_active: true,
    capabilities: {
      book_appointments: true,
      access_calendar: true,
      send_emails: true,
      transfer_calls: false,
      access_crm: true
    },
    
    // Relations
    tool_ids: ['tool_1', 'tool_2'],
    file_ids: ['file_1'],
    
    // Metadata
    owner_id: 'user_demo',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'assistant_2',
    name: 'Kundenservice Bot',
    description: 'Mehrsprachiger Assistant für allgemeinen Kundenservice',
    system_prompt: 'Du bist ein hilfsbereiter Kundenservice-Assistant. Beantworte Fragen zu unseren Produkten und Dienstleistungen. Bei komplexen Problemen leite den Anruf an einen menschlichen Mitarbeiter weiter.',
    
    // AI Model Configuration
    llm_provider: 'OpenAI',
    llm_model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 800,
    
    // Voice Configuration
    voice_provider: 'ElevenLabs',
    voice_id: 'german-male-warm',
    voice_speed: 0.9,
    voice_pitch: 1.1,
    voice_stability: 0.8,
    
    // Language Settings
    language: 'de-DE',
    fallback_language: 'en-US',
    first_message: 'Hallo! Ich bin Ihr Kundenservice-Assistant. Wie kann ich Ihnen behilflich sein?',
    
    // Voice Settings
    interruption_sensitivity: 'high',
    silence_timeout: 2500,
    response_delay: 300,
    
    // Status
    status: 'testing',
    is_active: true,
    capabilities: {
      book_appointments: false,
      access_calendar: false,
      send_emails: true,
      transfer_calls: true,
      access_crm: true
    },
    
    // Relations
    tool_ids: ['tool_3'],
    file_ids: ['file_2', 'file_3'],
    
    // Metadata
    owner_id: 'user_demo',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'assistant_3',
    name: 'Sales Assistant',
    description: 'Spezialisiert auf Verkaufsgespräche und Lead-Qualifizierung',
    system_prompt: 'Du bist ein erfahrener Verkaufsassistent. Führe professionelle Verkaufsgespräche, qualifiziere Leads und sammle wichtige Informationen für das Sales-Team.',
    
    // AI Model Configuration
    llm_provider: 'Anthropic',
    llm_model: 'claude-3-sonnet',
    temperature: 0.8,
    max_tokens: 1200,
    
    // Voice Configuration
    voice_provider: 'OpenAI',
    voice_id: 'alloy',
    voice_speed: 1.1,
    voice_pitch: 0.9,
    voice_stability: 0.7,
    
    // Language Settings
    language: 'en-US',
    fallback_language: 'de-DE',
    first_message: 'Hello! Thank you for your interest in our services. How can I help you today?',
    
    // Voice Settings
    interruption_sensitivity: 'low',
    silence_timeout: 4000,
    response_delay: 400,
    
    // Status
    status: 'draft',
    is_active: false,
    capabilities: {
      book_appointments: true,
      access_calendar: false,
      send_emails: true,
      transfer_calls: true,
      access_crm: true
    },
    
    // Relations
    tool_ids: [],
    file_ids: [],
    
    // Metadata
    owner_id: 'user_demo',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
]

// GET - Fetch assistants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const is_active = searchParams.get('is_active')
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Filter assistants by user and optional filters
    let userAssistants = assistants.filter(assistant => assistant.owner_id === userId)
    
    if (status) {
      userAssistants = userAssistants.filter(assistant => assistant.status === status)
    }
    
    if (is_active !== null && is_active !== undefined) {
      const activeFilter = is_active === 'true'
      userAssistants = userAssistants.filter(assistant => assistant.is_active === activeFilter)
    }
    
    // Apply pagination
    const paginatedAssistants = userAssistants.slice(offset, offset + limit)
    
    // Calculate statistics
    const stats = {
      totalAssistants: userAssistants.length,
      activeAssistants: userAssistants.filter(a => a.is_active).length,
      deployedAssistants: userAssistants.filter(a => a.status === 'deployed').length,
      testingAssistants: userAssistants.filter(a => a.status === 'testing').length,
      draftAssistants: userAssistants.filter(a => a.status === 'draft').length,
      byProvider: userAssistants.reduce((acc, a) => {
        acc[a.llm_provider] = (acc[a.llm_provider] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byVoiceProvider: userAssistants.reduce((acc, a) => {
        acc[a.voice_provider] = (acc[a.voice_provider] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byLanguage: userAssistants.reduce((acc, a) => {
        acc[a.language] = (acc[a.language] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        assistants: paginatedAssistants,
        pagination: {
          total: userAssistants.length,
          limit,
          offset,
          hasMore: offset + limit < userAssistants.length
        },
        stats
      }
    })
  } catch (error) {
    console.error('Assistants GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assistants' },
      { status: 500 }
    )
  }
}

// POST - Create new assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.system_prompt || !body.voice_id) {
      return NextResponse.json(
        { success: false, error: 'Name, system_prompt, and voice_id are required' },
        { status: 400 }
      )
    }

    // In production, get user ID from authentication
    const userId = 'user_demo'

    const newAssistant: Assistant = {
      id: `assistant_${Date.now()}`,
      name: body.name,
      description: body.description,
      system_prompt: body.system_prompt,
      
      // AI Model Configuration
      llm_provider: body.llm_provider || 'OpenAI',
      llm_model: body.llm_model || 'gpt-4o', 
      temperature: body.temperature || 0.7,
      max_tokens: body.max_tokens || 1000,
      
      // Voice Configuration
      voice_provider: body.voice_provider || 'ElevenLabs',
      voice_id: body.voice_id,
      voice_speed: body.voice_speed || 1.0,
      voice_pitch: body.voice_pitch || 1.0,
      voice_stability: body.voice_stability || 0.75,
      
      // Language Settings
      language: body.language || 'de-DE',
      fallback_language: body.fallback_language || 'en-US',
      first_message: body.first_message,
      
      // Voice Settings
      interruption_sensitivity: body.interruption_sensitivity || 'medium',
      silence_timeout: body.silence_timeout || 3000,
      response_delay: body.response_delay || 500,
      
      // Status
      status: body.status || 'draft',
      is_active: body.is_active !== undefined ? body.is_active : true,
      capabilities: body.capabilities,
      
      // Relations
      tool_ids: body.tool_ids || [],
      file_ids: body.file_ids || [],
      
      // Metadata
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    assistants.push(newAssistant)

    return NextResponse.json({
      success: true,
      data: newAssistant,
      message: 'Assistant created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Assistant creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create assistant' },
      { status: 500 }
    )
  }
}

// PUT - Update assistant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Assistant ID is required' },
        { status: 400 }
      )
    }

    // In production, get user ID from authentication
    const userId = 'user_demo'

    const assistantIndex = assistants.findIndex(a => a.id === id && a.owner_id === userId)
    if (assistantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      )
    }

    // Update assistant
    assistants[assistantIndex] = {
      ...assistants[assistantIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: assistants[assistantIndex],
      message: 'Assistant updated successfully'
    })
  } catch (error) {
    console.error('Assistant update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update assistant' },
      { status: 500 }
    )
  }
}

// DELETE - Delete assistant
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Assistant ID is required' },
        { status: 400 }
      )
    }

    // In production, get user ID from authentication
    const userId = 'user_demo'

    const assistantIndex = assistants.findIndex(a => a.id === id && a.owner_id === userId)
    if (assistantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      )
    }

    assistants.splice(assistantIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Assistant deleted successfully'
    })
  } catch (error) {
    console.error('Assistant deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete assistant' },
      { status: 500 }
    )
  }
}