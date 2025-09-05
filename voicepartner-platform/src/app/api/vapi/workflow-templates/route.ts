import { NextRequest, NextResponse } from 'next/server'
import { WorkflowNode, WorkflowEdge } from '../workflows/route'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'customer-service' | 'sales' | 'lead-qualification' | 'appointment-booking' | 'support' | 'general'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedSetupTime: number // in minutes
  features: string[]
  tags: string[]
  preview: {
    nodes: number
    complexity: 'simple' | 'moderate' | 'complex'
    estimatedCalls: string
  }
  template: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    configuration: {
      entryPoint: string
      fallbackAssistant?: string
      timeout: number
      maxIterations: number
      errorHandling: 'continue' | 'halt' | 'fallback'
    }
    triggers: Array<{
      type: 'phone-call' | 'webhook' | 'schedule' | 'manual'
      config: any
    }>
  }
  customization: {
    required: Array<{
      field: string
      type: 'text' | 'select' | 'number' | 'boolean'
      label: string
      description: string
      options?: string[]
      default?: any
    }>
    optional: Array<{
      field: string
      type: 'text' | 'select' | 'number' | 'boolean'
      label: string
      description: string
      options?: string[]
      default?: any
    }>
  }
  requirements: {
    assistants: number
    phoneNumbers: number
    webhooks: number
    integrations: string[]
  }
  pricing: {
    estimatedCostPerCall: number
    currency: string
  }
  examples: Array<{
    title: string
    description: string
    inputExample: any
    expectedOutput: any
  }>
  createdAt: string
  updatedAt: string
  usageCount: number
  rating: number
  reviews: number
}

// Mock workflow templates
const generateWorkflowTemplates = (): WorkflowTemplate[] => {
  return [
    {
      id: 'template_customer_service',
      name: 'Customer Service Router',
      description: 'Intelligent customer service workflow that routes calls based on customer intent and escalates to human agents when needed.',
      category: 'customer-service',
      difficulty: 'beginner',
      estimatedSetupTime: 15,
      features: [
        'Intent Recognition',
        'Smart Routing',
        'Escalation Handling',
        'Call Recording',
        'Customer Satisfaction Survey'
      ],
      tags: ['customer-service', 'routing', 'escalation', 'satisfaction'],
      preview: {
        nodes: 8,
        complexity: 'moderate',
        estimatedCalls: '100-1000/month'
      },
      template: {
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Incoming Call',
              config: {
                type: 'phone-call',
                greeting: 'Thank you for calling our customer service. Please hold while I connect you to the right department.'
              }
            },
            outputs: [{ id: 'out1', type: 'default' }]
          },
          {
            id: 'intent_classifier',
            type: 'assistant',
            position: { x: 300, y: 100 },
            data: {
              label: 'Intent Classifier',
              config: {
                assistantId: 'intent_classifier',
                systemPrompt: 'You are an intent classification assistant. Listen to the customer and classify their request into one of: technical_support, billing, sales, general_inquiry. Respond with just the classification.',
                timeout: 15,
                maxRetries: 2
              }
            },
            inputs: [{ id: 'in1', type: 'default' }],
            outputs: [
              { id: 'technical', type: 'technical_support' },
              { id: 'billing', type: 'billing' },
              { id: 'sales', type: 'sales' },
              { id: 'general', type: 'general_inquiry' }
            ]
          },
          {
            id: 'technical_support',
            type: 'assistant',
            position: { x: 500, y: 50 },
            data: {
              label: 'Technical Support',
              config: {
                assistantId: 'tech_support',
                systemPrompt: 'You are a technical support specialist. Help customers with technical issues. If you cannot resolve the issue, offer to escalate to a human technician.',
                escalationKeywords: ['escalate', 'human', 'technician', 'manager'],
                maxDuration: 300
              }
            },
            inputs: [{ id: 'in1', type: 'technical_support' }],
            outputs: [
              { id: 'resolved', type: 'resolved' },
              { id: 'escalate', type: 'escalate' }
            ]
          },
          {
            id: 'billing_support',
            type: 'assistant',
            position: { x: 500, y: 150 },
            data: {
              label: 'Billing Support',
              config: {
                assistantId: 'billing_support',
                systemPrompt: 'You are a billing support specialist. Help customers with billing questions, payment issues, and account management.',
                secureDataHandling: true,
                complianceMode: true
              }
            },
            inputs: [{ id: 'in1', type: 'billing' }],
            outputs: [
              { id: 'resolved', type: 'resolved' },
              { id: 'escalate', type: 'escalate' }
            ]
          },
          {
            id: 'sales_assistant',
            type: 'assistant',
            position: { x: 500, y: 250 },
            data: {
              label: 'Sales Assistant',
              config: {
                assistantId: 'sales_assistant',
                systemPrompt: 'You are a sales representative. Help customers with product information, pricing, and guide them through the sales process.',
                leadCapture: true,
                crmIntegration: true
              }
            },
            inputs: [{ id: 'in1', type: 'sales' }],
            outputs: [
              { id: 'qualified', type: 'qualified_lead' },
              { id: 'info_provided', type: 'resolved' }
            ]
          },
          {
            id: 'escalation_handler',
            type: 'transfer',
            position: { x: 700, y: 150 },
            data: {
              label: 'Human Agent Transfer',
              config: {
                transferTo: 'human_agent_queue',
                holdMusic: true,
                estimatedWaitTime: true,
                transferMessage: 'I\'m transferring you to one of our specialists who can better assist you.'
              }
            },
            inputs: [{ id: 'in1', type: 'escalate' }],
            outputs: []
          },
          {
            id: 'satisfaction_survey',
            type: 'collect-input',
            position: { x: 700, y: 50 },
            data: {
              label: 'Satisfaction Survey',
              config: {
                question: 'On a scale of 1 to 5, how satisfied are you with the service you received today?',
                inputType: 'dtmf',
                validInputs: ['1', '2', '3', '4', '5'],
                timeout: 10,
                retries: 1
              }
            },
            inputs: [{ id: 'in1', type: 'resolved' }],
            outputs: [{ id: 'out1', type: 'survey_complete' }]
          },
          {
            id: 'end_call',
            type: 'hangup',
            position: { x: 900, y: 100 },
            data: {
              label: 'End Call',
              config: {
                message: 'Thank you for calling. Have a great day!',
                saveRecording: true,
                updateCRM: true
              }
            },
            inputs: [{ id: 'in1', type: 'survey_complete' }],
            outputs: []
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'intent_classifier', sourceHandle: 'out1', targetHandle: 'in1' },
          { id: 'e2', source: 'intent_classifier', target: 'technical_support', sourceHandle: 'technical', targetHandle: 'in1' },
          { id: 'e3', source: 'intent_classifier', target: 'billing_support', sourceHandle: 'billing', targetHandle: 'in1' },
          { id: 'e4', source: 'intent_classifier', target: 'sales_assistant', sourceHandle: 'sales', targetHandle: 'in1' },
          { id: 'e5', source: 'technical_support', target: 'escalation_handler', sourceHandle: 'escalate', targetHandle: 'in1' },
          { id: 'e6', source: 'billing_support', target: 'escalation_handler', sourceHandle: 'escalate', targetHandle: 'in1' },
          { id: 'e7', source: 'technical_support', target: 'satisfaction_survey', sourceHandle: 'resolved', targetHandle: 'in1' },
          { id: 'e8', source: 'billing_support', target: 'satisfaction_survey', sourceHandle: 'resolved', targetHandle: 'in1' },
          { id: 'e9', source: 'sales_assistant', target: 'satisfaction_survey', sourceHandle: 'info_provided', targetHandle: 'in1' },
          { id: 'e10', source: 'satisfaction_survey', target: 'end_call', sourceHandle: 'out1', targetHandle: 'in1' }
        ],
        configuration: {
          entryPoint: 'start',
          fallbackAssistant: 'general_support',
          timeout: 600,
          maxIterations: 20,
          errorHandling: 'fallback'
        },
        triggers: [
          {
            type: 'phone-call',
            config: {
              phoneNumbers: [],
              businessHours: {
                enabled: true,
                timezone: 'America/New_York',
                schedule: {
                  monday: { start: '08:00', end: '18:00' },
                  tuesday: { start: '08:00', end: '18:00' },
                  wednesday: { start: '08:00', end: '18:00' },
                  thursday: { start: '08:00', end: '18:00' },
                  friday: { start: '08:00', end: '18:00' }
                }
              }
            }
          }
        ]
      },
      customization: {
        required: [
          {
            field: 'phoneNumbers',
            type: 'select',
            label: 'Phone Numbers',
            description: 'Select which phone numbers should trigger this workflow',
            options: []
          },
          {
            field: 'businessHours',
            type: 'boolean',
            label: 'Enable Business Hours',
            description: 'Only handle calls during business hours',
            default: true
          }
        ],
        optional: [
          {
            field: 'recordCalls',
            type: 'boolean',
            label: 'Record Calls',
            description: 'Enable call recording for quality assurance',
            default: true
          },
          {
            field: 'surveyEnabled',
            type: 'boolean',
            label: 'Customer Satisfaction Survey',
            description: 'Ask customers to rate their experience',
            default: true
          },
          {
            field: 'escalationNumber',
            type: 'text',
            label: 'Escalation Phone Number',
            description: 'Phone number for human agent escalation',
            default: ''
          }
        ]
      },
      requirements: {
        assistants: 4,
        phoneNumbers: 1,
        webhooks: 0,
        integrations: ['CRM (optional)']
      },
      pricing: {
        estimatedCostPerCall: 0.15,
        currency: 'USD'
      },
      examples: [
        {
          title: 'Technical Support Call',
          description: 'Customer calls with a technical issue',
          inputExample: {
            phoneNumber: '+1-555-0123',
            customerMessage: 'Hi, I\'m having trouble logging into my account'
          },
          expectedOutput: {
            route: 'technical_support',
            resolution: 'Password reset instructions provided',
            satisfaction: 4,
            duration: 180
          }
        }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 1247,
      rating: 4.8,
      reviews: 156
    },
    {
      id: 'template_appointment_booking',
      name: 'Appointment Booking System',
      description: 'Automated appointment booking workflow with calendar integration, confirmation, and reminder capabilities.',
      category: 'appointment-booking',
      difficulty: 'intermediate',
      estimatedSetupTime: 25,
      features: [
        'Calendar Integration',
        'Availability Checking',
        'Appointment Confirmation',
        'SMS/Email Reminders',
        'Rescheduling Support'
      ],
      tags: ['appointments', 'booking', 'calendar', 'reminders'],
      preview: {
        nodes: 12,
        complexity: 'complex',
        estimatedCalls: '50-500/month'
      },
      template: {
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Booking Request',
              config: {
                type: 'phone-call',
                greeting: 'Hello! I can help you schedule an appointment. Let me check our availability.'
              }
            },
            outputs: [{ id: 'out1', type: 'default' }]
          },
          {
            id: 'appointment_assistant',
            type: 'assistant',
            position: { x: 300, y: 100 },
            data: {
              label: 'Booking Assistant',
              config: {
                assistantId: 'booking_assistant',
                systemPrompt: 'You are an appointment booking assistant. Help customers schedule appointments by asking for their preferred date, time, and service type. Be friendly and efficient.',
                collectInfo: ['preferredDate', 'preferredTime', 'serviceType', 'customerName', 'customerPhone']
              }
            },
            inputs: [{ id: 'in1', type: 'default' }],
            outputs: [
              { id: 'info_collected', type: 'info_collected' },
              { id: 'needs_help', type: 'needs_help' }
            ]
          },
          {
            id: 'availability_check',
            type: 'webhook',
            position: { x: 500, y: 100 },
            data: {
              label: 'Check Availability',
              config: {
                webhookUrl: 'https://api.calendar.com/check-availability',
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer {{CALENDAR_API_KEY}}',
                  'Content-Type': 'application/json'
                },
                timeout: 10
              }
            },
            inputs: [{ id: 'in1', type: 'info_collected' }],
            outputs: [
              { id: 'available', type: 'slot_available' },
              { id: 'unavailable', type: 'slot_unavailable' }
            ]
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'appointment_assistant', sourceHandle: 'out1', targetHandle: 'in1' },
          { id: 'e2', source: 'appointment_assistant', target: 'availability_check', sourceHandle: 'info_collected', targetHandle: 'in1' }
        ],
        configuration: {
          entryPoint: 'start',
          timeout: 300,
          maxIterations: 15,
          errorHandling: 'fallback'
        },
        triggers: [
          {
            type: 'phone-call',
            config: {
              phoneNumbers: [],
              businessHours: {
                enabled: true,
                timezone: 'America/New_York'
              }
            }
          }
        ]
      },
      customization: {
        required: [
          {
            field: 'calendarApiKey',
            type: 'text',
            label: 'Calendar API Key',
            description: 'API key for your calendar system integration'
          },
          {
            field: 'businessName',
            type: 'text',
            label: 'Business Name',
            description: 'Name of your business for appointment confirmations'
          }
        ],
        optional: [
          {
            field: 'reminderTime',
            type: 'number',
            label: 'Reminder Time (hours)',
            description: 'How many hours before appointment to send reminder',
            default: 24
          },
          {
            field: 'allowRescheduling',
            type: 'boolean',
            label: 'Allow Rescheduling',
            description: 'Allow customers to reschedule appointments',
            default: true
          }
        ]
      },
      requirements: {
        assistants: 2,
        phoneNumbers: 1,
        webhooks: 2,
        integrations: ['Calendar API', 'SMS/Email Service']
      },
      pricing: {
        estimatedCostPerCall: 0.25,
        currency: 'USD'
      },
      examples: [
        {
          title: 'New Appointment Booking',
          description: 'Customer calls to book a new appointment',
          inputExample: {
            customerMessage: 'I need to schedule a haircut for next Tuesday morning'
          },
          expectedOutput: {
            appointmentBooked: true,
            date: '2024-01-16',
            time: '10:00',
            service: 'haircut',
            confirmationSent: true
          }
        }
      ],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 487,
      rating: 4.6,
      reviews: 73
    },
    {
      id: 'template_lead_qualification',
      name: 'Lead Qualification & Scoring',
      description: 'Intelligent lead qualification workflow that scores prospects based on budget, timeline, and decision-making authority.',
      category: 'lead-qualification',
      difficulty: 'advanced',
      estimatedSetupTime: 35,
      features: [
        'BANT Qualification',
        'Lead Scoring',
        'CRM Integration',
        'Hot Lead Alerts',
        'Follow-up Scheduling'
      ],
      tags: ['lead-gen', 'qualification', 'scoring', 'sales'],
      preview: {
        nodes: 15,
        complexity: 'complex',
        estimatedCalls: '200-1000/month'
      },
      template: {
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Lead Call',
              config: {
                type: 'phone-call',
                greeting: 'Thank you for your interest in our products. I\'d like to ask a few questions to better understand your needs.'
              }
            },
            outputs: [{ id: 'out1', type: 'default' }]
          }
        ],
        edges: [],
        configuration: {
          entryPoint: 'start',
          timeout: 600,
          maxIterations: 25,
          errorHandling: 'continue'
        },
        triggers: [
          {
            type: 'phone-call',
            config: {
              phoneNumbers: []
            }
          }
        ]
      },
      customization: {
        required: [
          {
            field: 'crmWebhook',
            type: 'text',
            label: 'CRM Webhook URL',
            description: 'Webhook URL to send qualified leads to your CRM'
          },
          {
            field: 'qualificationCriteria',
            type: 'select',
            label: 'Qualification Framework',
            description: 'Choose your lead qualification framework',
            options: ['BANT', 'MEDDIC', 'GPCTBA/C&I', 'Custom'],
            default: 'BANT'
          }
        ],
        optional: [
          {
            field: 'hotLeadThreshold',
            type: 'number',
            label: 'Hot Lead Score Threshold',
            description: 'Score threshold for hot lead alerts (0-100)',
            default: 80
          }
        ]
      },
      requirements: {
        assistants: 3,
        phoneNumbers: 1,
        webhooks: 2,
        integrations: ['CRM', 'Email Marketing', 'Sales Team Notifications']
      },
      pricing: {
        estimatedCostPerCall: 0.35,
        currency: 'USD'
      },
      examples: [
        {
          title: 'High-Quality Lead',
          description: 'Prospect with high budget and immediate timeline',
          inputExample: {
            budget: 50000,
            timeline: 'immediate',
            authority: 'decision_maker'
          },
          expectedOutput: {
            leadScore: 95,
            qualification: 'hot_lead',
            nextAction: 'immediate_sales_call',
            priority: 'high'
          }
        }
      ],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 234,
      rating: 4.9,
      reviews: 41
    }
  ]
}

// GET /api/vapi/workflow-templates - List all workflow templates
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const difficulty = url.searchParams.get('difficulty')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search')
    
    let templates = generateWorkflowTemplates()
    
    // Apply filters
    if (category) {
      templates = templates.filter(t => t.category === category)
    }
    
    if (difficulty) {
      templates = templates.filter(t => t.difficulty === difficulty)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }
    
    // Apply pagination
    const paginatedTemplates = templates.slice(offset, offset + limit)
    
    return NextResponse.json({
      templates: paginatedTemplates,
      pagination: {
        total: templates.length,
        limit,
        offset,
        hasMore: offset + limit < templates.length
      },
      categories: [
        'customer-service',
        'sales',
        'lead-qualification',
        'appointment-booking',
        'support',
        'general'
      ],
      difficulties: ['beginner', 'intermediate', 'advanced']
    })
  } catch (error) {
    console.error('Error fetching workflow templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/workflow-templates - Create workflow from template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, customization, workflowName } = body
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }
    
    const templates = generateWorkflowTemplates()
    const template = templates.find(t => t.id === templateId)
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Apply customizations to template
    const customizedWorkflow = {
      id: `workflow_${Date.now()}`,
      orgId: 'org_default',
      name: workflowName || `${template.name} - Copy`,
      description: template.description,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: template.template.nodes.map(node => ({
        ...node,
        id: `${node.id}_${Math.random().toString(36).substr(2, 6)}` // Generate unique IDs
      })),
      edges: template.template.edges,
      configuration: template.template.configuration,
      metadata: {
        version: '1.0.0',
        tags: template.tags,
        category: template.category,
        author: 'user',
        templateId: template.id,
        templateVersion: '1.0.0'
      },
      usage: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      },
      triggers: template.template.triggers,
      customization: customization || {}
    }
    
    return NextResponse.json({
      workflow: customizedWorkflow,
      message: 'Workflow created successfully from template'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow from template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}