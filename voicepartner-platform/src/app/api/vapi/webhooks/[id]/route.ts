import { NextRequest, NextResponse } from 'next/server'
import { VapiWebhook, WebhookDelivery, WebhookTestResult } from '../route'

// Mock function to get webhook by ID
const getWebhookById = (id: string): VapiWebhook | null => {
  const mockWebhooks = [
    {
      id: 'webhook_call_events',
      orgId: 'org_default',
      name: 'Call Events Webhook',
      url: 'https://api.company.com/webhooks/vapi/calls',
      description: 'Receive notifications for all call-related events',
      status: 'active' as const,
      events: ['call.started', 'call.ended', 'call.failed', 'call.transferred'] as const,
      security: {
        secret: 'whsec_1234567890abcdef',
        verifySSL: true,
        authMethod: 'bearer' as const,
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
        contentType: 'application/json' as const
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
    }
  ]
  
  return mockWebhooks.find(w => w.id === id) || null
}

// Generate mock webhook deliveries
const generateMockDeliveries = (webhookId: string): WebhookDelivery[] => {
  const events = ['call.started', 'call.ended', 'call.failed', 'workflow.completed']
  const statuses = ['delivered', 'failed', 'retrying']
  
  return Array.from({ length: 100 }, (_, i) => ({
    id: `delivery_${webhookId}_${i}`,
    webhookId,
    event: events[Math.floor(Math.random() * events.length)] as any,
    payload: {
      event: events[Math.floor(Math.random() * events.length)],
      data: {
        id: `call_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        duration: Math.floor(Math.random() * 300) + 30
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Vapi-Signature': `sha256=abc123def456${i}`,
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

// GET /api/vapi/webhooks/[id] - Get specific webhook with delivery history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const includeDeliveries = url.searchParams.get('includeDeliveries') === 'true'
    const deliveriesLimit = parseInt(url.searchParams.get('deliveriesLimit') || '50')
    const deliveryStatus = url.searchParams.get('deliveryStatus')
    
    const webhook = getWebhookById(id)
    
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }
    
    const response: any = { webhook }
    
    if (includeDeliveries) {
      let deliveries = generateMockDeliveries(id)
      
      // Filter by delivery status if specified
      if (deliveryStatus) {
        deliveries = deliveries.filter(d => d.status === deliveryStatus)
      }
      
      deliveries = deliveries.slice(0, deliveriesLimit)
      
      response.deliveries = deliveries
      response.deliveryStats = {
        totalDeliveries: deliveries.length,
        successRate: deliveries.filter(d => d.status === 'delivered').length / deliveries.length,
        averageResponseTime: deliveries.reduce((sum, d) => sum + (d.responseTime || 0), 0) / deliveries.length,
        recentFailures: deliveries.filter(d => d.status === 'failed' && 
          new Date(d.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vapi/webhooks/[id] - Update webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingWebhook = getWebhookById(id)
    
    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }
    
    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url)
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
    }
    
    // Validate status if provided
    if (body.status) {
      const validStatuses = ['active', 'inactive', 'failed', 'testing']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        )
      }
    }
    
    // Update webhook
    const updatedWebhook: VapiWebhook = {
      ...existingWebhook,
      name: body.name || existingWebhook.name,
      url: body.url || existingWebhook.url,
      description: body.description !== undefined ? body.description : existingWebhook.description,
      status: body.status || existingWebhook.status,
      events: body.events || existingWebhook.events,
      security: {
        ...existingWebhook.security,
        ...body.security
      },
      configuration: {
        ...existingWebhook.configuration,
        ...body.configuration
      },
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(updatedWebhook)
  } catch (error) {
    console.error('Error updating webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/vapi/webhooks/[id] - Delete webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const existingWebhook = getWebhookById(id)
    
    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }
    
    // In production, this would:
    // 1. Stop any pending deliveries
    // 2. Delete webhook from database
    // 3. Clean up delivery history (or archive it)
    
    return NextResponse.json({
      message: 'Webhook deleted successfully',
      webhookId: id
    })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/vapi/webhooks/[id] - Partial update (status, test, rotate secret)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingWebhook = getWebhookById(id)
    
    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }
    
    // Handle different patch operations
    const updates: Partial<VapiWebhook> = {
      updatedAt: new Date().toISOString()
    }
    
    if (body.action) {
      switch (body.action) {
        case 'activate':
          updates.status = 'active'
          break
        case 'deactivate':
          updates.status = 'inactive'
          break
        case 'test':
          // Perform webhook test (implemented separately in test endpoint)
          return NextResponse.json({
            message: 'Use POST /api/vapi/webhooks/[id]/test for testing webhooks'
          }, { status: 400 })
        case 'rotate_secret':
          // Generate new secret
          const newSecret = `whsec_${Math.random().toString(36).substr(2, 32)}`
          updates.security = {
            ...existingWebhook.security,
            secret: newSecret
          }
          
          const updatedWebhook = {
            ...existingWebhook,
            ...updates
          }
          
          return NextResponse.json({
            webhook: updatedWebhook,
            newSecret,
            message: 'Webhook secret rotated successfully. Please update your signature verification.'
          })
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }
    }
    
    // Handle direct field updates
    if (body.status) updates.status = body.status
    if (body.events) updates.events = body.events
    if (body.configuration) {
      updates.configuration = {
        ...existingWebhook.configuration,
        ...body.configuration
      }
    }
    
    const updatedWebhook = {
      ...existingWebhook,
      ...updates
    }
    
    return NextResponse.json(updatedWebhook)
  } catch (error) {
    console.error('Error partially updating webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}