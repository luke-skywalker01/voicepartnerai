'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Server,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  Bot,
  Phone,
  Mic,
  MessageSquare,
  Calendar,
  Shield,
  Globe
} from 'lucide-react'

interface SystemStatus {
  name: string
  status: 'healthy' | 'warning' | 'error' | 'maintenance'
  uptime: string
  responseTime: number
  lastCheck: string
  details?: string
}

interface RecentEvent {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  timestamp: string
  source: string
  details?: string
}

const SYSTEM_COMPONENTS: SystemStatus[] = [
  {
    name: 'Voice API Gateway',
    status: 'healthy',
    uptime: '99.98%',
    responseTime: 45,
    lastCheck: '2024-01-15 14:32:15',
    details: 'Alle TTS/STT Services verfügbar'
  },
  {
    name: 'Agent Processing',
    status: 'healthy',
    uptime: '99.95%',
    responseTime: 120,
    lastCheck: '2024-01-15 14:32:10',
    details: '8 von 8 Agents aktiv'
  },
  {
    name: 'Database',
    status: 'warning',
    uptime: '99.89%',
    responseTime: 25,
    lastCheck: '2024-01-15 14:32:08',
    details: 'Hohe CPU-Auslastung (85%)'
  },
  {
    name: 'ElevenLabs API',
    status: 'healthy',
    uptime: '99.92%',
    responseTime: 180,
    lastCheck: '2024-01-15 14:32:12',
    details: 'Rate Limit: 1,250/2,000 pro Minute'
  },
  {
    name: 'OpenAI API',
    status: 'healthy',
    uptime: '99.97%',
    responseTime: 95,
    lastCheck: '2024-01-15 14:32:14',
    details: 'GPT-4 verfügbar, niedrige Latenz'
  },
  {
    name: 'Google Calendar API',
    status: 'healthy',
    uptime: '99.99%',
    responseTime: 65,
    lastCheck: '2024-01-15 14:32:13',
    details: 'OAuth-Token gültig bis 16:30'
  },
  {
    name: 'Twilio Telephony',
    status: 'error',
    uptime: '95.23%',
    responseTime: 0,
    lastCheck: '2024-01-15 14:30:45',
    details: 'Verbindung unterbrochen seit 14:28'
  },
  {
    name: 'Webhook Endpoints',
    status: 'healthy',
    uptime: '99.94%',
    responseTime: 35,
    lastCheck: '2024-01-15 14:32:16',
    details: 'Alle Callbacks funktional'
  }
]

const RECENT_EVENTS: RecentEvent[] = [
  {
    id: '1',
    type: 'error',
    message: 'Twilio Verbindung unterbrochen',
    timestamp: '2024-01-15 14:28:32',
    source: 'Telephony Service',
    details: 'Connection timeout nach 30s. Automatische Wiederherstellung in 5 Min.'
  },
  {
    id: '2',
    type: 'warning',
    message: 'Database CPU-Auslastung hoch',
    timestamp: '2024-01-15 14:25:18',
    source: 'Database Monitor',
    details: 'CPU bei 85% für 5+ Minuten. Skalierung empfohlen.'
  },
  {
    id: '3',
    type: 'success',
    message: 'Agent "Terminassistent Pro" deployed',
    timestamp: '2024-01-15 14:20:45',
    source: 'Agent Manager',
    details: 'Version 1.3.2 erfolgreich in Produktion bereitgestellt'
  },
  {
    id: '4',
    type: 'info',
    message: 'Geplante Wartung ElevenLabs',
    timestamp: '2024-01-15 14:15:00',
    source: 'External Provider',
    details: 'Wartungsfenster 02:00-04:00 UTC angekündigt für morgen'
  },
  {
    id: '5',
    type: 'success',
    message: '1000. erfolgreicher Anruf heute',
    timestamp: '2024-01-15 14:12:33',
    source: 'Call Analytics',
    details: 'Meilenstein erreicht - Durchschnitt 87% Erfolgsrate'
  }
]

export default function MonitoringPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h')

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Auto-refresh logic would go here
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'maintenance': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'error': return <XCircle className="h-4 w-4" />
      case 'maintenance': return <Settings className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getEventIcon = (type: RecentEvent['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      case 'info': return <Bell className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const healthyCount = SYSTEM_COMPONENTS.filter(c => c.status === 'healthy').length
  const warningCount = SYSTEM_COMPONENTS.filter(c => c.status === 'warning').length
  const errorCount = SYSTEM_COMPONENTS.filter(c => c.status === 'error').length

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
                <Activity className="h-6 w-6 mr-3" />
                System Monitoring
              </h1>
              <p className="text-muted-foreground">
                Echtzeit-Überwachung aller VoicePartnerAI Services
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Online</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Letztes Update: vor 30s</span>
            </div>
            
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-Refresh</span>
            </label>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesunde Services</p>
                <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnungen</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fehler</p>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamtverfügbarkeit</p>
                <p className="text-2xl font-bold text-foreground">99.2%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* System Components Status */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold flex items-center">
              <Server className="h-5 w-5 mr-2" />
              System Components
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {SYSTEM_COMPONENTS.map((component, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(component.status)}`}>
                        {getStatusIcon(component.status)}
                      </div>
                      <div>
                        <h4 className="font-medium">{component.name}</h4>
                        <p className="text-sm text-muted-foreground">{component.details}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(component.status)}`}>
                      {component.status === 'healthy' ? 'Gesund' :
                       component.status === 'warning' ? 'Warnung' :
                       component.status === 'error' ? 'Fehler' : 'Wartung'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Uptime</span>
                      <p className="font-medium">{component.uptime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Response</span>
                      <p className="font-medium">{component.responseTime}ms</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Zuletzt geprüft</span>
                      <p className="font-medium text-xs">{component.lastCheck.split(' ')[1]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Events */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Aktuelle Events
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {RECENT_EVENTS.slice(0, 6).map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30">
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground mb-1">{event.source}</p>
                      {event.details && (
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          {event.details}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Performance Metriken
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">API Response Time</span>
                  <span className="text-sm text-muted-foreground">Avg: 89ms</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">72%</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">6.2GB / 16GB</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '39%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Network I/O</span>
                  <span className="text-sm text-muted-foreground">↑ 45MB/s ↓ 127MB/s</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">99.2%</p>
                  <p className="text-sm text-muted-foreground">Uptime 30d</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">1.2k</p>
                  <p className="text-sm text-muted-foreground">Requests/min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}