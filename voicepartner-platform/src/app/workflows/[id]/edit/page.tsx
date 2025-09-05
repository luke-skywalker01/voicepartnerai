'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Settings, 
  Plus,
  Trash2,
  Copy,
  GitBranch,
  Calendar,
  Phone,
  Database,
  Globe,
  MessageSquare,
  Mail,
  Webhook,
  ArrowRight,
  ArrowDown,
  Edit,
  Check,
  X,
  AlertTriangle,
  Info,
  Users
} from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'integration'
  name: string
  description: string
  position: { x: number; y: number }
  config: any
  connections: string[]
  status: 'active' | 'inactive' | 'error'
}

interface WorkflowData {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  variables: { [key: string]: any }
  settings: {
    errorHandling: 'stop' | 'continue' | 'retry'
    timeout: number
    logging: boolean
  }
}

export default function WorkflowEditPage() {
  const params = useParams()
  const workflowId = params.id as string
  
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [showNodePalette, setShowNodePalette] = useState(false)
  const [availableTools, setAvailableTools] = useState<any[]>([])
  
  // Load available tools
  useEffect(() => {
    loadAvailableTools()
  }, [])

  const loadAvailableTools = () => {
    try {
      const savedTools = localStorage.getItem('voicepartner_tools')
      if (savedTools) {
        const tools = JSON.parse(savedTools)
        setAvailableTools(tools.filter((tool: any) => tool.isActive))
      }
    } catch (error) {
      console.error('Failed to load tools:', error)
    }
  }

  // Available node types that can be added to the workflow
  const getNodeTypes = () => {
    // Base node types
    const baseNodes = [
      {
        type: 'trigger',
        name: 'Voice Call Started',
        description: 'Ausgelöst wenn ein Voice Agent Anruf beginnt',
        icon: Phone,
        config: { event: 'call_started' }
      },
      {
        type: 'trigger', 
        name: 'Keyword Detected',
        description: 'Ausgelöst wenn bestimmte Wörter erkannt werden',
        icon: MessageSquare,
        config: { keywords: [], caseSensitive: false }
      },
      {
        type: 'condition',
        name: 'If Condition',
        description: 'Bedingte Verzweigung basierend auf Variablen',
        icon: GitBranch,
        config: { condition: '', trueFlow: [], falseFlow: [] }
      }
    ]

    // Convert available tools to action nodes
    const toolNodes = availableTools.map(tool => ({
      type: 'action',
      name: tool.name,
      description: tool.description,
      icon: getToolIcon(tool.category),
      config: {
        toolId: tool.id,
        toolType: tool.type,
        ...getToolDefaultConfig(tool)
      }
    }))

    return [...baseNodes, ...toolNodes]
  }

  const getToolIcon = (category: string) => {
    switch (category) {
      case 'calendar': return Calendar
      case 'crm': return Database
      case 'communication': return Mail
      case 'utility': return Settings
      default: return Settings
    }
  }

  const getToolDefaultConfig = (tool: any) => {
    switch (tool.type) {
      case 'api':
        return {
          url: tool.config?.apiUrl || '',
          method: tool.config?.method || 'GET',
          headers: tool.config?.headers || {},
          timeout: tool.config?.timeout || 30000
        }
      case 'webhook':
        return {
          webhookUrl: tool.config?.webhookUrl || '',
          events: tool.config?.events || [],
          secret: tool.config?.webhookSecret || ''
        }
      case 'function':
        return {
          parameters: tool.config?.parameters || [],
          code: tool.config?.code || '',
          returnType: tool.config?.returnType || 'Object'
        }
      default:
        return {}
    }
  }

  useEffect(() => {
    loadWorkflow()
  }, [workflowId])

  const loadWorkflow = () => {
    // In production, this would be an API call
    const savedWorkflows = localStorage.getItem('voicepartner_workflows')
    if (savedWorkflows) {
      try {
        const workflows = JSON.parse(savedWorkflows)
        const found = workflows.find((w: WorkflowData) => w.id === workflowId)
        if (found) {
          setWorkflow(found)
        } else {
          // Create new workflow if not found - check for template types
          const newWorkflow: WorkflowData = createWorkflowTemplate()
          setWorkflow(newWorkflow)
        }
      } catch (error) {
        console.error('Failed to load workflow:', error)
      }
    } else {
      // Create new workflow if localStorage is empty
      const newWorkflow: WorkflowData = createWorkflowTemplate()
      setWorkflow(newWorkflow)
    }
  }

  const createWorkflowTemplate = (): WorkflowData => {
    // Check if this is a template workflow based on ID
    if (workflowId.startsWith('calendar_')) {
      return createCalendarWorkflowTemplate()
    } else if (workflowId.startsWith('crm_')) {
      return createCRMWorkflowTemplate()
    } else if (workflowId.startsWith('webhook_')) {
      return createWebhookWorkflowTemplate()
    } else if (workflowId.startsWith('routing_')) {
      return createRoutingWorkflowTemplate()
    } else {
      // Default template
      return {
        id: workflowId,
        name: 'Neuer Workflow',
        description: 'Beschreibung des Workflows',
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            name: 'Voice Call Started',
            description: 'Workflow startet automatisch bei Anrufbeginn',
            position: { x: 100, y: 100 },
            config: { event: 'call_started' },
            connections: [],
            status: 'active'
          }
        ],
        variables: {},
        settings: {
          errorHandling: 'stop',
          timeout: 30000,
          logging: true
        }
      }
    }
  }

  const createCalendarWorkflowTemplate = (): WorkflowData => ({
    id: workflowId,
    name: 'Kalender-Integration Workflow',
    description: 'Automatische Terminbuchung mit Google Calendar Integration',
    nodes: [
      {
        id: 'start',
        type: 'trigger',
        name: 'Keyword Detected',
        description: 'Ausgelöst bei Terminbuchungs-Keywords',
        position: { x: 100, y: 100 },
        config: { keywords: ['termin', 'buchung', 'terminvereinbarung', 'appointment'], caseSensitive: false },
        connections: ['check_calendar'],
        status: 'active'
      },
      {
        id: 'check_calendar',
        type: 'action',
        name: 'Google Calendar Check',
        description: 'Prüft Verfügbarkeit in Google Calendar',
        position: { x: 400, y: 100 },
        config: { calendarId: 'primary', timeRange: 30 },
        connections: ['send_confirmation'],
        status: 'active'
      },
      {
        id: 'send_confirmation',
        type: 'action',
        name: 'Send Email',
        description: 'Sendet Terminbestätigung per E-Mail',
        position: { x: 700, y: 100 },
        config: { to: '', subject: 'Terminbestätigung', template: 'appointment_confirmation' },
        connections: [],
        status: 'active'
      }
    ],
    variables: {
      customerName: '',
      customerEmail: '',
      appointmentDate: '',
      serviceType: ''
    },
    settings: {
      errorHandling: 'continue',
      timeout: 60000,
      logging: true
    }
  })

  const createCRMWorkflowTemplate = (): WorkflowData => ({
    id: workflowId,
    name: 'CRM-Integration Workflow',
    description: 'Automatische Kundendaten-Synchronisation mit CRM-System',
    nodes: [
      {
        id: 'start',
        type: 'trigger',
        name: 'Voice Call Started',
        description: 'Workflow startet bei jedem Anruf',
        position: { x: 100, y: 100 },
        config: { event: 'call_started' },
        connections: ['collect_data'],
        status: 'active'
      },
      {
        id: 'collect_data',
        type: 'condition',
        name: 'If Condition',
        description: 'Prüft ob Kundendaten vollständig sind',
        position: { x: 400, y: 100 },
        config: { condition: 'customer.name && customer.phone', trueFlow: ['update_crm'], falseFlow: [] },
        connections: ['update_crm'],
        status: 'active'
      },
      {
        id: 'update_crm',
        type: 'integration',
        name: 'CRM Update',
        description: 'Aktualisiert Kundendaten im CRM',
        position: { x: 700, y: 100 },
        config: { system: 'salesforce', action: 'upsert_contact' },
        connections: [],
        status: 'active'
      }
    ],
    variables: {
      customerData: {},
      crmContactId: ''
    },
    settings: {
      errorHandling: 'retry',
      timeout: 45000,
      logging: true
    }
  })

  const createWebhookWorkflowTemplate = (): WorkflowData => ({
    id: workflowId,
    name: 'API-Webhook Workflow',
    description: 'Integration mit externen APIs über Webhooks',
    nodes: [
      {
        id: 'start',
        type: 'trigger',
        name: 'Voice Call Started',
        description: 'Workflow startet bei Anrufbeginn',
        position: { x: 100, y: 100 },
        config: { event: 'call_started' },
        connections: ['webhook_call'],
        status: 'active'
      },
      {
        id: 'webhook_call',
        type: 'action',
        name: 'Webhook Call',
        description: 'Ruft externe API auf',
        position: { x: 400, y: 100 },
        config: { 
          url: 'https://api.example.com/webhook', 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: { event: 'call_started', timestamp: '{{timestamp}}' }
        },
        connections: ['process_response'],
        status: 'active'
      },
      {
        id: 'process_response',
        type: 'condition',
        name: 'If Condition',
        description: 'Verarbeitet API-Antwort',
        position: { x: 700, y: 100 },
        config: { condition: 'webhook.response.status === "success"', trueFlow: [], falseFlow: [] },
        connections: [],
        status: 'active'
      }
    ],
    variables: {
      apiResponse: {},
      webhookData: {}
    },
    settings: {
      errorHandling: 'continue',
      timeout: 30000,
      logging: true
    }
  })

  const createRoutingWorkflowTemplate = (): WorkflowData => ({
    id: workflowId,
    name: 'Call Routing Workflow',
    description: 'Intelligente Anrufweiterleitung basierend auf Intent',
    nodes: [
      {
        id: 'start',
        type: 'trigger',
        name: 'Voice Call Started',
        description: 'Workflow startet bei Anrufbeginn',
        position: { x: 100, y: 100 },
        config: { event: 'call_started' },
        connections: ['intent_detection'],
        status: 'active'
      },
      {
        id: 'intent_detection',
        type: 'condition',
        name: 'If Condition',
        description: 'Erkennt Kundenintent für Routing',
        position: { x: 400, y: 100 },
        config: { 
          condition: 'customer.intent === "support"', 
          trueFlow: ['route_support'], 
          falseFlow: ['route_sales'] 
        },
        connections: ['route_support', 'route_sales'],
        status: 'active'
      },
      {
        id: 'route_support',
        type: 'action',
        name: 'Webhook Call',
        description: 'Weiterleitung an Support-Team',
        position: { x: 600, y: 50 },
        config: { 
          url: 'https://api.company.com/route', 
          method: 'POST',
          body: { department: 'support', priority: 'normal' }
        },
        connections: [],
        status: 'active'
      },
      {
        id: 'route_sales',
        type: 'action',
        name: 'Webhook Call',
        description: 'Weiterleitung an Sales-Team',
        position: { x: 600, y: 150 },
        config: { 
          url: 'https://api.company.com/route', 
          method: 'POST',
          body: { department: 'sales', priority: 'high' }
        },
        connections: [],
        status: 'active'
      }
    ],
    variables: {
      customerIntent: '',
      routingDecision: ''
    },
    settings: {
      errorHandling: 'continue',
      timeout: 20000,
      logging: true
    }
  })

  const saveWorkflow = async () => {
    if (!workflow) return
    
    setIsSaving(true)
    try {
      const savedWorkflows = localStorage.getItem('voicepartner_workflows')
      let workflows: WorkflowData[] = []
      
      if (savedWorkflows) {
        workflows = JSON.parse(savedWorkflows)
      }

      const existingIndex = workflows.findIndex(w => w.id === workflow.id)
      if (existingIndex >= 0) {
        workflows[existingIndex] = workflow
      } else {
        workflows.push(workflow)
      }

      localStorage.setItem('voicepartner_workflows', JSON.stringify(workflows))
      alert('Workflow wurde erfolgreich gespeichert!')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Fehler beim Speichern des Workflows.')
    } finally {
      setIsSaving(false)
    }
  }

  const addNode = (nodeType: any, position?: { x: number; y: number }) => {
    if (!workflow) return

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType.type,
      name: nodeType.name,
      description: nodeType.description,
      position: position || { x: 200, y: 200 },
      config: { ...nodeType.config },
      connections: [],
      status: 'active'
    }

    setWorkflow(prev => prev ? {
      ...prev,
      nodes: [...prev.nodes, newNode]
    } : null)
  }

  const deleteNode = (nodeId: string) => {
    if (!workflow || nodeId === 'start') return

    setWorkflow(prev => prev ? {
      ...prev,
      nodes: prev.nodes.filter(node => {
        if (node.id === nodeId) return false
        // Remove connections to deleted node
        node.connections = node.connections.filter(conn => conn !== nodeId)
        return true
      })
    } : null)

    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }

  const updateNodeConfig = (nodeId: string, config: any) => {
    if (!workflow) return

    setWorkflow(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, config: { ...node.config, ...config } } : node
      )
    } : null)
  }

  const connectNodes = (fromId: string, toId: string) => {
    if (!workflow) return

    setWorkflow(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === fromId 
          ? { ...node, connections: [...node.connections.filter(c => c !== toId), toId] }
          : node
      )
    } : null)
  }

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    setIsDragging(true)
    setSelectedNode(nodeId)
    const node = workflow?.nodes.find(n => n.id === nodeId)
    if (node) {
      setDragOffset({
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y
      })
    }
  }

  const handleNodeDrag = useCallback((e: MouseEvent) => {
    if (isDragging && selectedNode) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      setWorkflow(prev => prev ? {
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === selectedNode 
            ? { ...node, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
            : node
        )
      } : null)
    }
  }, [isDragging, selectedNode, dragOffset])

  const handleNodeDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleNodeDrag)
      document.addEventListener('mouseup', handleNodeDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleNodeDrag)
        document.removeEventListener('mouseup', handleNodeDragEnd)
      }
    }
  }, [isDragging, handleNodeDrag, handleNodeDragEnd])

  const renderNode = (node: WorkflowNode) => {
    const isSelected = selectedNode === node.id
    const nodeTypes = getNodeTypes()
    const IconComponent = nodeTypes.find(nt => nt.name === node.name)?.icon || Settings
    
    return (
      <div
        key={node.id}
        className={`absolute bg-white border-2 rounded-lg p-4 min-w-48 cursor-pointer transition-all select-none ${
          isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300 hover:border-gray-400'
        } ${node.status === 'error' ? 'border-red-500 bg-red-50' : ''} ${
          isDragging && isSelected ? 'shadow-2xl scale-105' : ''
        }`}
        style={{ 
          left: node.position.x, 
          top: node.position.y,
          zIndex: isSelected ? 10 : 1
        }}
        onClick={() => setSelectedNode(node.id)}
        onMouseDown={(e) => handleNodeDragStart(e, node.id)}
      >
        <div className="flex items-center space-x-2 mb-2">
          <div className={`p-1 rounded ${
            node.type === 'trigger' ? 'bg-green-100 text-green-600' :
            node.type === 'action' ? 'bg-blue-100 text-blue-600' :
            node.type === 'condition' ? 'bg-yellow-100 text-yellow-600' :
            'bg-purple-100 text-purple-600'
          }`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <span className="font-medium text-sm">{node.name}</span>
          {node.id !== 'start' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteNode(node.id)
              }}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600 mb-2">{node.description}</p>
        
        {/* Connection points */}
        <div className="flex justify-between">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
        
        {/* Show connections */}
        {node.connections.map(connId => {
          const targetNode = workflow?.nodes.find(n => n.id === connId)
          if (!targetNode) return null
          
          return (
            <svg
              key={connId}
              className="absolute pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0
              }}
            >
              <line
                x1={node.position.x + 96}
                y1={node.position.y + 60}
                x2={targetNode.position.x + 96}
                y2={targetNode.position.y + 20}
                stroke="#6366f1"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            </svg>
          )
        })}
      </div>
    )
  }

  const renderNodeConfigPanel = () => {
    if (!selectedNode || !workflow) return null
    
    const node = workflow.nodes.find(n => n.id === selectedNode)
    if (!node) return null

    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Node Configuration</h3>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Node Name
            </label>
            <input
              type="text"
              value={node.name}
              onChange={(e) => {
                setWorkflow(prev => prev ? {
                  ...prev,
                  nodes: prev.nodes.map(n => 
                    n.id === selectedNode ? { ...n, name: e.target.value } : n
                  )
                } : null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={node.description}
              onChange={(e) => {
                setWorkflow(prev => prev ? {
                  ...prev,
                  nodes: prev.nodes.map(n => 
                    n.id === selectedNode ? { ...n, description: e.target.value } : n
                  )
                } : null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            />
          </div>

          {/* Node-specific configuration */}
          {node.type === 'trigger' && node.name.includes('Keyword') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (eine pro Zeile)
              </label>
              <textarea
                value={node.config.keywords?.join('\n') || ''}
                onChange={(e) => updateNodeConfig(node.id, {
                  keywords: e.target.value.split('\n').filter(k => k.trim())
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-24"
                placeholder="terminbuchung&#10;termin vereinbaren&#10;verfügbarkeit"
              />
            </div>
          )}

          {node.type === 'action' && node.name.includes('Calendar') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calendar ID
                </label>
                <input
                  type="text"
                  value={node.config.calendarId || ''}
                  onChange={(e) => updateNodeConfig(node.id, { calendarId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="primary oder calendar@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range (Tage)
                </label>
                <input
                  type="number"
                  value={node.config.timeRange || 30}
                  onChange={(e) => updateNodeConfig(node.id, { timeRange: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {node.type === 'action' && node.name.includes('Email') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Template
                </label>
                <select
                  value={node.config.template || ''}
                  onChange={(e) => updateNodeConfig(node.id, { template: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Template wählen</option>
                  <option value="appointment_confirmation">Terminbestätigung</option>
                  <option value="lead_notification">Lead Benachrichtigung</option>
                  <option value="customer_followup">Kunden Nachfassung</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empfänger E-Mail
                </label>
                <input
                  type="email"
                  value={node.config.to || ''}
                  onChange={(e) => updateNodeConfig(node.id, { to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="admin@unternehmen.de"
                />
              </div>
            </div>
          )}

          {node.type === 'action' && node.name.includes('Webhook') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={node.config.url || ''}
                  onChange={(e) => updateNodeConfig(node.id, { url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTTP Method
                </label>
                <select
                  value={node.config.method || 'POST'}
                  onChange={(e) => updateNodeConfig(node.id, { method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
          )}

          {node.type === 'condition' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Logic
              </label>
              <textarea
                value={node.config.condition || ''}
                onChange={(e) => updateNodeConfig(node.id, { condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-24"
                placeholder="customer.intent === 'booking' && calendar.available === true"
              />
              <p className="text-xs text-gray-500 mt-1">
                Verwenden Sie JavaScript-ähnliche Syntax für Bedingungen
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-sm mb-2">Connections</h4>
            {workflow.nodes.filter(n => n.id !== node.id).map(targetNode => (
              <div key={targetNode.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{targetNode.name}</span>
                <button
                  onClick={() => {
                    if (node.connections.includes(targetNode.id)) {
                      // Remove connection
                      setWorkflow(prev => prev ? {
                        ...prev,
                        nodes: prev.nodes.map(n => 
                          n.id === node.id 
                            ? { ...n, connections: n.connections.filter(c => c !== targetNode.id) }
                            : n
                        )
                      } : null)
                    } else {
                      // Add connection
                      connectNodes(node.id, targetNode.id)
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    node.connections.includes(targetNode.id)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {node.connections.includes(targetNode.id) ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Workflow wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/workflows" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="text-2xl font-bold bg-transparent border-none focus:outline-none"
              />
              <p className="text-gray-500">Workflow Builder</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNodePalette(!showNodePalette)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </button>
            <button
              onClick={saveWorkflow}
              disabled={isSaving}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
              <Play className="h-4 w-4 mr-2" />
              Test Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Node Palette */}
        {showNodePalette && (
          <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Available Nodes & Tools</h3>
            
            {/* Triggers Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Triggers</h4>
              <div className="space-y-2">
                {getNodeTypes().filter(nt => nt.type === 'trigger').map((nodeType) => {
                  const IconComponent = nodeType.icon
                  return (
                    <button
                      key={`${nodeType.type}-${nodeType.name}`}
                      onClick={() => addNode(nodeType)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-md bg-green-100 text-green-600">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{nodeType.name}</div>
                          <div className="text-xs text-gray-500">{nodeType.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions/Tools Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Actions & Tools ({availableTools.length})</h4>
              <div className="space-y-2">
                {getNodeTypes().filter(nt => nt.type === 'action').map((nodeType) => {
                  const IconComponent = nodeType.icon
                  const isFromTool = (nodeType.config as any)?.toolId
                  return (
                    <button
                      key={`${nodeType.type}-${nodeType.name}`}
                      onClick={() => addNode(nodeType)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-sm">{nodeType.name}</div>
                            {isFromTool && (
                              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                Tool
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{nodeType.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Conditions Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Logic</h4>
              <div className="space-y-2">
                {getNodeTypes().filter(nt => nt.type === 'condition').map((nodeType) => {
                  const IconComponent = nodeType.icon
                  return (
                    <button
                      key={`${nodeType.type}-${nodeType.name}`}
                      onClick={() => addNode(nodeType)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-md bg-yellow-100 text-yellow-600">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{nodeType.name}</div>
                          <div className="text-xs text-gray-500">{nodeType.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {availableTools.length === 0 && (
              <div className="text-center py-6">
                <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 mb-2">Keine Tools verfügbar</p>
                <Link 
                  href="/dashboard/tools/new"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Erstes Tool erstellen →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-100">
            {/* Grid pattern */}
            <svg className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Render workflow nodes */}
            {workflow.nodes.map(renderNode)}
          </div>
        </div>

        {/* Configuration Panel */}
        {selectedNode && renderNodeConfigPanel()}
      </div>
    </div>
  )
}