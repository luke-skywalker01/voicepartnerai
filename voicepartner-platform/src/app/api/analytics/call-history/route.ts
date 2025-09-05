import { NextRequest, NextResponse } from 'next/server'

// Mock Call History Response Structure
interface CallHistoryResponse {
  calls: CallLogEntry[]
  pagination: {
    total: number
    skip: number
    limit: number
    has_more: boolean
  }
  filters_applied: {
    status?: string
    assistant_id?: number
    phone_number_id?: number
    start_date?: string
    end_date?: string
    search?: string
  }
  total_calls: number
  total_duration_seconds: number
  total_credits_consumed: number
  summary_stats: {
    avg_duration: number
    total_credits: number
    success_rate: number
  }
}

interface CallLogEntry {
  id: number
  call_sid: string
  phone_number_id: number
  assistant_id?: number
  caller_number: string
  called_number: string
  direction: string
  start_time: string
  end_time?: string
  duration_seconds?: number
  billable_seconds?: number
  status: string
  hangup_cause?: string
  call_quality_score?: number
  ai_response_time_ms?: number
  ai_interruptions: number
  ai_confidence_avg?: number
  conversation_turns: number
  credits_consumed: number
  cost_usd?: number
  cost_eur?: number
  sentiment_score?: number
  intent_detected?: string
  customer_satisfaction?: number
  country_code?: string
  region?: string
  created_at: string
  assistant_name?: string
  phone_number?: string
}

// Extended Mock Data for Call History
const extendedMockCallLogs: CallLogEntry[] = [
  {
    id: 1,
    call_sid: 'CA123abc456def789',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+49 30 87654321',
    called_number: '+49 30 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 2 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
    duration_seconds: 240,
    billable_seconds: 235,
    status: 'completed',
    hangup_cause: 'completed-via-api',
    call_quality_score: 0.92,
    ai_response_time_ms: 850,
    ai_interruptions: 2,
    ai_confidence_avg: 0.89,
    conversation_turns: 8,
    credits_consumed: 4.0,
    cost_usd: 0.04,
    cost_eur: 0.037,
    sentiment_score: 0.75,
    intent_detected: 'appointment_booking',
    customer_satisfaction: 4,
    country_code: 'DE',
    region: 'Berlin',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    assistant_name: 'Terminbuchung Assistant',
    phone_number: '+49 30 12345678'
  },
  {
    id: 2,
    call_sid: 'CA789def012ghi345',
    phone_number_id: 2,
    assistant_id: 2,
    caller_number: '+49 89 98765432',
    called_number: '+49 89 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 1 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(),
    duration_seconds: 360,
    billable_seconds: 358,
    status: 'completed',
    hangup_cause: 'completed-via-api',
    call_quality_score: 0.88,
    ai_response_time_ms: 920,
    ai_interruptions: 1,
    ai_confidence_avg: 0.85,
    conversation_turns: 12,
    credits_consumed: 6.0,
    cost_usd: 0.06,
    cost_eur: 0.055,
    sentiment_score: 0.82,
    intent_detected: 'customer_support',
    customer_satisfaction: 5,
    country_code: 'DE',
    region: 'München',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    assistant_name: 'Kundenservice Bot',
    phone_number: '+49 89 12345678'
  },
  {
    id: 3,
    call_sid: 'CA345ghi678jkl901',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+1 555 123 4567',
    called_number: '+49 30 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    end_time: undefined,
    duration_seconds: undefined,
    billable_seconds: undefined,
    status: 'failed',
    hangup_cause: 'no-answer',
    call_quality_score: undefined,
    ai_response_time_ms: undefined,
    ai_interruptions: 0,
    ai_confidence_avg: undefined,
    conversation_turns: 0,
    credits_consumed: 0.1,
    cost_usd: 0.001,
    cost_eur: 0.0009,
    sentiment_score: undefined,
    intent_detected: undefined,
    customer_satisfaction: undefined,
    country_code: 'US',
    region: 'California',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    assistant_name: 'Terminbuchung Assistant',
    phone_number: '+49 30 12345678'
  },
  {
    id: 4,
    call_sid: 'CA567jkl890mno234',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+49 40 11223344',
    called_number: '+49 30 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 45 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
    duration_seconds: 120,
    billable_seconds: 118,
    status: 'completed',
    hangup_cause: 'completed-via-api',
    call_quality_score: 0.95,
    ai_response_time_ms: 720,
    ai_interruptions: 0,
    ai_confidence_avg: 0.92,
    conversation_turns: 4,
    credits_consumed: 2.0,
    cost_usd: 0.02,
    cost_eur: 0.018,
    sentiment_score: 0.68,
    intent_detected: 'information_request',
    customer_satisfaction: 4,
    country_code: 'DE',
    region: 'Hamburg',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    assistant_name: 'Terminbuchung Assistant',
    phone_number: '+49 30 12345678'
  },
  {
    id: 5,
    call_sid: 'CA890mno123pqr456',
    phone_number_id: 2,
    assistant_id: 2,
    caller_number: '+33 1 23456789',
    called_number: '+49 89 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 3 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    duration_seconds: 480,
    billable_seconds: 475,
    status: 'completed',
    hangup_cause: 'completed-via-api',
    call_quality_score: 0.86,
    ai_response_time_ms: 1050,
    ai_interruptions: 3,
    ai_confidence_avg: 0.81,
    conversation_turns: 15,
    credits_consumed: 8.0,
    cost_usd: 0.08,
    cost_eur: 0.074,
    sentiment_score: 0.45,
    intent_detected: 'complaint',
    customer_satisfaction: 3,
    country_code: 'FR',
    region: 'Paris',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    assistant_name: 'Kundenservice Bot',
    phone_number: '+49 89 12345678'
  },
  {
    id: 6,
    call_sid: 'CA234pqr567stu890',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+44 20 12345678',
    called_number: '+49 30 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 4 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    duration_seconds: 300,
    billable_seconds: 295,
    status: 'completed',
    hangup_cause: 'completed-via-api',
    call_quality_score: 0.91,
    ai_response_time_ms: 780,
    ai_interruptions: 1,
    ai_confidence_avg: 0.87,
    conversation_turns: 10,
    credits_consumed: 5.0,
    cost_usd: 0.05,
    cost_eur: 0.046,
    sentiment_score: 0.72,
    intent_detected: 'general_inquiry',
    customer_satisfaction: 4,
    country_code: 'GB',
    region: 'London',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    assistant_name: 'Terminbuchung Assistant',
    phone_number: '+49 30 12345678'
  },
  {
    id: 7,
    call_sid: 'CA678stu901vwx234',
    phone_number_id: 2,
    assistant_id: 2,
    caller_number: '+49 221 87654321',
    called_number: '+49 89 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    end_time: undefined,
    duration_seconds: undefined,
    billable_seconds: undefined,
    status: 'busy',
    hangup_cause: 'busy',
    call_quality_score: undefined,
    ai_response_time_ms: undefined,
    ai_interruptions: 0,
    ai_confidence_avg: undefined,
    conversation_turns: 0,
    credits_consumed: 0.1,
    cost_usd: 0.001,
    cost_eur: 0.0009,
    sentiment_score: undefined,
    intent_detected: undefined,
    customer_satisfaction: undefined,
    country_code: 'DE',
    region: 'Köln',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    assistant_name: 'Kundenservice Bot',
    phone_number: '+49 89 12345678'
  }
]

// GET - Call History with Filtering and Pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const assistant_id = searchParams.get('assistant_id') ? parseInt(searchParams.get('assistant_id')!) : undefined
    const phone_number_id = searchParams.get('phone_number_id') ? parseInt(searchParams.get('phone_number_id')!) : undefined
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const search = searchParams.get('search')
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Apply filters to mock data
    let filteredCalls = extendedMockCallLogs.slice()
    
    // Status filter
    if (status) {
      filteredCalls = filteredCalls.filter(call => call.status === status)
    }
    
    // Assistant filter
    if (assistant_id) {
      filteredCalls = filteredCalls.filter(call => call.assistant_id === assistant_id)
    }
    
    // Phone number filter
    if (phone_number_id) {
      filteredCalls = filteredCalls.filter(call => call.phone_number_id === phone_number_id)
    }
    
    // Date range filter
    if (start_date) {
      const startDateTime = new Date(start_date)
      filteredCalls = filteredCalls.filter(call => new Date(call.start_time) >= startDateTime)
    }
    
    if (end_date) {
      const endDateTime = new Date(end_date)
      filteredCalls = filteredCalls.filter(call => new Date(call.start_time) <= endDateTime)
    }
    
    // Search filter (caller number, called number, call sid)
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCalls = filteredCalls.filter(call => 
        call.caller_number.toLowerCase().includes(searchLower) ||
        call.called_number.toLowerCase().includes(searchLower) ||
        call.call_sid.toLowerCase().includes(searchLower) ||
        (call.assistant_name && call.assistant_name.toLowerCase().includes(searchLower))
      )
    }
    
    // Sort by start_time descending (newest first)
    filteredCalls.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    
    // Get total count before pagination
    const total_calls = filteredCalls.length
    
    // Apply pagination
    const paginatedCalls = filteredCalls.slice(skip, skip + limit)
    
    // Calculate summary statistics
    const total_duration_seconds = paginatedCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0)
    const total_credits_consumed = paginatedCalls.reduce((sum, call) => sum + call.credits_consumed, 0)
    const successful_calls = paginatedCalls.filter(call => call.status === 'completed').length
    
    const summary_stats = {
      avg_duration: paginatedCalls.length > 0 ? total_duration_seconds / paginatedCalls.length : 0,
      total_credits: total_credits_consumed,
      success_rate: paginatedCalls.length > 0 ? (successful_calls / paginatedCalls.length) * 100 : 0
    }
    
    const response: CallHistoryResponse = {
      calls: paginatedCalls,
      pagination: {
        total: total_calls,
        skip: skip,
        limit: limit,
        has_more: skip + limit < total_calls
      },
      filters_applied: {
        status,
        assistant_id,
        phone_number_id,
        start_date,
        end_date,
        search
      },
      total_calls,
      total_duration_seconds,
      total_credits_consumed,
      summary_stats
    }
    
    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error) {
    console.error('Call history error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch call history' },
      { status: 500 }
    )
  }
}