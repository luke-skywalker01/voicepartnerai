'use client'

import { useState, useEffect } from 'react'
import { 
  Webhook, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  TestTube, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity, 
  Send, 
  RotateCcw,
  Settings,
  Globe,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  MoreVertical,
  Bell,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react'

interface VapiWebhook {
  id: string
  orgId: string
  name: string
  url: string
  description?: string
  status: 'active' | 'inactive' | 'failed' | 'testing'
  events: WebhookEvent[]
  security: {
    secret: string
    verifySSL: boolean
    authMethod: 'none' | 'basic' | 'bearer' | 'custom'
    authCredentials?: {
      username?: string
      password?: string
      token?: string
      headers?: Record<string, string>
    }
  }
  configuration: {
    timeout: number
    retryPolicy: {
      maxRetries: number
      retryDelay: number
      exponentialBackoff: boolean
    }
    headers: Record<string, string>
    contentType: 'application/json' | 'application/x-www-form-urlencoded'
  }
  statistics: {
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    averageResponseTime: number
    lastDelivery?: string
    lastSuccess?: string
    lastFailure?: string
  }
  createdAt: string
  updatedAt: string
  lastTriggeredAt?: string
  createdBy: string
}

type WebhookEvent = 
  | 'call.started'
  | 'call.ended'
  | 'call.failed'
  | 'call.transferred'
  | 'assistant.created'
  | 'assistant.updated'
  | 'assistant.deleted'
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'squad.activated'
  | 'squad.deactivated'
  | 'phone_number.assigned'
  | 'phone_number.released'
  | 'billing.threshold_reached'
  | 'billing.payment_required'
  | 'system.health_check'
  | 'system.maintenance_scheduled'

interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: any
  headers: Record<string, string>
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  attempts: number
  responseStatus?: number
  responseBody?: string
  responseTime?: number
  errorMessage?: string
  createdAt: string
  deliveredAt?: string
  nextRetryAt?: string
}

interface WebhookTestResult {
  webhookId: string
  success: boolean
  responseTime: number
  responseStatus?: number
  responseBody?: string
  errorMessage?: string
  timestamp: string
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<VapiWebhook[]>([])
  const [selectedWebhook, setSelectedWebhook] = useState<VapiWebhook | null>(null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [testResults, setTestResults] = useState<WebhookTestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set())

  const availableEvents = [
    'call.started', 'call.ended', 'call.failed', 'call.transferred',
    'assistant.created', 'assistant.updated', 'assistant.deleted',
    'workflow.started', 'workflow.completed', 'workflow.failed',
    'squad.activated', 'squad.deactivated',
    'phone_number.assigned', 'phone_number.released',
    'billing.threshold_reached', 'billing.payment_required',
    'system.health_check', 'system.maintenance_scheduled'
  ]

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/vapi/webhooks?includeStats=true')
      const data = await response.json()
      setWebhooks(data.webhooks || [])
    } catch (error) {
      console.error('Failed to load webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWebhookDetails = async (webhookId: string) => {
    try {
      const [detailsResponse, deliveriesResponse, testHistoryResponse] = await Promise.all([
        fetch(`/api/vapi/webhooks/${webhookId}`),
        fetch(`/api/vapi/webhooks/${webhookId}?includeDeliveries=true&deliveriesLimit=50`),
        fetch(`/api/vapi/webhooks/${webhookId}/test?limit=10`)
      ])
      
      const details = await detailsResponse.json()
      const deliveriesData = await deliveriesResponse.json()
      const testHistory = await testHistoryResponse.json()
      
      if (deliveriesData.deliveries) {
        setDeliveries(deliveriesData.deliveries)
      }
      if (testHistory.testHistory) {
        setTestResults(testHistory.testHistory)
      }
    } catch (error) {
      console.error('Failed to load webhook details:', error)
    }
  }

  const createWebhook = async (webhookData: any) => {
    try {
      const response = await fetch('/api/vapi/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      })
      
      if (response.ok) {
        setShowCreateModal(false)
        await loadWebhooks()
      }
    } catch (error) {
      console.error('Failed to create webhook:', error)
    }
  }

  const updateWebhookStatus = async (webhookId: string, status: string) => {
    try {
      const response = await fetch(`/api/vapi/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        await loadWebhooks()
      }
    } catch (error) {
      console.error('Failed to update webhook status:', error)
    }
  }

  const testWebhook = async (webhookId: string, testUrl?: string) => {
    setTesting(webhookId)
    try {
      const response = await fetch(`/api/vapi/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testUrl })
      })
      
      const data = await response.json()
      
      if (selectedWebhook?.id === webhookId) {
        await loadWebhookDetails(webhookId)
      }
    } catch (error) {
      console.error('Failed to test webhook:', error)
    } finally {
      setTesting(null)
    }
  }

  const rotateSecret = async (webhookId: string) => {
    if (!confirm('Are you sure you want to rotate the webhook secret? You will need to update your endpoint verification.')) {
      return
    }

    try {
      const response = await fetch(`/api/vapi/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate_secret' })
      })
      
      if (response.ok) {
        await loadWebhooks()
        if (selectedWebhook?.id === webhookId) {
          const updatedWebhook = webhooks.find(w => w.id === webhookId)
          if (updatedWebhook) {
            setSelectedWebhook(updatedWebhook)
          }
        }
      }
    } catch (error) {
      console.error('Failed to rotate secret:', error)
    }
  }

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/vapi/webhooks/${webhookId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadWebhooks()
        if (selectedWebhook?.id === webhookId) {
          setSelectedWebhook(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error)
    }
  }

  const toggleSecretVisibility = (webhookId: string) => {
    const newVisible = new Set(showSecrets)
    if (newVisible.has(webhookId)) {
      newVisible.delete(webhookId)
    } else {
      newVisible.add(webhookId)
    }
    setShowSecrets(newVisible)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'testing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'inactive': return <Pause className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'testing': return <TestTube className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'retrying': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'pending': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const filteredWebhooks = webhooks.filter(webhook => {
    const matchesSearch = webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webhook.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || webhook.status === statusFilter
    const matchesEvent = eventFilter === 'all' || webhook.events.includes(eventFilter as WebhookEvent)
    return matchesSearch && matchesStatus && matchesEvent
  })

  useEffect(() => {
    loadWebhooks()
  }, [])

  useEffect(() => {
    if (selectedWebhook) {
      loadWebhookDetails(selectedWebhook.id)
    }
  }, [selectedWebhook])

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
          <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Manage webhook endpoints and monitor delivery status
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Webhooks</p>
              <p className="text-3xl font-bold text-foreground">{webhooks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {webhooks.filter(w => w.status === 'active').length} active
              </p>
            </div>
            <Webhook className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
              <p className="text-3xl font-bold text-foreground">
                {webhooks.reduce((sum, w) => sum + w.statistics.totalDeliveries, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </div>
            <Send className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-foreground">
                {webhooks.length > 0 
                  ? Math.round((webhooks.reduce((sum, w) => sum + w.statistics.successfulDeliveries, 0) / 
                      webhooks.reduce((sum, w) => sum + w.statistics.totalDeliveries, 1)) * 100) 
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Delivery success
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
              <p className="text-3xl font-bold text-foreground">
                {webhooks.length > 0 
                  ? Math.round(webhooks.reduce((sum, w) => sum + w.statistics.averageResponseTime, 0) / webhooks.length)
                  : 0}ms
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Endpoint response
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search webhooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="failed">Failed</option>
            <option value="testing">Testing</option>
          </select>
          
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Events</option>
            {availableEvents.map(event => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors">
            <Download className="h-4 w-4" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">URL</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Events</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Deliveries</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Last Delivery</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWebhooks.map((webhook) => (
                <tr 
                  key={webhook.id} 
                  className="border-t border-border hover:bg-muted/25 transition-colors cursor-pointer"
                  onClick={() => setSelectedWebhook(selectedWebhook?.id === webhook.id ? null : webhook)}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{webhook.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {webhook.description || 'No description'}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm max-w-xs truncate">
                        {webhook.url}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(webhook.url, '_blank')
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getStatusColor(webhook.status)}`}>
                        {getStatusIcon(webhook.status)}
                        <span className="capitalize">{webhook.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 3).map(event => (
                        <span key={event} className="px-2 py-1 bg-muted rounded text-xs">
                          {event}
                        </span>
                      ))}
                      {webhook.events.length > 3 && (
                        <span className="px-2 py-1 bg-muted rounded text-xs">
                          +{webhook.events.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {webhook.statistics.totalDeliveries.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {webhook.statistics.successfulDeliveries}/{webhook.statistics.totalDeliveries} success
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">
                      {webhook.statistics.lastDelivery 
                        ? formatDate(webhook.statistics.lastDelivery) 
                        : 'Never'}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          testWebhook(webhook.id)
                        }}
                        disabled={testing === webhook.id}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        title="Test webhook"
                      >
                        {testing === webhook.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateWebhookStatus(webhook.id, webhook.status === 'active' ? 'inactive' : 'active')
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title={webhook.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {webhook.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Open edit modal
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteWebhook(webhook.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Details Panel */}
      {selectedWebhook && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">{selectedWebhook.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getStatusColor(selectedWebhook.status)}`}>
                {getStatusIcon(selectedWebhook.status)}
                <span className="capitalize">{selectedWebhook.status}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => testWebhook(selectedWebhook.id)}
                disabled={testing === selectedWebhook.id}
                className="px-3 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded text-sm flex items-center space-x-1 transition-colors disabled:opacity-50"
              >
                {testing === selectedWebhook.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                <span>Test</span>
              </button>
              <button
                onClick={() => setSelectedWebhook(null)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium">Configuration</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">URL</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-sm">{selectedWebhook.url}</code>
                    <button
                      onClick={() => copyToClipboard(selectedWebhook.url)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Events</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedWebhook.events.map(event => (
                      <span key={event} className="px-2 py-1 bg-muted rounded text-xs">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Timeout</label>
                  <p className="text-sm">{selectedWebhook.configuration.timeout}ms</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Retry Policy</label>
                  <p className="text-sm">
                    {selectedWebhook.configuration.retryPolicy.maxRetries} retries, {selectedWebhook.configuration.retryPolicy.retryDelay}s delay
                    {selectedWebhook.configuration.retryPolicy.exponentialBackoff && ' (exponential)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h4 className="font-medium">Security</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Webhook Secret</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-sm">
                      {showSecrets.has(selectedWebhook.id) 
                        ? selectedWebhook.security.secret 
                        : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => toggleSecretVisibility(selectedWebhook.id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSecrets.has(selectedWebhook.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(selectedWebhook.security.secret)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => rotateSecret(selectedWebhook.id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Rotate secret"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">SSL Verification</label>
                  <div className="flex items-center space-x-2">
                    {selectedWebhook.security.verifySSL ? (
                      <Lock className="h-4 w-4 text-green-600" />
                    ) : (
                      <Unlock className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      {selectedWebhook.security.verifySSL ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Authentication</label>
                  <p className="text-sm capitalize">{selectedWebhook.security.authMethod}</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h4 className="font-medium">Statistics</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Deliveries</p>
                    <p className="font-medium">{selectedWebhook.statistics.totalDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Successful</p>
                    <p className="font-medium text-green-600">{selectedWebhook.statistics.successfulDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failed</p>
                    <p className="font-medium text-red-600">{selectedWebhook.statistics.failedDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Response</p>
                    <p className="font-medium">{selectedWebhook.statistics.averageResponseTime}ms</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Success</label>
                  <p className="text-sm">
                    {selectedWebhook.statistics.lastSuccess 
                      ? formatDate(selectedWebhook.statistics.lastSuccess) 
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Failure</label>
                  <p className="text-sm">
                    {selectedWebhook.statistics.lastFailure 
                      ? formatDate(selectedWebhook.statistics.lastFailure) 
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="mt-8">
            <h4 className="font-medium mb-4">Recent Deliveries</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Event</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Attempts</th>
                    <th className="text-left p-2">Response</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.slice(0, 10).map((delivery) => (
                    <tr key={delivery.id} className="border-t border-border">
                      <td className="p-2">
                        <span className="px-2 py-1 bg-muted rounded text-xs">
                          {delivery.event}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${getDeliveryStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="p-2">{delivery.attempts}</td>
                      <td className="p-2">
                        {delivery.responseStatus && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            delivery.responseStatus < 300 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            delivery.responseStatus < 400 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {delivery.responseStatus}
                          </span>
                        )}
                      </td>
                      <td className="p-2">{delivery.responseTime || '--'}ms</td>
                      <td className="p-2">{formatDate(delivery.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-8">
              <h4 className="font-medium mb-4">Test Results</h4>
              <div className="space-y-3">
                {testResults.slice(0, 5).map((result) => (
                  <div key={result.timestamp} className={`border rounded-lg p-3 ${
                    result.success 
                      ? 'border-green-200 bg-green-50 dark:border-green-900/20 dark:bg-green-900/10' 
                      : 'border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {result.success ? 'Test Successful' : 'Test Failed'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(result.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.responseTime}ms
                        {result.responseStatus && ` • ${result.responseStatus}`}
                      </div>
                    </div>
                    {result.errorMessage && (
                      <p className="text-sm text-red-600 mt-2">{result.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New Webhook</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const webhookData = {
                name: formData.get('name'),
                url: formData.get('url'),
                description: formData.get('description'),
                events: formData.getAll('events'),
                security: {
                  verifySSL: formData.get('verifySSL') === 'on',
                  authMethod: formData.get('authMethod') || 'none'
                },
                configuration: {
                  timeout: parseInt(formData.get('timeout') as string || '30000'),
                  retryPolicy: {
                    maxRetries: parseInt(formData.get('maxRetries') as string || '3'),
                    retryDelay: parseInt(formData.get('retryDelay') as string || '60'),
                    exponentialBackoff: formData.get('exponentialBackoff') === 'on'
                  }
                }
              }
              createWebhook(webhookData)
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Production Webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL *</label>
                  <input
                    type="url"
                    name="url"
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://api.company.com/webhooks/vapi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Webhook for handling call events..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">Events *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="events"
                        value={event}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">Security & Configuration</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="verifySSL"
                        defaultChecked
                        className="rounded border-border"
                      />
                      <span className="text-sm">Verify SSL</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="exponentialBackoff"
                        defaultChecked
                        className="rounded border-border"
                      />
                      <span className="text-sm">Exponential Backoff</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
                  <input
                    type="number"
                    name="timeout"
                    defaultValue="30000"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Retries</label>
                  <input
                    type="number"
                    name="maxRetries"
                    defaultValue="3"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Retry Delay (s)</label>
                  <input
                    type="number"
                    name="retryDelay"
                    defaultValue="60"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}