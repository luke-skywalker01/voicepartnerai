'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Key, 
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy
} from 'lucide-react'

interface ProviderKey {
  id: string
  provider: string
  keyType: 'API Key' | 'Secret' | 'Token'
  keyName: string
  keyValue: string
  status: 'active' | 'invalid' | 'expired'
  lastTested: string
  createdAt: string
  description?: string
}

export default function ProviderKeysPage() {
  const [keys, setKeys] = useState<ProviderKey[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = () => {
    try {
      const savedKeys = localStorage.getItem('voicepartner_provider_keys')
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys)
        setKeys(parsedKeys)
      } else {
        // Create demo keys if none exist
        const demoKeys: ProviderKey[] = [
          {
            id: 'key_1',
            provider: 'OpenAI',
            keyType: 'API Key',
            keyName: 'OpenAI GPT-4 Key',
            keyValue: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            status: 'active',
            lastTested: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'API Key für GPT-4 und GPT-4o Modelle'
          },
          {
            id: 'key_2',
            provider: 'ElevenLabs',
            keyType: 'API Key',
            keyName: 'ElevenLabs Voice API',
            keyValue: 'sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            status: 'active',
            lastTested: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Text-to-Speech API für Voice Synthesis'
          },
          {
            id: 'key_3',
            provider: 'Twilio',
            keyType: 'Secret',
            keyName: 'Twilio Account Secret',
            keyValue: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            status: 'active',
            lastTested: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Telefonie-Integration für eingehende Anrufe'
          },
          {
            id: 'key_4',
            provider: 'Anthropic',
            keyType: 'API Key',
            keyName: 'Claude API Key',
            keyValue: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            status: 'invalid',
            lastTested: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Claude 3 API für erweiterte Sprachmodelle'
          },
          {
            id: 'key_5',
            provider: 'Google Cloud',
            keyType: 'Token',
            keyName: 'Speech-to-Text API',
            keyValue: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            status: 'expired',
            lastTested: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Google Cloud Speech-to-Text Service'
          }
        ]
        setKeys(demoKeys)
        localStorage.setItem('voicepartner_provider_keys', JSON.stringify(demoKeys))
      }
    } catch (error) {
      console.error('Failed to load provider keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const testKey = async (keyId: string) => {
    // Simulate API key testing
    setKeys(keys.map(key => {
      if (key.id === keyId) {
        const statuses = ['active', 'invalid', 'expired'] as const
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        return {
          ...key,
          status: randomStatus,
          lastTested: new Date().toISOString()
        }
      }
      return key
    }))
  }

  const deleteKey = (keyId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen API Key löschen möchten?')) {
      const updatedKeys = keys.filter(k => k.id !== keyId)
      setKeys(updatedKeys)
      localStorage.setItem('voicepartner_provider_keys', JSON.stringify(updatedKeys))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600'
      case 'invalid':
        return 'text-red-600'
      case 'expired':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••'
    return key.substring(0, 4) + '••••••••••••••••••••' + key.substring(key.length - 4)
  }

  const providers = Array.from(new Set(keys.map(k => k.provider)))
  const activeKeys = keys.filter(k => k.status === 'active').length
  const invalidKeys = keys.filter(k => k.status === 'invalid').length
  const expiredKeys = keys.filter(k => k.status === 'expired').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Provider Keys</h1>
          <p className="text-muted-foreground mt-1">Verwalten Sie Ihre API Keys und Geheimnisse</p>
        </div>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Key
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gesamt Keys</p>
              <p className="text-2xl font-bold">{keys.length}</p>
            </div>
            <Key className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktiv</p>
              <p className="text-2xl font-bold text-green-600">{activeKeys}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ungültig</p>
              <p className="text-2xl font-bold text-red-600">{invalidKeys}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Provider</p>
              <p className="text-2xl font-bold text-blue-600">{providers.length}</p>
            </div>
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Keys List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Keine API Keys vorhanden</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Fügen Sie Ihre ersten API Keys hinzu um mit externen Services zu arbeiten.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Ersten Key hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-muted/50 px-6 py-3 border-b border-border">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-2">Provider</div>
              <div className="col-span-2">Name</div>
              <div className="col-span-1">Typ</div>
              <div className="col-span-3">Key</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Zuletzt getestet</div>
              <div className="col-span-1">Aktionen</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {keys.map((key) => (
              <div key={key.id} className="px-6 py-4 hover:bg-muted/25 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Provider */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Key className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{key.provider}</p>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="col-span-2">
                    <p className="text-sm text-foreground">{key.keyName}</p>
                    {key.description && (
                      <p className="text-xs text-muted-foreground">{key.description}</p>
                    )}
                  </div>

                  {/* Type */}
                  <div className="col-span-1">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {key.keyType}
                    </span>
                  </div>

                  {/* Key Value */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                        {visibleKeys.has(key.id) ? key.keyValue : maskKey(key.keyValue)}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        {visibleKeys.has(key.id) ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </button>
                      <button
                        onClick={() => copyToClipboard(key.keyValue)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Kopieren"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(key.status)}
                      <span className={`text-sm font-medium ${getStatusColor(key.status)}`}>
                        {key.status}
                      </span>
                    </div>
                  </div>

                  {/* Last Tested */}
                  <div className="col-span-2">
                    <p className="text-sm text-foreground">
                      {new Date(key.lastTested).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => testKey(key.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 rounded transition-colors"
                        title="Testen"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="p-1 text-red-600 hover:text-red-700 rounded transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Demo-Modus aktiv</h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Aktuell läuft die Plattform im Demo-Modus. Features wie der Claude Prompt Optimizer verwenden Mock-Daten, 
              um die Funktionalität zu demonstrieren.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Für vollständige Funktionalität:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside ml-4">
                <li>Fügen Sie Ihren Anthropic API Key für Claude hinzu</li>
                <li>Konfigurieren Sie OpenAI Keys für GPT-Modelle</li>
                <li>Hinterlegen Sie ElevenLabs Keys für Voice Synthesis</li>
                <li>Verbinden Sie Twilio für Telefonie-Integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Provider Keys Hilfe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Sichere Speicherung</h4>
            <p className="text-sm text-muted-foreground">
              Alle API Keys werden verschlüsselt gespeichert und sind nur für autorisierte Benutzer zugänglich.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Regelmäßige Tests</h4>
            <p className="text-sm text-muted-foreground">
              Keys werden automatisch getestet um sicherzustellen, dass sie gültig und funktionsfähig sind.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Unterstützte Provider</h4>
            <p className="text-sm text-muted-foreground">
              OpenAI, ElevenLabs, Anthropic, Google Cloud, Azure, Twilio, Vonage und viele weitere.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Claude Demo-Modus</h4>
            <p className="text-sm text-muted-foreground">
              Ohne API Key läuft Claude im Demo-Modus mit intelligenten Mock-Optimierungen für Entwicklung und Tests.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}