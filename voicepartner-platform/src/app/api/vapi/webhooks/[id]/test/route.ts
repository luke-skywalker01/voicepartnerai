import { NextRequest, NextResponse } from 'next/server'
import { WebhookTestResult } from '../../route'

// Mock function to simulate webhook test
const testWebhookEndpoint = async (
  url: string, 
  payload: any, 
  headers: Record<string, string>,
  timeout: number = 30000
): Promise<WebhookTestResult> => {
  const startTime = Date.now()
  
  try {
    // Simulate various test scenarios based on URL patterns
    if (url.includes('invalid') || url.includes('nowhere')) {
      throw new Error('Connection failed: DNS resolution failed')
    }
    
    if (url.includes('timeout')) {
      // Simulate timeout
      await new Promise(resolve => setTimeout(resolve, timeout + 1000))
      throw new Error('Request timeout')
    }
    
    if (url.includes('500') || url.includes('error')) {
      // Simulate server error
      await new Promise(resolve => setTimeout(resolve, 1500))
      return {
        webhookId: 'test',
        success: false,
        responseTime: Date.now() - startTime,
        responseStatus: 500,
        responseBody: '{"error": "Internal Server Error"}',
        errorMessage: 'Server returned 500 Internal Server Error',
        timestamp: new Date().toISOString()
      }
    }
    
    if (url.includes('unauthorized') || url.includes('401')) {
      // Simulate authentication error
      await new Promise(resolve => setTimeout(resolve, 800))
      return {
        webhookId: 'test',
        success: false,
        responseTime: Date.now() - startTime,
        responseStatus: 401,
        responseBody: '{"error": "Unauthorized"}',
        errorMessage: 'Authentication failed',
        timestamp: new Date().toISOString()
      }
    }
    
    if (url.includes('slow')) {
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 5000))
    } else {
      // Simulate normal response delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200))
    }
    
    // Successful response
    const responseTime = Date.now() - startTime
    
    return {
      webhookId: 'test',
      success: true,
      responseTime,
      responseStatus: 200,
      responseBody: '{"status": "success", "message": "Webhook received successfully"}',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return {
      webhookId: 'test',
      success: false,
      responseTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }
  }
}

// POST /api/vapi/webhooks/[id]/test - Test webhook endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Mock webhook data (in production, would fetch from database)
    const mockWebhook = {
      id,
      url: body.testUrl || 'https://api.company.com/webhooks/vapi/test',
      security: {
        secret: 'whsec_test_secret',
        verifySSL: true,
        authMethod: 'bearer',
        authCredentials: {
          token: 'Bearer test_token'
        }
      },
      configuration: {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VapiWebhook/1.0'
        }
      }
    }
    
    // Create test payload
    const testPayload = body.testPayload || {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        id: `test_${Date.now()}`,
        message: 'This is a test webhook delivery from Vapi',
        webhook_id: id,
        test: true
      }
    }
    
    // Prepare headers for the test request
    const testHeaders: Record<string, string> = {
      ...mockWebhook.configuration.headers,
      'X-Vapi-Event': 'webhook.test',
      'X-Vapi-Delivery': `delivery_test_${Date.now()}`,
      'X-Vapi-Signature': generateWebhookSignature(testPayload, mockWebhook.security.secret)
    }
    
    // Add authentication headers if configured
    if (mockWebhook.security.authMethod === 'bearer' && mockWebhook.security.authCredentials?.token) {
      testHeaders['Authorization'] = mockWebhook.security.authCredentials.token
    }
    
    // Perform the test
    const testResult = await testWebhookEndpoint(
      mockWebhook.url,
      testPayload,
      testHeaders,
      mockWebhook.configuration.timeout
    )
    
    testResult.webhookId = id
    
    // In production, save test result to database for history
    
    return NextResponse.json({
      testResult,
      testPayload,
      sentHeaders: testHeaders,
      message: testResult.success 
        ? 'Webhook test completed successfully' 
        : 'Webhook test failed'
    })
  } catch (error) {
    console.error('Error testing webhook:', error)
    
    const errorResult: WebhookTestResult = {
      webhookId: params.id,
      success: false,
      responseTime: 0,
      errorMessage: error instanceof Error ? error.message : 'Test setup failed',
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({
      testResult: errorResult,
      message: 'Webhook test failed due to system error'
    }, { status: 500 })
  }
}

// GET /api/vapi/webhooks/[id]/test - Get test history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    
    // Mock test history
    const mockTestHistory: WebhookTestResult[] = Array.from({ length: 10 }, (_, i) => ({
      webhookId: id,
      success: Math.random() > 0.3,
      responseTime: Math.floor(Math.random() * 3000) + 200,
      responseStatus: Math.random() > 0.3 ? 200 : 500,
      responseBody: Math.random() > 0.3 ? '{"status": "success"}' : '{"error": "Internal Server Error"}',
      errorMessage: Math.random() > 0.7 ? 'Connection timeout' : undefined,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    }))
    
    const paginatedHistory = mockTestHistory.slice(0, limit)
    
    return NextResponse.json({
      testHistory: paginatedHistory,
      summary: {
        totalTests: mockTestHistory.length,
        successRate: mockTestHistory.filter(t => t.success).length / mockTestHistory.length,
        averageResponseTime: mockTestHistory.reduce((sum, t) => sum + t.responseTime, 0) / mockTestHistory.length,
        lastTest: mockTestHistory[0]?.timestamp,
        recentFailures: mockTestHistory.filter(t => !t.success && 
          new Date(t.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
      }
    })
  } catch (error) {
    console.error('Error fetching webhook test history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate webhook signature (simplified)
function generateWebhookSignature(payload: any, secret: string): string {
  // In production, use proper HMAC-SHA256 signature
  const payloadString = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)
  
  // Simplified signature for demo - in production use crypto.createHmac
  const signature = Buffer.from(`${timestamp}.${payloadString}.${secret}`).toString('base64')
  
  return `t=${timestamp},v1=${signature}`
}