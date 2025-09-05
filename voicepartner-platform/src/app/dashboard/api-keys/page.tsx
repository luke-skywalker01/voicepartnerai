'use client'

import { useState, useEffect } from 'react'
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Shield, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings, 
  RotateCcw,
  Download,
  Filter,
  Search,
  MoreVertical,
  Globe,
  Lock,
  Unlock,
  Pause,
  Play,
  TrendingUp,
  DollarSign,
  BarChart3
} from 'lucide-react'

interface VapiApiKey {
  id: string
  orgId: string
  name: string
  keyPrefix: string
  hashedKey: string
  permissions: {
    assistants: ('read' | 'write' | 'delete')[]
    calls: ('read' | 'write' | 'delete')[]
    phoneNumbers: ('read' | 'write' | 'delete')[]
    workflows: ('read' | 'write' | 'delete')[]
    squads: ('read' | 'write' | 'delete')[]
    billing: ('read')[]
    analytics: ('read')[]
  }
  restrictions: {
    ipWhitelist?: string[]
    rateLimits: {
      requestsPerMinute: number
      requestsPerHour: number
      requestsPerDay: number
    }
    allowedOrigins?: string[]
    expiresAt?: string
  }
  usage: {
    totalRequests: number
    totalCost: number
    lastUsed?: string
    requestsThisMonth: number
    requestsToday: number
  }
  status: 'active' | 'revoked' | 'expired' | 'suspended'
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
  createdBy: string
}

interface ApiKeyUsageLog {
  id: string
  apiKeyId: string
  timestamp: string
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  userAgent: string
  ipAddress: string
  requestSize: number
  responseSize: number
  cost: number
  errorMessage?: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<VapiApiKey[]>([])
  const [selectedKey, setSelectedKey] = useState<VapiApiKey | null>(null)
  const [usageLogs, setUsageLogs] = useState<ApiKeyUsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newKeyData, setNewKeyData] = useState<any>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/vapi/api-keys')
      const data = await response.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadKeyUsage = async (keyId: string) => {
    try {
      const response = await fetch(`/api/vapi/api-keys/${keyId}?includeLogs=true&logsLimit=100`)
      const data = await response.json()
      if (data.usageLogs) {
        setUsageLogs(data.usageLogs)
      }
    } catch (error) {
      console.error('Failed to load key usage:', error)
    }
  }

  const createApiKey = async (keyData: any) => {
    try {
      const response = await fetch('/api/vapi/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyData)
      })
      const data = await response.json()
      
      if (response.ok) {
        setNewKeyData(data)
        setShowKeyModal(true)
        setShowCreateModal(false)
        await loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    }
  }

  const updateApiKey = async (keyId: string, updates: any) => {
    try {
      const response = await fetch(`/api/vapi/api-keys/${keyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        await loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to update API key:', error)
    }
  }

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/vapi/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' })
      })
      
      if (response.ok) {
        await loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    }
  }

  const rotateApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to rotate this API key? The old key will be immediately invalidated.')) {
      return
    }

    try {
      const response = await fetch(`/api/vapi/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setNewKeyData(data)
        setShowKeyModal(true)
        await loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to rotate API key:', error)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
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
      case 'revoked': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'expired': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'suspended': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'revoked': return <XCircle className="h-4 w-4" />
      case 'expired': return <Clock className="h-4 w-4" />
      case 'suspended': return <Pause className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.keyPrefix.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || key.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    loadApiKeys()
  }, [])

  useEffect(() => {
    if (selectedKey) {
      loadKeyUsage(selectedKey.id)
    }
  }, [selectedKey])

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
          <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Manage authentication keys and monitor API usage
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Keys</p>
              <p className="text-3xl font-bold text-foreground">{apiKeys.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {apiKeys.filter(k => k.status === 'active').length} active
              </p>
            </div>
            <Key className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Requests Today</p>
              <p className="text-3xl font-bold text-foreground">
                {apiKeys.reduce((sum, key) => sum + key.usage.requestsToday, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across all keys
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="text-3xl font-bold text-foreground">
                ${apiKeys.reduce((sum, key) => sum + key.usage.totalCost, 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All time usage
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Security Issues</p>
              <p className="text-3xl font-bold text-foreground">
                {apiKeys.filter(k => k.status === 'revoked' || k.status === 'suspended').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Revoked/suspended
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
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
              placeholder="Search API keys..."
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
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
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

      {/* API Keys List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Key</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Usage</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Last Used</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map((key) => (
                <tr 
                  key={key.id} 
                  className="border-t border-border hover:bg-muted/25 transition-colors cursor-pointer"
                  onClick={() => setSelectedKey(selectedKey?.id === key.id ? null : key)}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDate(key.createdAt)}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {visibleKeys.has(key.id) ? key.keyPrefix + '...' : '••••••••••••••••'}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleKeyVisibility(key.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(key.keyPrefix + '...')
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getStatusColor(key.status)}`}>
                        {getStatusIcon(key.status)}
                        <span className="capitalize">{key.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium">{key.usage.totalRequests.toLocaleString()} requests</p>
                      <p className="text-xs text-muted-foreground">${key.usage.totalCost.toFixed(2)} total</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">
                      {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
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
                          rotateApiKey(key.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Rotate key"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          revokeApiKey(key.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Revoke key"
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

      {/* Key Details Panel */}
      {selectedKey && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{selectedKey.name} - Details</h3>
            <button
              onClick={() => setSelectedKey(null)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Key Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Full Key Prefix</label>
                  <p className="font-mono text-sm">{selectedKey.keyPrefix}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Created By</label>
                  <p className="text-sm">{selectedKey.createdBy}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Created</label>
                  <p className="text-sm">{formatDate(selectedKey.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{formatDate(selectedKey.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h4 className="font-medium">Permissions</h4>
              <div className="space-y-2">
                {Object.entries(selectedKey.permissions).map(([resource, perms]) => (
                  <div key={resource} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{resource}</span>
                    <div className="flex space-x-1">
                      {(perms as string[]).map((perm) => (
                        <span key={perm} className="px-2 py-1 bg-muted rounded text-xs">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restrictions */}
            <div className="space-y-4">
              <h4 className="font-medium">Security Restrictions</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Rate Limits</label>
                  <div className="text-sm space-y-1">
                    <p>{selectedKey.restrictions.rateLimits.requestsPerMinute}/min</p>
                    <p>{selectedKey.restrictions.rateLimits.requestsPerHour}/hour</p>
                    <p>{selectedKey.restrictions.rateLimits.requestsPerDay}/day</p>
                  </div>
                </div>
                {selectedKey.restrictions.ipWhitelist && (
                  <div>
                    <label className="text-sm text-muted-foreground">IP Whitelist</label>
                    <div className="text-sm">
                      {selectedKey.restrictions.ipWhitelist.map((ip, i) => (
                        <p key={i} className="font-mono">{ip}</p>
                      ))}
                    </div>
                  </div>
                )}
                {selectedKey.restrictions.expiresAt && (
                  <div>
                    <label className="text-sm text-muted-foreground">Expires</label>
                    <p className="text-sm">{formatDate(selectedKey.restrictions.expiresAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Logs */}
          <div className="mt-8">
            <h4 className="font-medium mb-4">Recent Usage</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">Method</th>
                    <th className="text-left p-2">Endpoint</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Response Time</th>
                    <th className="text-left p-2">Cost</th>
                    <th className="text-left p-2">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {usageLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="border-t border-border">
                      <td className="p-2">{formatDate(log.timestamp)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                          log.method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          log.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="p-2 font-mono">{log.endpoint}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.statusCode < 300 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          log.statusCode < 400 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="p-2">{log.responseTime}ms</td>
                      <td className="p-2">${log.cost.toFixed(4)}</td>
                      <td className="p-2 font-mono">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New API Key</h3>
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
              const keyData = {
                name: formData.get('name'),
                permissions: {
                  assistants: formData.getAll('assistants-perms'),
                  calls: formData.getAll('calls-perms'),
                  phoneNumbers: formData.getAll('phoneNumbers-perms'),
                  workflows: formData.getAll('workflows-perms'),
                  squads: formData.getAll('squads-perms'),
                  billing: formData.getAll('billing-perms'),
                  analytics: formData.getAll('analytics-perms')
                },
                restrictions: {
                  rateLimits: {
                    requestsPerMinute: parseInt(formData.get('rateLimitMinute') as string || '1000'),
                    requestsPerHour: parseInt(formData.get('rateLimitHour') as string || '50000'),
                    requestsPerDay: parseInt(formData.get('rateLimitDay') as string || '1000000')
                  },
                  ipWhitelist: (formData.get('ipWhitelist') as string)?.split(',').map(ip => ip.trim()).filter(Boolean),
                  allowedOrigins: (formData.get('allowedOrigins') as string)?.split(',').map(origin => origin.trim()).filter(Boolean)
                }
              }
              createApiKey(keyData)
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Production API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">Permissions</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['assistants', 'calls', 'phoneNumbers', 'workflows', 'squads', 'billing', 'analytics'].map((resource) => (
                    <div key={resource} className="space-y-2">
                      <h4 className="text-sm font-medium capitalize">{resource}</h4>
                      <div className="space-y-1">
                        {(resource === 'billing' || resource === 'analytics' ? ['read'] : ['read', 'write', 'delete']).map((perm) => (
                          <label key={perm} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name={`${resource}-perms`}
                              value={perm}
                              defaultChecked={perm === 'read'}
                              className="rounded border-border"
                            />
                            <span className="text-sm capitalize">{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">Rate Limits</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Per Minute</label>
                    <input
                      type="number"
                      name="rateLimitMinute"
                      defaultValue="1000"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Per Hour</label>
                    <input
                      type="number"
                      name="rateLimitHour"
                      defaultValue="50000"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Per Day</label>
                    <input
                      type="number"
                      name="rateLimitDay"
                      defaultValue="1000000"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">IP Whitelist (optional)</label>
                  <input
                    type="text"
                    name="ipWhitelist"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="192.168.1.0/24, 10.0.0.0/8"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated list</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Allowed Origins (optional)</label>
                  <input
                    type="text"
                    name="allowedOrigins"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://app.company.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated list</p>
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
                  Create API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showKeyModal && newKeyData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">API Key Created</h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Your new API key:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm font-mono">
                    {newKeyData.newRawKey || newKeyData.rawKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKeyData.newRawKey || newKeyData.rawKey)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/40 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Save this key securely
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This is the only time you'll see the full key. Store it securely as it cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowKeyModal(false)
                    setNewKeyData(null)
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  I've saved the key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}