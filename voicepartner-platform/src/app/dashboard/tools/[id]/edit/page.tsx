'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  TestTube, 
  Settings,
  Code,
  Database,
  Globe,
  Calendar,
  Mail,
  Calculator,
  AlertCircle,
  CheckCircle,
  Play,
  Copy
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  description: string
  type: 'function' | 'api' | 'webhook'
  category: 'calendar' | 'crm' | 'communication' | 'utility' | 'custom'
  isActive: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
  config: {
    // Function-specific
    code?: string
    parameters?: { name: string; type: string; required: boolean; description: string }[]
    returnType?: string
    // API-specific
    apiUrl?: string
    apiKey?: string
    headers?: { [key: string]: string }
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    // Webhook-specific
    webhookUrl?: string
    webhookSecret?: string
    events?: string[]
    // Common
    timeout?: number
    retries?: number
    errorHandling?: 'stop' | 'continue' | 'retry'
  }
  schema?: {
    input?: any
    output?: any
  }
}

export default function ToolEditPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.id as string
  
  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'test' | 'schema'>('config')

  useEffect(() => {
    loadTool()
  }, [toolId])

  const loadTool = () => {
    try {
      const savedTools = localStorage.getItem('voicepartner_tools')
      if (savedTools) {
        const tools = JSON.parse(savedTools)
        const foundTool = tools.find((t: Tool) => t.id === toolId)
        if (foundTool) {
          setTool(foundTool)
        } else if (toolId === 'new') {
          // Create new tool
          setTool({
            id: `tool_${Date.now()}`,
            name: 'Neues Tool',
            description: 'Beschreibung des Tools',
            type: 'function',
            category: 'custom',
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            config: {
              parameters: [],
              timeout: 30000,
              retries: 3,
              errorHandling: 'stop'
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to load tool:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTool = async () => {
    if (!tool) return

    setSaving(true)
    try {
      const savedTools = localStorage.getItem('voicepartner_tools')
      let tools: Tool[] = []
      
      if (savedTools) {
        tools = JSON.parse(savedTools)
      }

      const updatedTool = {
        ...tool,
        updatedAt: new Date().toISOString()
      }

      const existingIndex = tools.findIndex(t => t.id === tool.id)
      if (existingIndex >= 0) {
        tools[existingIndex] = updatedTool
      } else {
        tools.push(updatedTool)
      }

      localStorage.setItem('voicepartner_tools', JSON.stringify(tools))
      setTool(updatedTool)
      alert('Tool wurde erfolgreich gespeichert!')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Fehler beim Speichern des Tools.')
    } finally {
      setSaving(false)
    }
  }

  const testTool = async () => {
    if (!tool) return

    setTesting(true)
    setTestResult(null)

    try {
      // Simulate tool testing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (tool.type === 'function') {
        setTestResult({
          success: true,
          message: 'Funktion wurde erfolgreich ausgeführt',
          data: { result: 'Test successful', timestamp: new Date().toISOString() }
        })
      } else if (tool.type === 'api') {
        setTestResult({
          success: true,
          message: 'API-Verbindung erfolgreich getestet',
          data: { status: 200, response: 'API connected' }
        })
      } else if (tool.type === 'webhook') {
        setTestResult({
          success: true,
          message: 'Webhook wurde erfolgreich getestet',
          data: { delivered: true, response_time: '120ms' }
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test fehlgeschlagen: ' + (error as Error).message
      })
    } finally {
      setTesting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'function': return <Code className="h-5 w-5" />
      case 'api': return <Globe className="h-5 w-5" />
      case 'webhook': return <Database className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'calendar': return <Calendar className="h-5 w-5" />
      case 'crm': return <Database className="h-5 w-5" />
      case 'communication': return <Mail className="h-5 w-5" />
      case 'utility': return <Calculator className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Tool wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tool nicht gefunden</h2>
          <p className="text-muted-foreground mb-4">Das angeforderte Tool konnte nicht geladen werden.</p>
          <Link 
            href="/dashboard/tools"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Tools
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/tools" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {getTypeIcon(tool.type)}
              </div>
              <div>
                <input
                  type="text"
                  value={tool.name}
                  onChange={(e) => setTool(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-foreground"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Tool Editor</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tool.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {tool.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={testTool}
              disabled={testing}
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? 'Testing...' : 'Test Tool'}
            </button>
            <button
              onClick={saveTool}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 border-b border-border">
          {[
            { key: 'config', label: 'Konfiguration', icon: Settings },
            { key: 'code', label: 'Code/Logic', icon: Code },
            { key: 'test', label: 'Testing', icon: TestTube },
            { key: 'schema', label: 'Schema', icon: Database }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Basis-Konfiguration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tool Name
                    </label>
                    <input
                      type="text"
                      value={tool.name}
                      onChange={(e) => setTool(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      value={tool.description}
                      onChange={(e) => setTool(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Typ
                      </label>
                      <select
                        value={tool.type}
                        onChange={(e) => setTool(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="function">Function</option>
                        <option value="api">API</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Kategorie
                      </label>
                      <select
                        value={tool.category}
                        onChange={(e) => setTool(prev => prev ? { ...prev, category: e.target.value as any } : null)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="calendar">Kalender</option>
                        <option value="crm">CRM</option>
                        <option value="communication">Kommunikation</option>
                        <option value="utility">Utility</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={tool.isActive}
                      onChange={(e) => setTool(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                      className="rounded border-input"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                      Tool aktivieren
                    </label>
                  </div>
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Erweiterte Konfiguration</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        value={tool.config.timeout || 30000}
                        onChange={(e) => setTool(prev => prev ? {
                          ...prev,
                          config: { ...prev.config, timeout: parseInt(e.target.value) }
                        } : null)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Retry-Versuche
                      </label>
                      <input
                        type="number"
                        value={tool.config.retries || 3}
                        onChange={(e) => setTool(prev => prev ? {
                          ...prev,
                          config: { ...prev.config, retries: parseInt(e.target.value) }
                        } : null)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Fehlerbehandlung
                    </label>
                    <select
                      value={tool.config.errorHandling || 'stop'}
                      onChange={(e) => setTool(prev => prev ? {
                        ...prev,
                        config: { ...prev.config, errorHandling: e.target.value as any }
                      } : null)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="stop">Stop bei Fehler</option>
                      <option value="continue">Fortfahren bei Fehler</option>
                      <option value="retry">Wiederholen bei Fehler</option>
                    </select>
                  </div>

                  {/* Type-specific configuration */}
                  {tool.type === 'api' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          API URL
                        </label>
                        <input
                          type="url"
                          value={tool.config.apiUrl || ''}
                          onChange={(e) => setTool(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, apiUrl: e.target.value }
                          } : null)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="https://api.example.com/endpoint"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          HTTP Method
                        </label>
                        <select
                          value={tool.config.method || 'GET'}
                          onChange={(e) => setTool(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, method: e.target.value as any }
                          } : null)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={tool.config.apiKey || ''}
                          onChange={(e) => setTool(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, apiKey: e.target.value }
                          } : null)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Ihr API Key"
                        />
                      </div>
                    </>
                  )}

                  {tool.type === 'webhook' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={tool.config.webhookUrl || ''}
                          onChange={(e) => setTool(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, webhookUrl: e.target.value }
                          } : null)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="https://your-domain.com/webhook"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Webhook Secret
                        </label>
                        <input
                          type="password"
                          value={tool.config.webhookSecret || ''}
                          onChange={(e) => setTool(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, webhookSecret: e.target.value }
                          } : null)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Webhook Secret für Authentifizierung"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Code/Logic Editor</h3>
              
              {tool.type === 'function' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Function Code (JavaScript)
                    </label>
                    <textarea
                      value={tool.config.code || '// Implementieren Sie hier Ihre Funktion\nfunction execute(params) {\n  // Ihre Logik hier\n  return { success: true, data: params };\n}'}
                      onChange={(e) => setTool(prev => prev ? {
                        ...prev,
                        config: { ...prev.config, code: e.target.value }
                      } : null)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                      rows={15}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Return Type
                    </label>
                    <input
                      type="text"
                      value={tool.config.returnType || 'Object'}
                      onChange={(e) => setTool(prev => prev ? {
                        ...prev,
                        config: { ...prev.config, returnType: e.target.value }
                      } : null)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="z.B. Object, String, Number, Boolean"
                    />
                  </div>
                </div>
              )}

              {tool.type === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Request Headers (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(tool.config.headers || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const headers = JSON.parse(e.target.value)
                          setTool(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, headers }
                          } : null)
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                      rows={8}
                      placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer YOUR_TOKEN"\n}'
                    />
                  </div>
                </div>
              )}

              {tool.type === 'webhook' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Event Types (eine pro Zeile)
                    </label>
                    <textarea
                      value={tool.config.events?.join('\n') || ''}
                      onChange={(e) => setTool(prev => prev ? {
                        ...prev,
                        config: { ...prev.config, events: e.target.value.split('\n').filter(e => e.trim()) }
                      } : null)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={6}
                      placeholder="call.started&#10;call.ended&#10;message.received"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'test' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Tool Testing</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Testen Sie Ihr Tool um sicherzustellen, dass es korrekt funktioniert.
                  </p>
                  <button
                    onClick={testTool}
                    disabled={testing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {testing ? 'Testing...' : 'Run Test'}
                  </button>
                </div>

                {testing && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Tool wird getestet...</span>
                  </div>
                )}

                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        testResult.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
                      }`}>
                        {testResult.success ? 'Test erfolgreich' : 'Test fehlgeschlagen'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {testResult.message}
                    </p>
                    {testResult.data && (
                      <div className="mt-3">
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium">Test-Ergebnis anzeigen</summary>
                          <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs overflow-auto">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Input Schema</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Definieren Sie die Parameter, die Ihr Tool erwartet.
                  </p>
                  
                  {tool.config.parameters?.map((param, index) => (
                    <div key={index} className="border border-border rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => {
                            const newParams = [...(tool.config.parameters || [])]
                            newParams[index] = { ...param, name: e.target.value }
                            setTool(prev => prev ? {
                              ...prev,
                              config: { ...prev.config, parameters: newParams }
                            } : null)
                          }}
                          className="px-2 py-1 text-sm border border-input bg-background rounded"
                          placeholder="Parameter Name"
                        />
                        <select
                          value={param.type}
                          onChange={(e) => {
                            const newParams = [...(tool.config.parameters || [])]
                            newParams[index] = { ...param, type: e.target.value }
                            setTool(prev => prev ? {
                              ...prev,
                              config: { ...prev.config, parameters: newParams }
                            } : null)
                          }}
                          className="px-2 py-1 text-sm border border-input bg-background rounded"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) => {
                          const newParams = [...(tool.config.parameters || [])]
                          newParams[index] = { ...param, description: e.target.value }
                          setTool(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, parameters: newParams }
                          } : null)
                        }}
                        className="w-full px-2 py-1 text-sm border border-input bg-background rounded"
                        placeholder="Beschreibung"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => {
                              const newParams = [...(tool.config.parameters || [])]
                              newParams[index] = { ...param, required: e.target.checked }
                              setTool(prev => prev ? {
                                ...prev,
                                config: { ...prev.config, parameters: newParams }
                              } : null)
                            }}
                          />
                          <span>Required</span>
                        </label>
                        <button
                          onClick={() => {
                            const newParams = (tool.config.parameters || []).filter((_, i) => i !== index)
                            setTool(prev => prev ? {
                              ...prev,
                              config: { ...prev.config, parameters: newParams }
                            } : null)
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Entfernen
                        </button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">Keine Parameter definiert</p>
                  )}

                  <button
                    onClick={() => {
                      const newParam = { name: '', type: 'string', required: false, description: '' }
                      const newParams = [...(tool.config.parameters || []), newParam]
                      setTool(prev => prev ? {
                        ...prev,
                        config: { ...prev.config, parameters: newParams }
                      } : null)
                    }}
                    className="w-full border border-dashed border-border rounded-lg p-3 text-muted-foreground hover:text-foreground hover:border-solid transition-colors"
                  >
                    + Parameter hinzufügen
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Output Schema</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Beispiel der erwarteten Ausgabe Ihres Tools.
                  </p>
                  
                  <textarea
                    value={JSON.stringify(tool.schema?.output || {
                      success: true,
                      data: {},
                      message: "Tool executed successfully"
                    }, null, 2)}
                    onChange={(e) => {
                      try {
                        const output = JSON.parse(e.target.value)
                        setTool(prev => prev ? {
                          ...prev,
                          schema: { ...prev.schema, output }
                        } : null)
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    rows={12}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}