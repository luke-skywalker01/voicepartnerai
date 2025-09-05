import { NextRequest, NextResponse } from 'next/server'

// Tool definition structure
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
  createdAt: string
  updatedAt: string
  isActive: boolean
  category: 'api' | 'webhook' | 'database' | 'service'
  usage: {
    totalCalls: number
    lastUsed?: string
    avgResponseTime?: number
  }
}

// Mock tools storage (in production, use database)
let toolsStorage: Tool[] = [
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
      },
      {
        name: 'lang',
        type: 'string',
        description: 'Sprache der Antwort',
        required: false,
        default: 'de'
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
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    category: 'api',
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
      },
      {
        name: 'name',
        type: 'string',
        description: 'Name des Kunden',
        required: false
      }
    ],
    headers: {
      'Content-Type': 'application/json'
    },
    authentication: {
      type: 'bearer',
      key: 'demo_bearer_token'
    },
    responseFormat: {
      successPath: 'data.customers',
      errorPath: 'error.message'
    },
    ownerId: 'user_demo',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    category: 'database',
    usage: {
      totalCalls: 128,
      lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
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
      },
      {
        name: 'service_type',
        type: 'string',
        description: 'Art des Services',
        required: false
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
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    category: 'service',
    usage: {
      totalCalls: 67,
      lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      avgResponseTime: 180
    }
  }
]

// GET - List all tools for the user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const isActive = searchParams.get('active')
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Filter tools by user and optional filters
    let userTools = toolsStorage.filter(tool => tool.ownerId === userId)
    
    if (category) {
      userTools = userTools.filter(tool => tool.category === category)
    }
    
    if (isActive !== null) {
      userTools = userTools.filter(tool => tool.isActive === (isActive === 'true'))
    }
    
    // Apply pagination
    const paginatedTools = userTools.slice(offset, offset + limit)
    
    // Calculate statistics
    const stats = {
      totalTools: userTools.length,
      activeTools: userTools.filter(t => t.isActive).length,
      totalCalls: userTools.reduce((sum, tool) => sum + tool.usage.totalCalls, 0),
      byCategory: userTools.reduce((acc, tool) => {
        acc[tool.category] = (acc[tool.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tools: paginatedTools,
        pagination: {
          total: userTools.length,
          limit,
          offset,
          hasMore: offset + limit < userTools.length
        },
        stats
      }
    })
    
  } catch (error: any) {
    console.error('Tools GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      endpoint,
      method = 'GET',
      parameters = [],
      headers = {},
      authentication,
      responseFormat,
      category = 'api'
    } = body
    
    // Validate required fields
    if (!name || !description || !endpoint) {
      return NextResponse.json(
        { success: false, error: 'Name, description, and endpoint are required' },
        { status: 400 }
      )
    }
    
    // Validate endpoint URL
    try {
      new URL(endpoint)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid endpoint URL' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Create new tool
    const newTool: Tool = {
      id: `tool_${Date.now()}`,
      name,
      description,
      endpoint,
      method,
      parameters,
      headers,
      authentication,
      responseFormat,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      category,
      usage: {
        totalCalls: 0
      }
    }
    
    // Store tool
    toolsStorage.push(newTool)
    
    return NextResponse.json({
      success: true,
      data: {
        tool: newTool,
        message: 'Tool created successfully'
      }
    })
    
  } catch (error: any) {
    console.error('Tool creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Creation failed' },
      { status: 500 }
    )
  }
}

// DELETE - Remove tool
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('id')
    
    if (!toolId) {
      return NextResponse.json(
        { success: false, error: 'Tool ID required' },
        { status: 400 }
      )
    }
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Find tool
    const toolIndex = toolsStorage.findIndex(
      tool => tool.id === toolId && tool.ownerId === userId
    )
    
    if (toolIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    // Remove tool
    const deletedTool = toolsStorage.splice(toolIndex, 1)[0]
    
    return NextResponse.json({
      success: true,
      data: {
        deletedTool,
        message: 'Tool deleted successfully'
      }
    })
    
  } catch (error: any) {
    console.error('Tool delete error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    )
  }
}