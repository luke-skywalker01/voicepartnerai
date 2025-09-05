import { NextRequest, NextResponse } from 'next/server'

export interface VapiSquad {
  id: string
  orgId: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'draft'
  createdAt: string
  updatedAt: string
  members: Array<{
    assistantId: string
    assistantName: string
    role: 'primary' | 'fallback' | 'specialist' | 'escalation'
    priority: number
    conditions?: {
      timeOfDay?: string[]
      dayOfWeek?: string[]
      keywords?: string[]
      sentiment?: 'positive' | 'negative' | 'neutral'
      language?: string[]
    }
    isActive: boolean
  }>
  routingStrategy: {
    type: 'sequential' | 'conditional' | 'load-balanced' | 'skill-based'
    config: {
      failoverDelay?: number // seconds
      maxRetries?: number
      loadBalanceMethod?: 'round-robin' | 'least-busy' | 'random'
      skillMatching?: Array<{
        skill: string
        weight: number
      }>
    }
  }
  escalationRules: {
    enabled: boolean
    triggers: Array<{
      condition: 'timeout' | 'keyword' | 'sentiment' | 'user-request' | 'assistant-request'
      value?: string | number
      target: 'human' | 'specialist' | 'manager'
      delay?: number
    }>
  }
  performance: {
    totalCalls: number
    successfulCalls: number
    averageHandleTime: number
    escalationRate: number
    customerSatisfaction: number
    lastUsed?: string
  }
  configuration: {
    businessHours?: {
      enabled: boolean
      timezone: string
      schedule: Record<string, { start: string; end: string }>
    }
    languages: string[]
    maxConcurrentCalls: number
    callRecording: boolean
    monitoring: boolean
  }
}

// Mock squads data
const generateMockSquads = (): VapiSquad[] => {
  return [
    {
      id: 'squad_customer_service',
      orgId: 'org_default',
      name: 'Customer Service Team',
      description: 'Primary customer service squad with specialized assistants for different service areas',
      status: 'active',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      members: [
        {
          assistantId: 'assistant_primary_support',
          assistantName: 'Primary Support Assistant',
          role: 'primary',
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
          role: 'specialist',
          priority: 2,
          conditions: {
            keywords: ['technical', 'bug', 'error', 'not working', 'broken'],
            sentiment: 'negative'
          },
          isActive: true
        },
        {
          assistantId: 'assistant_billing_specialist',
          assistantName: 'Billing Specialist',
          role: 'specialist',
          priority: 2,
          conditions: {
            keywords: ['billing', 'payment', 'invoice', 'charge', 'refund', 'subscription']
          },
          isActive: true
        },
        {
          assistantId: 'assistant_escalation_manager',
          assistantName: 'Escalation Manager',
          role: 'escalation',
          priority: 3,
          conditions: {
            keywords: ['manager', 'supervisor', 'escalate', 'complaint']
          },
          isActive: true
        },
        {
          assistantId: 'assistant_fallback',
          assistantName: 'General Fallback Assistant',
          role: 'fallback',
          priority: 4,
          isActive: true
        }
      ],
      routingStrategy: {
        type: 'conditional',
        config: {
          failoverDelay: 30,
          maxRetries: 3,
          skillMatching: [
            { skill: 'customer_service', weight: 1.0 },
            { skill: 'technical_support', weight: 0.8 },
            { skill: 'billing', weight: 0.7 }
          ]
        }
      },
      escalationRules: {
        enabled: true,
        triggers: [
          {
            condition: 'timeout',
            value: 300,
            target: 'specialist',
            delay: 0
          },
          {
            condition: 'keyword',
            value: 'manager',
            target: 'manager',
            delay: 0
          },
          {
            condition: 'sentiment',
            value: 'negative',
            target: 'specialist',
            delay: 60
          },
          {
            condition: 'user-request',
            target: 'human',
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
    },
    {
      id: 'squad_sales_team',
      orgId: 'org_default',
      name: 'Sales Team',
      description: 'Dedicated sales squad for lead qualification and conversion',
      status: 'active',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      members: [
        {
          assistantId: 'assistant_lead_qualifier',
          assistantName: 'Lead Qualifier',
          role: 'primary',
          priority: 1,
          conditions: {
            keywords: ['interested', 'pricing', 'demo', 'information']
          },
          isActive: true
        },
        {
          assistantId: 'assistant_sales_specialist',
          assistantName: 'Sales Specialist',
          role: 'specialist',
          priority: 2,
          conditions: {
            keywords: ['buy', 'purchase', 'contract', 'deal']
          },
          isActive: true
        },
        {
          assistantId: 'assistant_enterprise_sales',
          assistantName: 'Enterprise Sales',
          role: 'specialist',
          priority: 2,
          conditions: {
            keywords: ['enterprise', 'large', 'team', 'organization', 'company']
          },
          isActive: true
        }
      ],
      routingStrategy: {
        type: 'skill-based',
        config: {
          failoverDelay: 20,
          maxRetries: 2,
          skillMatching: [
            { skill: 'lead_qualification', weight: 1.0 },
            { skill: 'sales_conversion', weight: 0.9 },
            { skill: 'enterprise_sales', weight: 0.8 }
          ]
        }
      },
      escalationRules: {
        enabled: true,
        triggers: [
          {
            condition: 'timeout',
            value: 180,
            target: 'human',
            delay: 0
          },
          {
            condition: 'keyword',
            value: 'human',
            target: 'human',
            delay: 0
          }
        ]
      },
      performance: {
        totalCalls: 1456,
        successfulCalls: 1298,
        averageHandleTime: 423,
        escalationRate: 18.2,
        customerSatisfaction: 4.1,
        lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      configuration: {
        businessHours: {
          enabled: true,
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '08:00', end: '18:00' },
            tuesday: { start: '08:00', end: '18:00' },
            wednesday: { start: '08:00', end: '18:00' },
            thursday: { start: '08:00', end: '18:00' },
            friday: { start: '08:00', end: '16:00' }
          }
        },
        languages: ['en'],
        maxConcurrentCalls: 25,
        callRecording: true,
        monitoring: true
      }
    },
    {
      id: 'squad_after_hours',
      orgId: 'org_default',
      name: 'After Hours Support',
      description: 'Basic support coverage for after-hours and weekend inquiries',
      status: 'active',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      members: [
        {
          assistantId: 'assistant_after_hours_basic',
          assistantName: 'After Hours Assistant',
          role: 'primary',
          priority: 1,
          conditions: {
            timeOfDay: ['18:00-08:59'],
            dayOfWeek: ['saturday', 'sunday']
          },
          isActive: true
        },
        {
          assistantId: 'assistant_emergency_handler',
          assistantName: 'Emergency Handler',
          role: 'specialist',
          priority: 2,
          conditions: {
            keywords: ['emergency', 'urgent', 'critical', 'down', 'outage']
          },
          isActive: true
        }
      ],
      routingStrategy: {
        type: 'sequential',
        config: {
          failoverDelay: 45,
          maxRetries: 2
        }
      },
      escalationRules: {
        enabled: true,
        triggers: [
          {
            condition: 'keyword',
            value: 'emergency',
            target: 'human',
            delay: 0
          },
          {
            condition: 'timeout',
            value: 600,
            target: 'human',
            delay: 0
          }
        ]
      },
      performance: {
        totalCalls: 634,
        successfulCalls: 567,
        averageHandleTime: 198,
        escalationRate: 8.7,
        customerSatisfaction: 3.9,
        lastUsed: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      configuration: {
        businessHours: {
          enabled: false,
          timezone: 'America/New_York',
          schedule: {}
        },
        languages: ['en'],
        maxConcurrentCalls: 10,
        callRecording: true,
        monitoring: false
      }
    }
  ]
}

// GET /api/vapi/squads - List all squads
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')
    const includePerformance = url.searchParams.get('includePerformance') === 'true'
    
    const squads = generateMockSquads()
    
    // Apply filters
    let filteredSquads = squads
    if (status) {
      filteredSquads = filteredSquads.filter(s => s.status === status)
    }
    
    // Apply pagination
    const paginatedSquads = filteredSquads.slice(offset, offset + limit)
    
    // Optionally exclude performance data for lighter responses
    const responseSquads = includePerformance 
      ? paginatedSquads 
      : paginatedSquads.map(squad => {
          const { performance, ...squadWithoutPerformance } = squad
          return squadWithoutPerformance
        })
    
    return NextResponse.json({
      squads: responseSquads,
      pagination: {
        total: filteredSquads.length,
        limit,
        offset,
        hasMore: offset + limit < filteredSquads.length
      },
      summary: {
        totalSquads: squads.length,
        activeSquads: squads.filter(s => s.status === 'active').length,
        totalMembers: squads.reduce((sum, s) => sum + s.members.length, 0),
        averageSquadSize: squads.length > 0 ? squads.reduce((sum, s) => sum + s.members.length, 0) / squads.length : 0
      }
    })
  } catch (error) {
    console.error('Error fetching squads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/squads - Create new squad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Squad name is required' },
        { status: 400 }
      )
    }
    
    if (!body.members || !Array.isArray(body.members) || body.members.length === 0) {
      return NextResponse.json(
        { error: 'At least one squad member is required' },
        { status: 400 }
      )
    }
    
    // Validate members
    for (const member of body.members) {
      if (!member.assistantId || !member.role || member.priority === undefined) {
        return NextResponse.json(
          { error: 'Each member must have assistantId, role, and priority' },
          { status: 400 }
        )
      }
    }
    
    const newSquad: VapiSquad = {
      id: `squad_${Date.now()}`,
      orgId: 'org_default',
      name: body.name,
      description: body.description || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: body.members.map((member: any, index: number) => ({
        assistantId: member.assistantId,
        assistantName: member.assistantName || `Assistant ${index + 1}`,
        role: member.role,
        priority: member.priority,
        conditions: member.conditions || {},
        isActive: member.isActive !== false
      })),
      routingStrategy: {
        type: body.routingStrategy?.type || 'sequential',
        config: {
          failoverDelay: body.routingStrategy?.config?.failoverDelay || 30,
          maxRetries: body.routingStrategy?.config?.maxRetries || 3,
          ...body.routingStrategy?.config
        }
      },
      escalationRules: {
        enabled: body.escalationRules?.enabled || false,
        triggers: body.escalationRules?.triggers || []
      },
      performance: {
        totalCalls: 0,
        successfulCalls: 0,
        averageHandleTime: 0,
        escalationRate: 0,
        customerSatisfaction: 0
      },
      configuration: {
        businessHours: body.configuration?.businessHours || {
          enabled: false,
          timezone: 'America/New_York',
          schedule: {}
        },
        languages: body.configuration?.languages || ['en'],
        maxConcurrentCalls: body.configuration?.maxConcurrentCalls || 10,
        callRecording: body.configuration?.callRecording !== false,
        monitoring: body.configuration?.monitoring !== false
      }
    }
    
    return NextResponse.json(newSquad, { status: 201 })
  } catch (error) {
    console.error('Error creating squad:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/squads - Bulk update squads
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { squadIds, updates } = body
    
    if (!Array.isArray(squadIds) || !updates) {
      return NextResponse.json(
        { error: 'squadIds array and updates object are required' },
        { status: 400 }
      )
    }
    
    // In production, this would update multiple squads in the database
    const updatedSquads = squadIds.map(id => ({
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
    
    return NextResponse.json({
      updated: updatedSquads.length,
      squads: updatedSquads
    })
  } catch (error) {
    console.error('Error bulk updating squads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/squads - Bulk delete squads
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const squadIds = url.searchParams.get('ids')?.split(',') || []
    
    if (squadIds.length === 0) {
      return NextResponse.json(
        { error: 'No squad IDs provided' },
        { status: 400 }
      )
    }
    
    // In production, this would delete squads from the database
    // Also check if squads are currently in use
    
    return NextResponse.json({
      deleted: squadIds.length,
      squadIds
    })
  } catch (error) {
    console.error('Error bulk deleting squads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}