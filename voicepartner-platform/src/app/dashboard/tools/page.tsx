'use client'

import { useState, useEffect } from 'react'
import { 
  Wrench,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Code,
  Database,
  Globe,
  Webhook,
  Settings,
  MoreVertical
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  parameters: {
    name: string
    type: 'string' | 'number' | 'boolean' | 'object'
    description: string
    required: boolean
    default?: any
  }[]
  headers?: Record<string, string>
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic'
    key?: string
    headerName?: string
  }
  responseFormat?: {
    successPath?: string
    errorPath?: string
  }
  ownerId: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  category: 'api' | 'webhook' | 'database' | 'service'
  usage: {
    totalCalls: number
    lastUsed?: string
    avgResponseTime?: number
  }
}

interface ToolStats {
  totalTools: number
  activeTools: number
  totalCalls: number
  byCategory: Record<string, number>
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [stats, setStats] = useState<ToolStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [testingTool, setTestingTool] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'api' | 'webhook' | 'database' | 'service'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTools()
  }, [filter, categoryFilter])

  const loadTools = async () => {
    setLoading(true)
    try {
      let url = '/api/tools?limit=50'
      if (filter !== 'all') {
        url += `&active=${filter === 'active'}`
      }
      if (categoryFilter !== 'all') {
        url += `&category=${categoryFilter}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setTools(data.data.tools)
        setStats(data.data.stats)
      } else {
        console.error('Failed to load tools:', data.error)
      }
    } catch (error) {
      console.error('Error loading tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTool = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const toolData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      endpoint: formData.get('endpoint') as string,
      method: formData.get('method') as string,
      category: formData.get('category') as string,
      parameters: [], // Will be configured later
      authentication: {
        type: formData.get('authType') as string,
        key: formData.get('authKey') as string,
        headerName: formData.get('authHeader') as string
      }
    }
    
    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTools()
        setShowCreateDialog(false)
        ;(event.target as HTMLFormElement).reset()
      } else {
        alert(`Creation failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('Creation failed')
    }
  }

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Tool löschen möchten?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/tools?id=${toolId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTools()
      } else {
        alert(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  const handleTestTool = async (tool: Tool, testParams: Record<string, any>) => {
    setTestingTool(tool.id)
    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolId: tool.id,
          parameters: testParams
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Tool executed successfully!\nExecution time: ${data.data.executionTime}ms\nResult: ${JSON.stringify(data.data.result, null, 2)}`)
        await loadTools() // Refresh to update usage stats
      } else {
        alert(`Execution failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Test error:', error)
      alert('Test execution failed')
    } finally {
      setTestingTool(null)
    }
  }

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api': return <Globe className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'service': return <Settings className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'api': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'webhook': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'database': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'service': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tools</h1>
          <p className="text-muted-foreground mt-1">
            Konfigurieren Sie externe Funktionen für Ihre KI-Assistenten
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => loadTools()}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neues Tool
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt Tools</p>
                <p className="text-2xl font-bold">{stats.totalTools}</p>
              </div>
              <Wrench className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive Tools</p>
                <p className="text-2xl font-bold">{stats.activeTools}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte Aufrufe</p>
                <p className="text-2xl font-bold">{stats.totalCalls}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Tools</p>
                <p className="text-2xl font-bold">{stats.byCategory.api || 0}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tools durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {['all', 'active', 'inactive'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
              }`}
            >
              {filterOption === 'all' ? 'Alle' : 
               filterOption === 'active' ? 'Aktiv' : 'Inaktiv'}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          {['all', 'api', 'webhook', 'database', 'service'].map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                categoryFilter === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
              }`}
            >
              {category === 'all' ? 'Alle' : category.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm ? 'Keine Tools gefunden' : 'Keine Tools vorhanden'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchTerm 
              ? 'Versuchen Sie andere Suchbegriffe'
              : 'Erstellen Sie Ihr erstes Tool, um externe Funktionen zu integrieren.'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Erstes Tool erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {getCategoryIcon(tool.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{tool.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(tool.category)}`}>
                      {tool.category.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setSelectedTool(tool)
                      setShowTestDialog(true)
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                    title="Tool testen"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTool(tool.id)}
                    className="p-1 text-red-600 hover:text-red-800 rounded"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {tool.description}
              </p>

              {/* Technical Details */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <span className="font-medium truncate ml-2" title={tool.endpoint}>
                    {tool.endpoint.replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Methode:</span>
                  <span className="font-medium">{tool.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parameter:</span>
                  <span className="font-medium">{tool.parameters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${tool.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {tool.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aufrufe:</span>
                  <span className="font-medium">{tool.usage.totalCalls}</span>
                </div>
                {tool.usage.avgResponseTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ø Response:</span>
                    <span className="font-medium">{tool.usage.avgResponseTime}ms</span>
                  </div>
                )}
                {tool.usage.lastUsed && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zuletzt:</span>
                    <span className="font-medium">
                      {new Date(tool.usage.lastUsed).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedTool(tool)
                    setShowTestDialog(true)
                  }}
                  disabled={testingTool === tool.id}
                  className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/30 text-center transition-colors disabled:opacity-50"
                >
                  {testingTool === tool.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full inline mr-1"></div>
                      Teste...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 inline mr-1" />
                      Testen
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.open(tool.endpoint, '_blank')}
                  className="p-2 border border-border rounded-md hover:bg-muted transition-colors"
                  title="Endpoint öffnen"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tool Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Neues Tool erstellen</h3>
            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tool Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="z.B. Wetter-API"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Beschreibung</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Beschreiben Sie die Funktion dieses Tools..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">API Endpoint</label>
                <input
                  type="url"
                  name="endpoint"
                  required
                  placeholder="https://api.example.com/endpoint"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">HTTP Methode</label>
                  <select
                    name="method"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Kategorie</label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="api">API</option>
                    <option value="webhook">Webhook</option>
                    <option value="database">Database</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Authentifizierung</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="authType"
                    className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Keine</option>
                    <option value="api_key">API Key</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                  <input
                    type="text"
                    name="authHeader"
                    placeholder="Header Name"
                    className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <input
                    type="password"
                    name="authKey"
                    placeholder="API Key/Token"
                    className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Tool erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Tool Dialog */}
      {showTestDialog && selectedTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tool testen: {selectedTool.name}</h3>
              <button
                onClick={() => setShowTestDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const testParams: Record<string, any> = {}
              selectedTool.parameters.forEach(param => {
                const value = formData.get(param.name)
                if (value) {
                  testParams[param.name] = param.type === 'number' ? Number(value) : value
                }
              })
              handleTestTool(selectedTool, testParams)
            }} className="space-y-4">
              {selectedTool.parameters.length > 0 ? (
                selectedTool.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium mb-2">
                      {param.name} {param.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={param.type === 'number' ? 'number' : 'text'}
                      name={param.name}
                      required={param.required}
                      defaultValue={param.default}
                      placeholder={param.description}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Dieses Tool benötigt keine Parameter.</p>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTestDialog(false)}
                  className="flex-1 border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={testingTool === selectedTool.id}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {testingTool === selectedTool.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                      Teste...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Tool ausführen
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}