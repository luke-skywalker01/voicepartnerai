'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Code, 
  Copy, 
  ExternalLink, 
  Book, 
  Zap, 
  MessageSquare, 
  Phone,
  Calendar,
  Mic,
  Bot,
  Settings,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  parameters?: { name: string; type: string; required: boolean; description: string }[]
  body?: { name: string; type: string; required: boolean; description: string }[]
  response: any
  example: {
    request?: any
    response: any
  }
}

const API_SECTIONS = [
  {
    id: 'agents',
    title: 'Voice Agents',
    icon: Bot,
    description: 'Verwalten Sie Ihre AI-gesteuerten Voice Agents',
    endpoints: [
      {
        method: 'GET' as const,
        path: '/api/agents',
        description: 'Alle Voice Agents abrufen',
        response: { agents: [], total: 0 },
        example: {
          response: {
            success: true,
            data: {
              agents: [
                {
                  id: 'agent_123',
                  name: 'Terminassistent',
                  description: 'Automatische Terminbuchung',
                  status: 'deployed',
                  createdAt: '2024-01-15T10:00:00Z',
                  voice: { provider: 'elevenlabs', voiceId: 'anna-german' },
                  model: { provider: 'openai', model: 'gpt-4' }
                }
              ],
              total: 1
            }
          }
        }
      },
      {
        method: 'POST' as const,
        path: '/api/agents',
        description: 'Neuen Voice Agent erstellen',
        body: [
          { name: 'name', type: 'string', required: true, description: 'Name des Agents' },
          { name: 'description', type: 'string', required: true, description: 'Beschreibung' },
          { name: 'systemPrompt', type: 'string', required: true, description: 'System Prompt' },
          { name: 'voice', type: 'object', required: true, description: 'Voice-Konfiguration' },
          { name: 'model', type: 'object', required: true, description: 'LLM-Konfiguration' }
        ],
        response: { agent: {} },
        example: {
          request: {
            name: 'Terminassistent',
            description: 'Automatische Terminbuchung',
            systemPrompt: 'Du bist ein freundlicher Terminassistent...',
            voice: { provider: 'elevenlabs', voiceId: 'anna-german' },
            model: { provider: 'openai', model: 'gpt-4' }
          },
          response: {
            success: true,
            data: { agent: { id: 'agent_123', name: 'Terminassistent' } }
          }
        }
      }
    ]
  },
  {
    id: 'calls',
    title: 'Anrufe & Gespräche',
    icon: Phone,
    description: 'Voice Calls und Gesprächsverläufe verwalten',
    endpoints: [
      {
        method: 'POST' as const,
        path: '/api/calls/start',
        description: 'Neuen Voice Call starten',
        body: [
          { name: 'agentId', type: 'string', required: true, description: 'ID des Voice Agents' },
          { name: 'phoneNumber', type: 'string', required: false, description: 'Telefonnummer (für ausgehende Anrufe)' },
          { name: 'context', type: 'object', required: false, description: 'Zusätzlicher Kontext' }
        ],
        response: { callId: '', status: 'started' },
        example: {
          request: {
            agentId: 'agent_123',
            phoneNumber: '+49301234567',
            context: { customerName: 'Max Mustermann' }
          },
          response: {
            success: true,
            data: {
              callId: 'call_456',
              status: 'started',
              agent: { id: 'agent_123', name: 'Terminassistent' },
              startedAt: '2024-01-15T14:30:00Z'
            }
          }
        }
      },
      {
        method: 'GET' as const,
        path: '/api/calls/{callId}',
        description: 'Call-Details und Transcript abrufen',
        parameters: [
          { name: 'callId', type: 'string', required: true, description: 'Eindeutige Call-ID' }
        ],
        response: { call: {}, transcript: [] },
        example: {
          response: {
            success: true,
            data: {
              call: {
                id: 'call_456',
                agentId: 'agent_123',
                status: 'completed',
                duration: 180,
                startedAt: '2024-01-15T14:30:00Z',
                endedAt: '2024-01-15T14:33:00Z'
              },
              transcript: [
                { speaker: 'assistant', text: 'Hallo! Möchten Sie einen Termin buchen?', timestamp: '2024-01-15T14:30:05Z' },
                { speaker: 'user', text: 'Ja, ich hätte gerne einen Termin.', timestamp: '2024-01-15T14:30:08Z' }
              ]
            }
          }
        }
      }
    ]
  },
  {
    id: 'voice',
    title: 'Voice Processing',
    icon: Mic,
    description: 'Text-to-Speech und Speech-to-Text Services',
    endpoints: [
      {
        method: 'POST' as const,
        path: '/api/voice',
        description: 'Voice Processing (TTS/STT)',
        body: [
          { name: 'action', type: 'string', required: true, description: 'Action: text_to_speech, speech_to_text, get_voices' },
          { name: 'text', type: 'string', required: false, description: 'Text für TTS' },
          { name: 'audioData', type: 'string', required: false, description: 'Audio Data für STT (Base64)' },
          { name: 'options', type: 'object', required: false, description: 'Zusätzliche Optionen' }
        ],
        response: { audioUrl: '', transcript: '', voices: [] },
        example: {
          request: {
            action: 'text_to_speech',
            text: 'Hallo! Möchten Sie einen Termin buchen?',
            options: { voice: 'anna', language: 'de-DE' }
          },
          response: {
            success: true,
            data: {
              audioUrl: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAP...',
              duration: 3.2,
              text: 'Hallo! Möchten Sie einen Termin buchen?',
              voice: 'anna',
              language: 'de-DE'
            }
          }
        }
      }
    ]
  },
  {
    id: 'calendar',
    title: 'Calendar Integration',
    icon: Calendar,
    description: 'Google Calendar und Terminmanagement',
    endpoints: [
      {
        method: 'POST' as const,
        path: '/api/tools/google-calendar',
        description: 'Google Calendar Operationen',
        body: [
          { name: 'action', type: 'string', required: true, description: 'Action: check_availability, create_event, get_events' },
          { name: 'accessToken', type: 'string', required: true, description: 'Google OAuth Access Token' },
          { name: 'calendarId', type: 'string', required: false, description: 'Calendar ID (default: primary)' }
        ],
        response: { availableSlots: [], events: [] },
        example: {
          request: {
            action: 'check_availability',
            accessToken: 'ya29.a0AfH6SMC...',
            startDate: '2024-01-15',
            endDate: '2024-01-17',
            duration: 60
          },
          response: {
            success: true,
            data: {
              availableSlots: [
                {
                  start: '2024-01-15T14:00:00+01:00',
                  end: '2024-01-15T15:00:00+01:00',
                  formatted: 'Morgen um 14:00'
                }
              ],
              total: 5,
              duration: 60
            }
          }
        }
      }
    ]
  }
]

export default function APIDocsPage() {
  const [activeSection, setActiveSection] = useState('agents')
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({})
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(key)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const renderEndpoint = (endpoint: APIEndpoint, sectionId: string, index: number) => {
    const key = `${sectionId}_${index}`
    const isExpanded = expandedEndpoints[key]

    const methodColors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800'
    }

    return (
      <div key={key} className="border border-border rounded-lg">
        <button
          onClick={() => toggleEndpoint(key)}
          className="w-full p-4 text-left hover:bg-muted/50 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 text-xs font-mono rounded ${methodColors[endpoint.method]}`}>
              {endpoint.method}
            </span>
            <code className="font-mono text-sm">{endpoint.path}</code>
            <span className="text-sm text-muted-foreground">{endpoint.description}</span>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {isExpanded && (
          <div className="border-t border-border p-4 space-y-6">
            {/* Parameters */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">URL Parameter</h4>
                <div className="space-y-2">
                  {endpoint.parameters.map((param) => (
                    <div key={param.name} className="flex items-center space-x-2 text-sm">
                      <code className="bg-muted px-2 py-1 rounded">{param.name}</code>
                      <span className="text-muted-foreground">{param.type}</span>
                      {param.required && <span className="text-red-500 text-xs">required</span>}
                      <span className="text-muted-foreground">- {param.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body */}
            {endpoint.body && endpoint.body.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <div className="space-y-2">
                  {endpoint.body.map((field) => (
                    <div key={field.name} className="flex items-center space-x-2 text-sm">
                      <code className="bg-muted px-2 py-1 rounded">{field.name}</code>
                      <span className="text-muted-foreground">{field.type}</span>
                      {field.required && <span className="text-red-500 text-xs">required</span>}
                      <span className="text-muted-foreground">- {field.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example */}
            <div>
              <h4 className="font-semibold mb-2">Beispiel</h4>
              
              {endpoint.example.request && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Request:</span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(endpoint.example.request, null, 2), `${key}_request`)}
                      className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copiedCode === `${key}_request` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    <code>{JSON.stringify(endpoint.example.request, null, 2)}</code>
                  </pre>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response:</span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(endpoint.example.response, null, 2), `${key}_response`)}
                    className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedCode === `${key}_response` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  <code>{JSON.stringify(endpoint.example.response, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const activeContentSection = API_SECTIONS.find(s => s.id === activeSection)

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
                <Code className="h-6 w-6 mr-3" />
                API Dokumentation
              </h1>
              <p className="text-muted-foreground">
                Vollständige REST API Referenz für VoicePartnerAI
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href="https://docs.vapi.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Vapi Docs
            </a>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* API Sections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 sticky top-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Book className="h-4 w-4 mr-2" />
                API Bereiche
              </h3>
              <div className="space-y-2">
                {API_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeSection === section.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {section.endpoints.length} Endpoints
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Start
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Base URL: <code className="bg-background px-1 rounded">https://your-domain.com</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  Alle API-Anfragen benötigen einen gültigen API-Key im Header.
                </p>
              </div>
            </div>
          </div>

          {/* API Documentation Content */}
          <div className="lg:col-span-3">
            {activeContentSection && (
              <div className="bg-card border border-border rounded-lg">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center space-x-3 mb-2">
                    <activeContentSection.icon className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-semibold">{activeContentSection.title}</h2>
                  </div>
                  <p className="text-muted-foreground">{activeContentSection.description}</p>
                </div>

                <div className="p-6 space-y-4">
                  {activeContentSection.endpoints.map((endpoint, index) => 
                    renderEndpoint(endpoint, activeContentSection.id, index)
                  )}
                </div>
              </div>
            )}

            {/* Authentication Info */}
            <div className="mt-6 bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Authentifizierung
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">API Key</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fügen Sie Ihren API-Key als Bearer Token in den Authorization Header ein:
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      <code>Authorization: Bearer YOUR_API_KEY</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth_header')}
                      className="absolute top-2 right-2 p-1 hover:bg-background rounded"
                    >
                      {copiedCode === 'auth_header' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Provider Konfiguration</h4>
                  <p className="text-sm text-muted-foreground">
                    Konfigurieren Sie Ihre Provider-API-Keys in den <Link href="/settings" className="text-primary hover:text-primary/80">Einstellungen</Link> 
                    bevor Sie die API verwenden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}