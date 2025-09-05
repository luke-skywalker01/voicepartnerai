import { NextRequest, NextResponse } from 'next/server'

// Outbound Call Request Interface
interface OutboundCallRequest {
  phone_number_to_call: string
  assistant_id: number
  phone_number_id?: number
  priority?: string
  scheduled_time?: string
  context_data?: Record<string, any>
  max_duration_minutes?: number
}

// Outbound Call Response Interface
interface OutboundCallResponse {
  call_id: string
  call_sid: string
  status: string
  phone_number_to_call: string
  phone_number_from: string
  assistant_id: number
  estimated_credits: number
  created_at: string
  message: string
}

// Mock Assistants Data
const mockAssistants = [
  {
    id: 1,
    name: 'Terminbuchung Assistant',
    description: 'Spezialist für Terminvereinbarungen',
    is_active: true
  },
  {
    id: 2,
    name: 'Kundenservice Bot',
    description: 'Allgemeiner Kundenservice',
    is_active: true
  },
  {
    id: 3,
    name: 'Verkaufs Assistant',
    description: 'Verkaufsgespräche und Beratung',
    is_active: true
  }
]

// Mock Phone Numbers
const mockPhoneNumbers = [
  {
    id: 1,
    phone_number: '+49 30 12345678',
    friendly_name: 'Berlin Hauptnummer',
    status: 'active'
  },
  {
    id: 2,
    phone_number: '+49 89 98765432',
    friendly_name: 'München Office',
    status: 'active'
  }
]

// POST - Start Outbound Call
export async function POST(request: NextRequest) {
  try {
    const body: OutboundCallRequest = await request.json()
    
    // Validate required fields
    if (!body.phone_number_to_call || !body.assistant_id) {
      return NextResponse.json(
        { success: false, error: 'phone_number_to_call and assistant_id are required' },
        { status: 400 }
      )
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(body.phone_number_to_call.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }
    
    // Validate assistant exists and is active
    const assistant = mockAssistants.find(a => a.id === body.assistant_id && a.is_active)
    if (!assistant) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found or not active' },
        { status: 400 }
      )
    }
    
    // Get phone number to call from
    let phoneNumberFrom = mockPhoneNumbers[0] // Default to first number
    if (body.phone_number_id) {
      const foundPhone = mockPhoneNumbers.find(p => p.id === body.phone_number_id && p.status === 'active')
      if (foundPhone) {
        phoneNumberFrom = foundPhone
      }
    }
    
    // Mock credit check
    const currentCredits = 45.5
    const estimatedCost = (body.max_duration_minutes || 5) * 1.2 // 1.2 credits per minute
    
    if (currentCredits < estimatedCost) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient credits. Need ${estimatedCost.toFixed(1)}, have ${currentCredits.toFixed(1)}` 
        },
        { status: 400 }
      )
    }
    
    // Generate mock call identifiers
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const callSid = `CA${Math.random().toString(36).substr(2, 32)}`
    
    // Simulate call initiation delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock call initiation logic
    const callStatuses = ['queued', 'initiated', 'failed']
    const randomStatus = callStatuses[Math.floor(Math.random() * callStatuses.length)]
    
    let message: string
    if (randomStatus === 'failed') {
      message = `Failed to initiate call to ${body.phone_number_to_call}: Network error`
    } else {
      message = `Outbound call ${randomStatus} successfully to ${body.phone_number_to_call}`
    }
    
    const response: OutboundCallResponse = {
      call_id: callId,
      call_sid: callSid,
      status: randomStatus,
      phone_number_to_call: body.phone_number_to_call,
      phone_number_from: phoneNumberFrom.phone_number,
      assistant_id: body.assistant_id,
      estimated_credits: estimatedCost,
      created_at: new Date().toISOString(),
      message: message
    }
    
    // Log the outbound call attempt
    console.log(`[OUTBOUND CALL] ${callSid}: ${phoneNumberFrom.phone_number} -> ${body.phone_number_to_call} (${assistant.name})`)
    
    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error) {
    console.error('Outbound call start error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start outbound call' },
      { status: 500 }
    )
  }
}

// GET - Get available assistants and phone numbers for outbound calls
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        assistants: mockAssistants.filter(a => a.is_active),
        phone_numbers: mockPhoneNumbers.filter(p => p.status === 'active'),
        credit_info: {
          current_credits: 45.5,
          monthly_limit: 100.0,
          cost_per_minute: 1.2
        }
      }
    })
  } catch (error) {
    console.error('Failed to get outbound call options:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get call options' },
      { status: 500 }
    )
  }
}