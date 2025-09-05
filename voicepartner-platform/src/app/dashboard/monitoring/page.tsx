'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Server, 
  Database, 
  Zap, 
  Globe, 
  Phone, 
  Bot, 
  Webhooks,
  HardDrive,
  Cpu,
  Memory,
  Network,
  RefreshCw,
  Bell,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Settings,
  Download,
  AlertCircle,
  Info,
  XCircle
} from 'lucide-react'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance'
  timestamp: string
  uptime: number
  version: string
  environment: 'production' | 'staging' | 'development'
  components: {
    api: ComponentHealth
    database: ComponentHealth
    messageQueue: ComponentHealth
    telephony: ComponentHealth
    ai_providers: ComponentHealth
    webhooks: ComponentHealth
    storage: ComponentHealth
    cdn: ComponentHealth
  }
  metrics: {
    cpu: {
      usage: number
      cores: number
      loadAverage: number[]
    }
    memory: {
      usage: number
      total: number
      free: number
      cached: number
    }
    disk: {
      usage: number
      total: number
      free: number
      iops: number
    }
    network: {
      inbound: number
      outbound: number
      connections: number
      latency: number
    }
  }
  performance: {
    apiResponseTime: number
    databaseQueryTime: number
    cacheHitRate: number
    errorRate: number
    throughput: number
  }
  alerts: SystemAlert[]
  lastCheck: string
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  responseTime: number
  errorRate: number
  lastCheck: string
  details?: {
    message?: string
    metrics?: Record<string, number>
    dependencies?: Array<{
      name: string
      status: string
      responseTime: number
    }>
  }
}

interface SystemAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  component: string
  title: string
  description: string
  threshold: number
  currentValue: number
  timestamp: string
  acknowledged: boolean
  resolvedAt?: string
  escalated: boolean
  actions: Array<{
    type: 'notification' | 'auto_scale' | 'failover' | 'restart'
    executed: boolean
    timestamp: string
  }>
}

interface SystemMetrics {
  timestamp: string
  requests: {
    total: number
    successful: number
    failed: number
    responseTime: {
      p50: number
      p95: number
      p99: number
      average: number
    }
  }
  calls: {
    active: number
    completed: number
    failed: number
    averageDuration: number
    concurrentPeak: number
  }
  resources: {
    cpu: number
    memory: number
    disk: number
    bandwidth: number
  }
  costs: {
    total: number
    providers: Record<string, number>
    trend: 'increasing' | 'decreasing' | 'stable'
  }
}

export default function SystemMonitoringPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [timeSeriesMetrics, setTimeSeriesMetrics] = useState<SystemMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false)

  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/vapi/monitoring/system?includeMetrics=true&metricsHours=24')
      const data = await response.json()
      
      setSystemHealth(data.systemHealth)
      if (data.timeSeriesMetrics) {
        setTimeSeriesMetrics(data.timeSeriesMetrics)
      }
    } catch (error) {
      console.error('Failed to load system health:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshSystem = async () => {
    setRefreshing(true)
    await loadSystemHealth()
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch('/api/vapi/monitoring/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge_alerts',
          alertIds: [alertId]
        })
      })
      
      // Refresh to get updated alert status
      await loadSystemHealth()
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const triggerComponentAction = async (component: string, actionType: string) => {
    try {
      await fetch('/api/vapi/monitoring/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'component_action',
          componentAction: { component, actionType }
        })
      })
      
      // Refresh to see updated status
      await loadSystemHealth()
    } catch (error) {
      console.error('Failed to trigger component action:', error)
    }
  }

  useEffect(() => {
    loadSystemHealth()
    
    if (autoRefresh) {
      const interval = setInterval(loadSystemHealth, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'degraded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'unhealthy': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'maintenance': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'api': return <Server className="h-5 w-5" />
      case 'database': return <Database className="h-5 w-5" />
      case 'messageQueue': return <Zap className="h-5 w-5" />
      case 'telephony': return <Phone className="h-5 w-5" />
      case 'ai_providers': return <Bot className="h-5 w-5" />
      case 'webhooks': return <Webhooks className="h-5 w-5" />
      case 'storage': return <HardDrive className="h-5 w-5" />
      case 'cdn': return <Globe className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const activeAlerts = systemHealth?.alerts.filter(a => !a.resolvedAt) || []
  const resolvedAlerts = systemHealth?.alerts.filter(a => a.resolvedAt) || []
  const criticalAlerts = activeAlerts.filter(a => a.type === 'critical')

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
          <h1 className="text-3xl font-bold text-foreground">System Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Real-time enterprise system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-md flex items-center font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
            }`}
          >
            {autoRefresh ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            Auto-refresh
          </button>
          <button
            onClick={refreshSystem}
            disabled={refreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Status</p>
              <p className={`text-2xl font-bold capitalize ${
                systemHealth?.status === 'healthy' ? 'text-green-600' :
                systemHealth?.status === 'degraded' ? 'text-yellow-600' :
                systemHealth?.status === 'unhealthy' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {systemHealth?.status || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                v{systemHealth?.version} ({systemHealth?.environment})
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              systemHealth?.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/20' :
              systemHealth?.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              systemHealth?.status === 'unhealthy' ? 'bg-red-100 dark:bg-red-900/20' :
              'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              {systemHealth?.status === 'healthy' ? <CheckCircle className="h-6 w-6 text-green-600" /> :
               systemHealth?.status === 'degraded' ? <AlertTriangle className="h-6 w-6 text-yellow-600" /> :
               systemHealth?.status === 'unhealthy' ? <XCircle className="h-6 w-6 text-red-600" /> :
               <Settings className="h-6 w-6 text-blue-600" />}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold text-foreground">
                {systemHealth ? formatUptime(systemHealth.uptime) : '--'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Since last restart
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-foreground">{activeAlerts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {criticalAlerts.length} critical
              </p>
            </div>
            <div className={`h-8 w-8 flex items-center justify-center ${
              criticalAlerts.length > 0 ? 'text-red-600' :
              activeAlerts.length > 0 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              <Bell className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">API Performance</p>
              <p className="text-2xl font-bold text-foreground">
                {systemHealth?.performance.apiResponseTime || '--'}ms
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {systemHealth?.performance.throughput || '--'} req/sec
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">CPU Usage</h3>
            <Cpu className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {systemHealth?.metrics.cpu.usage.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {systemHealth?.metrics.cpu.cores} cores
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(systemHealth?.metrics.cpu.usage || 0, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Load: {systemHealth?.metrics.cpu.loadAverage?.[0]?.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Memory Usage</h3>
            <Memory className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {systemHealth?.metrics.memory.usage.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {systemHealth ? formatBytes(systemHealth.metrics.memory.total) : '--'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(systemHealth?.metrics.memory.usage || 0, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Free: {systemHealth ? formatBytes(systemHealth.metrics.memory.free) : '--'}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Disk Usage</h3>
            <HardDrive className="h-5 w-5 text-purple-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {systemHealth?.metrics.disk.usage.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {systemHealth ? formatBytes(systemHealth.metrics.disk.total) : '--'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(systemHealth?.metrics.disk.usage || 0, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              IOPS: {systemHealth?.metrics.disk.iops || '--'}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Network</h3>
            <Network className="h-5 w-5 text-orange-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>In: {systemHealth?.metrics.network.inbound || '--'} MB/s</span>
              <span>Out: {systemHealth?.metrics.network.outbound || '--'} MB/s</span>
            </div>
            <div className="text-2xl font-bold">
              {systemHealth?.metrics.network.latency || '--'}ms
            </div>
            <div className="text-xs text-muted-foreground">
              {systemHealth?.metrics.network.connections || '--'} connections
            </div>
          </div>
        </div>
      </div>

      {/* Component Health */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Component Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemHealth && Object.entries(systemHealth.components).map(([name, component]) => (
            <div 
              key={name}
              className="border border-border rounded-lg p-4 hover:bg-muted/25 transition-colors cursor-pointer"
              onClick={() => setSelectedComponent(selectedComponent === name ? null : name)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getComponentIcon(name)}
                  <span className="font-medium capitalize">
                    {name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(component.status)}`}>
                  {component.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-medium">{component.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Error Rate</span>
                  <span className="font-medium">{component.errorRate.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last check: {new Date(component.lastCheck).toLocaleTimeString()}
                </div>
              </div>

              {selectedComponent === name && component.details && (
                <div className="mt-4 pt-4 border-t border-border">
                  {component.details.message && (
                    <p className="text-sm text-muted-foreground mb-3">{component.details.message}</p>
                  )}
                  
                  {component.details.metrics && (
                    <div className="space-y-2 mb-3">
                      {Object.entries(component.details.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {component.details.dependencies && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dependencies</h4>
                      {component.details.dependencies.map((dep, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span>{dep.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{dep.responseTime}ms</span>
                            <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(dep.status)}`}>
                              {dep.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        triggerComponentAction(name, 'health_check')
                      }}
                      className="text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90 px-2 py-1 rounded transition-colors"
                    >
                      Health Check
                    </button>
                    {component.status !== 'healthy' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          triggerComponentAction(name, 'restart')
                        }}
                        className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded transition-colors"
                      >
                        Restart
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Performance Trends (24h)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Response Time */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">API Response Time</h4>
            <div className="h-32 flex items-end space-x-1">
              {timeSeriesMetrics.slice(-24).map((metric, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500/20 rounded-t hover:bg-blue-500/30 transition-colors"
                  style={{ height: `${Math.max((metric.requests.responseTime.average / 1000) * 32, 4)}px` }}
                  title={`${metric.requests.responseTime.average}ms at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>-24h</span>
              <span>Now</span>
            </div>
          </div>

          {/* Request Volume */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Request Volume</h4>
            <div className="h-32 flex items-end space-x-1">
              {timeSeriesMetrics.slice(-24).map((metric, i) => (
                <div
                  key={i}
                  className="flex-1 bg-green-500/20 rounded-t hover:bg-green-500/30 transition-colors"
                  style={{ height: `${Math.max((metric.requests.total / 1000) * 32, 4)}px` }}
                  title={`${metric.requests.total} requests at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>-24h</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">System Alerts</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowResolvedAlerts(!showResolvedAlerts)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showResolvedAlerts ? 'Hide' : 'Show'} resolved ({resolvedAlerts.length})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Active Alerts */}
          {activeAlerts.map((alert) => (
            <div key={alert.id} className={`border rounded-lg p-4 ${
              alert.type === 'critical' ? 'border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10' :
              alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/20 dark:bg-yellow-900/10' :
              'border-blue-200 bg-blue-50 dark:border-blue-900/20 dark:bg-blue-900/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Component: {alert.component}</span>
                      <span>Threshold: {alert.threshold}</span>
                      <span>Current: {alert.currentValue.toFixed(2)}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-1 rounded transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.acknowledged && (
                    <span className="text-xs text-muted-foreground">Acknowledged</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Resolved Alerts */}
          {showResolvedAlerts && resolvedAlerts.map((alert) => (
            <div key={alert.id} className="border border-border rounded-lg p-4 bg-muted/25">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 opacity-75">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Resolved: {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '--'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activeAlerts.length === 0 && !showResolvedAlerts && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">No active alerts - all systems operational</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}