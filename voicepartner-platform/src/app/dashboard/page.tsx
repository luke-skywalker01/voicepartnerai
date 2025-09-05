'use client'

import React from 'react'
import VapiMainLayout from '@/components/layout/VapiMainLayout'
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  Users, 
  Phone,
  Bot,
  Activity,
  MoreHorizontal,
  Play,
  Settings,
  Eye
} from 'lucide-react'

interface DashboardStats {
  assistants: {
    total: number
    active: number
    draft: number
    testing: number
  }
  calls: {
    total: number
    today: number
    inProgress: number
    completed: number
    failed: number
    averageDuration: number
    successRate: number
  }
  phoneNumbers: {
    total: number
    active: number
    inactive: number
  }
  costs: {
    total: number
    today: number
    thisMonth: number
    perMinute: number
  }
  activity: {
    callsLast24h: number[]
    costsLast24h: number[]
    topAssistants: Array<{
      name: string
      calls: number
      cost: number
    }>
  }
}

interface Agent {
  id: string
  name: string
  description: string
  status: 'draft' | 'deployed' | 'testing'
  createdAt: string
  updatedAt: string
  voice: {
    provider: string
    voiceId: string
  }
  model: {
    provider: string
    model: string
  }
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboardData = async () => {
    try {
      // Load assistants, calls, phone numbers in parallel
      const [assistantsResponse, callsResponse, phoneNumbersResponse] = await Promise.all([
        fetch('/api/vapi/assistants?limit=50'),
        fetch('/api/vapi/calls?limit=100'),
        fetch('/api/vapi/phone-numbers?limit=50')
      ])

      const assistantsData = await assistantsResponse.json()
      const callsData = await callsResponse.json()
      const phoneNumbersData = await phoneNumbersResponse.json()

      // Transform assistants
      const transformedAssistants = assistantsData.assistants ? assistantsData.assistants.map((assistant: any) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.firstMessage || 'Vapi Assistant',
        status: 'deployed' as const,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt,
        voice: {
          provider: assistant.voice?.provider || 'elevenlabs',
          voiceId: assistant.voice?.voiceId || 'default'
        },
        model: {
          provider: assistant.model?.provider || 'openai',
          model: assistant.model?.model || 'gpt-3.5-turbo'
        }
      })) : [
        {
          id: 'demo_1',
          name: 'Customer Service Bot',
          description: 'Friendly customer support assistant',
          status: 'deployed' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          voice: { provider: 'elevenlabs', voiceId: 'rachel' },
          model: { provider: 'openai', model: 'gpt-3.5-turbo' }
        },
        {
          id: 'demo_2',
          name: 'Sales Assistant',
          description: 'Lead qualification specialist',
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          voice: { provider: 'elevenlabs', voiceId: 'daniel' },
          model: { provider: 'openai', model: 'gpt-4' }
        }
      ]

      setAgents(transformedAssistants)

      // Calculate comprehensive stats
      const calls = callsData.calls || []
      const phoneNumbers = phoneNumbersData.phoneNumbers || []
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const todayCalls = calls.filter((call: any) => new Date(call.createdAt) >= today)
      const completedCalls = calls.filter((call: any) => call.status === 'ended')
      const inProgressCalls = calls.filter((call: any) => call.status === 'in-progress')
      const failedCalls = calls.filter((call: any) => call.status === 'failed')

      const totalCost = calls.reduce((sum: number, call: any) => sum + (call.costBreakdown?.total || 0), 0)
      const todayCost = todayCalls.reduce((sum: number, call: any) => sum + (call.costBreakdown?.total || 0), 0)
      const thisMonthCalls = calls.filter((call: any) => new Date(call.createdAt) >= thisMonth)
      const thisMonthCost = thisMonthCalls.reduce((sum: number, call: any) => sum + (call.costBreakdown?.total || 0), 0)

      const totalDuration = completedCalls.reduce((sum: number, call: any) => sum + (call.duration || 0), 0)
      const averageDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0

      // Generate 24h activity data (mock for demo)
      const callsLast24h = Array.from({length: 24}, (_, i) => Math.floor(Math.random() * 10))
      const costsLast24h = Array.from({length: 24}, (_, i) => Math.random() * 5)

      // Top assistants by call volume
      const assistantStats = transformedAssistants.map((assistant: any) => {
        const assistantCalls = calls.filter((call: any) => call.assistantId === assistant.id)
        return {
          name: assistant.name,
          calls: assistantCalls.length,
          cost: assistantCalls.reduce((sum: number, call: any) => sum + (call.costBreakdown?.total || 0), 0)
        }
      }).sort((a, b) => b.calls - a.calls).slice(0, 5)

      const dashboardStats: DashboardStats = {
        assistants: {
          total: transformedAssistants.length,
          active: transformedAssistants.filter((a: any) => a.status === 'deployed').length,
          draft: transformedAssistants.filter((a: any) => a.status === 'draft').length,
          testing: transformedAssistants.filter((a: any) => a.status === 'testing').length
        },
        calls: {
          total: calls.length,
          today: todayCalls.length,
          inProgress: inProgressCalls.length,
          completed: completedCalls.length,
          failed: failedCalls.length,
          averageDuration: averageDuration,
          successRate: calls.length > 0 ? (completedCalls.length / calls.length) * 100 : 0
        },
        phoneNumbers: {
          total: phoneNumbers.length,
          active: phoneNumbers.filter((pn: any) => pn.assistantId).length,
          inactive: phoneNumbers.filter((pn: any) => !pn.assistantId).length
        },
        costs: {
          total: totalCost,
          today: todayCost,
          thisMonth: thisMonthCost,
          perMinute: totalDuration > 0 ? (totalCost / (totalDuration / 60)) : 0
        },
        activity: {
          callsLast24h,
          costsLast24h,
          topAssistants: assistantStats
        }
      }

      setStats(dashboardStats)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      
      // Fallback demo data
      setAgents([
        {
          id: 'demo_1',
          name: 'Customer Service Bot',
          description: 'Friendly customer support assistant',
          status: 'deployed' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          voice: { provider: 'elevenlabs', voiceId: 'rachel' },
          model: { provider: 'openai', model: 'gpt-3.5-turbo' }
        }
      ])

      setStats({
        assistants: { total: 1, active: 1, draft: 0, testing: 0 },
        calls: { total: 5, today: 2, inProgress: 0, completed: 5, failed: 0, averageDuration: 180, successRate: 100 },
        phoneNumbers: { total: 1, active: 1, inactive: 0 },
        costs: { total: 1.25, today: 0.50, thisMonth: 8.75, perMinute: 0.25 },
        activity: {
          callsLast24h: [2, 1, 0, 1, 3, 2, 4, 1, 0, 2, 3, 1, 2, 0, 1, 2, 3, 1, 0, 1, 2, 1, 0, 1],
          costsLast24h: [0.5, 0.2, 0, 0.3, 0.8, 0.4, 1.2, 0.2, 0, 0.5, 0.9, 0.3, 0.6, 0, 0.2, 0.4, 0.7, 0.2, 0, 0.3, 0.5, 0.2, 0, 0.2],
          topAssistants: [
            { name: 'Customer Service Bot', calls: 5, cost: 1.25 }
          ]
        }
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshDashboard = async () => {
    setRefreshing(true)
    await loadDashboardData()
  }

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const deleteAgent = (agentId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Agent löschen möchten?')) {
      const updatedAgents = agents.filter(a => a.id !== agentId)
      setAgents(updatedAgents)
      if (typeof window !== 'undefined') {
        localStorage.setItem('voicepartner_agents', JSON.stringify(updatedAgents))
      }
    }
  }

  const duplicateAgent = (agent: Agent) => {
    const newAgent = {
      ...agent,
      id: `agent_${Date.now()}`,
      name: `${agent.name} (Kopie)`,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updatedAgents = [...agents, newAgent]
    setAgents(updatedAgents)
    if (typeof window !== 'undefined') {
      localStorage.setItem('voicepartner_agents', JSON.stringify(updatedAgents))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
          <Bot className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Willkommen bei VoicePartnerAI!
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Erstellen Sie Ihren ersten intelligenten Voice Assistant und bringen Sie 
          Ihr Business ins Gespräch. In wenigen Minuten einsatzbereit.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/dashboard/assistants/new"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Assistant erstellen
          </Link>
        </div>
      </div>
    </div>
  )

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
          <h1 className="text-3xl font-bold text-foreground">Voice AI Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time overview of your voice AI platform
          </p>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Show EmptyState if no agents, otherwise show comprehensive dashboard */}
      {agents.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.calls.total || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{stats?.calls.today || 0} today
                  </p>
                </div>
                <PhoneCall className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Assistants</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.assistants.active || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {stats?.assistants.total || 0} total
                  </p>
                </div>
                <Bot className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-3xl font-bold text-foreground">
                    {Math.round(stats?.calls.successRate || 0)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.calls.completed || 0} completed
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(stats?.costs.total || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(stats?.costs.today || 0)} today
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats?.calls.inProgress || 0}</p>
                </div>
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Phone Numbers</p>
                  <p className="text-2xl font-bold">{stats?.phoneNumbers.total || 0}</p>
                </div>
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">
                    {formatDuration(Math.round(stats?.calls.averageDuration || 0))}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cost/Minute</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.costs.perMinute || 0)}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.costs.thisMonth || 0)}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 24h Call Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Call Activity (24h)</h3>
              <div className="h-32 flex items-end space-x-1">
                {(stats?.activity.callsLast24h || []).map((calls, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 rounded-t hover:bg-primary/30 transition-colors"
                    style={{ height: `${Math.max(calls * 8, 4)}px` }}
                    title={`${calls} calls at ${i}:00`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </div>

            {/* 24h Cost Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Activity (24h)</h3>
              <div className="h-32 flex items-end space-x-1">
                {(stats?.activity.costsLast24h || []).map((cost, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-purple-500/20 rounded-t hover:bg-purple-500/30 transition-colors"
                    style={{ height: `${Math.max(cost * 20, 4)}px` }}
                    title={`${formatCurrency(cost)} at ${i}:00`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Assistants */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Assistants</h3>
              <div className="space-y-3">
                {(stats?.activity.topAssistants || []).slice(0, 5).map((assistant, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm font-medium">{assistant.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{assistant.calls} calls</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(assistant.cost)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.activity.topAssistants || stats.activity.topAssistants.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No assistant activity yet
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/assistants/new"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-primary" />
                  <span className="font-medium">New Assistant</span>
                </Link>
                <Link
                  href="/dashboard/calls"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <PhoneCall className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">View All Calls</span>
                </Link>
                <Link
                  href="/dashboard/phone-numbers"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Phone className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Manage Numbers</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Billing & Usage</span>
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Voice AI Service</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Phone System</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Analytics</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Billing System</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Operational</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last updated:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Assistants */}
          {agents.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Assistants</h3>
                <Link
                  href="/dashboard/assistants"
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.slice(0, 4).map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/25 transition-colors">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{agent.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          agent.status === 'deployed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          agent.status === 'testing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {agent.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {agent.voice.provider}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Link
                        href={`/dashboard/assistants/${agent.id}/edit`}
                        className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}