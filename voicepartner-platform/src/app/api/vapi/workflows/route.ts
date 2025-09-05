import { NextRequest, NextResponse } from 'next/server'

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'assistant' | 'webhook' | 'transfer' | 'hangup' | 'collect-input' | 'text-to-speech' | 'delay'
  position: { x: number; y: number }
  data: {
    label: string
    config: any
  }
  inputs?: Array<{
    id: string
    type: string
  }>
  outputs?: Array<{
    id: string
    type: string
  }>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  condition?: string
}

export interface VapiWorkflow {
  id: string
  orgId: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdAt: string
  updatedAt: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  configuration: {
    entryPoint: string
    fallbackAssistant?: string
    timeout: number
    maxIterations: number
    errorHandling: 'continue' | 'halt' | 'fallback'
  }
  metadata: {
    version: string
    tags: string[]
    category: string
    author: string
  }
  usage: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    lastExecuted?: string
  }
  triggers: Array<{
    type: 'phone-call' | 'webhook' | 'schedule' | 'manual'
    config: any
  }>
}

// Mock workflow data
const generateMockWorkflows = (): VapiWorkflow[] => {
  return [
    {
      id: 'workflow_1',
      orgId: 'org_default',
      name: 'Customer Service Flow',
      description: 'Main customer service workflow with routing and escalation',
      status: 'active',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'start',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Phone Call Trigger',
            config: {
              phoneNumbers: ['+1-555-0123'],
              businessHours: true
            }
          },
          outputs: [{ id: 'out1', type: 'default' }]
        },
        {
          id: 'greeting',
          type: 'assistant',
          position: { x: 300, y: 100 },
          data: {
            label: 'Greeting Assistant',
            config: {
              assistantId: 'assistant_greeting',
              message: 'Thank you for calling. How can I help you today?',
              collectResponse: true,
              timeout: 10
            }
          },
          inputs: [{ id: 'in1', type: 'default' }],
          outputs: [
            { id: 'out1', type: 'support' },
            { id: 'out2', type: 'sales' },
            { id: 'out3', type: 'billing' }
          ]
        },
        {
          id: 'route_support',
          type: 'condition',
          position: { x: 500, y: 50 },
          data: {
            label: 'Route to Support',
            config: {
              condition: 'intent === "support"',
              variables: ['intent', 'urgency']
            }
          },
          inputs: [{ id: 'in1', type: 'support' }],
          outputs: [{ id: 'out1', type: 'default' }]
        },
        {
          id: 'support_assistant',
          type: 'assistant',
          position: { x: 700, y: 50 },
          data: {
            label: 'Support Assistant',
            config: {
              assistantId: 'assistant_support',
              systemPrompt: 'You are a helpful technical support agent.',
              escalationKeywords: ['manager', 'supervisor', 'escalate']
            }
          },
          inputs: [{ id: 'in1', type: 'default' }],
          outputs: [
            { id: 'out1', type: 'resolved' },
            { id: 'out2', type: 'escalate' }
          ]
        },
        {
          id: 'route_sales',
          type: 'condition',
          position: { x: 500, y: 150 },
          data: {
            label: 'Route to Sales',
            config: {
              condition: 'intent === "sales"',
              variables: ['intent', 'product_interest']
            }
          },
          inputs: [{ id: 'in1', type: 'sales' }],
          outputs: [{ id: 'out1', type: 'default' }]
        },
        {
          id: 'sales_assistant',
          type: 'assistant',
          position: { x: 700, y: 150 },
          data: {
            label: 'Sales Assistant',
            config: {
              assistantId: 'assistant_sales',
              systemPrompt: 'You are a knowledgeable sales representative.',
              leadCapture: true
            }
          },
          inputs: [{ id: 'in1', type: 'default' }],
          outputs: [{ id: 'out1', type: 'qualified' }]
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'start',
          target: 'greeting',
          sourceHandle: 'out1',
          targetHandle: 'in1'
        },
        {
          id: 'e2',
          source: 'greeting',
          target: 'route_support',
          sourceHandle: 'out1',
          targetHandle: 'in1',
          label: 'Support Intent'
        },
        {
          id: 'e3',
          source: 'route_support',
          target: 'support_assistant',
          sourceHandle: 'out1',
          targetHandle: 'in1'
        },
        {
          id: 'e4',
          source: 'greeting',
          target: 'route_sales',
          sourceHandle: 'out2',
          targetHandle: 'in1',
          label: 'Sales Intent'
        },
        {
          id: 'e5',
          source: 'route_sales',
          target: 'sales_assistant',
          sourceHandle: 'out1',
          targetHandle: 'in1'
        }
      ],
      configuration: {
        entryPoint: 'start',
        fallbackAssistant: 'assistant_fallback',
        timeout: 300,
        maxIterations: 50,
        errorHandling: 'fallback'
      },
      metadata: {
        version: '1.2.0',
        tags: ['customer-service', 'routing', 'escalation'],
        category: 'customer-support',
        author: 'system'
      },
      usage: {
        totalExecutions: 1247,
        successfulExecutions: 1198,
        failedExecutions: 49,
        averageExecutionTime: 185,
        lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      triggers: [
        {
          type: 'phone-call',
          config: {
            phoneNumbers: ['+1-555-0123'],
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
            }
          }
        }
      ]
    },
    {
      id: 'workflow_2',
      orgId: 'org_default',
      name: 'Lead Qualification Flow',
      description: 'Automated lead qualification and scoring workflow',
      status: 'draft',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      nodes: [
        {
          id: 'start',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Webhook Trigger',
            config: {
              webhook_url: 'https://api.example.com/webhook/lead',
              authentication: 'bearer_token'
            }
          },
          outputs: [{ id: 'out1', type: 'default' }]
        },
        {
          id: 'qualify',
          type: 'assistant',
          position: { x: 300, y: 100 },
          data: {
            label: 'Lead Qualifier',
            config: {
              assistantId: 'assistant_qualifier',
              questions: [
                'What is your budget range?',
                'When are you looking to implement?',
                'Who would be the decision maker?'
              ],
              scoringCriteria: {
                budget: { weight: 0.4, thresholds: { high: 10000, medium: 1000 } },
                timeline: { weight: 0.3, thresholds: { immediate: 30, soon: 90 } },
                authority: { weight: 0.3, values: { decision_maker: 1, influencer: 0.7 } }
              }
            }
          },
          inputs: [{ id: 'in1', type: 'default' }],
          outputs: [
            { id: 'out1', type: 'qualified' },
            { id: 'out2', type: 'unqualified' }
          ]
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'start',
          target: 'qualify',
          sourceHandle: 'out1',
          targetHandle: 'in1'
        }
      ],
      configuration: {
        entryPoint: 'start',
        timeout: 600,
        maxIterations: 20,
        errorHandling: 'continue'
      },
      metadata: {
        version: '0.1.0',
        tags: ['lead-gen', 'qualification', 'scoring'],
        category: 'sales',
        author: 'sales_team'
      },
      usage: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      },
      triggers: [
        {
          type: 'webhook',
          config: {
            endpoint: '/webhook/lead-qualification',
            method: 'POST',
            authentication: 'api_key'
          }
        }
      ]
    }
  ]
}

// GET /api/vapi/workflows - List all workflows
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    
    const workflows = generateMockWorkflows()
    
    // Apply filters
    let filteredWorkflows = workflows
    if (status) {
      filteredWorkflows = filteredWorkflows.filter(w => w.status === status)
    }
    if (category) {
      filteredWorkflows = filteredWorkflows.filter(w => w.metadata.category === category)
    }
    
    // Apply pagination
    const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit)
    
    return NextResponse.json({
      workflows: paginatedWorkflows,
      pagination: {
        total: filteredWorkflows.length,
        limit,
        offset,
        hasMore: offset + limit < filteredWorkflows.length
      }
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/workflows - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }
    
    const newWorkflow: VapiWorkflow = {
      id: `workflow_${Date.now()}`,
      orgId: 'org_default',
      name: body.name,
      description: body.description || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: body.nodes || [
        {
          id: 'start',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Start',
            config: {}
          },
          outputs: [{ id: 'out1', type: 'default' }]
        }
      ],
      edges: body.edges || [],
      configuration: {
        entryPoint: 'start',
        fallbackAssistant: body.configuration?.fallbackAssistant,
        timeout: body.configuration?.timeout || 300,
        maxIterations: body.configuration?.maxIterations || 50,
        errorHandling: body.configuration?.errorHandling || 'fallback'
      },
      metadata: {
        version: '1.0.0',
        tags: body.metadata?.tags || [],
        category: body.metadata?.category || 'general',
        author: body.metadata?.author || 'user'
      },
      usage: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      },
      triggers: body.triggers || []
    }
    
    return NextResponse.json(newWorkflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/workflows - Bulk update workflows
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflowIds, updates } = body
    
    if (!Array.isArray(workflowIds) || !updates) {
      return NextResponse.json(
        { error: 'workflowIds array and updates object are required' },
        { status: 400 }
      )
    }
    
    // In production, this would update multiple workflows in the database
    const updatedWorkflows = workflowIds.map(id => ({
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
    
    return NextResponse.json({
      updated: updatedWorkflows.length,
      workflows: updatedWorkflows
    })
  } catch (error) {
    console.error('Error bulk updating workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/workflows - Bulk delete workflows
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const workflowIds = url.searchParams.get('ids')?.split(',') || []
    
    if (workflowIds.length === 0) {
      return NextResponse.json(
        { error: 'No workflow IDs provided' },
        { status: 400 }
      )
    }
    
    // In production, this would delete workflows from the database
    return NextResponse.json({
      deleted: workflowIds.length,
      workflowIds
    })
  } catch (error) {
    console.error('Error bulk deleting workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}