'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Play,
  Pause,
  Settings,
  Copy,
  Trash2,
  GitBranch,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  Activity,
  Users,
  Phone,
  Webhook,
  Calendar,
  RefreshCw,
  Eye,
  Edit,
  Download,
  Upload,
  Workflow
} from 'lucide-react'

interface VapiWorkflow {
  id: string
  orgId: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdAt: string
  updatedAt: string
  nodes: any[]
  edges: any[]
  configuration: {
    entryPoint: string
    fallbackAssistant?: string
    timeout: number
    maxIterations: number
    errorHandling: 'continue' | 'halt' | 'fallback'
  }
  metadata: {
    version: string
    tags: string[]
    category: string
    author: string
  }
  usage: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    lastExecuted?: string
  }
  triggers: Array<{
    type: 'phone-call' | 'webhook' | 'schedule' | 'manual'
    config: any
  }>
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedSetupTime: number
  features: string[]
  tags: string[]
  usageCount: number
  rating: number
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<VapiWorkflow[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'paused'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadWorkflows()
  }, [])

  useEffect(() => {
    if (showTemplates && templates.length === 0) {
      loadTemplates()
    }
  }, [showTemplates])

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/vapi/workflows?limit=50')
      const data = await response.json()
      
      if (data.workflows) {
        setWorkflows(data.workflows)
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const response = await fetch('/api/vapi/workflow-templates?limit=20')
      const data = await response.json()
      
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const refreshWorkflows = async () => {
    setRefreshing(true)
    await loadWorkflows()
  }

  const updateWorkflowStatus = async (workflowId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/vapi/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await loadWorkflows()
      } else {
        const error = await response.json()
        alert(`Failed to update workflow: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert('Failed to update workflow status')
    }
  }

  const duplicateWorkflow = async (workflow: VapiWorkflow) => {
    try {
      const response = await fetch('/api/vapi/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges,
          configuration: workflow.configuration,
          triggers: workflow.triggers,
          metadata: {
            ...workflow.metadata,
            version: '1.0.0'
          }
        })
      })
      
      if (response.ok) {
        await loadWorkflows()
      }
    } catch (error) {
      console.error('Error duplicating workflow:', error)
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/vapi/workflows/${workflowId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadWorkflows()
      } else {
        const error = await response.json()
        alert(`Failed to delete workflow: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  const createFromTemplate = async (templateId: string, templateName: string) => {
    try {
      const response = await fetch('/api/vapi/workflow-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          workflowName: `${templateName} - New`,
          customization: {}
        })
      })
      
      if (response.ok) {
        await loadWorkflows()
        setShowTemplates(false)
      }
    } catch (error) {
      console.error('Error creating workflow from template:', error)
    }
  }

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesFilter = filter === 'all' || workflow.status === filter
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />
      case 'draft': return <Edit className="h-4 w-4 text-gray-600" />
      case 'archived': return <Archive className="h-4 w-4 text-gray-400" />
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'archived': return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-500'
      default: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

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
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Workflow className="h-8 w-8 mr-3 text-primary" />
            Workflows
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and manage intelligent conversation flows
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshWorkflows}
            disabled={refreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="border border-border text-foreground hover:bg-muted px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            {showTemplates ? 'Hide Templates' : 'Browse Templates'}
          </button>
          <Link
            href="/dashboard/workflows/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {workflows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
              <Workflow className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {workflows.filter(w => w.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.usage.totalExecutions, 0).toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {workflows.length > 0 ? 
                    Math.round((workflows.reduce((sum, w) => sum + w.usage.successfulExecutions, 0) / 
                               workflows.reduce((sum, w) => sum + w.usage.totalExecutions, 1)) * 100) : 0}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Templates Section */}
      {showTemplates && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Workflow Templates</h2>
            <div className="flex items-center space-x-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background"
              >
                <option value="all">All Categories</option>
                <option value="customer-service">Customer Service</option>
                <option value="sales">Sales</option>
                <option value="lead-qualification">Lead Qualification</option>
                <option value="appointment-booking">Appointment Booking</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>

          {templatesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="border border-border rounded-lg p-4 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ~{template.estimatedSetupTime}min setup
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                        {feature}
                      </span>
                    ))}
                    {template.features.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                        +{template.features.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {template.usageCount}
                      </span>
                      <span className="flex items-center">
                        ⭐ {template.rating}
                      </span>
                    </div>
                    <button
                      onClick={() => createFromTemplate(template.id, template.name)}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: workflows.length },
              { key: 'active', label: 'Active', count: workflows.filter(w => w.status === 'active').length },
              { key: 'draft', label: 'Draft', count: workflows.filter(w => w.status === 'draft').length },
              { key: 'paused', label: 'Paused', count: workflows.filter(w => w.status === 'paused').length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-md bg-background w-80"
          />
        </div>
      </div>

      {/* Workflows List */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
              <Workflow className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {searchTerm ? 'No workflows found' : 'No workflows yet'}
            </h2>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Create your first workflow to automate voice conversations and improve customer experience'
              }
            </p>
            
            {!searchTerm && (
              <div className="space-y-4">
                <Link
                  href="/dashboard/workflows/new"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Workflow
                </Link>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="w-full border border-border text-foreground hover:bg-muted px-8 py-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Browse Templates
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(workflow.status)}
                    <h3 className="text-lg font-semibold text-foreground">{workflow.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workflow.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => duplicateWorkflow(workflow)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/dashboard/workflows/${workflow.id}/edit`}
                    className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="p-2 text-red-600 hover:text-red-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Executions</p>
                  <p className="text-lg font-bold">{workflow.usage.totalExecutions.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-lg font-bold text-green-600">
                    {workflow.usage.totalExecutions > 0 
                      ? Math.round((workflow.usage.successfulExecutions / workflow.usage.totalExecutions) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-1" />
                    {workflow.nodes.length} nodes
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDuration(workflow.usage.averageExecutionTime)}
                  </span>
                </div>
                {workflow.usage.lastExecuted && (
                  <span className="text-xs text-muted-foreground">
                    Last run: {new Date(workflow.usage.lastExecuted).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {workflow.metadata.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  {workflow.triggers.map((trigger, index) => (
                    <span key={index} className="text-xs text-muted-foreground flex items-center">
                      {trigger.type === 'phone-call' && <Phone className="h-3 w-3 mr-1" />}
                      {trigger.type === 'webhook' && <Webhook className="h-3 w-3 mr-1" />}
                      {trigger.type === 'schedule' && <Calendar className="h-3 w-3 mr-1" />}
                      {trigger.type}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  {workflow.status === 'active' ? (
                    <button
                      onClick={() => updateWorkflowStatus(workflow.id, 'paused')}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                    >
                      <Pause className="h-3 w-3 mr-1 inline" />
                      Pause
                    </button>
                  ) : workflow.status === 'paused' ? (
                    <button
                      onClick={() => updateWorkflowStatus(workflow.id, 'active')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    >
                      <Play className="h-3 w-3 mr-1 inline" />
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => updateWorkflowStatus(workflow.id, 'active')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    >
                      <Play className="h-3 w-3 mr-1 inline" />
                      Activate
                    </button>
                  )}
                  
                  <Link
                    href={`/dashboard/workflows/${workflow.id}`}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
                  >
                    <Eye className="h-3 w-3 mr-1 inline" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}