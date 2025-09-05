import { NextRequest, NextResponse } from 'next/server'
import { VapiSquad } from '../route'

// Mock function to get squad by ID
const getSquadById = (id: string): VapiSquad | null => {
  // In production, this would query the database
  const mockSquads = [
    {
      id: 'squad_customer_service',
      orgId: 'org_default',
      name: 'Customer Service Team',
      description: 'Primary customer service squad with specialized assistants for different service areas',
      status: 'active' as const,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      members: [
        {
          assistantId: 'assistant_primary_support',
          assistantName: 'Primary Support Assistant',
          role: 'primary' as const,
          priority: 1,
          conditions: {
            timeOfDay: ['09:00-17:00'],
            dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          },
          isActive: true
        },
        {
          assistantId: 'assistant_technical_specialist',
          assistantName: 'Technical Specialist',
          role: 'specialist' as const,
          priority: 2,
          conditions: {
            keywords: ['technical', 'bug', 'error', 'not working', 'broken'],
            sentiment: 'negative' as const
          },
          isActive: true
        }
      ],
      routingStrategy: {
        type: 'conditional' as const,
        config: {
          failoverDelay: 30,
          maxRetries: 3,
          skillMatching: [
            { skill: 'customer_service', weight: 1.0 },
            { skill: 'technical_support', weight: 0.8 }
          ]
        }
      },
      escalationRules: {
        enabled: true,
        triggers: [
          {
            condition: 'timeout' as const,
            value: 300,
            target: 'specialist' as const,
            delay: 0
          }
        ]
      },
      performance: {
        totalCalls: 2847,
        successfulCalls: 2698,
        averageHandleTime: 267,
        escalationRate: 12.5,
        customerSatisfaction: 4.3,
        lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      configuration: {
        businessHours: {
          enabled: true,
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' }
          }
        },
        languages: ['en', 'es', 'fr'],
        maxConcurrentCalls: 50,
        callRecording: true,
        monitoring: true
      }
    }
  ]
  
  return mockSquads.find(s => s.id === id) || null
}

// GET /api/vapi/squads/[id] - Get specific squad
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const squadId = params.id
    
    const squad = getSquadById(squadId)
    
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(squad)
  } catch (error) {
    console.error('Error fetching squad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/squads/[id] - Update specific squad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const squadId = params.id
    const body = await request.json()
    
    const existingSquad = getSquadById(squadId)
    
    if (!existingSquad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      )
    }
    
    // Validate members if provided
    if (body.members && Array.isArray(body.members)) {
      for (const member of body.members) {
        if (!member.assistantId || !member.role || member.priority === undefined) {
          return NextResponse.json(
            { error: 'Each member must have assistantId, role, and priority' },
            { status: 400 }
          )
        }
      }
    }
    
    // Update squad
    const updatedSquad: VapiSquad = {
      ...existingSquad,
      name: body.name || existingSquad.name,
      description: body.description !== undefined ? body.description : existingSquad.description,
      status: body.status || existingSquad.status,
      members: body.members || existingSquad.members,
      routingStrategy: {
        ...existingSquad.routingStrategy,
        ...body.routingStrategy
      },
      escalationRules: {
        ...existingSquad.escalationRules,
        ...body.escalationRules
      },
      configuration: {
        ...existingSquad.configuration,
        ...body.configuration
      },
      updatedAt: new Date().toISOString()
    }
    
    // In production, this would update the squad in the database
    return NextResponse.json(updatedSquad)
  } catch (error) {
    console.error('Error updating squad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/squads/[id] - Delete specific squad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const squadId = params.id
    
    const existingSquad = getSquadById(squadId)
    
    if (!existingSquad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      )
    }
    
    // Check if squad is currently active
    if (existingSquad.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active squad. Please deactivate it first.' },
        { status: 400 }
      )
    }
    
    // In production, this would:
    // 1. Check if squad is assigned to any phone numbers
    // 2. Check if squad is being used in any workflows
    // 3. Delete the squad from the database
    
    return NextResponse.json({
      message: 'Squad deleted successfully',
      squadId: squadId
    })
  } catch (error) {
    console.error('Error deleting squad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/vapi/squads/[id] - Partial update squad (e.g., status change, member updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const squadId = params.id
    const body = await request.json()
    
    const existingSquad = getSquadById(squadId)
    
    if (!existingSquad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      )
    }
    
    // Handle status changes
    if (body.status) {
      const validStatuses = ['active', 'inactive', 'draft']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        )
      }
      
      // Validate squad before activating
      if (body.status === 'active') {
        const validation = validateSquad(existingSquad)
        if (!validation.isValid) {
          return NextResponse.json(
            { error: 'Cannot activate squad: ' + validation.errors.join(', ') },
            { status: 400 }
          )
        }
      }
    }
    
    // Handle member updates
    if (body.memberUpdates) {
      for (const update of body.memberUpdates) {
        if (update.action === 'add') {
          if (!update.member?.assistantId || !update.member?.role) {
            return NextResponse.json(
              { error: 'New member must have assistantId and role' },
              { status: 400 }
            )
          }
        }
      }
    }
    
    // Create partial update
    const updates: Partial<VapiSquad> = {
      updatedAt: new Date().toISOString()
    }
    
    if (body.status) updates.status = body.status
    if (body.name) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    
    // Handle member updates
    if (body.memberUpdates) {
      let updatedMembers = [...existingSquad.members]
      
      for (const update of body.memberUpdates) {
        switch (update.action) {
          case 'add':
            updatedMembers.push({
              assistantId: update.member.assistantId,
              assistantName: update.member.assistantName || 'New Assistant',
              role: update.member.role,
              priority: update.member.priority || updatedMembers.length + 1,
              conditions: update.member.conditions || {},
              isActive: update.member.isActive !== false
            })
            break
          case 'remove':
            updatedMembers = updatedMembers.filter(m => m.assistantId !== update.assistantId)
            break
          case 'update':
            const memberIndex = updatedMembers.findIndex(m => m.assistantId === update.assistantId)
            if (memberIndex !== -1) {
              updatedMembers[memberIndex] = {
                ...updatedMembers[memberIndex],
                ...update.member
              }
            }
            break
          case 'toggle':
            const toggleIndex = updatedMembers.findIndex(m => m.assistantId === update.assistantId)
            if (toggleIndex !== -1) {
              updatedMembers[toggleIndex].isActive = !updatedMembers[toggleIndex].isActive
            }
            break
        }
      }
      
      updates.members = updatedMembers
    }
    
    const updatedSquad = {
      ...existingSquad,
      ...updates
    }
    
    return NextResponse.json(updatedSquad)
  } catch (error) {
    console.error('Error partially updating squad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate squad configuration
function validateSquad(squad: VapiSquad): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if there's at least one active member
  const activeMembers = squad.members.filter(member => member.isActive)
  if (activeMembers.length === 0) {
    errors.push('Squad must have at least one active member')
  }
  
  // Check if there's a primary member
  const primaryMembers = activeMembers.filter(member => member.role === 'primary')
  if (primaryMembers.length === 0) {
    errors.push('Squad must have at least one primary member')
  }
  
  // Check for duplicate assistant IDs
  const assistantIds = squad.members.map(m => m.assistantId)
  const duplicateIds = assistantIds.filter((id, index) => assistantIds.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate assistant IDs found: ${duplicateIds.join(', ')}`)
  }
  
  // Check for invalid priority values
  const priorities = squad.members.map(m => m.priority)
  const invalidPriorities = priorities.filter(p => p < 1 || p > 10)
  if (invalidPriorities.length > 0) {
    errors.push('Member priorities must be between 1 and 10')
  }
  
  // Check routing strategy configuration
  if (squad.routingStrategy.type === 'load-balanced' && !squad.routingStrategy.config.loadBalanceMethod) {
    errors.push('Load balanced routing requires a load balance method')
  }
  
  if (squad.routingStrategy.type === 'skill-based' && (!squad.routingStrategy.config.skillMatching || squad.routingStrategy.config.skillMatching.length === 0)) {
    errors.push('Skill-based routing requires skill matching configuration')
  }
  
  // Check business hours configuration
  if (squad.configuration.businessHours?.enabled) {
    const schedule = squad.configuration.businessHours.schedule
    if (!schedule || Object.keys(schedule).length === 0) {
      errors.push('Business hours are enabled but no schedule is configured')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}