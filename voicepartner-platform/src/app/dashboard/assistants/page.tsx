'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Bot, Edit, Trash2, Play, Copy, PhoneOutgoing } from 'lucide-react'

interface Assistant {
  id: string
  name: string
  description: string
  status: 'draft' | 'deployed' | 'testing'
  createdAt: string
  updatedAt: string
  voice: {
    provider: string
    voiceId: string
  }
  model: {
    provider: string
    model: string
  }
  type?: 'simple' | 'workflow'
}

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'simple' | 'workflow'>('all')

  useEffect(() => {
    loadAssistants()
  }, [])

  const loadAssistants = async () => {
    setLoading(true)
    try {
      // Load from new Vapi-compatible API
      const response = await fetch('/api/vapi/assistants?limit=50')
      const data = await response.json()
      
      if (data.assistants) {
        // Transform Vapi assistants to our format
        const transformedAssistants = data.assistants.map((assistant: any) => ({
          id: assistant.id,
          name: assistant.name,
          description: assistant.firstMessage || 'Vapi Assistant',
          status: 'deployed' as const,
          createdAt: assistant.createdAt,
          updatedAt: assistant.updatedAt,
          voice: {
            provider: assistant.voice?.provider || 'elevenlabs',
            voiceId: assistant.voice?.voiceId || 'default'
          },
          model: {
            provider: assistant.model?.provider || 'openai',
            model: assistant.model?.model || 'gpt-3.5-turbo'
          },
          type: 'simple' as const
        }))
        setAssistants(transformedAssistants)
      } else {
        // Fallback: create demo assistants if none exist
        const demoAssistants = [
          {
            id: 'demo_1',
            name: 'Customer Service Bot',
            description: 'Friendly customer support assistant with FAQ knowledge',
            status: 'deployed' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            voice: { provider: 'elevenlabs', voiceId: 'rachel' },
            model: { provider: 'openai', model: 'gpt-3.5-turbo' },
            type: 'simple' as const
          },
          {
            id: 'demo_2', 
            name: 'Sales Assistant',
            description: 'Persuasive sales representative for lead qualification',
            status: 'draft' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            voice: { provider: 'elevenlabs', voiceId: 'daniel' },
            model: { provider: 'openai', model: 'gpt-4' },
            type: 'workflow' as const
          }
        ]
        setAssistants(demoAssistants)
      }
    } catch (error) {
      console.error('Failed to load assistants:', error)
      // Create demo assistants on error
      const demoAssistants = [
        {
          id: 'demo_1',
          name: 'Customer Service Bot',
          description: 'Friendly customer support assistant with FAQ knowledge',
          status: 'deployed' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          voice: { provider: 'elevenlabs', voiceId: 'rachel' },
          model: { provider: 'openai', model: 'gpt-3.5-turbo' },
          type: 'simple' as const
        }
      ]
      setAssistants(demoAssistants)
    } finally {
      setLoading(false)
    }
  }

  const deleteAssistant = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Assistant löschen möchten?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/assistants?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadAssistants() // Reload from API
      } else {
        // Fallback to localStorage
        const updated = assistants.filter(a => a.id !== id)
        setAssistants(updated)
        if (typeof window !== 'undefined') {
          localStorage.setItem('voicepartner_agents', JSON.stringify(updated))
        }
      }
    } catch (error) {
      console.error('Delete error:', error)
      // Fallback to localStorage on error
      const updated = assistants.filter(a => a.id !== id)
      setAssistants(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('voicepartner_agents', JSON.stringify(updated))
      }
    }
  }

  const duplicateAssistant = async (assistant: Assistant) => {
    const duplicateData = {
      ...assistant,
      name: `${assistant.name} (Kopie)`,
      status: 'draft',
      description: `${assistant.description} (Kopie)`
    }
    
    try {
      const response = await fetch('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicateData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadAssistants() // Reload from API
      } else {
        // Fallback to localStorage
        const duplicate = {
          ...assistant,
          id: `agent_${Date.now()}`,
          name: `${assistant.name} (Kopie)`,
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const updated = [...assistants, duplicate]
        setAssistants(updated)
        if (typeof window !== 'undefined') {
          localStorage.setItem('voicepartner_agents', JSON.stringify(updated))
        }
      }
    } catch (error) {
      console.error('Duplicate error:', error)
      // Fallback to localStorage on error
      const duplicate = {
        ...assistant,
        id: `agent_${Date.now()}`,
        name: `${assistant.name} (Kopie)`,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updated = [...assistants, duplicate]
      setAssistants(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('voicepartner_agents', JSON.stringify(updated))
      }
    }
  }

  const filteredAssistants = assistants.filter(assistant => {
    if (activeTab === 'all') return true
    if (activeTab === 'simple') return !assistant.type || assistant.type === 'simple'
    if (activeTab === 'workflow') return assistant.type === 'workflow'
    return true
  })

  const simpleAssistants = assistants.filter(a => !a.type || a.type === 'simple')
  const workflowAssistants = assistants.filter(a => a.type === 'workflow')

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Voice Assistants</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre AI-gesteuerten Voice Assistants
          </p>
        </div>
        <Link
          href="/dashboard/assistants/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center font-medium transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Assistant
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold text-foreground">{assistants.length}</p>
            </div>
            <Bot className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Simple Assistants</p>
              <p className="text-2xl font-bold text-foreground">{simpleAssistants.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Workflow Assistants</p>
              <p className="text-2xl font-bold text-foreground">{workflowAssistants.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Alle ({assistants.length})
        </button>
        <button
          onClick={() => setActiveTab('simple')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'simple'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Simple ({simpleAssistants.length})
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'workflow'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Workflow ({workflowAssistants.length})
        </button>
      </div>

      {/* Assistants List */}
      {filteredAssistants.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {assistants.length === 0 ? 'Noch keine Assistants' : 'Keine Assistants gefunden'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {assistants.length === 0 
              ? 'Erstellen Sie Ihren ersten Voice Assistant und bringen Sie Ihr Business ins Gespräch.'
              : 'Versuchen Sie andere Filter.'
            }
          </p>
          {assistants.length === 0 && (
            <Link
              href="/dashboard/assistants/new"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ersten Assistant erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssistants.map((assistant) => (
            <div key={assistant.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    assistant.type === 'workflow' 
                      ? 'bg-purple-100 dark:bg-purple-900/20' 
                      : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    <Bot className={`h-5 w-5 ${
                      assistant.type === 'workflow' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{assistant.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      assistant.type === 'workflow'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {assistant.type === 'workflow' ? 'Workflow' : 'Simple'}
                    </span>
                  </div>
                </div>
                
                <span className={`text-xs px-2 py-1 rounded-full ${
                  assistant.status === 'deployed' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : assistant.status === 'testing'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {assistant.status === 'deployed' ? 'Live' : 
                   assistant.status === 'testing' ? 'Testing' : 'Draft'}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {assistant.description}
              </p>

              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voice:</span>
                  <span className="font-medium">{assistant.voice?.provider || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{assistant.model?.model || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Erstellt:</span>
                  <span className="font-medium">
                    {new Date(assistant.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/test?assistant=${assistant.id}`}
                  className="flex-1 px-3 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 text-center transition-colors"
                >
                  <Play className="h-4 w-4 inline mr-1" />
                  Testen
                </Link>
                <Link
                  href={`/outbound?assistant=${assistant.id}`}
                  className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 text-center transition-colors"
                  title="Outbound-Anruf mit diesem Assistant starten"
                >
                  <PhoneOutgoing className="h-4 w-4 inline mr-1" />
                  Anrufen
                </Link>
                <Link
                  href={`/dashboard/assistants/${assistant.id}/edit`}
                  className="p-2 border border-border rounded-md hover:bg-muted transition-colors"
                  title="Bearbeiten"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => duplicateAssistant(assistant)}
                  className="p-2 border border-border rounded-md hover:bg-muted transition-colors"
                  title="Duplizieren"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteAssistant(assistant.id)}
                  className="p-2 text-destructive border border-destructive/20 rounded-md hover:bg-destructive/10 transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}