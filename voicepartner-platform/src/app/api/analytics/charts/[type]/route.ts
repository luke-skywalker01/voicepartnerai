import { NextRequest, NextResponse } from 'next/server'

// Chart Data Structure
interface ChartData {
  chart_type: string
  title: string
  labels: string[]
  datasets: ChartDataset[]
  period: string
  total_data_points: number
}

interface ChartDataset {
  label?: string
  data: number[]
  borderColor?: string
  backgroundColor?: string | string[]
  tension?: number
  fill?: boolean
}

// Mock Call Data for Charts (using simplified structure)
const mockChartCallLogs = [
  { start_time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 240, assistant_id: 1, country_code: 'DE' },
  { start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 360, assistant_id: 2, country_code: 'DE' },
  { start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'failed', duration_seconds: null, assistant_id: 1, country_code: 'US' },
  { start_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 120, assistant_id: 1, country_code: 'DE' },
  { start_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 480, assistant_id: 2, country_code: 'FR' },
  { start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 300, assistant_id: 1, country_code: 'GB' },
  { start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'busy', duration_seconds: null, assistant_id: 2, country_code: 'DE' },
  { start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 180, assistant_id: 1, country_code: 'DE' },
  { start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 420, assistant_id: 2, country_code: 'DE' },
  { start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 250, assistant_id: 1, country_code: 'DE' },
  { start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'completed', duration_seconds: 380, assistant_id: 2, country_code: 'AT' },
  { start_time: new Date(Date.now() - 12 * 60 * 60 * 1000), status: 'completed', duration_seconds: 220, assistant_id: 1, country_code: 'DE' },
  { start_time: new Date(Date.now() - 8 * 60 * 60 * 1000), status: 'completed', duration_seconds: 340, assistant_id: 2, country_code: 'DE' },
  { start_time: new Date(Date.now() - 4 * 60 * 60 * 1000), status: 'failed', duration_seconds: null, assistant_id: 1, country_code: 'CH' },
  { start_time: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'completed', duration_seconds: 280, assistant_id: 1, country_code: 'DE' }
]

// GET - Dynamic Chart Data
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    const chart_type = params.type
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Determine time period for filtering
    const now = new Date()
    let start_date: Date
    
    if (period === 'week') {
      start_date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      start_date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      start_date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // default to week
    }
    
    // Filter calls by period
    const filteredCalls = mockChartCallLogs.filter(call => call.start_time >= start_date)
    
    if (chart_type === 'calls_over_time') {
      // Calls over time (Line Chart)
      const dailyCalls: Record<string, number> = {}
      
      // Initialize days with 0 calls
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayKey = date.toISOString().split('T')[0]
        dailyCalls[dayKey] = 0
      }
      
      // Count calls per day
      filteredCalls.forEach(call => {
        const dayKey = call.start_time.toISOString().split('T')[0]
        if (dailyCalls.hasOwnProperty(dayKey)) {
          dailyCalls[dayKey]++
        }
      })
      
      const labels = Object.keys(dailyCalls).sort()
      const data = labels.map(day => dailyCalls[day])
      
      const chartData: ChartData = {
        chart_type: 'line',
        title: 'Anrufe über Zeit',
        labels: labels.map(date => {
          const d = new Date(date)
          return d.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })
        }),
        datasets: [{
          label: 'Anrufe',
          data: data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }],
        period: period,
        total_data_points: labels.length
      }
      
      return NextResponse.json({
        success: true,
        data: chartData
      })
    }
    
    else if (chart_type === 'status_distribution') {
      // Status distribution (Pie Chart)
      const statusCounts: Record<string, number> = {}
      
      filteredCalls.forEach(call => {
        statusCounts[call.status] = (statusCounts[call.status] || 0) + 1
      })
      
      const chartData: ChartData = {
        chart_type: 'pie',
        title: 'Anruf-Status Verteilung',
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgb(34, 197, 94)',   // completed - green
            'rgb(239, 68, 68)',   // failed - red
            'rgb(245, 158, 11)',  // busy - yellow
            'rgb(156, 163, 175)', // canceled - gray
            'rgb(168, 85, 247)'   // other - purple
          ]
        }],
        period: period,
        total_data_points: Object.keys(statusCounts).length
      }
      
      return NextResponse.json({
        success: true,
        data: chartData
      })
    }
    
    else if (chart_type === 'duration_distribution') {
      // Call duration distribution (Bar Chart)
      const durationBuckets = {
        '0-1 Min': 0,
        '1-3 Min': 0,
        '3-5 Min': 0,
        '5-10 Min': 0,
        '10+ Min': 0
      }
      
      filteredCalls.forEach(call => {
        if (call.duration_seconds) {
          const minutes = call.duration_seconds / 60
          if (minutes <= 1) {
            durationBuckets['0-1 Min']++
          } else if (minutes <= 3) {
            durationBuckets['1-3 Min']++
          } else if (minutes <= 5) {
            durationBuckets['3-5 Min']++
          } else if (minutes <= 10) {
            durationBuckets['5-10 Min']++
          } else {
            durationBuckets['10+ Min']++
          }
        }
      })
      
      const chartData: ChartData = {
        chart_type: 'bar',
        title: 'Anrufdauer Verteilung',
        labels: Object.keys(durationBuckets),
        datasets: [{
          label: 'Anzahl Anrufe',
          data: Object.values(durationBuckets),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
        }],
        period: period,
        total_data_points: Object.keys(durationBuckets).length
      }
      
      return NextResponse.json({
        success: true,
        data: chartData
      })
    }
    
    else if (chart_type === 'assistant_performance') {
      // Assistant performance comparison (Bar Chart)
      const assistantStats: Record<string, { calls: number, total_duration: number }> = {}
      
      filteredCalls.forEach(call => {
        const assistantKey = call.assistant_id === 1 ? 'Terminbuchung Assistant' : 'Kundenservice Bot'
        if (!assistantStats[assistantKey]) {
          assistantStats[assistantKey] = { calls: 0, total_duration: 0 }
        }
        assistantStats[assistantKey].calls++
        if (call.duration_seconds) {
          assistantStats[assistantKey].total_duration += call.duration_seconds
        }
      })
      
      const assistantNames = Object.keys(assistantStats)
      const callCounts = assistantNames.map(name => assistantStats[name].calls)
      const avgDurations = assistantNames.map(name => 
        assistantStats[name].calls > 0 ? 
        Math.round(assistantStats[name].total_duration / assistantStats[name].calls) : 0
      )
      
      const chartData: ChartData = {
        chart_type: 'bar',
        title: 'Assistant Performance',
        labels: assistantNames,
        datasets: [
          {
            label: 'Anzahl Anrufe',
            data: callCounts,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
          },
          {
            label: 'Ø Dauer (Sek.)',
            data: avgDurations,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
          }
        ],
        period: period,
        total_data_points: assistantNames.length
      }
      
      return NextResponse.json({
        success: true,
        data: chartData
      })
    }
    
    else if (chart_type === 'geographic_distribution') {
      // Geographic distribution (Pie Chart)
      const countryCounts: Record<string, number> = {}
      
      filteredCalls.forEach(call => {
        if (call.country_code) {
          countryCounts[call.country_code] = (countryCounts[call.country_code] || 0) + 1
        }
      })
      
      const chartData: ChartData = {
        chart_type: 'pie',
        title: 'Geografische Verteilung',
        labels: Object.keys(countryCounts),
        datasets: [{
          data: Object.values(countryCounts),
          backgroundColor: [
            'rgb(59, 130, 246)',   // DE - blue
            'rgb(34, 197, 94)',    // US - green
            'rgb(245, 158, 11)',   // FR - yellow
            'rgb(239, 68, 68)',    // GB - red
            'rgb(168, 85, 247)',   // AT - purple
            'rgb(156, 163, 175)',  // CH - gray
          ]
        }],
        period: period,
        total_data_points: Object.keys(countryCounts).length
      }
      
      return NextResponse.json({
        success: true,
        data: chartData
      })
    }
    
    else if (chart_type === 'hourly_patterns') {
      // Hourly call patterns (Line Chart)
      const hourlyCalls: Record<number, number> = {}
      
      // Initialize all hours with 0
      for (let i = 0; i < 24; i++) {
        hourlyCalls[i] = 0
      }
      
      filteredCalls.forEach(call => {
        const hour = call.start_time.getHours()
        hourlyCalls[hour]++
      })
      
      const chartData: ChartData = {
        chart_type: 'line',
        title: 'Anrufe nach Tageszeit',
        labels: Object.keys(hourlyCalls).map(hour => `${hour}:00`),
        datasets: [{
          label: 'Anrufe',
          data: Object.values(hourlyCalls),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true
        }],
        period: period,
        total_data_points: 24
      }
      
      return NextResponse.json({
        success: true,
        data: chartData
      })
    }
    
    else {
      return NextResponse.json(
        { success: false, error: `Chart type '${chart_type}' not found` },
        { status: 404 }
      )
    }
    
  } catch (error) {
    console.error('Analytics chart error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}