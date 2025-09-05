import { NextRequest, NextResponse } from 'next/server'

export interface VapiApiKey {
  id: string
  orgId: string
  name: string
  keyPrefix: string
  hashedKey: string
  permissions: {
    assistants: ('read' | 'write' | 'delete')[]
    calls: ('read' | 'write' | 'delete')[]
    phoneNumbers: ('read' | 'write' | 'delete')[]
    workflows: ('read' | 'write' | 'delete')[]
    squads: ('read' | 'write' | 'delete')[]
    billing: ('read')[]
    analytics: ('read')[]
  }
  restrictions: {
    ipWhitelist?: string[]
    rateLimits: {
      requestsPerMinute: number
      requestsPerHour: number
      requestsPerDay: number
    }
    allowedOrigins?: string[]
    expiresAt?: string
  }
  usage: {
    totalRequests: number
    totalCost: number
    lastUsed?: string
    requestsThisMonth: number
    requestsToday: number
  }
  status: 'active' | 'revoked' | 'expired' | 'suspended'
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
  createdBy: string
}

export interface CreateApiKeyRequest {
  name: string
  permissions: VapiApiKey['permissions']
  restrictions?: Partial<VapiApiKey['restrictions']>
  expiresInDays?: number
}

export interface ApiKeyUsageLog {
  id: string
  apiKeyId: string
  timestamp: string
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  userAgent?: string
  ipAddress: string
  requestSize: number
  responseSize: number
  cost: number
  errorMessage?: string
}

// Mock API keys data
const generateMockApiKeys = (): VapiApiKey[] => {
  return [
    {
      id: 'key_prod_main',
      orgId: 'org_default',
      name: 'Production API Key',
      keyPrefix: 'vapi_sk_prod_',
      hashedKey: 'sha256:a1b2c3d4e5f6...', // In production, store only hash
      permissions: {
        assistants: ['read', 'write', 'delete'],
        calls: ['read', 'write'],
        phoneNumbers: ['read', 'write'],
        workflows: ['read', 'write', 'delete'],
        squads: ['read', 'write'],
        billing: ['read'],
        analytics: ['read']
      },
      restrictions: {
        ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
        rateLimits: {
          requestsPerMinute: 1000,
          requestsPerHour: 50000,
          requestsPerDay: 1000000
        },
        allowedOrigins: ['https://app.voicepartner.ai', 'https://dashboard.company.com'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      usage: {
        totalRequests: 234567,
        totalCost: 1847.32,
        lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        requestsThisMonth: 45234,
        requestsToday: 1247
      },
      status: 'active',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      createdBy: 'admin@company.com'
    },
    {
      id: 'key_dev_testing',
      orgId: 'org_default',
      name: 'Development Testing Key',
      keyPrefix: 'vapi_sk_dev_',
      hashedKey: 'sha256:x1y2z3a4b5c6...',
      permissions: {
        assistants: ['read', 'write'],
        calls: ['read'],
        phoneNumbers: ['read'],
        workflows: ['read', 'write'],
        squads: ['read'],
        billing: ['read'],
        analytics: ['read']
      },
      restrictions: {
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerHour: 5000,
          requestsPerDay: 50000
        },
        allowedOrigins: ['http://localhost:3000', 'https://dev.voicepartner.ai'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      usage: {
        totalRequests: 12456,
        totalCost: 89.45,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        requestsThisMonth: 3456,
        requestsToday: 89
      },
      status: 'active',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdBy: 'dev@company.com'
    },
    {
      id: 'key_webhook_integration',
      orgId: 'org_default',
      name: 'Webhook Integration Key',
      keyPrefix: 'vapi_sk_webhook_',
      hashedKey: 'sha256:w1e2b3h4o5o6...',
      permissions: {
        assistants: ['read'],
        calls: ['read', 'write'],
        phoneNumbers: ['read'],
        workflows: ['read'],
        squads: ['read'],
        billing: [],
        analytics: ['read']
      },
      restrictions: {
        ipWhitelist: ['webhook.zapier.com', 'hooks.slack.com'],
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 2000,
          requestsPerDay: 20000
        }
      },
      usage: {
        totalRequests: 5678,
        totalCost: 23.67,
        lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        requestsThisMonth: 1234,
        requestsToday: 45
      },
      status: 'active',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      createdBy: 'integrations@company.com'
    },
    {
      id: 'key_revoked_old',
      orgId: 'org_default',
      name: 'Old Production Key (Revoked)',
      keyPrefix: 'vapi_sk_old_',
      hashedKey: 'sha256:o1l2d3k4e5y6...',
      permissions: {
        assistants: ['read', 'write', 'delete'],
        calls: ['read', 'write'],
        phoneNumbers: ['read', 'write'],
        workflows: ['read', 'write'],
        squads: ['read'],
        billing: ['read'],
        analytics: ['read']
      },
      restrictions: {
        rateLimits: {
          requestsPerMinute: 1000,
          requestsPerHour: 50000,
          requestsPerDay: 1000000
        }
      },
      usage: {
        totalRequests: 567890,
        totalCost: 4521.78,
        lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        requestsThisMonth: 0,
        requestsToday: 0
      },
      status: 'revoked',
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'admin@company.com'
    }
  ]
}

// Generate mock usage logs
const generateMockUsageLogs = (apiKeyId: string): ApiKeyUsageLog[] => {
  const endpoints = [
    '/api/vapi/assistants',
    '/api/vapi/calls',
    '/api/vapi/phone-numbers',
    '/api/vapi/workflows',
    '/api/vapi/billing'
  ]
  
  const methods = ['GET', 'POST', 'PUT', 'DELETE']
  const statusCodes = [200, 201, 400, 401, 403, 404, 500]
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `log_${apiKeyId}_${i}`,
    apiKeyId,
    timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    method: methods[Math.floor(Math.random() * methods.length)],
    endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
    statusCode: statusCodes[Math.floor(Math.random() * statusCodes.length)],
    responseTime: Math.floor(Math.random() * 2000) + 100,
    userAgent: 'VapiSDK/1.0 (Node.js)',
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    requestSize: Math.floor(Math.random() * 10000) + 500,
    responseSize: Math.floor(Math.random() * 50000) + 1000,
    cost: Math.random() * 0.05,
    errorMessage: Math.random() > 0.8 ? 'Rate limit exceeded' : undefined
  }))
}

// GET /api/vapi/api-keys - List all API keys
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const includeUsage = url.searchParams.get('includeUsage') === 'true'
    
    let apiKeys = generateMockApiKeys()
    
    // Apply filters
    if (status) {
      apiKeys = apiKeys.filter(key => key.status === status)
    }
    
    // Apply pagination
    const paginatedKeys = apiKeys.slice(offset, offset + limit)
    
    // Optionally exclude detailed usage for lighter responses
    const responseKeys = includeUsage 
      ? paginatedKeys 
      : paginatedKeys.map(key => {
          const { usage, ...keyWithoutUsage } = key
          return {
            ...keyWithoutUsage,
            usage: {
              totalRequests: usage.totalRequests,
              lastUsed: usage.lastUsed
            }
          }
        })
    
    return NextResponse.json({
      apiKeys: responseKeys,
      pagination: {
        total: apiKeys.length,
        limit,
        offset,
        hasMore: offset + limit < apiKeys.length
      },
      summary: {
        totalActive: apiKeys.filter(k => k.status === 'active').length,
        totalRevoked: apiKeys.filter(k => k.status === 'revoked').length,
        totalExpired: apiKeys.filter(k => k.status === 'expired').length,
        totalRequests: apiKeys.reduce((sum, k) => sum + k.usage.totalRequests, 0),
        totalCost: apiKeys.reduce((sum, k) => sum + k.usage.totalCost, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const body: CreateApiKeyRequest = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }
    
    if (!body.permissions) {
      return NextResponse.json(
        { error: 'API key permissions are required' },
        { status: 400 }
      )
    }
    
    // Generate secure API key
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const rawKey = `vapi_sk_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`
    const keyPrefix = rawKey.substring(0, 12) + '...'
    
    // In production, hash the key and store only the hash
    const hashedKey = `sha256:${Buffer.from(rawKey).toString('base64')}`
    
    const expiresAt = body.expiresInDays 
      ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined
    
    const newApiKey: VapiApiKey = {
      id: keyId,
      orgId: 'org_default',
      name: body.name,
      keyPrefix,
      hashedKey,
      permissions: body.permissions,
      restrictions: {
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerHour: 5000,
          requestsPerDay: 50000
        },
        ...body.restrictions,
        expiresAt
      },
      usage: {
        totalRequests: 0,
        totalCost: 0,
        requestsThisMonth: 0,
        requestsToday: 0
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user@company.com' // In production, get from auth context
    }
    
    // Return the full key only once during creation
    return NextResponse.json({
      apiKey: newApiKey,
      rawKey, // Only returned once!
      message: 'API key created successfully. Please save the key securely as it will not be shown again.'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/api-keys - Bulk operations (revoke, suspend, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKeyIds, action, updates } = body
    
    if (!Array.isArray(apiKeyIds) || apiKeyIds.length === 0) {
      return NextResponse.json(
        { error: 'apiKeyIds array is required' },
        { status: 400 }
      )
    }
    
    const validActions = ['revoke', 'suspend', 'activate', 'update']
    if (action && !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: ' + validActions.join(', ') },
        { status: 400 }
      )
    }
    
    // In production, perform bulk operation on database
    const updatedKeys = apiKeyIds.map(id => ({
      id,
      status: action === 'revoke' ? 'revoked' : 
              action === 'suspend' ? 'suspended' : 
              action === 'activate' ? 'active' : 'active',
      updatedAt: new Date().toISOString(),
      ...updates
    }))
    
    return NextResponse.json({
      updated: updatedKeys.length,
      apiKeys: updatedKeys,
      action
    })
  } catch (error) {
    console.error('Error performing bulk API key operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/api-keys - Delete API keys (permanent)
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const apiKeyIds = url.searchParams.get('ids')?.split(',') || []
    
    if (apiKeyIds.length === 0) {
      return NextResponse.json(
        { error: 'No API key IDs provided' },
        { status: 400 }
      )
    }
    
    // In production, permanently delete from database
    // Also delete associated usage logs
    
    return NextResponse.json({
      deleted: apiKeyIds.length,
      apiKeyIds,
      message: 'API keys permanently deleted'
    })
  } catch (error) {
    console.error('Error deleting API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}