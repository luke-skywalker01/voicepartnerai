import { NextRequest, NextResponse } from 'next/server'
import { VapiApiKey, ApiKeyUsageLog } from '../route'

// Mock function to get API key by ID
const getApiKeyById = (id: string): VapiApiKey | null => {
  const mockApiKeys = [
    {
      id: 'key_prod_main',
      orgId: 'org_default',
      name: 'Production API Key',
      keyPrefix: 'vapi_sk_prod_',
      hashedKey: 'sha256:a1b2c3d4e5f6...',
      permissions: {
        assistants: ['read', 'write', 'delete'] as ('read' | 'write' | 'delete')[],
        calls: ['read', 'write'] as ('read' | 'write' | 'delete')[],
        phoneNumbers: ['read', 'write'] as ('read' | 'write' | 'delete')[],
        workflows: ['read', 'write', 'delete'] as ('read' | 'write' | 'delete')[],
        squads: ['read', 'write'] as ('read' | 'write' | 'delete')[],
        billing: ['read'] as ('read')[],
        analytics: ['read'] as ('read')[]
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
      status: 'active' as const,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      createdBy: 'admin@company.com'
    }
  ]
  
  return mockApiKeys.find(k => k.id === id) || null
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
  
  return Array.from({ length: 100 }, (_, i) => ({
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

// GET /api/vapi/api-keys/[id] - Get specific API key with usage details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const includeLogs = url.searchParams.get('includeLogs') === 'true'
    const logsLimit = parseInt(url.searchParams.get('logsLimit') || '50')
    
    const apiKey = getApiKeyById(id)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }
    
    const response: any = { apiKey }
    
    if (includeLogs) {
      const logs = generateMockUsageLogs(id).slice(0, logsLimit)
      response.usageLogs = logs
      response.logsStats = {
        totalLogs: logs.length,
        errorRate: logs.filter(l => l.statusCode >= 400).length / logs.length,
        averageResponseTime: logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length,
        totalCost: logs.reduce((sum, l) => sum + l.cost, 0)
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/api-keys/[id] - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingKey = getApiKeyById(id)
    
    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }
    
    // Validate status if provided
    if (body.status) {
      const validStatuses = ['active', 'revoked', 'expired', 'suspended']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        )
      }
    }
    
    // Update API key
    const updatedKey: VapiApiKey = {
      ...existingKey,
      name: body.name || existingKey.name,
      status: body.status || existingKey.status,
      permissions: body.permissions || existingKey.permissions,
      restrictions: {
        ...existingKey.restrictions,
        ...body.restrictions
      },
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(updatedKey)
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/api-keys/[id] - Revoke/Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const permanent = url.searchParams.get('permanent') === 'true'
    
    const existingKey = getApiKeyById(id)
    
    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }
    
    if (permanent) {
      // Permanent deletion - remove from database
      return NextResponse.json({
        message: 'API key permanently deleted',
        apiKeyId: id
      })
    } else {
      // Soft delete - revoke the key
      const revokedKey = {
        ...existingKey,
        status: 'revoked' as const,
        updatedAt: new Date().toISOString()
      }
      
      return NextResponse.json({
        message: 'API key revoked successfully',
        apiKey: revokedKey
      })
    }
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/vapi/api-keys/[id] - Partial update (status, permissions, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingKey = getApiKeyById(id)
    
    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }
    
    // Handle different patch operations
    const updates: Partial<VapiApiKey> = {
      updatedAt: new Date().toISOString()
    }
    
    if (body.action) {
      switch (body.action) {
        case 'revoke':
          updates.status = 'revoked'
          break
        case 'suspend':
          updates.status = 'suspended'
          break
        case 'activate':
          updates.status = 'active'
          break
        case 'rotate':
          // Generate new key (would be done securely in production)
          updates.keyPrefix = `vapi_sk_new_${Date.now().toString().slice(-6)}...`
          updates.hashedKey = `sha256:${Math.random().toString(36).substr(2, 32)}`
          updates.updatedAt = new Date().toISOString()
          break
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }
    }
    
    // Handle direct field updates
    if (body.name) updates.name = body.name
    if (body.permissions) updates.permissions = body.permissions
    if (body.restrictions) {
      updates.restrictions = {
        ...existingKey.restrictions,
        ...body.restrictions
      }
    }
    
    const updatedKey = {
      ...existingKey,
      ...updates
    }
    
    // For key rotation, return the new key (only once)
    if (body.action === 'rotate') {
      const newRawKey = `vapi_sk_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`
      return NextResponse.json({
        apiKey: updatedKey,
        newRawKey, // Only returned for rotation!
        message: 'API key rotated successfully. Please update your applications with the new key.'
      })
    }
    
    return NextResponse.json(updatedKey)
  } catch (error) {
    console.error('Error partially updating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}