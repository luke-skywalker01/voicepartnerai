import { NextRequest, NextResponse } from 'next/server'

// Tool execution for function calling
interface ToolExecutionRequest {
  toolId: string
  parameters: Record<string, any>
  assistantId?: string
  conversationId?: string
}

interface Tool {
  id: string
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  parameters: {
    name: string
    type: 'string' | 'number' | 'boolean' | 'object'
    description: string
    required: boolean
    default?: any
  }[]
  headers?: Record<string, string>
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic'
    key?: string
    headerName?: string
  }
  responseFormat?: {
    successPath?: string
    errorPath?: string
  }
  ownerId: string
  isActive: boolean
  usage: {
    totalCalls: number
    lastUsed?: string
    avgResponseTime?: number
  }
}

// Mock tool storage (same as main route)
const getToolsStorage = (): Tool[] => [
  {
    id: 'tool_1',
    name: 'Wetter-API',
    description: 'Aktuelle Wetterdaten für eine bestimmte Stadt abrufen',
    endpoint: 'https://api.openweathermap.org/data/2.5/weather',
    method: 'GET',
    parameters: [
      {
        name: 'q',
        type: 'string',
        description: 'Stadtname (z.B. "Berlin,DE")',
        required: true
      },
      {
        name: 'units',
        type: 'string',
        description: 'Temperatureinheit (metric, imperial)',
        required: false,
        default: 'metric'
      }
    ],
    authentication: {
      type: 'api_key',
      headerName: 'appid',
      key: 'demo_api_key'
    },
    responseFormat: {
      successPath: 'weather[0].description,main.temp',
      errorPath: 'message'
    },
    ownerId: 'user_demo',
    isActive: true,
    usage: {
      totalCalls: 42,
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      avgResponseTime: 250
    }
  },
  {
    id: 'tool_2',
    name: 'CRM Kundensuche',
    description: 'Kundendaten aus dem CRM-System abrufen',
    endpoint: 'https://api.example-crm.com/customers/search',
    method: 'POST',
    parameters: [
      {
        name: 'email',
        type: 'string',
        description: 'E-Mail-Adresse des Kunden',
        required: false
      },
      {
        name: 'phone',
        type: 'string',
        description: 'Telefonnummer des Kunden',
        required: false
      }
    ],
    authentication: {
      type: 'bearer',
      key: 'demo_bearer_token'
    },
    responseFormat: {
      successPath: 'data.customers',
      errorPath: 'error.message'
    },
    ownerId: 'user_demo',
    isActive: true,
    usage: {
      totalCalls: 128,
      avgResponseTime: 450
    }
  },
  {
    id: 'tool_3',
    name: 'Kalender Terminprüfung',
    description: 'Verfügbare Termine im Kalender prüfen',
    endpoint: 'https://api.calendar-service.com/availability',
    method: 'GET',
    parameters: [
      {
        name: 'date',
        type: 'string',
        description: 'Datum im Format YYYY-MM-DD',
        required: true
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Termindauer in Minuten',
        required: false,
        default: 60
      }
    ],
    authentication: {
      type: 'api_key',
      headerName: 'X-API-Key',
      key: 'demo_calendar_key'
    },
    responseFormat: {
      successPath: 'available_slots',
      errorPath: 'error'
    },
    ownerId: 'user_demo',
    isActive: true,
    usage: {
      totalCalls: 67,
      avgResponseTime: 180
    }
  }
]

// POST - Execute tool function
export async function POST(request: NextRequest) {
  try {
    const body: ToolExecutionRequest = await request.json()
    const { toolId, parameters = {}, assistantId, conversationId } = body
    
    if (!toolId) {
      return NextResponse.json(
        { success: false, error: 'Tool ID is required' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Find tool
    const toolsStorage = getToolsStorage()
    const tool = toolsStorage.find(t => t.id === toolId && t.ownerId === userId)
    
    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool not found or not accessible' },
        { status: 404 }
      )
    }
    
    if (!tool.isActive) {
      return NextResponse.json(
        { success: false, error: 'Tool is not active' },
        { status: 400 }
      )
    }
    
    // Validate required parameters
    const missingParams = tool.parameters
      .filter(param => param.required && !(param.name in parameters))
      .map(param => param.name)
    
    if (missingParams.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required parameters: ${missingParams.join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    // Execute tool function
    const startTime = Date.now()
    const result = await executeToolFunction(tool, parameters)
    const executionTime = Date.now() - startTime
    
    // Update usage statistics (in production, update in database)
    tool.usage.totalCalls++
    tool.usage.lastUsed = new Date().toISOString()
    tool.usage.avgResponseTime = tool.usage.avgResponseTime 
      ? Math.round((tool.usage.avgResponseTime + executionTime) / 2)
      : executionTime
    
    // Log execution for debugging
    console.log(`Tool ${tool.name} executed in ${executionTime}ms`, {
      toolId,
      parameters,
      assistantId,
      conversationId,
      success: result.success
    })
    
    return NextResponse.json({
      success: true,
      data: {
        toolId,
        toolName: tool.name,
        executionTime,
        result: result.data,
        rawResponse: result.rawResponse,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('Tool execution error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Execution failed' },
      { status: 500 }
    )
  }
}

async function executeToolFunction(tool: Tool, parameters: Record<string, any>) {
  try {
    // Prepare parameters with defaults
    const finalParams = { ...parameters }
    tool.parameters.forEach(param => {
      if (param.default !== undefined && !(param.name in finalParams)) {
        finalParams[param.name] = param.default
      }
    })
    
    // Build request configuration
    const requestConfig: RequestInit = {
      method: tool.method,
      headers: {
        'Content-Type': 'application/json',
        ...tool.headers
      }
    }
    
    // Add authentication
    if (tool.authentication) {
      switch (tool.authentication.type) {
        case 'bearer':
          requestConfig.headers = {
            ...requestConfig.headers,
            'Authorization': `Bearer ${tool.authentication.key}`
          }
          break
        case 'api_key':
          if (tool.authentication.headerName) {
            requestConfig.headers = {
              ...requestConfig.headers,
              [tool.authentication.headerName]: tool.authentication.key
            }
          }
          break
        case 'basic':
          requestConfig.headers = {
            ...requestConfig.headers,
            'Authorization': `Basic ${tool.authentication.key}`
          }
          break
      }
    }
    
    // Prepare URL and body based on method
    let url = tool.endpoint
    
    if (tool.method === 'GET') {
      // Add parameters as query string
      const queryParams = new URLSearchParams()
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }
    } else {
      // Add parameters as request body
      requestConfig.body = JSON.stringify(finalParams)
    }
    
    // For demo purposes, simulate API responses
    const mockResponse = await simulateToolExecution(tool, finalParams)
    
    // In production, make actual HTTP request:
    // const response = await fetch(url, requestConfig)
    // const responseData = await response.json()
    
    // Extract relevant data using response format
    let extractedData = mockResponse
    if (tool.responseFormat?.successPath) {
      extractedData = extractDataFromPath(mockResponse, tool.responseFormat.successPath)
    }
    
    return {
      success: true,
      data: extractedData,
      rawResponse: mockResponse
    }
    
  } catch (error: any) {
    console.error('Tool function execution error:', error)
    return {
      success: false,
      error: error.message,
      rawResponse: null
    }
  }
}

async function simulateToolExecution(tool: Tool, parameters: Record<string, any>) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
  
  switch (tool.id) {
    case 'tool_1': // Weather API
      return {
        weather: [{
          main: 'Clear',
          description: parameters.q?.includes('Berlin') ? 'sonnig' : 'bewölkt'
        }],
        main: {
          temp: Math.round(Math.random() * 30 + 5),
          feels_like: Math.round(Math.random() * 30 + 5),
          humidity: Math.round(Math.random() * 50 + 30)
        },
        wind: {
          speed: Math.round(Math.random() * 10 + 1)
        },
        name: parameters.q?.split(',')[0] || 'Unknown City'
      }
      
    case 'tool_2': // CRM Customer Search
      return {
        data: {
          customers: [
            {
              id: '12345',
              name: 'Max Mustermann',
              email: parameters.email || 'max.mustermann@example.com',
              phone: parameters.phone || '+49 30 12345678',
              lastContact: '2024-01-15',
              status: 'active',
              notes: 'Interessiert an Premium-Paket'
            }
          ]
        },
        total: 1
      }
      
    case 'tool_3': // Calendar Availability
      const date = parameters.date || new Date().toISOString().split('T')[0]
      return {
        available_slots: [
          { time: '09:00', duration: parameters.duration || 60, available: true },
          { time: '10:30', duration: parameters.duration || 60, available: true },
          { time: '14:00', duration: parameters.duration || 60, available: false },
          { time: '15:30', duration: parameters.duration || 60, available: true }
        ],
        date: date,
        total_slots: 4,
        available_count: 3
      }
      
    default:
      return {
        message: 'Tool executed successfully',
        parameters: parameters,
        timestamp: new Date().toISOString()
      }
  }
}

function extractDataFromPath(data: any, path: string): any {
  const paths = path.split(',').map(p => p.trim())
  const result: any = {}
  
  paths.forEach(p => {
    const keys = p.split('.')
    let current = data
    
    for (const key of keys) {
      if (key.includes('[') && key.includes(']')) {
        // Handle array access like "weather[0]"
        const [arrayKey, indexStr] = key.split('[')
        const index = parseInt(indexStr.replace(']', ''))
        current = current?.[arrayKey]?.[index]
      } else {
        current = current?.[key]
      }
      
      if (current === undefined) break
    }
    
    if (current !== undefined) {
      result[p.replace(/\[.*?\]/g, '')] = current
    }
  })
  
  return Object.keys(result).length === 1 ? Object.values(result)[0] : result
}