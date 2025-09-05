import { NextRequest, NextResponse } from 'next/server'

// Mock data - in production this would come from a database
let agents = [
  {
    id: '1',
    name: 'Kundenservice Bot',
    description: 'Beantwortet häufige Kundenfragen und leitet komplexe Anfragen weiter',
    status: 'active',
    systemPrompt: 'Du bist ein hilfsreicher Kundenservice-Assistent...',
    voice: {
      provider: 'elevenlabs',
      voiceId: 'german-female-1',
      stability: 0.75,
      clarity: 0.85,
      speed: 1.0
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 150
    },
    transcription: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'de'
    },
    conversations: 1247,
    successRate: 94,
    avgDuration: '3:42',
    lastActivity: new Date().toISOString(),
    language: 'Deutsch',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: agents,
      total: agents.length
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.systemPrompt) {
      return NextResponse.json(
        { success: false, error: 'Name and system prompt are required' },
        { status: 400 }
      )
    }

    const newAgent = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || '',
      status: 'draft',
      systemPrompt: body.systemPrompt,
      voice: body.voice || {
        provider: 'elevenlabs',
        voiceId: 'german-female-1',
        stability: 0.75,
        clarity: 0.85,
        speed: 1.0
      },
      model: body.model || {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 150
      },
      transcription: body.transcription || {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'de'
      },
      conversations: 0,
      successRate: 0,
      avgDuration: '0:00',
      lastActivity: new Date().toISOString(),
      language: body.language || 'Deutsch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    agents.push(newAgent)

    return NextResponse.json({
      success: true,
      data: newAgent
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const agentIndex = agents.findIndex(agent => agent.id === id)
    if (agentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    agents[agentIndex] = {
      ...agents[agentIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: agents[agentIndex]
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const agentIndex = agents.findIndex(agent => agent.id === id)
    if (agentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    agents.splice(agentIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}