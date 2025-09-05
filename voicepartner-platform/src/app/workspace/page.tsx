'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { 
  Bot, 
  Workflow, 
  Phone, 
  BarChart3,
  Settings,
  Zap,
  Mic,
  Brain,
  Users,
  Clock,
  DollarSign,
  Activity,
  Plus,
  PlayCircle,
  PauseCircle,
  Volume2,
  Headphones,
  Globe,
  Database,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Sparkles
} from 'lucide-react'
import VapiWorkspace from '../../components/vapi/VapiWorkspace'
import VisualWorkflowBuilder from '../../components/workflow/VisualWorkflowBuilder'
import PipecatVoiceInterface from '../../components/voice/PipecatVoiceInterface'
import AIAgentCreator from '../../components/agents/AIAgentCreator'
import { useAuth } from '../../lib/auth/cross-app-auth'

interface WorkspaceStats {
  totalAssistants: number
  activeWorkflows: number
  callsToday: number
  successRate: number
  averageCallDuration: number
  totalCost: number
  activeConnections: number
  uptime: number
}

export default function WorkspacePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [vapiApiKey, setVapiApiKey] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const { session, isAuthenticated, createSession } = useAuth()
  const [stats, setStats] = useState<WorkspaceStats>({
    totalAssistants: 5,
    activeWorkflows: 3,
    callsToday: 247,
    successRate: 94.2,
    averageCallDuration: 180,
    totalCost: 47.82,
    activeConnections: 12,
    uptime: 99.9
  })
  const [recentActivity, setRecentActivity] = useState([
    {
      id: '1',
      type: 'call_completed',
      message: 'Call completed successfully - Customer Support Bot',
      timestamp: new Date(Date.now() - 300000),
      status: 'success'
    },
    {
      id: '2',
      type: 'workflow_executed',
      message: 'N8N workflow "Vapi Call to CRM" executed',
      timestamp: new Date(Date.now() - 600000),
      status: 'success'
    },
    {
      id: '3',
      type: 'assistant_created',
      message: 'New assistant "Sales Qualifier" created',
      timestamp: new Date(Date.now() - 900000),
      status: 'info'
    },
    {
      id: '4',
      type: 'error',
      message: 'Pipecat connection timeout - retrying',
      timestamp: new Date(Date.now() - 1200000),
      status: 'error'
    },
    {
      id: '5',
      type: 'workflow_activated',
      message: 'Workflow "Daily Call Summary" activated',
      timestamp: new Date(Date.now() - 1800000),
      status: 'success'
    }
  ])

  const [liveMetrics, setLiveMetrics] = useState({
    currentCalls: 8,
    averageLatency: 245,
    errorRate: 0.3,
    resourceUsage: 67
  })

  useEffect(() => {
    // Check if user came from homepage and handle authentication
    const urlParams = new URLSearchParams(window.location.search)
    const fromHomepage = urlParams.get('from') === 'homepage'
    const sessionId = urlParams.get('session')
    
    if (fromHomepage) {
      setShowWelcome(true)
      
      // Create or update session for workspace
      if (!isAuthenticated) {
        createSession('workspace', {
          id: sessionId || undefined
        })
      }
      
      // Clean URL after checking
      window.history.replaceState({}, '', window.location.pathname)
    }
    
    // Listen for authentication messages from homepage
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'HOMEPAGE_AUTH' && event.data.session) {
        createSession('workspace', event.data.session)
        setShowWelcome(true)
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        currentCalls: Math.max(0, prev.currentCalls + Math.floor(Math.random() * 3) - 1),
        averageLatency: 200 + Math.floor(Math.random() * 100),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.2)),
        resourceUsage: Math.max(0, Math.min(100, prev.resourceUsage + (Math.random() - 0.5) * 10))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call_completed': return <Phone className="h-4 w-4 text-green-600" />
      case 'workflow_executed': return <Workflow className="h-4 w-4 text-blue-600" />
      case 'assistant_created': return <Bot className="h-4 w-4 text-purple-600" />
      case 'workflow_activated': return <PlayCircle className="h-4 w-4 text-green-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }
    return colors[status as keyof typeof colors] || colors.info
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatUptime = (percentage: number) => {
    const days = Math.floor(percentage * 365 / 100)
    const hours = Math.floor((percentage * 365 % 100) * 24 / 100)
    return `${days}d ${hours}h`
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className="w-72 bg-card border-r border-border flex flex-col">
        {/* Logo Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">VoicePartnerAI</h1>
              <p className="text-xs text-muted-foreground">Voice AI Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'overview' 
                ? 'bg-accent text-accent-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('vapi')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'vapi' 
                ? 'bg-accent text-accent-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Bot className="h-5 w-5" />
            <span className="font-medium">AI Agents</span>
          </button>
          
          <button
            onClick={() => setActiveTab('workflows')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'workflows' 
                ? 'bg-accent text-accent-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Workflow className="h-5 w-5" />
            <span className="font-medium">Workflow Builder</span>
          </button>
          
          <button
            onClick={() => setActiveTab('voice')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'voice' 
                ? 'bg-accent text-accent-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Headphones className="h-5 w-5" />
            <span className="font-medium">Voice Testing</span>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'analytics' 
                ? 'bg-accent text-accent-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">Analytics</span>
          </button>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => router.push('/')}
          >
            <Globe className="mr-2 h-4 w-4" />
            Homepage
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Settings className="mr-2 h-4 w-4" />
            Einstellungen
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              // Logout functionality
              localStorage.removeItem('auth_token')
              sessionStorage.clear()
              router.push('/login')
            }}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Abmelden
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-background border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'vapi' && 'AI Agents'}
                {activeTab === 'workflows' && 'Workflow Builder'}
                {activeTab === 'voice' && 'Voice Testing'}
                {activeTab === 'analytics' && 'Analytics'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {activeTab === 'overview' && 'Comprehensive voice AI platform powered by Vapi, Pipecat, and N8N'}
                {activeTab === 'vapi' && 'Erstellen und verwalten Sie Ihre Voice AI Assistenten'}
                {activeTab === 'workflows' && 'Visueller N8N-Style Workflow Builder'}
                {activeTab === 'voice' && 'Testen Sie Ihre Voice AI Implementierungen'}
                {activeTab === 'analytics' && 'Detaillierte Einblicke und Performance-Metriken'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-500 text-white">
                <Activity className="mr-1 h-3 w-3" />
                System Healthy
              </Badge>
              <AIAgentCreator />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        {showWelcome && (
          <div className="mx-6 mt-6">
            <div className="bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Willkommen im Voice AI Workspace! 
                    </h3>
                    <p className="text-muted-foreground">
                      Hier können Sie Ihre eigenen Voice AI Agenten erstellen und verwalten.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWelcome(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button
                  size="sm"
                  className="bg-accent hover:bg-accent/90"
                  onClick={() => {
                    setActiveTab('vapi')
                    setShowWelcome(false)
                  }}
                >
                  Agent erstellen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('workflows')
                    setShowWelcome(false)
                  }}
                >
                  Workflow Builder
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
            {/* Live Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Phone className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Calls</p>
                      <p className="text-2xl font-bold text-gray-900">{liveMetrics.currentCalls}</p>
                      <p className="text-xs text-green-600 mt-1">+2 from last hour</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                      <p className="text-2xl font-bold text-gray-900">{liveMetrics.averageLatency}ms</p>
                      <p className="text-xs text-blue-600 mt-1">Excellent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                      <p className="text-xs text-green-600 mt-1">+1.2% today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Daily Cost</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.totalCost}</p>
                      <p className="text-xs text-gray-500 mt-1">Within budget</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    System Status
                  </CardTitle>
                  <CardDescription>Real-time platform performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Voice Assistants</span>
                        <span className="text-lg font-bold text-gray-900">{stats.totalAssistants}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Active Workflows</span>
                        <span className="text-lg font-bold text-gray-900">{stats.activeWorkflows}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Calls Today</span>
                        <span className="text-lg font-bold text-gray-900">{stats.callsToday}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Avg Call Duration</span>
                        <span className="text-lg font-bold text-gray-900">{formatDuration(stats.averageCallDuration)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Active Connections</span>
                        <span className="text-lg font-bold text-gray-900">{stats.activeConnections}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">System Uptime</span>
                        <span className="text-lg font-bold text-gray-900">{stats.uptime}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resource Usage */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Resource Usage</span>
                      <span className="text-sm text-gray-500">{liveMetrics.resourceUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${liveMetrics.resourceUsage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge className={`${getStatusBadge(activity.status)} text-white text-xs`}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Integration Status
                </CardTitle>
                <CardDescription>Connected services and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Bot className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Vapi Platform</h3>
                      <p className="text-sm text-gray-500">Voice AI Management</p>
                      <Badge className="bg-green-500 text-white text-xs mt-1">Connected</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Workflow className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">N8N Workflows</h3>
                      <p className="text-sm text-gray-500">Automation Engine</p>
                      <Badge className="bg-green-500 text-white text-xs mt-1">Active</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Headphones className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Pipecat Voice</h3>
                      <p className="text-sm text-gray-500">Real-time Processing</p>
                      <Badge className="bg-green-500 text-white text-xs mt-1">Running</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Vapi Assistants Tab */}
          {activeTab === 'vapi' && (
            <VapiWorkspace 
              apiKey={vapiApiKey}
              onApiKeyChange={setVapiApiKey}
            />
          )}

          {/* Workflow Builder Tab */}
          {activeTab === 'workflows' && (
            <VisualWorkflowBuilder />
          )}

          {/* Pipecat Voice Tab */}
          {activeTab === 'voice' && (
            <PipecatVoiceInterface
              assistantId="demo-assistant"
              config={{
                transport: 'websocket',
                stt: 'deepgram',
                tts: 'elevenlabs',
                llm: 'openai'
              }}
              onSessionStart={(session) => {
                console.log('Voice session started:', session)
              }}
              onSessionEnd={(session) => {
                console.log('Voice session ended:', session)
              }}
              onTranscript={(text) => {
                console.log('Transcript:', text)
              }}
              onBotResponse={(text) => {
                console.log('Bot response:', text)
              }}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Call Volume Trends</CardTitle>
                  <CardDescription>Calls over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Interactive charts coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>System performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Performance analytics loading...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Detailed breakdown of usage costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">${(stats.totalCost * 0.4).toFixed(2)}</h3>
                    <p className="text-sm text-gray-600">Voice Processing</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">${(stats.totalCost * 0.3).toFixed(2)}</h3>
                    <p className="text-sm text-gray-600">AI Models</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">${(stats.totalCost * 0.2).toFixed(2)}</h3>
                    <p className="text-sm text-gray-600">Infrastructure</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">${(stats.totalCost * 0.1).toFixed(2)}</h3>
                    <p className="text-sm text-gray-600">Storage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}