import { NextRequest, NextResponse } from 'next/server'

// Mock assistants storage (should match the one in route.ts)
// In production, this would be fetched from database
let assistants = [
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
  }
]

// GET - Fetch specific assistant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    const assistant = assistants.find(a => a.id === id && a.owner_id === userId)
    
    if (!assistant) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      )
    }
    
    // In production, also fetch related tools and files
    const relatedTools = assistant.tool_ids.map(toolId => ({
      id: toolId,
      name: `Tool ${toolId}`,
      description: `Description for tool ${toolId}`,
      endpoint: `https://api.example.com/tool/${toolId}`,
      method: 'POST',
      category: 'api',
      is_active: true,
      total_calls: Math.floor(Math.random() * 100),
      created_at: new Date().toISOString()
    }))
    
    const relatedFiles = assistant.file_ids.map(fileId => ({
      id: fileId,
      filename: `document_${fileId}.pdf`,
      original_name: `Document ${fileId}.pdf`,
      file_type: 'application/pdf',
      file_size: Math.floor(Math.random() * 1000000),
      status: 'processed',
      description: `Document ${fileId} description`,
      created_at: new Date().toISOString()
    }))
    
    const assistantWithRelations = {
      ...assistant,
      tools: relatedTools,
      files: relatedFiles
    }
    
    return NextResponse.json({
      success: true,
      data: assistantWithRelations
    })
  } catch (error) {
    console.error('Assistant GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assistant' },
      { status: 500 }
    )
  }
}

// PUT - Update specific assistant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
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
      ...body,
      id, // Ensure ID doesn't change
      owner_id: userId, // Ensure ownership doesn't change
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: assistants[assistantIndex],
      message: 'Assistant updated successfully'
    })
  } catch (error) {
    console.error('Assistant PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update assistant' },
      { status: 500 }
    )
  }
}

// DELETE - Delete specific assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    const assistantIndex = assistants.findIndex(a => a.id === id && a.owner_id === userId)
    
    if (assistantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      )
    }
    
    // Check if assistant is being used by any phone numbers
    // In production, check database relationships
    const isInUse = false // Placeholder check
    
    if (isInUse) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete assistant - it is currently assigned to phone numbers' 
        },
        { status: 400 }
      )
    }
    
    assistants.splice(assistantIndex, 1)
    
    return NextResponse.json({
      success: true,
      message: 'Assistant deleted successfully'
    })
  } catch (error) {
    console.error('Assistant DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete assistant' },
      { status: 500 }
    )
  }
}