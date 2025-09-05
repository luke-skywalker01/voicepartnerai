'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  DollarSign, 
  Phone, 
  Users, 
  Bot, 
  Activity, 
  Download, 
  Filter, 
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  LineChart,
  Map,
  Globe,
  Target,
  Zap,
  MessageSquare,
  Timer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalCalls: number
    totalDuration: number
    totalCost: number
    averageCallDuration: number
    successRate: number
    activeAssistants: number
    callsToday: number
    costToday: number
    trends: {
      calls: number // percentage change
      duration: number
      cost: number
      successRate: number
    }
  }
  timeSeriesData: {
    labels: string[]
    calls: number[]
    costs: number[]
    duration: number[]
    successRate: number[]
  }
  callsByHour: {
    hour: number
    calls: number
    avgDuration: number
    cost: number
  }[]
  assistantPerformance: {
    id: string
    name: string
    calls: number
    totalDuration: number
    avgDuration: number
    successRate: number
    cost: number
    trend: 'up' | 'down' | 'stable'
  }[]
  geographicData: {
    country: string
    region: string
    calls: number
    avgDuration: number
    cost: number
    coordinates: [number, number]
  }[]
  callOutcomes: {
    completed: number
    transferred: number
    failed: number
    abandoned: number
  }
  costBreakdown: {
    vapi: number
    llm: number
    tts: number
    stt: number
    telephony: number
  }
  providerMetrics: {
    provider: string
    type: 'llm' | 'tts' | 'stt' | 'telephony'
    requests: number
    avgLatency: number
    errorRate: number
    cost: number
  }[]
  topKeywords: {
    keyword: string
    frequency: number
    sentiment: 'positive' | 'negative' | 'neutral'
  }[]
  realTimeMetrics: {
    activeCalls: number
    queuedCalls: number
    avgWaitTime: number
    concurrentPeak: number
    systemLoad: number
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('calls')
  const [showCosts, setShowCosts] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadAnalyticsData = async () => {
    try {
      // Simulate comprehensive analytics data
      const mockData: AnalyticsData = {
        overview: {
          totalCalls: 2847,
          totalDuration: 485700, // seconds
          totalCost: 1847.32,
          averageCallDuration: 170,
          successRate: 94.2,
          activeAssistants: 8,
          callsToday: 127,
          costToday: 82.45,
          trends: {
            calls: 12.5,
            duration: -3.2,
            cost: 8.7,
            successRate: 1.8
          }
        },
        timeSeriesData: {
          labels: Array.from({length: 30}, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (29 - i))
            return date.toISOString().split('T')[0]
          }),
          calls: Array.from({length: 30}, () => Math.floor(Math.random() * 150) + 50),
          costs: Array.from({length: 30}, () => Math.random() * 100 + 20),
          duration: Array.from({length: 30}, () => Math.floor(Math.random() * 10000) + 5000),
          successRate: Array.from({length: 30}, () => Math.random() * 10 + 90)
        },
        callsByHour: Array.from({length: 24}, (_, hour) => ({
          hour,
          calls: Math.floor(Math.random() * 50) + 10,
          avgDuration: Math.floor(Math.random() * 100) + 120,
          cost: Math.random() * 20 + 5
        })),
        assistantPerformance: [
          {
            id: 'assistant_1',
            name: 'Customer Service Bot',
            calls: 856,
            totalDuration: 145680,
            avgDuration: 170,
            successRate: 96.3,
            cost: 542.18,
            trend: 'up'
          },
          {
            id: 'assistant_2',
            name: 'Sales Assistant',
            calls: 634,
            totalDuration: 108780,
            avgDuration: 172,
            successRate: 92.8,
            cost: 387.45,
            trend: 'up'
          },
          {
            id: 'assistant_3',
            name: 'Support Specialist',
            calls: 423,
            totalDuration: 72510,
            avgDuration: 171,
            successRate: 94.1,
            cost: 258.73,
            trend: 'stable'
          },
          {
            id: 'assistant_4',
            name: 'Technical Help',
            calls: 312,
            totalDuration: 53544,
            avgDuration: 172,
            successRate: 89.7,
            cost: 198.92,
            trend: 'down'
          }
        ],
        geographicData: [
          {
            country: 'United States',
            region: 'California',
            calls: 1240,
            avgDuration: 168,
            cost: 745.20,
            coordinates: [-119.4179, 36.7783]
          },
          {
            country: 'United States',
            region: 'New York',
            calls: 892,
            avgDuration: 175,
            cost: 567.84,
            coordinates: [-74.0060, 40.7128]
          },
          {
            country: 'Canada',
            region: 'Ontario',
            calls: 456,
            avgDuration: 172,
            cost: 298.16,
            coordinates: [-85.0000, 50.0000]
          },
          {
            country: 'United Kingdom',
            region: 'London',
            calls: 259,
            avgDuration: 165,
            cost: 236.12,
            coordinates: [-0.1276, 51.5074]
          }
        ],
        callOutcomes: {
          completed: 2682,
          transferred: 98,
          failed: 45,
          abandoned: 22
        },
        costBreakdown: {
          vapi: 142.35,
          llm: 687.94,
          tts: 523.68,
          stt: 298.47,
          telephony: 194.88
        },
        providerMetrics: [
          {
            provider: 'OpenAI GPT-4',
            type: 'llm',
            requests: 2456,
            avgLatency: 1240,
            errorRate: 1.2,
            cost: 687.94
          },
          {
            provider: 'ElevenLabs',
            type: 'tts',
            requests: 2847,
            avgLatency: 680,
            errorRate: 0.8,
            cost: 523.68
          },
          {
            provider: 'Deepgram',
            type: 'stt',
            requests: 2847,
            avgLatency: 420,
            errorRate: 1.5,
            cost: 298.47
          },
          {
            provider: 'Twilio',
            type: 'telephony',
            requests: 2847,
            avgLatency: 150,
            errorRate: 2.1,
            cost: 194.88
          }
        ],
        topKeywords: [
          { keyword: 'billing', frequency: 456, sentiment: 'neutral' },
          { keyword: 'support', frequency: 389, sentiment: 'positive' },
          { keyword: 'cancel', frequency: 234, sentiment: 'negative' },
          { keyword: 'upgrade', frequency: 198, sentiment: 'positive' },
          { keyword: 'refund', frequency: 156, sentiment: 'negative' },
          { keyword: 'help', frequency: 145, sentiment: 'neutral' },
          { keyword: 'technical', frequency: 134, sentiment: 'neutral' },
          { keyword: 'price', frequency: 123, sentiment: 'neutral' }
        ],
        realTimeMetrics: {
          activeCalls: 23,
          queuedCalls: 5,
          avgWaitTime: 12,
          concurrentPeak: 67,
          systemLoad: 34.7
        }
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  useEffect(() => {
    loadAnalyticsData()
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalyticsData, 60000) // 1 minute
      return () => clearInterval(interval)
    }
  }, [autoRefresh, dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your voice AI platform performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-md flex items-center font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
            }`}
          >
            {autoRefresh ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            Live
          </button>
          
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Real-time Metrics Bar */}
      {analyticsData && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Real-time Status</h3>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>{analyticsData.realTimeMetrics.activeCalls} Active Calls</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>{analyticsData.realTimeMetrics.queuedCalls} Queued</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{analyticsData.realTimeMetrics.avgWaitTime}s Avg Wait</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>Peak: {analyticsData.realTimeMetrics.concurrentPeak}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>Load: {analyticsData.realTimeMetrics.systemLoad.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.overview.totalCalls.toLocaleString()}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analyticsData.overview.trends.calls)}
                  <span className={`text-xs ${getTrendColor(analyticsData.overview.trends.calls)}`}>
                    {formatPercentage(analyticsData.overview.trends.calls)}
                  </span>
                </div>
              </div>
              <Phone className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.overview.successRate}%</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analyticsData.overview.trends.successRate)}
                  <span className={`text-xs ${getTrendColor(analyticsData.overview.trends.successRate)}`}>
                    {formatPercentage(analyticsData.overview.trends.successRate)}
                  </span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.floor(analyticsData.overview.averageCallDuration / 60)}m {analyticsData.overview.averageCallDuration % 60}s
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analyticsData.overview.trends.duration)}
                  <span className={`text-xs ${getTrendColor(analyticsData.overview.trends.duration)}`}>
                    {formatPercentage(analyticsData.overview.trends.duration)}
                  </span>
                </div>
              </div>
              <Timer className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(analyticsData.overview.totalCost)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analyticsData.overview.trends.cost)}
                  <span className={`text-xs ${getTrendColor(analyticsData.overview.trends.cost)}`}>
                    {formatPercentage(analyticsData.overview.trends.cost)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Export Analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Download detailed reports and data for further analysis
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted/50 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>CSV Export</span>
            </button>
            <button className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted/50 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>PDF Report</span>
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Advanced Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}