'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Globe,
  Lock,
  ArrowLeft,
  Copy,
  RefreshCw,
  Download,
  Trash2,
  Plus
} from 'lucide-react'

interface SecurityEvent {
  id: string
  type: 'login' | 'api_access' | 'failed_login' | 'password_change' | 'mfa_enabled'
  description: string
  timestamp: string
  ip: string
  location: string
  device: string
  status: 'success' | 'failed' | 'warning'
}

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed: string
  created: string
  status: 'active' | 'inactive'
}

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login',
    description: 'Erfolgreiche Anmeldung',
    timestamp: '2024-01-15T10:30:00Z',
    ip: '192.168.1.100',
    location: 'Berlin, Deutschland',
    device: 'Chrome auf Windows',
    status: 'success'
  },
  {
    id: '2',
    type: 'api_access',
    description: 'API Zugriff auf Voice Endpoints',
    timestamp: '2024-01-15T09:15:00Z',
    ip: '192.168.1.100',
    location: 'Berlin, Deutschland',
    device: 'API Client',
    status: 'success'
  },
  {
    id: '3',
    type: 'failed_login',
    description: 'Fehlgeschlagene Anmeldung',
    timestamp: '2024-01-14T22:45:00Z',
    ip: '203.0.113.0',
    location: 'Unbekannt',
    device: 'Chrome auf Linux',
    status: 'failed'
  }
]

const mockAPIKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API',
    key: 'vp_live_sk_1234567890abcdef',
    permissions: ['voice:read', 'voice:write', 'agents:read', 'agents:write'],
    lastUsed: '2024-01-15T09:15:00Z',
    created: '2024-01-01T00:00:00Z',
    status: 'active'
  },
  {
    id: '2',
    name: 'Development API',
    key: 'vp_test_sk_abcdef1234567890',
    permissions: ['voice:read', 'agents:read'],
    lastUsed: '2024-01-10T14:30:00Z',
    created: '2024-01-05T00:00:00Z',
    status: 'active'
  }
]

export default function SecurityPage() {
  const [securityEvents] = useState<SecurityEvent[]>(mockSecurityEvents)
  const [apiKeys, setApiKeys] = useState<APIKey[]>(mockAPIKeys)
  const [activeTab, setActiveTab] = useState('overview')
  const [showMFAModal, setShowMFAModal] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false)

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed_login':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'api_access':
        return <Key className="h-4 w-4 text-blue-600" />
      case 'mfa_enabled':
        return <Shield className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('In Zwischenablage kopiert!')
  }

  const revokeAPIKey = (keyId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen API-Schlüssel widerrufen möchten?')) {
      setApiKeys(keys => keys.filter(k => k.id !== keyId))
    }
  }

  const tabs = [
    { id: 'overview', name: 'Übersicht', icon: Shield },
    { id: 'activity', name: 'Sicherheitsaktivität', icon: Eye },
    { id: 'api-keys', name: 'API Schlüssel', icon: Key },
    { id: 'settings', name: 'Sicherheitseinstellungen', icon: Settings }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Score */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sicherheitsbewertung</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">85/100</div>
            <Shield className="h-6 w-6 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Zwei-Faktor-Authentifizierung</span>
            <div className="flex items-center space-x-2">
              {mfaEnabled ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Aktiviert</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <button
                    onClick={() => setShowMFAModal(true)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Jetzt aktivieren
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Starkes Passwort</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Aktiviert</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">API Schlüssel Rotation</span>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-600">Empfohlen</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Verdächtige Aktivitäten</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Keine gefunden</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Zwei-Faktor-Auth</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Erhöhen Sie die Sicherheit Ihres Kontos mit 2FA
          </p>
          <button
            onClick={() => setShowMFAModal(true)}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {mfaEnabled ? 'Verwalten' : 'Aktivieren'}
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">API Schlüssel</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Verwalten Sie Ihre API-Zugangsschlüssel
          </p>
          <button
            onClick={() => setActiveTab('api-keys')}
            className="w-full px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted"
          >
            Verwalten
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Aktivitätslog</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Laden Sie Ihre Sicherheitsaktivitäten herunter
          </p>
          <button className="w-full px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted">
            Herunterladen
          </button>
        </div>
      </div>
    </div>
  )

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Letzte Sicherheitsaktivitäten</h3>
        <button className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Exportieren
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ereignis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Zeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  IP-Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Standort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Gerät
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {securityEvents.map((event) => (
                <tr key={event.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getEventIcon(event.type)}
                      <span className="text-sm font-medium">{event.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {event.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {event.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {event.device}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'success' ? 'bg-green-100 text-green-800' :
                      event.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status === 'success' ? 'Erfolgreich' :
                       event.status === 'failed' ? 'Fehlgeschlagen' : 'Warnung'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderAPIKeys = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Schlüssel</h3>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre API-Zugangsschlüssel für die VoicePartnerAI API</p>
        </div>
        <button
          onClick={() => setShowAPIKeyModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Schlüssel
        </button>
      </div>

      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold">{apiKey.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Erstellt am {new Date(apiKey.created).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  apiKey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {apiKey.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => revokeAPIKey(apiKey.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Widerrufen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">API Schlüssel</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-muted text-sm rounded border">
                    {apiKey.key.substring(0, 20)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(apiKey.key)}
                    className="p-2 border border-border rounded hover:bg-muted"
                    title="Kopieren"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Berechtigungen</label>
                <div className="flex flex-wrap gap-1">
                  {apiKey.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Zuletzt verwendet: {new Date(apiKey.lastUsed).toLocaleString('de-DE')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sicherheitseinstellungen</h3>

      <div className="space-y-6">
        {/* Password Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Passwort-Einstellungen</h4>
          <div className="space-y-4">
            <button className="w-full md:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Passwort ändern
            </button>
            <div className="flex items-center justify-between">
              <span className="text-sm">Automatische Passwort-Rotation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Session-Einstellungen</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Automatische Abmeldung (Stunden)</span>
              <select className="px-3 py-2 border border-input rounded-md bg-background">
                <option value="1">1 Stunde</option>
                <option value="2">2 Stunden</option>
                <option value="8" selected>8 Stunden</option>
                <option value="24">24 Stunden</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Gleichzeitige Sessions begrenzen</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* IP Restrictions */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="font-semibold mb-4">IP-Beschränkungen</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">IP-basierte Zugriffsbeschränkung</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Erlaubte IP-Adressen</label>
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                rows={3}
                placeholder="192.168.1.0/24&#10;203.0.113.0&#10;..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 hover:bg-muted rounded-md">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Security</h1>
              <p className="text-muted-foreground">Sicherheitseinstellungen und Überwachung</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'activity' && renderActivity()}
        {activeTab === 'api-keys' && renderAPIKeys()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* MFA Modal */}
      {showMFAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Zwei-Faktor-Authentifizierung</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Erhöhen Sie die Sicherheit Ihres Kontos durch Aktivierung der Zwei-Faktor-Authentifizierung.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowMFAModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setMfaEnabled(true)
                  setShowMFAModal(false)
                  alert('2FA wurde aktiviert!')
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Aktivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showAPIKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Neuen API Schlüssel erstellen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  placeholder="z.B. Production API"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Berechtigungen</label>
                <div className="space-y-2">
                  {['voice:read', 'voice:write', 'agents:read', 'agents:write'].map((perm) => (
                    <label key={perm} className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowAPIKeyModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowAPIKeyModal(false)
                  alert('API Schlüssel wurde erstellt!')
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}