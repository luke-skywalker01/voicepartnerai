import { NextRequest, NextResponse } from 'next/server'
import { VapiWorkflow, WorkflowNode, WorkflowEdge } from '../route'

// Mock function to get workflow by ID
const getWorkflowById = (id: string): VapiWorkflow | null => {
  // In production, this would query the database
  const mockWorkflows = [
    {
      id: 'workflow_1',
      orgId: 'org_default',
      name: 'Customer Service Flow',
      description: 'Main customer service workflow with routing and escalation',
      status: 'active' as const,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'start',
          type: 'trigger' as const,
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
          type: 'assistant' as const,
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
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'start',
          target: 'greeting',
          sourceHandle: 'out1',
          targetHandle: 'in1'
        }
      ],
      configuration: {
        entryPoint: 'start',
        fallbackAssistant: 'assistant_fallback',
        timeout: 300,
        maxIterations: 50,
        errorHandling: 'fallback' as const
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
          type: 'phone-call' as const,
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
    }
  ]
  
  return mockWorkflows.find(w => w.id === id) || null
}

// GET /api/vapi/workflows/[id] - Get specific workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    
    const workflow = getWorkflowById(workflowId)
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/workflows/[id] - Update specific workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const body = await request.json()
    
    const existingWorkflow = getWorkflowById(workflowId)
    
    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }
    
    // Validate workflow structure
    if (body.nodes && !Array.isArray(body.nodes)) {
      return NextResponse.json(
        { error: 'Nodes must be an array' },
        { status: 400 }
      )
    }
    
    if (body.edges && !Array.isArray(body.edges)) {
      return NextResponse.json(
        { error: 'Edges must be an array' },
        { status: 400 }
      )
    }
    
    // Update workflow
    const updatedWorkflow: VapiWorkflow = {
      ...existingWorkflow,
      name: body.name || existingWorkflow.name,
      description: body.description !== undefined ? body.description : existingWorkflow.description,
      status: body.status || existingWorkflow.status,
      nodes: body.nodes || existingWorkflow.nodes,
      edges: body.edges || existingWorkflow.edges,
      configuration: {
        ...existingWorkflow.configuration,
        ...body.configuration
      },
      metadata: {
        ...existingWorkflow.metadata,
        ...body.metadata,
        version: body.metadata?.version || existingWorkflow.metadata.version
      },
      triggers: body.triggers || existingWorkflow.triggers,
      updatedAt: new Date().toISOString()
    }
    
    // In production, this would update the workflow in the database
    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/workflows/[id] - Delete specific workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    
    const existingWorkflow = getWorkflowById(workflowId)
    
    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }
    
    // Check if workflow is in use
    if (existingWorkflow.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active workflow. Please deactivate it first.' },
        { status: 400 }
      )
    }
    
    // In production, this would delete the workflow from the database
    return NextResponse.json({
      message: 'Workflow deleted successfully',
      workflowId: workflowId
    })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/vapi/workflows/[id] - Partial update workflow (e.g., status change)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const body = await request.json()
    
    const existingWorkflow = getWorkflowById(workflowId)
    
    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }
    
    // Handle status changes
    if (body.status) {
      const validStatuses = ['draft', 'active', 'paused', 'archived']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        )
      }
      
      // Validate workflow before activating
      if (body.status === 'active') {
        const validation = validateWorkflow(existingWorkflow)
        if (!validation.isValid) {
          return NextResponse.json(
            { error: 'Cannot activate workflow: ' + validation.errors.join(', ') },
            { status: 400 }
          )
        }
      }
    }
    
    // Create partial update
    const updates: Partial<VapiWorkflow> = {
      updatedAt: new Date().toISOString()
    }
    
    if (body.status) updates.status = body.status
    if (body.name) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    
    const updatedWorkflow = {
      ...existingWorkflow,
      ...updates
    }
    
    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    console.error('Error partially updating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate workflow structure
function validateWorkflow(workflow: VapiWorkflow): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if there's at least one trigger node
  const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger')
  if (triggerNodes.length === 0) {
    errors.push('Workflow must have at least one trigger node')
  }
  
  // Check if entry point exists
  const entryPointExists = workflow.nodes.some(node => node.id === workflow.configuration.entryPoint)
  if (!entryPointExists) {
    errors.push('Entry point node does not exist')
  }
  
  // Check for orphaned nodes (nodes with no connections)
  const connectedNodeIds = new Set()
  workflow.edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })
  
  const orphanedNodes = workflow.nodes.filter(node => 
    node.id !== workflow.configuration.entryPoint && !connectedNodeIds.has(node.id)
  )
  
  if (orphanedNodes.length > 0) {
    errors.push(`Orphaned nodes found: ${orphanedNodes.map(n => n.data.label).join(', ')}`)
  }
  
  // Check for invalid edge connections
  workflow.edges.forEach(edge => {
    const sourceNode = workflow.nodes.find(n => n.id === edge.source)
    const targetNode = workflow.nodes.find(n => n.id === edge.target)
    
    if (!sourceNode) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`)
    }
    if (!targetNode) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}