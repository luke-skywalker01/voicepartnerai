'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  GitBranch, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  MoreVertical,
  Calendar,
  Database,
  Webhook,
  ArrowRight,
  Zap,
  Code
} from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused'
  createdAt: string
  updatedAt: string
  nodes: any[]
  triggers: string[]
  category: string
}

const workflowTemplates = [
  {
    id: 'appointment_booking',
    name: 'Terminbuchung',
    description: 'Automatische Terminvereinbarung mit Kalender-Integration',
    icon: Calendar,
    category: 'Terminverwaltung'
  },
  {
    id: 'lead_qualification',
    name: 'Lead-Qualifizierung',
    description: 'Interessenten automatisch bewerten und CRM-System aktualisieren',
    icon: Database,
    category: 'Sales'
  },
  {
    id: 'order_processing',
    name: 'Bestellabwicklung',
    description: 'Voice-basierte Bestellungen verarbeiten und bestätigen',
    icon: Webhook,
    category: 'E-Commerce'
  },
  {
    id: 'customer_support',
    name: 'Kundensupport',
    description: 'FAQ-basierte Kundenbetreuung mit Eskalation an Experten',
    icon: ArrowRight,
    category: 'Support'
  },
  {
    id: 'survey_feedback',
    name: 'Umfragen & Feedback',
    description: 'Kundenfeedback sammeln und Zufriedenheit bewerten',
    icon: Zap,
    category: 'Analytics'
  }
]

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'paused'>('all')
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = () => {
    try {
      const savedWorkflows = localStorage.getItem('voicepartner_workflows')
      if (savedWorkflows) {
        const parsedWorkflows = JSON.parse(savedWorkflows)
        setWorkflows(parsedWorkflows)
      } else {
        // Create demo workflows if none exist
        const demoWorkflows: Workflow[] = [
          {
            id: 'workflow_1',
            name: 'Terminbuchung Workflow',
            description: 'Automatische Terminbuchung mit Google Calendar Integration',
            status: 'active',
            category: 'Terminverwaltung',
            triggers: ['Phone Call', 'Voice Command'],
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            nodes: [
              { id: '1', type: 'trigger', name: 'Phone Call Trigger' },
              { id: '2', type: 'action', name: 'Calendar Check' },
              { id: '3', type: 'action', name: 'Book Appointment' }
            ]
          },
          {
            id: 'workflow_2',
            name: 'Lead Qualification',
            description: 'Automatische Lead-Erfassung und CRM-Integration',
            status: 'active',
            category: 'Sales',
            triggers: ['Inbound Call', 'Form Submission'],
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            nodes: [
              { id: '1', type: 'trigger', name: 'Inbound Call' },
              { id: '2', type: 'logic', name: 'Qualify Lead' },
              { id: '3', type: 'action', name: 'Update CRM' },
              { id: '4', type: 'action', name: 'Send Email' }
            ]
          },
          {
            id: 'workflow_3',
            name: 'Order Processing',
            description: 'Bestellungen automatisch verarbeiten und bestätigen',
            status: 'draft',
            category: 'E-Commerce',
            triggers: ['Voice Order', 'Phone Call'],
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            nodes: [
              { id: '1', type: 'trigger', name: 'Voice Order' },
              { id: '2', type: 'logic', name: 'Validate Order' },
              { id: '3', type: 'action', name: 'Process Payment' }
            ]
          }
        ]
        setWorkflows(demoWorkflows)
        localStorage.setItem('voicepartner_workflows', JSON.stringify(demoWorkflows))
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkflows = workflows.filter(workflow => {
    return filter === 'all' || workflow.status === filter
  })

  const deleteWorkflow = (workflowId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Workflow löschen möchten?')) {
      const updatedWorkflows = workflows.filter(w => w.id !== workflowId)
      setWorkflows(updatedWorkflows)
      localStorage.setItem('voicepartner_workflows', JSON.stringify(updatedWorkflows))
    }
  }

  const duplicateWorkflow = (workflow: Workflow) => {
    const newWorkflow = {
      ...workflow,
      id: `workflow_${Date.now()}`,
      name: `${workflow.name} (Kopie)`,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updatedWorkflows = [...workflows, newWorkflow]
    setWorkflows(updatedWorkflows)
    localStorage.setItem('voicepartner_workflows', JSON.stringify(updatedWorkflows))
  }

  const toggleWorkflowStatus = (workflowId: string) => {
    const updatedWorkflows = workflows.map(workflow => {
      if (workflow.id === workflowId) {
        const newStatus: 'draft' | 'active' | 'paused' = 
          workflow.status === 'active' ? 'paused' : 
          workflow.status === 'paused' ? 'active' : 'active'
        return { ...workflow, status: newStatus, updatedAt: new Date().toISOString() }
      }
      return workflow
    })
    setWorkflows(updatedWorkflows)
    localStorage.setItem('voicepartner_workflows', JSON.stringify(updatedWorkflows))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢'
      case 'paused':
        return '🟡'
      case 'draft':
        return '⚪'
      default:
        return '⚪'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Terminverwaltung':
        return Calendar
      case 'Sales':
        return Database
      case 'E-Commerce':
        return Webhook
      default:
        return GitBranch
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Erstellen und verwalten Sie automatisierte Voice AI Workflows
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/tools/workflow-generator"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Zap className="h-4 w-4 mr-2" />
            KI Generator
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
            >
              <Code className="h-4 w-4 mr-2" />
              Templates
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Standard-Templates</h3>
                  <p className="text-sm text-muted-foreground">Vorgefertigte Workflows für häufige Anwendungsfälle</p>
                </div>
                <div className="p-2">
                  {workflowTemplates.map((template) => (
                    <Link
                      key={template.id}
                      href={`/workflows/${template.id}_${Date.now()}/edit`}
                      className="block p-3 rounded hover:bg-muted transition-colors"
                      onClick={() => setShowTemplates(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <template.icon className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link
            href={`/workflows/new_${Date.now()}/edit`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Workflow
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { key: 'all', label: 'Alle Workflows', count: workflows.length },
            { key: 'active', label: 'Aktiv', count: workflows.filter(w => w.status === 'active').length },
            { key: 'paused', label: 'Pausiert', count: workflows.filter(w => w.status === 'paused').length },
            { key: 'draft', label: 'Entwurf', count: workflows.filter(w => w.status === 'draft').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Workflows Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">
            {filter === 'all' ? 'Keine Workflows vorhanden' : `Keine ${filter} Workflows`}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {filter === 'all' 
              ? 'Erstellen Sie Ihren ersten Workflow um komplexe Automatisierungen zu implementieren.'
              : `Sie haben aktuell keine Workflows im ${filter} Status.`
            }
          </p>
          {filter === 'all' && (
            <Link
              href={`/workflows/new_${Date.now()}/edit`}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ersten Workflow erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => {
            const CategoryIcon = getCategoryIcon(workflow.category)
            return (
              <div key={workflow.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                        {getStatusIcon(workflow.status)} {workflow.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleWorkflowStatus(workflow.id)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                      title={workflow.status === 'active' ? 'Pausieren' : 'Aktivieren'}
                    >
                      {workflow.status === 'active' ? 
                        <Pause className="h-4 w-4" /> : 
                        <Play className="h-4 w-4" />
                      }
                    </button>
                    <button className="p-1 text-muted-foreground hover:text-foreground rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {workflow.description}
                </p>

                {/* Technical Details */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kategorie:</span>
                    <span className="font-medium">{workflow.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Knoten:</span>
                    <span className="font-medium">{workflow.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trigger:</span>
                    <span className="font-medium">{workflow.triggers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aktualisiert:</span>
                    <span className="font-medium">
                      {new Date(workflow.updatedAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>

                {/* Triggers */}
                {workflow.triggers && workflow.triggers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Trigger:</p>
                    <div className="flex flex-wrap gap-1">
                      {workflow.triggers.map((trigger: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">
                          <Code className="h-3 w-3 mr-1" />
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/workflows/${workflow.id}/edit`}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/30 text-center transition-colors"
                  >
                    <Edit className="h-4 w-4 inline mr-1" />
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => duplicateWorkflow(workflow)}
                    className="p-2 border border-border rounded-md hover:bg-muted transition-colors"
                    title="Duplizieren"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="p-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}