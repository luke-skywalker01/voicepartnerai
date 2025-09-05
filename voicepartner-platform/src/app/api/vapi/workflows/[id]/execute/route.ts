import { NextRequest, NextResponse } from 'next/server'

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  startedAt: string
  completedAt?: string
  duration?: number
  currentNode?: string
  executionPath: Array<{
    nodeId: string
    nodeName: string
    enteredAt: string
    exitedAt?: string
    duration?: number
    input?: any
    output?: any
    error?: string
  }>
  context: Record<string, any>
  metrics: {
    nodesExecuted: number
    totalDuration: number
    errors: number
    warnings: number
  }
  logs: Array<{
    timestamp: string
    level: 'info' | 'warn' | 'error' | 'debug'
    nodeId?: string
    message: string
    data?: any
  }>
}

export interface ExecutionResult {
  success: boolean
  executionId: string
  status: string
  result?: any
  error?: string
  metrics: {
    totalDuration: number
    nodesExecuted: number
    errors: number
    warnings: number
  }
}

// Mock function to simulate workflow execution
const executeWorkflow = async (workflowId: string, input: any = {}): Promise<WorkflowExecution> => {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = new Date()
  
  // Simulate workflow execution
  const execution: WorkflowExecution = {
    id: executionId,
    workflowId,
    status: 'running',
    startedAt: startTime.toISOString(),
    currentNode: 'start',
    executionPath: [],
    context: {
      ...input,
      executionId,
      startTime: startTime.toISOString(),
      variables: {}
    },
    metrics: {
      nodesExecuted: 0,
      totalDuration: 0,
      errors: 0,
      warnings: 0
    },
    logs: [
      {
        timestamp: startTime.toISOString(),
        level: 'info',
        message: 'Workflow execution started',
        data: { workflowId, executionId, input }
      }
    ]
  }
  
  // Simulate node execution steps
  const simulatedNodes = [
    {
      id: 'start',
      name: 'Phone Call Trigger',
      duration: 100,
      output: { trigger: 'phone-call', phoneNumber: input.phoneNumber || '+1-555-0123' }
    },
    {
      id: 'greeting',
      name: 'Greeting Assistant',
      duration: 2500,
      output: { 
        message: 'Thank you for calling. How can I help you today?',
        intent: input.intent || 'support',
        confidence: 0.85
      }
    },
    {
      id: 'route_support',
      name: 'Route to Support',
      duration: 200,
      output: { route: 'support', qualified: true }
    },
    {
      id: 'support_assistant',
      name: 'Support Assistant',
      duration: 8500,
      output: { 
        resolution: 'Issue resolved successfully',
        satisfaction: 4.5,
        followUpRequired: false
      }
    }
  ]
  
  let totalDuration = 0
  
  for (let i = 0; i < simulatedNodes.length; i++) {
    const node = simulatedNodes[i]
    const nodeStartTime = new Date(startTime.getTime() + totalDuration)
    const nodeEndTime = new Date(nodeStartTime.getTime() + node.duration)
    
    // Add to execution path
    execution.executionPath.push({
      nodeId: node.id,
      nodeName: node.name,
      enteredAt: nodeStartTime.toISOString(),
      exitedAt: nodeEndTime.toISOString(),
      duration: node.duration,
      input: i === 0 ? input : execution.executionPath[i-1]?.output,
      output: node.output
    })
    
    // Update context with node output
    execution.context.variables = {
      ...execution.context.variables,
      ...node.output
    }
    
    // Add logs
    execution.logs.push(
      {
        timestamp: nodeStartTime.toISOString(),
        level: 'info',
        nodeId: node.id,
        message: `Entered node: ${node.name}`,
        data: { nodeId: node.id }
      },
      {
        timestamp: nodeEndTime.toISOString(),
        level: 'info',
        nodeId: node.id,
        message: `Completed node: ${node.name}`,
        data: { duration: node.duration, output: node.output }
      }
    )
    
    totalDuration += node.duration
    execution.metrics.nodesExecuted++
    
    // Update current node
    execution.currentNode = i < simulatedNodes.length - 1 ? simulatedNodes[i + 1].id : undefined
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  // Complete execution
  const endTime = new Date(startTime.getTime() + totalDuration)
  execution.status = 'completed'
  execution.completedAt = endTime.toISOString()
  execution.duration = totalDuration
  execution.currentNode = undefined
  execution.metrics.totalDuration = totalDuration
  
  execution.logs.push({
    timestamp: endTime.toISOString(),
    level: 'info',
    message: 'Workflow execution completed successfully',
    data: { 
      totalDuration,
      nodesExecuted: execution.metrics.nodesExecuted,
      result: execution.context.variables
    }
  })
  
  return execution
}

// POST /api/vapi/workflows/[id]/execute - Execute workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const body = await request.json()
    
    const { input = {}, async = false, testMode = false } = body
    
    // Validate input
    if (typeof input !== 'object') {
      return NextResponse.json(
        { error: 'Input must be an object' },
        { status: 400 }
      )
    }
    
    if (async) {
      // Start async execution
      executeWorkflow(workflowId, input).catch(error => {
        console.error('Async workflow execution failed:', error)
      })
      
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return NextResponse.json({
        success: true,
        executionId,
        status: 'started',
        message: 'Workflow execution started asynchronously',
        statusUrl: `/api/vapi/workflows/${workflowId}/executions/${executionId}`
      }, { status: 202 })
    } else {
      // Synchronous execution
      const execution = await executeWorkflow(workflowId, input)
      
      const result: ExecutionResult = {
        success: execution.status === 'completed',
        executionId: execution.id,
        status: execution.status,
        result: execution.context.variables,
        metrics: execution.metrics
      }
      
      if (execution.status === 'failed') {
        const lastError = execution.logs.find(log => log.level === 'error')
        result.error = lastError?.message || 'Workflow execution failed'
      }
      
      return NextResponse.json(result)
    }
    
  } catch (error) {
    console.error('Error executing workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/vapi/workflows/[id]/execute - Get execution history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')
    
    // Mock execution history
    const mockExecutions = [
      {
        id: 'exec_1',
        workflowId,
        status: 'completed',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 12000).toISOString(),
        duration: 12000,
        metrics: {
          nodesExecuted: 4,
          totalDuration: 12000,
          errors: 0,
          warnings: 0
        }
      },
      {
        id: 'exec_2',
        workflowId,
        status: 'completed',
        startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 15000).toISOString(),
        duration: 15000,
        metrics: {
          nodesExecuted: 4,
          totalDuration: 15000,
          errors: 0,
          warnings: 1
        }
      },
      {
        id: 'exec_3',
        workflowId,
        status: 'failed',
        startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 8000).toISOString(),
        duration: 8000,
        metrics: {
          nodesExecuted: 2,
          totalDuration: 8000,
          errors: 1,
          warnings: 0
        }
      }
    ]
    
    let filteredExecutions = mockExecutions
    if (status) {
      filteredExecutions = filteredExecutions.filter(exec => exec.status === status)
    }
    
    const paginatedExecutions = filteredExecutions.slice(offset, offset + limit)
    
    return NextResponse.json({
      executions: paginatedExecutions,
      pagination: {
        total: filteredExecutions.length,
        limit,
        offset,
        hasMore: offset + limit < filteredExecutions.length
      },
      summary: {
        total: mockExecutions.length,
        completed: mockExecutions.filter(e => e.status === 'completed').length,
        failed: mockExecutions.filter(e => e.status === 'failed').length,
        running: mockExecutions.filter(e => e.status === 'running').length,
        averageDuration: mockExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / mockExecutions.length
      }
    })
  } catch (error) {
    console.error('Error fetching execution history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}