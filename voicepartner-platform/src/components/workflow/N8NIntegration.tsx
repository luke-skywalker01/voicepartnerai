'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { 
  Workflow, 
  Play, 
  Pause, 
  Square, 
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Zap,
  Clock,
  Globe,
  Calendar,
  Database,
  Mail,
  MessageSquare,
  Phone,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  nodes: N8NNode[]
  connections: Record<string, any>
  createdAt: string
  updatedAt: string
  lastExecuted?: string
  executionCount: number
  successRate: number
  tags?: string[]
}

interface N8NNode {
  id: string
  name: string
  type: string
  position: [number, number]
  parameters: Record<string, any>
  credentials?: Record<string, any>
}

interface N8NExecution {
  id: string
  workflowId: string
  status: 'success' | 'error' | 'running' | 'waiting'
  startedAt: string
  stoppedAt?: string
  data?: Record<string, any>
  error?: string
}

const nodeTypes = {
  trigger: [
    { type: 'webhook', name: 'Webhook', icon: Globe, description: 'Trigger workflow via HTTP request' },
    { type: 'schedule', name: 'Schedule', icon: Clock, description: 'Run workflow on schedule' },
    { type: 'manual', name: 'Manual', icon: Play, description: 'Manual workflow execution' },
    { type: 'vapi-call', name: 'Vapi Call', icon: Phone, description: 'Trigger on Vapi call events' }
  ],
  action: [
    { type: 'http-request', name: 'HTTP Request', icon: Globe, description: 'Make HTTP requests' },
    { type: 'email', name: 'Email', icon: Mail, description: 'Send emails' },
    { type: 'slack', name: 'Slack', icon: MessageSquare, description: 'Send Slack messages' },
    { type: 'database', name: 'Database', icon: Database, description: 'Database operations' },
    { type: 'openai', name: 'OpenAI', icon: Zap, description: 'AI text generation' },
    { type: 'vapi-assistant', name: 'Vapi Assistant', icon: Phone, description: 'Create Vapi assistant' }
  ],
  logic: [
    { type: 'if', name: 'IF', icon: CheckCircle, description: 'Conditional branching' },
    { type: 'switch', name: 'Switch', icon: Settings, description: 'Multiple condition routing' },
    { type: 'merge', name: 'Merge', icon: Zap, description: 'Merge multiple inputs' },
    { type: 'split', name: 'Split', icon: Zap, description: 'Split data into multiple outputs' }
  ]
}

export default function N8NIntegration() {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([])
  const [executions, setExecutions] = useState<N8NExecution[]>([])
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8NWorkflow | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for demonstration
  const mockWorkflows: N8NWorkflow[] = [
    {
      id: 'wf_1',
      name: 'Vapi Call to CRM',
      active: true,
      nodes: [
        {
          id: 'trigger',
          name: 'Vapi Webhook',
          type: 'vapi-call',
          position: [0, 0],
          parameters: {
            events: ['call.ended']
          }
        },
        {
          id: 'extract',
          name: 'Extract Data',
          type: 'function',
          position: [200, 0],
          parameters: {
            functionCode: 'return items.map(item => ({ customer: item.json.customer, transcript: item.json.transcript }))'
          }
        },
        {
          id: 'crm',
          name: 'Create CRM Lead',
          type: 'http-request',
          position: [400, 0],
          parameters: {
            url: 'https://api.hubspot.com/crm/v3/objects/contacts',
            method: 'POST'
          }
        }
      ],
      connections: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: new Date(Date.now() - 3600000).toISOString(),
      executionCount: 42,
      successRate: 95.2,
      tags: ['vapi', 'crm', 'automation']
    },
    {
      id: 'wf_2',
      name: 'Daily Call Summary',
      active: true,
      nodes: [
        {
          id: 'schedule',
          name: 'Daily at 6 PM',
          type: 'schedule',
          position: [0, 0],
          parameters: {
            cron: '0 18 * * *'
          }
        },
        {
          id: 'vapi-stats',
          name: 'Get Vapi Stats',
          type: 'vapi-api',
          position: [200, 0],
          parameters: {
            endpoint: '/call',
            filters: { date: 'today' }
          }
        },
        {
          id: 'email',
          name: 'Send Summary Email',
          type: 'email',
          position: [400, 0],
          parameters: {
            to: 'team@company.com',
            subject: 'Daily Call Summary'
          }
        }
      ],
      connections: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: new Date(Date.now() - 86400000).toISOString(),
      executionCount: 15,
      successRate: 100,
      tags: ['reporting', 'email', 'daily']
    },
    {
      id: 'wf_3',
      name: 'AI Call Analysis',
      active: false,
      nodes: [
        {
          id: 'trigger',
          name: 'Call Ended',
          type: 'vapi-call',
          position: [0, 0],
          parameters: {
            events: ['call.ended']
          }
        },
        {
          id: 'openai',
          name: 'Analyze Transcript',
          type: 'openai',
          position: [200, 0],
          parameters: {
            model: 'gpt-4',
            prompt: 'Analyze this call transcript for sentiment and key topics'
          }
        },
        {
          id: 'database',
          name: 'Store Analysis',
          type: 'database',
          position: [400, 0],
          parameters: {
            operation: 'insert',
            table: 'call_analysis'
          }
        }
      ],
      connections: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successRate: 0,
      tags: ['ai', 'analysis', 'transcript']
    }
  ]

  const mockExecutions: N8NExecution[] = [
    {
      id: 'exec_1',
      workflowId: 'wf_1',
      status: 'success',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      stoppedAt: new Date(Date.now() - 3598000).toISOString(),
      data: {
        customer: { name: 'John Doe', phone: '+1234567890' },
        created_lead_id: 'lead_123'
      }
    },
    {
      id: 'exec_2',
      workflowId: 'wf_2',
      status: 'success',
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      stoppedAt: new Date(Date.now() - 86398000).toISOString()
    },
    {
      id: 'exec_3',
      workflowId: 'wf_1',
      status: 'error',
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      stoppedAt: new Date(Date.now() - 7199000).toISOString(),
      error: 'CRM API rate limit exceeded'
    }
  ]

  useEffect(() => {
    setWorkflows(mockWorkflows)
    setExecutions(mockExecutions)
  }, [])

  const handleToggleWorkflow = async (workflowId: string, active: boolean) => {
    setWorkflows(workflows.map(wf => 
      wf.id === workflowId ? { ...wf, active } : wf
    ))
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    setIsLoading(true)
    // Simulate execution
    setTimeout(() => {
      const newExecution: N8NExecution = {
        id: `exec_${Date.now()}`,
        workflowId,
        status: 'success',
        startedAt: new Date().toISOString(),
        stoppedAt: new Date(Date.now() + 2000).toISOString()
      }
      setExecutions([newExecution, ...executions])
      setIsLoading(false)
    }, 2000)
  }

  const getStatusIcon = (status: N8NExecution['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'waiting': return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const formatDuration = (startedAt?: string, stoppedAt?: string) => {
    if (!startedAt || !stoppedAt) return 'N/A'
    const duration = new Date(stoppedAt).getTime() - new Date(startedAt).getTime()
    return `${Math.round(duration / 1000)}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">N8N Workflow Automation</h2>
          <p className="text-gray-600 mt-1">Connect Vapi with external services and automate processes</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setShowWorkflowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Workflow className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflows.filter(wf => wf.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflows.reduce((sum, wf) => sum + wf.executionCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(workflows.reduce((sum, wf) => sum + wf.successRate, 0) / workflows.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Workflow className="mr-2 h-5 w-5" />
            Workflows
          </CardTitle>
          <CardDescription>Manage your automation workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${workflow.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {workflow.nodes.length} nodes
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {workflow.executionCount} executions
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {workflow.successRate}% success rate
                      </span>
                    </div>
                    <div className="flex space-x-1 mt-2">
                      {workflow.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleWorkflow(workflow.id, !workflow.active)}
                  >
                    {workflow.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExecuteWorkflow(workflow.id)}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Recent Executions
          </CardTitle>
          <CardDescription>Latest workflow execution results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workflow
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.map((execution) => {
                  const workflow = workflows.find(wf => wf.id === execution.workflowId)
                  return (
                    <tr key={execution.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(execution.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {execution.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workflow?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(execution.startedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(execution.startedAt, execution.stoppedAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Builder Dialog */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Build automated workflows that integrate with Vapi and external services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>
            </div>

            {/* Node Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Available Nodes</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Triggers</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {nodeTypes.trigger.map((node) => (
                      <div key={node.type} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <node.icon className="h-6 w-6 text-blue-600" />
                          <div>
                            <h5 className="font-medium text-sm">{node.name}</h5>
                            <p className="text-xs text-gray-500">{node.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {nodeTypes.action.map((node) => (
                      <div key={node.type} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <node.icon className="h-6 w-6 text-green-600" />
                          <div>
                            <h5 className="font-medium text-sm">{node.name}</h5>
                            <p className="text-xs text-gray-500">{node.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Logic</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {nodeTypes.logic.map((node) => (
                      <div key={node.type} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <node.icon className="h-6 w-6 text-purple-600" />
                          <div>
                            <h5 className="font-medium text-sm">{node.name}</h5>
                            <p className="text-xs text-gray-500">{node.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Preview */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center text-gray-500">
                <Workflow className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Visual Workflow Builder</h3>
                <p className="text-sm">
                  Drag and drop nodes to build your workflow. Connect nodes to create automation flows.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
                Cancel
              </Button>
              <div className="space-x-2">
                <Button variant="outline">
                  Save Draft
                </Button>
                <Button>
                  Create & Activate
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}