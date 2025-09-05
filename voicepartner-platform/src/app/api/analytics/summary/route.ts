import { NextRequest, NextResponse } from 'next/server'

// Mock Analytics Summary Data Structure
interface AnalyticsSummary {
  period_start: string
  period_end: string
  period_type: string
  total_calls: number
  successful_calls: number
  failed_calls: number
  abandoned_calls: number
  success_rate: number
  total_duration_seconds: number
  total_duration_minutes: number
  total_duration_hours: number
  avg_duration_seconds: number
  min_duration_seconds: number
  max_duration_seconds: number
  total_credits_consumed: number
  total_cost_usd: number
  total_cost_eur: number
  avg_cost_per_call: number
  cost_per_minute: number
  avg_quality_score?: number
  avg_ai_response_time_ms?: number
  avg_ai_confidence?: number
  avg_customer_satisfaction?: number
  top_assistant?: {
    id: string
    name: string
    calls: number
  }
  top_phone_number?: {
    id: string
    number: string
    calls: number
  }
  top_country?: string
  calls_change_percent?: number
  duration_change_percent?: number
  cost_change_percent?: number
  quality_change_percent?: number
}

// Mock Call Logs Data (in production, this comes from database)
const mockCallLogs = [
  {
    id: 1,
    call_sid: 'CA123abc456def789',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+49 30 87654321',
    called_number: '+49 30 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    end_time: new Date(Date.now() - 2 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(), // 4 min call
    duration_seconds: 240,
    status: 'completed',
    credits_consumed: 4.0,
    cost_usd: 0.04,
    cost_eur: 0.037,
    call_quality_score: 0.92,
    ai_response_time_ms: 850,
    ai_confidence_avg: 0.89,
    customer_satisfaction: 4,
    country_code: 'DE',
    assistant_name: 'Terminbuchung Assistant'
  },
  {
    id: 2,
    call_sid: 'CA789def012ghi345',
    phone_number_id: 2,
    assistant_id: 2,
    caller_number: '+49 89 98765432',
    called_number: '+49 89 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    end_time: new Date(Date.now() - 1 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(), // 6 min call
    duration_seconds: 360,
    status: 'completed',
    credits_consumed: 6.0,
    cost_usd: 0.06,
    cost_eur: 0.055,
    call_quality_score: 0.88,
    ai_response_time_ms: 920,
    ai_confidence_avg: 0.85,
    customer_satisfaction: 5,
    country_code: 'DE',
    assistant_name: 'Kundenservice Bot'
  },
  {
    id: 3,
    call_sid: 'CA345ghi678jkl901',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+1 555 123 4567',
    called_number: '+49 30 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    end_time: null, // Call failed
    duration_seconds: null,
    status: 'failed',
    credits_consumed: 0.1, // Minimal charge for failed call
    cost_usd: 0.001,
    cost_eur: 0.0009,
    call_quality_score: null,
    ai_response_time_ms: null,
    ai_confidence_avg: null,
    customer_satisfaction: null,
    country_code: 'US',
    assistant_name: 'Terminbuchung Assistant'
  },
  {
    id: 4,
    call_sid: 'CA567jkl890mno234',
    phone_number_id: 1,
    assistant_id: 1,
    caller_number: '+49 40 11223344',
    called_number: '+49 30 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    end_time: new Date(Date.now() - 45 * 60 * 1000 + 2 * 60 * 1000).toISOString(), // 2 min call
    duration_seconds: 120,
    status: 'completed',
    credits_consumed: 2.0,
    cost_usd: 0.02,
    cost_eur: 0.018,
    call_quality_score: 0.95,
    ai_response_time_ms: 720,
    ai_confidence_avg: 0.92,
    customer_satisfaction: 4,
    country_code: 'DE',
    assistant_name: 'Terminbuchung Assistant'
  },
  {
    id: 5,
    call_sid: 'CA890mno123pqr456',
    phone_number_id: 2,
    assistant_id: 2,
    caller_number: '+33 1 23456789',
    called_number: '+49 89 12345678',
    direction: 'inbound',
    start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    end_time: new Date(Date.now() - 3 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), // 8 min call
    duration_seconds: 480,
    status: 'completed',
    credits_consumed: 8.0,
    cost_usd: 0.08,
    cost_eur: 0.074,
    call_quality_score: 0.86,
    ai_response_time_ms: 1050,
    ai_confidence_avg: 0.81,
    customer_satisfaction: 3,
    country_code: 'FR',
    assistant_name: 'Kundenservice Bot'
  }
]

// GET - Analytics Summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Determine time period
    const now = new Date()
    let period_start: Date
    let period_end: Date = now
    
    if (period === 'today') {
      period_start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
      period_start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      period_start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (period === 'custom' && start_date && end_date) {
      period_start = new Date(start_date)
      period_end = new Date(end_date)
    } else {
      period_start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)  // default to week
    }
    
    // Filter mock calls by time period
    const filteredCalls = mockCallLogs.filter(call => {
      const callTime = new Date(call.start_time)
      return callTime >= period_start && callTime <= period_end
    })
    
    if (filteredCalls.length === 0) {
      // Return empty summary
      const summary: AnalyticsSummary = {
        period_start: period_start.toISOString(),
        period_end: period_end.toISOString(),
        period_type: period,
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        abandoned_calls: 0,
        success_rate: 0,
        total_duration_seconds: 0,
        total_duration_minutes: 0,
        total_duration_hours: 0,
        avg_duration_seconds: 0,
        min_duration_seconds: 0,
        max_duration_seconds: 0,
        total_credits_consumed: 0,
        total_cost_usd: 0,
        total_cost_eur: 0,
        avg_cost_per_call: 0,
        cost_per_minute: 0
      }
      
      return NextResponse.json({
        success: true,
        data: summary
      })
    }
    
    // Calculate metrics
    const total_calls = filteredCalls.length
    const successful_calls = filteredCalls.filter(c => c.status === 'completed').length
    const failed_calls = filteredCalls.filter(c => c.status === 'failed').length
    const abandoned_calls = filteredCalls.filter(c => c.status === 'canceled').length
    const success_rate = (successful_calls / total_calls) * 100
    
    // Duration metrics
    const durations = filteredCalls.filter(c => c.duration_seconds).map(c => c.duration_seconds!)
    const total_duration_seconds = durations.reduce((sum, d) => sum + d, 0)
    const total_duration_minutes = total_duration_seconds / 60
    const total_duration_hours = total_duration_minutes / 60
    const avg_duration_seconds = durations.length > 0 ? total_duration_seconds / durations.length : 0
    const min_duration_seconds = durations.length > 0 ? Math.min(...durations) : 0
    const max_duration_seconds = durations.length > 0 ? Math.max(...durations) : 0
    
    // Financial metrics
    const total_credits_consumed = filteredCalls.reduce((sum, c) => sum + c.credits_consumed, 0)
    const total_cost_usd = filteredCalls.reduce((sum, c) => sum + c.cost_usd, 0)
    const total_cost_eur = filteredCalls.reduce((sum, c) => sum + c.cost_eur, 0)
    const avg_cost_per_call = total_calls > 0 ? total_cost_eur / total_calls : 0
    const cost_per_minute = total_duration_minutes > 0 ? total_cost_eur / total_duration_minutes : 0
    
    // Quality metrics
    const qualityScores = filteredCalls.filter(c => c.call_quality_score).map(c => c.call_quality_score!)
    const avg_quality_score = qualityScores.length > 0 ? qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length : undefined
    
    const responseTimes = filteredCalls.filter(c => c.ai_response_time_ms).map(c => c.ai_response_time_ms!)
    const avg_ai_response_time_ms = responseTimes.length > 0 ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length : undefined
    
    const confidences = filteredCalls.filter(c => c.ai_confidence_avg).map(c => c.ai_confidence_avg!)
    const avg_ai_confidence = confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : undefined
    
    const satisfactionScores = filteredCalls.filter(c => c.customer_satisfaction).map(c => c.customer_satisfaction!)
    const avg_customer_satisfaction = satisfactionScores.length > 0 ? satisfactionScores.reduce((sum, s) => sum + s, 0) / satisfactionScores.length : undefined
    
    // Top performers
    const assistantCalls: Record<string, number> = {}
    const assistantNames: Record<string, string> = {}
    
    filteredCalls.forEach(call => {
      if (call.assistant_id) {
        const id = call.assistant_id.toString()
        assistantCalls[id] = (assistantCalls[id] || 0) + 1
        assistantNames[id] = call.assistant_name || `Assistant ${id}`
      }
    })
    
    const top_assistant = Object.keys(assistantCalls).length > 0 ? {
      id: Object.keys(assistantCalls).reduce((a, b) => assistantCalls[a] > assistantCalls[b] ? a : b),
      name: '',
      calls: 0
    } : undefined
    
    if (top_assistant) {
      top_assistant.name = assistantNames[top_assistant.id]
      top_assistant.calls = assistantCalls[top_assistant.id]
    }
    
    // Top country
    const countryCalls: Record<string, number> = {}
    filteredCalls.forEach(call => {
      if (call.country_code) {
        countryCalls[call.country_code] = (countryCalls[call.country_code] || 0) + 1
      }
    })
    
    const top_country = Object.keys(countryCalls).length > 0 ? 
      Object.keys(countryCalls).reduce((a, b) => countryCalls[a] > countryCalls[b] ? a : b) : undefined
    
    // Calculate change percentages (mock data for comparison)
    const calls_change_percent = 12.5  // +12.5% vs previous period
    const duration_change_percent = -3.2  // -3.2% vs previous period
    const cost_change_percent = 8.7  // +8.7% vs previous period
    const quality_change_percent = 2.1  // +2.1% vs previous period
    
    const summary: AnalyticsSummary = {
      period_start: period_start.toISOString(),
      period_end: period_end.toISOString(),
      period_type: period,
      total_calls,
      successful_calls,
      failed_calls,
      abandoned_calls,
      success_rate,
      total_duration_seconds,
      total_duration_minutes,
      total_duration_hours,
      avg_duration_seconds,
      min_duration_seconds,
      max_duration_seconds,
      total_credits_consumed,
      total_cost_usd,
      total_cost_eur,
      avg_cost_per_call,
      cost_per_minute,
      avg_quality_score,
      avg_ai_response_time_ms,
      avg_ai_confidence,
      avg_customer_satisfaction,
      top_assistant,
      top_country,
      calls_change_percent,
      duration_change_percent,
      cost_change_percent,
      quality_change_percent
    }
    
    return NextResponse.json({
      success: true,
      data: summary
    })
    
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics summary' },
      { status: 500 }
    )
  }
}