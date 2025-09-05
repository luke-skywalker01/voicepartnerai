import { NextRequest, NextResponse } from 'next/server'

// Helper function to get available tools for assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Mock available tools (in production, fetch from database)
    const availableTools = [
      {
        id: 'tool_1',
        name: 'Kalender API',
        description: 'Zugriff auf Google Calendar für Terminbuchungen',
        endpoint: 'https://api.calendar.google.com/v3/events',
        method: 'POST',
        category: 'api',
        is_active: true,
        total_calls: 156,
        created_at: new Date().toISOString()
      },
      {
        id: 'tool_2',
        name: 'CRM Integration',
        description: 'Kundendaten aus Salesforce abrufen und aktualisieren',
        endpoint: 'https://api.salesforce.com/v1/customers',
        method: 'GET',
        category: 'api',
        is_active: true,
        total_calls: 89,
        created_at: new Date().toISOString()
      },
      {
        id: 'tool_3',
        name: 'Email Service',
        description: 'Automatische E-Mail-Benachrichtigungen senden',
        endpoint: 'https://api.sendgrid.com/v3/mail/send',
        method: 'POST',
        category: 'service',
        is_active: true,
        total_calls: 234,
        created_at: new Date().toISOString()
      },
      {
        id: 'tool_4',
        name: 'Wetter API',
        description: 'Aktuelle Wetterinformationen abrufen',
        endpoint: 'https://api.openweathermap.org/data/2.5/weather',
        method: 'GET',
        category: 'api',
        is_active: true,
        total_calls: 12,
        created_at: new Date().toISOString()
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: {
        assistantId: id,
        availableTools
      }
    })
  } catch (error) {
    console.error('Assistant tools GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available tools' },
      { status: 500 }
    )
  }
}

// POST - Assign tools to assistant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { tool_ids } = body
    
    if (!Array.isArray(tool_ids)) {
      return NextResponse.json(
        { success: false, error: 'tool_ids must be an array' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // In production, update assistant-tool relationships in database
    // For now, we'll simulate the update
    
    // Validate that all tool_ids exist and belong to user
    const validToolIds = ['tool_1', 'tool_2', 'tool_3', 'tool_4'] // Mock validation
    const invalidIds = tool_ids.filter(id => !validToolIds.includes(id))
    
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid tool IDs: ${invalidIds.join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    // Mock successful assignment
    const assignedTools = tool_ids.map(toolId => ({
      id: toolId,
      name: `Tool ${toolId}`,
      description: `Description for tool ${toolId}`,
      assigned_at: new Date().toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        assistantId: id,
        assignedTools,
        totalAssigned: tool_ids.length
      },
      message: 'Tools assigned successfully'
    })
  } catch (error) {
    console.error('Assistant tools POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to assign tools' },
      { status: 500 }
    )
  }
}

// DELETE - Remove tool assignment from assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('tool_id')
    
    if (!toolId) {
      return NextResponse.json(
        { success: false, error: 'tool_id parameter is required' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // In production, remove assistant-tool relationship from database
    // For now, we'll simulate the removal
    
    return NextResponse.json({
      success: true,
      data: {
        assistantId: id,
        removedToolId: toolId
      },
      message: 'Tool assignment removed successfully'
    })
  } catch (error) {
    console.error('Assistant tools DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove tool assignment' },
      { status: 500 }
    )
  }
}