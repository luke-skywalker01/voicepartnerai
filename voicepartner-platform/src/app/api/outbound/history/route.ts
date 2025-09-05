import { NextRequest, NextResponse } from 'next/server'

// Mock Outbound Call History Data
const mockOutboundCalls = [
  {
    id: 1,
    call_sid: 'CA123abc456def789out',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+49 30 12345678', // FROM (our number)
    called_number: '+49 171 1234567', // TO (target number)
    direction: 'outbound',
    start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 1 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
    duration_seconds: 180,
    status: 'completed',
    credits_consumed: 3.6,
    cost_usd: 0.036,
    cost_eur: 0.033,
    call_quality_score: 0.91,
    ai_response_time_ms: 780,
    assistant_name: 'Terminbuchung Assistant',
    phone_number: '+49 30 12345678',
    context_data: { campaign: 'appointment_reminder', customer_id: 'cust_123' },
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    call_sid: 'CA789def012ghi345out',
    phone_number_id: 2,
    assistant_id: 2,
    caller_number: '+49 89 98765432',
    called_number: '+49 175 9876543',
    direction: 'outbound',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    end_time: null,
    duration_seconds: null,
    status: 'failed',
    credits_consumed: 0.1,
    cost_usd: 0.001,
    cost_eur: 0.0009,
    call_quality_score: null,
    ai_response_time_ms: null,
    assistant_name: 'Kundenservice Bot',
    phone_number: '+49 89 98765432',
    context_data: { campaign: 'customer_followup', ticket_id: 'tick_456' },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    call_sid: 'CA345ghi678jkl901out',
    phone_number_id: 1,
    assistant_id: 3,
    caller_number: '+49 30 12345678',
    called_number: '+49 160 1111222',
    direction: 'outbound',
    start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 3 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(),
    duration_seconds: 420,
    status: 'completed',
    credits_consumed: 8.4,
    cost_usd: 0.084,
    cost_eur: 0.077,
    call_quality_score: 0.88,
    ai_response_time_ms: 920,
    assistant_name: 'Verkaufs Assistant',
    phone_number: '+49 30 12345678',
    context_data: { campaign: 'sales_outreach', lead_id: 'lead_789' },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    call_sid: 'CA567jkl890mno234out',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+49 30 12345678',
    called_number: '+49 152 3334455',
    direction: 'outbound',
    start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 4 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
    duration_seconds: 120,
    status: 'completed',
    credits_consumed: 2.4,
    cost_usd: 0.024,
    cost_eur: 0.022,
    call_quality_score: 0.94,
    ai_response_time_ms: 650,
    assistant_name: 'Terminbuchung Assistant',
    phone_number: '+49 30 12345678',
    context_data: { campaign: 'appointment_confirmation', appointment_id: 'apt_321' },
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    call_sid: 'CA890mno123pqr456out',
    phone_number_id: 2,
    assistant_id: 2,
    caller_number: '+49 89 98765432',
    called_number: '+49 177 7778899',
    direction: 'outbound',
    start_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    end_time: null,
    duration_seconds: null,
    status: 'busy',
    credits_consumed: 0.1,
    cost_usd: 0.001,
    cost_eur: 0.0009,
    call_quality_score: null,
    ai_response_time_ms: null,
    assistant_name: 'Kundenservice Bot',
    phone_number: '+49 89 98765432',
    context_data: { campaign: 'support_callback', case_id: 'case_654' },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 6,
    call_sid: 'CA234pqr567stu890out',
    phone_number_id: 1,
    assistant_id: 3,
    caller_number: '+49 30 12345678',
    called_number: '+41 79 1234567', // Switzerland
    direction: 'outbound',
    start_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    duration_seconds: 300,
    status: 'completed',
    credits_consumed: 6.0,
    cost_usd: 0.06,
    cost_eur: 0.055,
    call_quality_score: 0.85,
    ai_response_time_ms: 1100,
    assistant_name: 'Verkaufs Assistant',
    phone_number: '+49 30 12345678',
    context_data: { campaign: 'international_outreach', region: 'DACH' },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
]

// GET - Outbound Call History with Filtering and Pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const assistant_id = searchParams.get('assistant_id') ? parseInt(searchParams.get('assistant_id')!) : undefined
    const phone_number_id = searchParams.get('phone_number_id') ? parseInt(searchParams.get('phone_number_id')!) : undefined
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const search = searchParams.get('search')
    const campaign = searchParams.get('campaign')
    
    // Apply filters to mock data
    let filteredCalls = mockOutboundCalls.slice()
    
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
    
    // Search filter (target number, call sid, campaign)
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCalls = filteredCalls.filter(call => 
        call.called_number.toLowerCase().includes(searchLower) ||
        call.call_sid.toLowerCase().includes(searchLower) ||
        (call.assistant_name && call.assistant_name.toLowerCase().includes(searchLower)) ||
        (call.context_data?.campaign && call.context_data.campaign.toLowerCase().includes(searchLower))
      )
    }
    
    // Campaign filter
    if (campaign) {
      filteredCalls = filteredCalls.filter(call => 
        call.context_data?.campaign === campaign
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
    const failed_calls = paginatedCalls.filter(call => call.status === 'failed').length
    const busy_calls = paginatedCalls.filter(call => call.status === 'busy').length
    
    // Campaign statistics
    const campaignStats: Record<string, number> = {}
    paginatedCalls.forEach(call => {
      if (call.context_data?.campaign) {
        campaignStats[call.context_data.campaign] = (campaignStats[call.context_data.campaign] || 0) + 1
      }
    })
    
    const summary_stats = {
      avg_duration: paginatedCalls.length > 0 ? total_duration_seconds / paginatedCalls.length : 0,
      total_credits: total_credits_consumed,
      success_rate: paginatedCalls.length > 0 ? (successful_calls / paginatedCalls.length) * 100 : 0,
      completion_rate: paginatedCalls.length > 0 ? ((successful_calls + failed_calls + busy_calls) / paginatedCalls.length) * 100 : 0,
      avg_cost_per_call: paginatedCalls.length > 0 ? paginatedCalls.reduce((sum, call) => sum + (call.cost_eur || 0), 0) / paginatedCalls.length : 0,
      campaign_breakdown: campaignStats
    }
    
    const response = {
      calls: paginatedCalls,
      pagination: {
        total: total_calls,
        skip: skip,
        limit: limit,
        has_more: skip + limit < total_calls,
        current_page: Math.floor(skip / limit) + 1,
        total_pages: Math.ceil(total_calls / limit)
      },
      filters_applied: {
        status,
        assistant_id,
        phone_number_id,
        start_date,
        end_date,
        search,
        campaign
      },
      total_outbound_calls: total_calls,
      total_duration_seconds,
      total_credits_consumed,
      summary_stats
    }
    
    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error) {
    console.error('Outbound call history error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outbound call history' },
      { status: 500 }
    )
  }
}