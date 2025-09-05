import { NextRequest, NextResponse } from 'next/server'

// Mock analytics data generator
const generateAnalyticsData = (range: string) => {
  const now = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  
  const data: any = {
    summary: {
      totalCalls: Math.floor(Math.random() * 5000) + 1000,
      totalDuration: Math.floor(Math.random() * 50000) + 10000, // in seconds
      avgDuration: Math.floor(Math.random() * 300) + 60, // in seconds
      successRate: (Math.random() * 20 + 75).toFixed(1), // 75-95%
      totalCost: (Math.random() * 500 + 100).toFixed(2),
      activeBots: Math.floor(Math.random() * 20) + 5
    },
    callsByDay: [],
    callsByHour: [],
    topBots: [
      { id: '1', name: 'Kundenservice Bot', calls: 1247, duration: 15680, successRate: 94.2 },
      { id: '2', name: 'Terminbuchung', calls: 892, duration: 8934, successRate: 98.1 },
      { id: '3', name: 'Sales Qualifier', calls: 567, duration: 12450, successRate: 87.5 }
    ],
    sentimentAnalysis: {
      positive: Math.floor(Math.random() * 30) + 50,
      neutral: Math.floor(Math.random() * 25) + 20,
      negative: Math.floor(Math.random() * 15) + 5
    },
    commonIntents: [
      { intent: 'appointment_booking', count: 456, percentage: 35.2 },
      { intent: 'product_inquiry', count: 287, percentage: 22.1 },
      { intent: 'support_request', count: 198, percentage: 15.3 },
      { intent: 'billing_question', count: 156, percentage: 12.0 },
      { intent: 'general_inquiry', count: 134, percentage: 10.3 }
    ],
    geographicData: [
      { region: 'Berlin', calls: 345, percentage: 28.5 },
      { region: 'München', calls: 289, percentage: 23.8 },
      { region: 'Hamburg', calls: 234, percentage: 19.3 },
      { region: 'Köln', calls: 189, percentage: 15.6 },
      { region: 'Frankfurt', calls: 156, percentage: 12.8 }
    ],
    costBreakdown: {
      sttCost: (Math.random() * 50 + 20).toFixed(2),
      llmCost: (Math.random() * 150 + 80).toFixed(2),
      ttsCost: (Math.random() * 75 + 30).toFixed(2),
      telephonyCost: (Math.random() * 200 + 100).toFixed(2)
    },
    performanceMetrics: {
      avgResponseTime: (Math.random() * 2 + 0.5).toFixed(2), // seconds
      errorRate: (Math.random() * 3).toFixed(2), // percentage
      uptime: (99 + Math.random()).toFixed(2), // percentage
      concurrentCalls: Math.floor(Math.random() * 50) + 10
    }
  }

  // Generate daily data
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    data.callsByDay.push({
      date: date.toISOString().split('T')[0],
      calls: Math.floor(Math.random() * 100) + 20,
      duration: Math.floor(Math.random() * 5000) + 1000,
      cost: (Math.random() * 50 + 10).toFixed(2)
    })
  }

  // Generate hourly data for last 24 hours
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000).getHours()
    data.callsByHour.push({
      hour: hour,
      calls: Math.floor(Math.random() * 25) + 5,
      avgDuration: Math.floor(Math.random() * 200) + 60
    })
  }

  return data
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '7d' // 7d, 30d, 90d
    const botId = url.searchParams.get('botId')
    const metric = url.searchParams.get('metric') // specific metric
    
    if (metric) {
      // Return specific metric data
      const metricData = {
        calls: generateAnalyticsData(range).summary.totalCalls,
        duration: generateAnalyticsData(range).summary.totalDuration,
        cost: generateAnalyticsData(range).summary.totalCost,
        successRate: generateAnalyticsData(range).summary.successRate
      }
      
      return NextResponse.json({
        success: true,
        data: metricData[metric as keyof typeof metricData] || null,
        metric,
        range
      })
    }

    let analyticsData = generateAnalyticsData(range)

    // Filter by bot ID if specified
    if (botId) {
      const bot = analyticsData.topBots.find((b: any) => b.id === botId)
      if (bot) {
        analyticsData = {
          ...analyticsData,
          summary: {
            ...analyticsData.summary,
            totalCalls: bot.calls,
            totalDuration: bot.duration,
            successRate: bot.successRate.toString()
          },
          topBots: [bot]
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      range,
      botId,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Custom analytics query
    const query = {
      id: `query_${Date.now()}`,
      name: body.name || 'Custom Query',
      filters: body.filters || {},
      metrics: body.metrics || ['calls', 'duration'],
      dateRange: body.dateRange || {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    }

    // Generate results based on query
    const results = generateAnalyticsData('7d')

    return NextResponse.json({
      success: true,
      data: {
        query,
        results: results.summary,
        rowCount: Math.floor(Math.random() * 1000) + 100
      },
      message: 'Analytics query executed successfully'
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to execute analytics query' },
      { status: 500 }
    )
  }
}