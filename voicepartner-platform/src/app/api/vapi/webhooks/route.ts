import { NextRequest, NextResponse } from 'next/server'

export interface VapiWebhook {
  id: string
  orgId: string
  name: string
  url: string
  description?: string
  status: 'active' | 'inactive' | 'failed' | 'testing'
  events: WebhookEvent[]
  security: {
    secret: string
    verifySSL: boolean
    authMethod: 'none' | 'basic' | 'bearer' | 'custom'
    authCredentials?: {
      username?: string
      password?: string
      token?: string
      headers?: Record<string, string>
    }
  }
  configuration: {
    timeout: number // milliseconds
    retryPolicy: {
      maxRetries: number
      retryDelay: number // seconds
      exponentialBackoff: boolean
    }
    headers: Record<string, string>
    contentType: 'application/json' | 'application/x-www-form-urlencoded'
  }
  statistics: {
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    averageResponseTime: number
    lastDelivery?: string
    lastSuccess?: string
    lastFailure?: string
  }
  createdAt: string
  updatedAt: string
  lastTriggeredAt?: string
  createdBy: string
}

export type WebhookEvent = 
  | 'call.started'
  | 'call.ended'
  | 'call.failed'
  | 'call.transferred'
  | 'assistant.created'
  | 'assistant.updated'
  | 'assistant.deleted'
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'squad.activated'
  | 'squad.deactivated'
  | 'phone_number.assigned'
  | 'phone_number.released'
  | 'billing.threshold_reached'
  | 'billing.payment_required'
  | 'system.health_check'
  | 'system.maintenance_scheduled'

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: any
  headers: Record<string, string>
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  attempts: number
  responseStatus?: number
  responseBody?: string
  responseTime?: number
  errorMessage?: string
  createdAt: string
  deliveredAt?: string
  nextRetryAt?: string
}

export interface WebhookTestResult {
  webhookId: string
  success: boolean
  responseTime: number
  responseStatus?: number
  responseBody?: string
  errorMessage?: string
  timestamp: string
}

// Mock webhooks data
const generateMockWebhooks = (): VapiWebhook[] => {
  return [
    {
      id: 'webhook_call_events',
      orgId: 'org_default',
      name: 'Call Events Webhook',
      url: 'https://api.company.com/webhooks/vapi/calls',
      description: 'Receive notifications for all call-related events',
      status: 'active',
      events: ['call.started', 'call.ended', 'call.failed', 'call.transferred'],
      security: {
        secret: 'whsec_1234567890abcdef',
        verifySSL: true,
        authMethod: 'bearer',
        authCredentials: {
          token: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...'
        }
      },
      configuration: {
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 60,
          exponentialBackoff: true
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VapiWebhook/1.0'
        },
        contentType: 'application/json'
      },
      statistics: {
        totalDeliveries: 2847,
        successfulDeliveries: 2756,
        failedDeliveries: 91,
        averageResponseTime: 450,
        lastDelivery: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        lastSuccess: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        lastFailure: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastTriggeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      createdBy: 'admin@company.com'
    },
    {
      id: 'webhook_billing_alerts',
      orgId: 'org_default',
      name: 'Billing Alerts',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      description: 'Get notified when billing thresholds are reached',
      status: 'active',
      events: ['billing.threshold_reached', 'billing.payment_required'],
      security: {
        secret: 'whsec_billing_alerts_secret',
        verifySSL: true,
        authMethod: 'none'
      },
      configuration: {
        timeout: 15000,
        retryPolicy: {
          maxRetries: 2,
          retryDelay: 30,
          exponentialBackoff: false
        },
        headers: {
          'Content-Type': 'application/json'
        },
        contentType: 'application/json'
      },
      statistics: {
        totalDeliveries: 24,
        successfulDeliveries: 24,
        failedDeliveries: 0,
        averageResponseTime: 280,
        lastDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastSuccess: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastTriggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'billing@company.com'
    },
    {
      id: 'webhook_crm_integration',
      orgId: 'org_default',
      name: 'CRM Integration',
      url: 'https://api.salesforce.com/services/data/v57.0/sobjects/Lead/',
      description: 'Sync lead information to Salesforce CRM',
      status: 'active',
      events: ['call.ended', 'workflow.completed'],
      security: {
        secret: 'whsec_crm_integration',
        verifySSL: true,
        authMethod: 'custom',
        authCredentials: {
          headers: {
            'Authorization': 'Bearer 00D000000000000!AR8AQPWV...',
            'X-SFDC-Session': 'session_id_here'
          }
        }
      },
      configuration: {
        timeout: 45000,
        retryPolicy: {
          maxRetries: 5,
          retryDelay: 120,
          exponentialBackoff: true
        },
        headers: {
          'Content-Type': 'application/json',
          'Sforce-Call-Options': 'client=VapiIntegration'
        },
        contentType: 'application/json'
      },
      statistics: {
        totalDeliveries: 1456,
        successfulDeliveries: 1389,
        failedDeliveries: 67,
        averageResponseTime: 890,
        lastDelivery: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        lastSuccess: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        lastFailure: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastTriggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      createdBy: 'integrations@company.com'
    },
    {
      id: 'webhook_analytics_pipeline',
      orgId: 'org_default',
      name: 'Analytics Data Pipeline',
      url: 'https://analytics.company.com/api/v1/events',
      description: 'Send event data to analytics platform',
      status: 'testing',
      events: ['call.started', 'call.ended', 'workflow.started', 'workflow.completed'],
      security: {
        secret: 'whsec_analytics_secret',
        verifySSL: true,
        authMethod: 'basic',
        authCredentials: {
          username: 'vapi_user',
          password: 'secure_password_123'
        }
      },
      configuration: {
        timeout: 20000,
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 90,
          exponentialBackoff: true
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'VapiPlatform'
        },
        contentType: 'application/json'
      },
      statistics: {
        totalDeliveries: 87,
        successfulDeliveries: 83,
        failedDeliveries: 4,
        averageResponseTime: 650,
        lastDelivery: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        lastSuccess: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        lastFailure: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      lastTriggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdBy: 'analytics@company.com'
    },
    {
      id: 'webhook_failed_example',
      orgId: 'org_default',
      name: 'Failed Webhook Example',
      url: 'https://invalid-endpoint.nowhere.com/webhook',
      description: 'Example of a webhook that has been failing',
      status: 'failed',
      events: ['system.health_check'],
      security: {
        secret: 'whsec_failed_webhook',
        verifySSL: true,
        authMethod: 'none'
      },
      configuration: {
        timeout: 10000,
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 60,
          exponentialBackoff: false
        },
        headers: {
          'Content-Type': 'application/json'
        },
        contentType: 'application/json'
      },
      statistics: {
        totalDeliveries: 15,
        successfulDeliveries: 0,
        failedDeliveries: 15,
        averageResponseTime: 0,
        lastDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        lastFailure: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastTriggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'test@company.com'
    }
  ]
}

// Generate mock webhook deliveries
const generateMockDeliveries = (webhookId: string): WebhookDelivery[] => {
  const events: WebhookEvent[] = ['call.started', 'call.ended', 'call.failed', 'workflow.completed']
  const statuses = ['delivered', 'failed', 'retrying']
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `delivery_${webhookId}_${i}`,
    webhookId,
    event: events[Math.floor(Math.random() * events.length)],
    payload: {
      event: events[Math.floor(Math.random() * events.length)],
      data: {
        id: `call_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Vapi-Signature': 'sha256=abc123...',
      'User-Agent': 'VapiWebhook/1.0'
    },
    status: statuses[Math.floor(Math.random() * statuses.length)] as any,
    attempts: Math.floor(Math.random() * 3) + 1,
    responseStatus: Math.random() > 0.2 ? 200 : 500,
    responseBody: Math.random() > 0.2 ? 'OK' : 'Internal Server Error',
    responseTime: Math.floor(Math.random() * 2000) + 100,
    errorMessage: Math.random() > 0.8 ? 'Connection timeout' : undefined,
    createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    deliveredAt: Math.random() > 0.2 ? new Date(Date.now() - i * 60 * 60 * 1000 + 1000).toISOString() : undefined,
    nextRetryAt: Math.random() > 0.8 ? new Date(Date.now() + 60 * 1000).toISOString() : undefined
  }))
}

// GET /api/vapi/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const event = url.searchParams.get('event')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const includeStats = url.searchParams.get('includeStats') === 'true'
    
    let webhooks = generateMockWebhooks()
    
    // Apply filters
    if (status) {
      webhooks = webhooks.filter(w => w.status === status)
    }
    
    if (event) {
      webhooks = webhooks.filter(w => w.events.includes(event as WebhookEvent))
    }
    
    // Apply pagination
    const paginatedWebhooks = webhooks.slice(offset, offset + limit)
    
    // Optionally exclude detailed stats for lighter responses
    const responseWebhooks = includeStats 
      ? paginatedWebhooks 
      : paginatedWebhooks.map(webhook => {
          const { statistics, ...webhookWithoutStats } = webhook
          return {
            ...webhookWithoutStats,
            statistics: {
              totalDeliveries: statistics.totalDeliveries,
              successfulDeliveries: statistics.successfulDeliveries,
              lastDelivery: statistics.lastDelivery
            }
          }
        })
    
    return NextResponse.json({
      webhooks: responseWebhooks,
      pagination: {
        total: webhooks.length,
        limit,
        offset,
        hasMore: offset + limit < webhooks.length
      },
      summary: {
        totalActive: webhooks.filter(w => w.status === 'active').length,
        totalFailed: webhooks.filter(w => w.status === 'failed').length,
        totalInactive: webhooks.filter(w => w.status === 'inactive').length,
        totalDeliveries: webhooks.reduce((sum, w) => sum + w.statistics.totalDeliveries, 0),
        successRate: webhooks.reduce((sum, w) => sum + w.statistics.successfulDeliveries, 0) / 
                    webhooks.reduce((sum, w) => sum + w.statistics.totalDeliveries, 1) * 100,
        averageResponseTime: webhooks.reduce((sum, w) => sum + w.statistics.averageResponseTime, 0) / webhooks.length
      },
      availableEvents: [
        'call.started', 'call.ended', 'call.failed', 'call.transferred',
        'assistant.created', 'assistant.updated', 'assistant.deleted',
        'workflow.started', 'workflow.completed', 'workflow.failed',
        'squad.activated', 'squad.deactivated',
        'phone_number.assigned', 'phone_number.released',
        'billing.threshold_reached', 'billing.payment_required',
        'system.health_check', 'system.maintenance_scheduled'
      ]
    })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/webhooks - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Name, URL, and events array are required' },
        { status: 400 }
      )
    }
    
    // Validate URL format
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    // Generate webhook secret
    const secret = `whsec_${Math.random().toString(36).substr(2, 32)}`
    
    const newWebhook: VapiWebhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orgId: 'org_default',
      name: body.name,
      url: body.url,
      description: body.description || '',
      status: 'inactive', // Start inactive until tested
      events: body.events,
      security: {
        secret,
        verifySSL: body.security?.verifySSL !== false,
        authMethod: body.security?.authMethod || 'none',
        authCredentials: body.security?.authCredentials
      },
      configuration: {
        timeout: body.configuration?.timeout || 30000,
        retryPolicy: {
          maxRetries: body.configuration?.retryPolicy?.maxRetries || 3,
          retryDelay: body.configuration?.retryPolicy?.retryDelay || 60,
          exponentialBackoff: body.configuration?.retryPolicy?.exponentialBackoff !== false
        },
        headers: body.configuration?.headers || {
          'Content-Type': 'application/json',
          'User-Agent': 'VapiWebhook/1.0'
        },
        contentType: body.configuration?.contentType || 'application/json'
      },
      statistics: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        averageResponseTime: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user@company.com' // In production, get from auth context
    }
    
    return NextResponse.json({
      webhook: newWebhook,
      secret, // Return secret only once during creation
      message: 'Webhook created successfully. Please save the secret securely for signature verification.'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/webhooks - Bulk operations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookIds, action, updates } = body
    
    if (!Array.isArray(webhookIds) || webhookIds.length === 0) {
      return NextResponse.json(
        { error: 'webhookIds array is required' },
        { status: 400 }
      )
    }
    
    const validActions = ['activate', 'deactivate', 'test', 'update']
    if (action && !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: ' + validActions.join(', ') },
        { status: 400 }
      )
    }
    
    // In production, perform bulk operation on database
    const updatedWebhooks = webhookIds.map(id => ({
      id,
      status: action === 'activate' ? 'active' : 
              action === 'deactivate' ? 'inactive' : 'active',
      updatedAt: new Date().toISOString(),
      ...updates
    }))
    
    return NextResponse.json({
      updated: updatedWebhooks.length,
      webhooks: updatedWebhooks,
      action
    })
  } catch (error) {
    console.error('Error performing bulk webhook operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/webhooks - Delete webhooks
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const webhookIds = url.searchParams.get('ids')?.split(',') || []
    
    if (webhookIds.length === 0) {
      return NextResponse.json(
        { error: 'No webhook IDs provided' },
        { status: 400 }
      )
    }
    
    // In production, delete from database and stop any pending deliveries
    
    return NextResponse.json({
      deleted: webhookIds.length,
      webhookIds,
      message: 'Webhooks deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting webhooks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}