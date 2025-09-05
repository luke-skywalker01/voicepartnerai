'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Phone, 
  Clock, 
  Users,
  MessageSquare,
  Zap,
  AlertCircle,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PhoneCall,
  CheckCircle,
  XCircle,
  Search,
  DollarSign
} from 'lucide-react'

// Types for the new Analytics API
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
  top_country?: string
  calls_change_percent?: number
  duration_change_percent?: number
  cost_change_percent?: number
  quality_change_percent?: number
}

interface CallLog {
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
  status: string
  credits_consumed: number
  cost_eur?: number
  call_quality_score?: number
  ai_response_time_ms?: number
  ai_confidence_avg?: number
  customer_satisfaction?: number
  country_code?: string
  assistant_name?: string
  phone_number?: string
}

interface CallHistoryData {
  calls: CallLog[]
  pagination: {
    total: number
    skip: number
    limit: number
    has_more: boolean
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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('today')
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [callHistory, setCallHistory] = useState<CallHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch analytics summary
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/summary?period=${timeRange}`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  // Fetch call history
  const fetchCallHistory = async () => {
    try {
      const params = new URLSearchParams({
        skip: '0',
        limit: '10',
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/analytics/call-history?${params}`)
      const data = await response.json()
      if (data.success) {
        setCallHistory(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch call history:', error)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchAnalytics(), fetchCallHistory()])
      setLoading(false)
    }
    loadData()
  }, [timeRange, searchTerm, statusFilter])

  // Format duration in readable format
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</span>
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center"><XCircle className="w-3 h-3 mr-1" />Fehlgeschlagen</span>
      case 'busy':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />Besetzt</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const statCards = analytics ? [
    {
      title: 'Anrufe Gesamt',
      value: analytics.total_calls.toLocaleString(),
      change: analytics.calls_change_percent ? `${analytics.calls_change_percent > 0 ? '+' : ''}${analytics.calls_change_percent}%` : '',
      changeType: (analytics.calls_change_percent || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Phone,
      color: 'text-blue-600'
    },
    {
      title: 'Erfolgsrate',
      value: `${analytics.success_rate.toFixed(1)}%`,
      change: analytics.quality_change_percent ? `${analytics.quality_change_percent > 0 ? '+' : ''}${analytics.quality_change_percent}%` : '',
      changeType: (analytics.quality_change_percent || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Ø Gesprächsdauer',
      value: `${Math.round(analytics.avg_duration_seconds / 60)} Min`,
      change: analytics.duration_change_percent ? `${analytics.duration_change_percent > 0 ? '+' : ''}${analytics.duration_change_percent}%` : '',
      changeType: (analytics.duration_change_percent || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Gesamt Minuten',
      value: Math.round(analytics.total_duration_minutes).toLocaleString(),
      change: analytics.duration_change_percent ? `${analytics.duration_change_percent > 0 ? '+' : ''}${analytics.duration_change_percent}%` : '',
      changeType: (analytics.duration_change_percent || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Activity,
      color: 'text-purple-600'
    },
    {
      title: 'Credits Verbraucht',
      value: analytics.total_credits_consumed.toFixed(1),
      change: '',
      changeType: 'positive' as const,
      icon: Zap,
      color: 'text-teal-600'
    },
    {
      title: 'Kosten Gesamt',
      value: formatCurrency(analytics.total_cost_eur),
      change: analytics.cost_change_percent ? `${analytics.cost_change_percent > 0 ? '+' : ''}${analytics.cost_change_percent}%` : '',
      changeType: (analytics.cost_change_percent || 0) >= 0 ? 'negative' as const : 'positive' as const, // Cost increase is negative
      icon: DollarSign,
      color: 'text-indigo-600'
    }
  ] : []

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <BarChart3 className="h-6 w-6 mr-3" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Detaillierte Einblicke in Ihre Voice AI Performance
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-border bg-background rounded-md px-3 py-2 text-sm"
            >
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
              <option value="month">Dieser Monat</option>
            </select>
            <button className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button 
              onClick={() => {fetchAnalytics(); fetchCallHistory()}}
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === 'calls'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Anrufliste
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    {stat.change && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stat.changeType === 'positive' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Stats */}
            {analytics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Assistant</h3>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{analytics.top_assistant?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {analytics.top_assistant?.calls || 0} Anrufe
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Land</h3>
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-2xl">{analytics.top_country || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Häufigste Anrufe</div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Qualität</h3>
                  <div className="text-2xl font-bold">
                    {analytics.avg_quality_score ? (analytics.avg_quality_score * 100).toFixed(0) + '%' : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ø {analytics.avg_ai_response_time_ms || 0}ms Antwortzeit
                  </p>
                </div>
              </div>
            )}

            {/* Recent Calls Preview */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Letzte Anrufe</h3>
              {callHistory && callHistory.calls.length > 0 ? (
                <div className="space-y-2">
                  {callHistory.calls.slice(0, 5).map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <PhoneCall className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{call.caller_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(call.start_time).toLocaleString('de-DE')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(call.status)}
                        <div className="text-sm text-muted-foreground">
                          {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Anrufe in diesem Zeitraum
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'calls' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Anrufliste</h3>
            
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Suche nach Nummer, Call-ID oder Assistant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-md bg-background"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-border bg-background rounded-md px-3 py-2 text-sm"
              >
                <option value="">Alle Status</option>
                <option value="completed">Abgeschlossen</option>
                <option value="failed">Fehlgeschlagen</option>
                <option value="busy">Besetzt</option>
              </select>
            </div>

            {/* Call History Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 font-medium">Anrufer</th>
                    <th className="text-left py-3 font-medium">Assistant</th>
                    <th className="text-left py-3 font-medium">Start</th>
                    <th className="text-left py-3 font-medium">Dauer</th>
                    <th className="text-left py-3 font-medium">Status</th>
                    <th className="text-left py-3 font-medium">Credits</th>
                    <th className="text-left py-3 font-medium">Kosten</th>
                    <th className="text-left py-3 font-medium">Land</th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory?.calls.map((call) => (
                    <tr key={call.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-4">
                        <div>
                          <div className="font-medium">{call.caller_number}</div>
                          <div className="text-sm text-muted-foreground">{call.call_sid}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm">{call.assistant_name || '-'}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm">
                          {new Date(call.start_time).toLocaleString('de-DE')}
                        </div>
                      </td>
                      <td className="py-4">
                        {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                      </td>
                      <td className="py-4">
                        {getStatusBadge(call.status)}
                      </td>
                      <td className="py-4">{call.credits_consumed.toFixed(1)}</td>
                      <td className="py-4">
                        {call.cost_eur ? formatCurrency(call.cost_eur) : '-'}
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {call.country_code || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Call History Summary */}
            {callHistory && (
              <div className="mt-6 flex items-center justify-between px-2 py-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Gesamt: {callHistory.pagination.total} Anrufe | 
                  Ø Dauer: {Math.round(callHistory.summary_stats.avg_duration)}s | 
                  Erfolgsrate: {callHistory.summary_stats.success_rate.toFixed(1)}%
                </div>
                <div className="text-sm font-medium">
                  Credits: {callHistory.summary_stats.total_credits.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}