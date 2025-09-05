interface N8nConfig {
  baseUrl: string
  apiKey: string
}

interface WorkflowNode {
  id: string
  name: string
  type: string
  position: [number, number]
  parameters: Record<string, any>
}

interface N8nWorkflow {
  id?: string
  name: string
  active: boolean
  nodes: WorkflowNode[]
  connections: Record<string, any>
  settings: Record<string, any>
}

export class N8nWorkflowManager {
  private config: N8nConfig

  constructor(config: N8nConfig) {
    this.config = config
  }

  async createVoiceBotWorkflow(botName: string, botConfig: any): Promise<string> {
    const workflow: N8nWorkflow = {
      name: `VoiceBot: ${botName}`,
      active: false,
      nodes: [
        // Webhook Trigger - receives voice bot events
        {
          id: 'webhook-trigger',
          name: 'Voice Bot Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: `voicebot/${botConfig.id}`,
            responseMode: 'responseNode'
          }
        },
        
        // Process Voice Input
        {
          id: 'process-input',
          name: 'Process Voice Input',
          type: 'n8n-nodes-base.function',
          position: [450, 300],
          parameters: {
            functionCode: `
              const input = items[0].json;
              
              // Extract voice data and user intent
              const voiceData = {
                transcript: input.transcript,
                intent: input.intent,
                confidence: input.confidence,
                userId: input.userId,
                sessionId: input.sessionId,
                timestamp: new Date().toISOString()
              };
              
              return [{ json: voiceData }];
            `
          }
        },

        // Intent Router
        {
          id: 'intent-router',
          name: 'Intent Router',
          type: 'n8n-nodes-base.switch',
          position: [650, 300],
          parameters: {
            dataType: 'string',
            value1: '={{ $json.intent }}',
            rules: {
              rules: [
                {
                  operation: 'equal',
                  value2: 'booking'
                },
                {
                  operation: 'equal',
                  value2: 'information'
                },
                {
                  operation: 'equal',
                  value2: 'support'
                }
              ]
            }
          }
        },

        // Booking Handler
        {
          id: 'booking-handler',
          name: 'Handle Booking',
          type: 'n8n-nodes-base.function',
          position: [850, 200],
          parameters: {
            functionCode: `
              const bookingData = items[0].json;
              
              // Process booking request
              const booking = {
                service: bookingData.service,
                date: bookingData.date,
                time: bookingData.time,
                customerName: bookingData.customerName,
                customerPhone: bookingData.customerPhone,
                status: 'pending'
              };
              
              return [{ json: { ...bookingData, booking } }];
            `
          }
        },

        // Database Save
        {
          id: 'save-to-db',
          name: 'Save to Database',
          type: 'n8n-nodes-base.postgres',
          position: [1050, 200],
          parameters: {
            operation: 'insert',
            table: 'bookings',
            columns: 'service,date,time,customer_name,customer_phone,status,created_at',
            additionalFields: {}
          }
        },

        // Send Confirmation
        {
          id: 'send-confirmation',
          name: 'Send Confirmation',
          type: 'n8n-nodes-base.webhook',
          position: [1250, 200],
          parameters: {
            httpMethod: 'POST',
            responseMode: 'responseNode',
            responseData: `{
              "success": true,
              "message": "Buchung erfolgreich erstellt",
              "bookingId": "{{ $json.booking.id }}",
              "response": "Vielen Dank! Ihre Buchung wurde bestätigt. Sie erhalten eine Bestätigung per SMS."
            }`
          }
        },

        // Information Handler
        {
          id: 'info-handler',
          name: 'Handle Information Request',
          type: 'n8n-nodes-base.function',
          position: [850, 300],
          parameters: {
            functionCode: `
              const request = items[0].json;
              
              // Knowledge base lookup
              const responses = {
                'hours': 'Unsere Öffnungszeiten sind Montag bis Freitag 9-20 Uhr, Samstag 10-18 Uhr.',
                'prices': 'Klassische Massage 60 Min: 80€, Thai Massage 90 Min: 120€, Hot Stone 75 Min: 110€',
                'location': 'Wir befinden uns in der Musterstraße 123, 12345 Berlin.',
                'services': 'Wir bieten klassische Massage, Thai Massage, Hot Stone und Sportmassage an.'
              };
              
              const responseText = responses[request.topic] || 'Entschuldigung, dazu kann ich Ihnen keine Information geben.';
              
              return [{ json: { ...request, response: responseText } }];
            `
          }
        },

        // Response Sender
        {
          id: 'send-response',
          name: 'Send Response',
          type: 'n8n-nodes-base.webhook',
          position: [1050, 300],
          parameters: {
            httpMethod: 'POST',
            responseMode: 'responseNode',
            responseData: `{
              "success": true,
              "response": "{{ $json.response }}"
            }`
          }
        }
      ],
      connections: {
        'webhook-trigger': {
          main: [
            [
              {
                node: 'process-input',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'process-input': {
          main: [
            [
              {
                node: 'intent-router',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'intent-router': {
          main: [
            [
              {
                node: 'booking-handler',
                type: 'main',
                index: 0
              }
            ],
            [
              {
                node: 'info-handler',
                type: 'main',
                index: 0
              }
            ],
            [
              {
                node: 'send-response',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'booking-handler': {
          main: [
            [
              {
                node: 'save-to-db',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'save-to-db': {
          main: [
            [
              {
                node: 'send-confirmation',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'info-handler': {
          main: [
            [
              {
                node: 'send-response',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      },
      settings: {
        timezone: 'Europe/Berlin'
      }
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.config.apiKey
        },
        body: JSON.stringify(workflow)
      })

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`)
      }

      const result = await response.json()
      return result.id

    } catch (error) {
      console.error('Error creating n8n workflow:', error)
      throw error
    }
  }

  async activateWorkflow(workflowId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to activate workflow: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error activating workflow:', error)
      throw error
    }
  }

  async deactivateWorkflow(workflowId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/deactivate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to deactivate workflow: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deactivating workflow:', error)
      throw error
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      throw error
    }
  }

  async getWorkflowExecutions(workflowId: string, limit = 100): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/executions?workflowId=${workflowId}&limit=${limit}`,
        {
          headers: {
            'X-N8N-API-KEY': this.config.apiKey
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get executions: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting workflow executions:', error)
      throw error
    }
  }
}

// Factory function
export function createN8nWorkflowManager(): N8nWorkflowManager {
  const config: N8nConfig = {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY || ''
  }

  return new N8nWorkflowManager(config)
}