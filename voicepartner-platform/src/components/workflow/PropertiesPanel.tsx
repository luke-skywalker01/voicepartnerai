'use client'

import React from 'react'
import { 
  Settings, 
  MessageSquare, 
  Save,
  Code,
  Zap,
  Phone,
  AlertTriangle,
  Globe,
  Plus,
  Trash2
} from 'lucide-react'
import { useWorkflowStore } from '@/lib/workflow/store'

export const PropertiesPanel = ({ className }: { className?: string }) => {
  const { 
    nodes, 
    selectedNode, 
    updateNode,
    workflowName,
    setWorkflowName 
  } = useWorkflowStore()

  const node = nodes.find(n => n.id === selectedNode)

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return
    
    if (key.includes('.')) {
      // Handle nested updates like 'config.firstMessage'
      const [parent, child] = key.split('.')
      const currentNode = nodes.find(n => n.id === selectedNode)
      if (currentNode) {
        updateNode(selectedNode, {
          [parent]: {
            ...currentNode.data[parent as keyof typeof currentNode.data],
            [child]: value
          }
        })
      }
    } else {
      updateNode(selectedNode, { [key]: value })
    }
  }

  const addVariable = () => {
    if (!node) return
    const newVariable = `variable_${(node.data.variables?.length || 0) + 1}`
    updateNodeData('variables', [...(node.data.variables || []), newVariable])
  }

  const removeVariable = (index: number) => {
    if (!node) return
    const newVariables = node.data.variables?.filter((_, i) => i !== index) || []
    updateNodeData('variables', newVariables)
  }

  const updateVariable = (index: number, value: string) => {
    if (!node) return
    const newVariables = [...(node.data.variables || [])]
    newVariables[index] = value
    updateNodeData('variables', newVariables)
  }

  const addCondition = () => {
    if (!node) return
    const newCondition = {
      id: `condition_${Date.now()}`,
      description: 'Neue Bedingung',
      type: 'ai' as const
    }
    updateNodeData('conditions', [...(node.data.conditions || []), newCondition])
  }

  const removeCondition = (index: number) => {
    if (!node) return
    const newConditions = node.data.conditions?.filter((_, i) => i !== index) || []
    updateNodeData('conditions', newConditions)
  }

  if (!node) {
    return (
      <div className={`bg-white border-l border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12">
          <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Kein Node ausgewählt
          </h3>
          <p className="text-gray-500">
            Wähle einen Node aus, um dessen Eigenschaften zu bearbeiten.
          </p>
        </div>
      </div>
    )
  }

  const renderNodeConfig = () => {
    switch (node.data.type) {
      case 'conversation':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Erste Nachricht
              </label>
              <textarea
                value={node.data.config.firstMessage || ''}
                onChange={(e) => updateNodeData('config.firstMessage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                placeholder="Was soll der Bot als erstes sagen?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={node.data.config.prompt || ''}
                onChange={(e) => updateNodeData('config.prompt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={5}
                placeholder="Instruktionen für das AI-Modell..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modell
                </label>
                <select
                  value={node.data.config.model || 'gpt-4o'}
                  onChange={(e) => updateNodeData('config.model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatur
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={node.data.config.temperature || 0.7}
                  onChange={(e) => updateNodeData('config.temperature', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stimme
              </label>
              <select
                value={node.data.config.voice?.voiceId || 'german-female-1'}
                onChange={(e) => updateNodeData('config.voice', {
                  ...node.data.config.voice,
                  voiceId: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="german-female-1">Anna (Deutsch, Weiblich)</option>
                <option value="german-male-1">Max (Deutsch, Männlich)</option>
                <option value="english-female-1">Sarah (English, Female)</option>
              </select>
            </div>
          </div>
        )

      case 'api_request':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <input
                type="text"
                value={node.data.description || ''}
                onChange={(e) => updateNodeData('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Was macht dieser API-Aufruf?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTTP Methode
                </label>
                <select
                  value={node.data.config.method || 'GET'}
                  onChange={(e) => updateNodeData('config.method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={node.data.config.timeout || 10000}
                  onChange={(e) => updateNodeData('config.timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="url"
                value={node.data.config.url || ''}
                onChange={(e) => updateNodeData('config.url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers (JSON)
              </label>
              <textarea
                value={JSON.stringify(node.data.config.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value)
                    updateNodeData('config.headers', headers)
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-none"
                rows={4}
                placeholder='{"Authorization": "Bearer {{token}}"}'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body (JSON)
              </label>
              <textarea
                value={JSON.stringify(node.data.config.body || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const body = JSON.parse(e.target.value)
                    updateNodeData('config.body', body)
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-none"
                rows={4}
                placeholder='{"key": "{{variable}}"}'
              />
            </div>
          </div>
        )

      case 'tool':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool Name
              </label>
              <select
                value={node.data.config.toolName || 'custom_tool'}
                onChange={(e) => updateNodeData('config.toolName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="google_calendar_check">Google Calendar - Verfügbarkeit prüfen</option>
                <option value="google_calendar_create">Google Calendar - Termin erstellen</option>
                <option value="google_calendar_update">Google Calendar - Termin ändern</option>
                <option value="google_calendar_delete">Google Calendar - Termin löschen</option>
                <option value="custom_tool">Custom Tool</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={node.data.config.description || ''}
                onChange={(e) => updateNodeData('config.description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                placeholder="Was macht dieses Tool?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Function Schema (JSON)
              </label>
              <textarea
                value={JSON.stringify(node.data.config.function || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const func = JSON.parse(e.target.value)
                    updateNodeData('config.function', func)
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-none"
                rows={8}
                placeholder='{"name": "function_name", "parameters": {...}}'
              />
            </div>
          </div>
        )

      case 'transfer_call':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ziel-Telefonnummer
              </label>
              <input
                type="tel"
                value={node.data.config.destination || ''}
                onChange={(e) => updateNodeData('config.destination', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="+49 30 123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weiterleitungs-Nachricht
              </label>
              <textarea
                value={node.data.config.message || ''}
                onChange={(e) => updateNodeData('config.message', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                placeholder="Einen Moment bitte, ich verbinde Sie weiter."
              />
            </div>
          </div>
        )

      case 'end_call':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abschiedsnachricht
              </label>
              <textarea
                value={node.data.config.message || ''}
                onChange={(e) => updateNodeData('config.message', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                placeholder="Vielen Dank für Ihren Anruf. Auf Wiederhören!"
              />
            </div>
          </div>
        )

      case 'global':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={node.data.description || ''}
                onChange={(e) => updateNodeData('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                placeholder="Wann soll dieser globale Node aktiviert werden?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger
              </label>
              <select
                value={node.data.config.trigger || 'always_available'}
                onChange={(e) => updateNodeData('config.trigger', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="always_available">Immer verfügbar</option>
                <option value="keyword_trigger">Keyword-Trigger</option>
                <option value="error_fallback">Fehler-Fallback</option>
                <option value="timeout">Timeout-Handler</option>
              </select>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Konfiguration für diesen Node-Typ nicht verfügbar.</p>
          </div>
        )
    }
  }

  return (
    <div className={`bg-white border-l border-gray-200 overflow-y-auto ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        </div>

        {/* Node Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Titel
          </label>
          <input
            type="text"
            value={node.data.title}
            onChange={(e) => updateNodeData('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Node Titel eingeben..."
          />
        </div>

        {/* Node Configuration */}
        {renderNodeConfig()}

        {/* Variables Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Variablen extrahieren
            </label>
            <button
              onClick={addVariable}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Hinzufügen
            </button>
          </div>
          <div className="space-y-2">
            {node.data.variables?.map((variable, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={variable}
                  onChange={(e) => updateVariable(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="variable_name"
                />
                <button
                  onClick={() => removeVariable(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Variablen, die aus diesem Node extrahiert werden sollen
          </p>
        </div>

        {/* Conditions Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Ausgangs-Bedingungen
            </label>
            <button
              onClick={addCondition}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Hinzufügen
            </button>
          </div>
          <div className="space-y-3">
            {node.data.conditions?.map((condition, index) => (
              <div key={condition.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <select
                    value={condition.type}
                    onChange={(e) => {
                      const newConditions = [...(node.data.conditions || [])]
                      newConditions[index] = { 
                        ...condition, 
                        type: e.target.value as 'ai' | 'logical' 
                      }
                      updateNodeData('conditions', newConditions)
                    }}
                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="ai">KI-Bedingung</option>
                    <option value="logical">Logische Bedingung</option>
                  </select>
                  <button
                    onClick={() => removeCondition(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={condition.description}
                  onChange={(e) => {
                    const newConditions = [...(node.data.conditions || [])]
                    newConditions[index] = { ...condition, description: e.target.value }
                    updateNodeData('conditions', newConditions)
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Beschreibung der Bedingung..."
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Bedingungen für ausgehende Verbindungen
          </p>
        </div>
      </div>
    </div>
  )
}