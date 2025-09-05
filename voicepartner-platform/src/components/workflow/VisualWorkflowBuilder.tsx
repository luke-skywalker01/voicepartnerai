'use client'

import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionMode,
  Panel,
  NodeTypes,
  EdgeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
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
} from '../ui/dialog'
import { 
  Plus,
  Save,
  Play,
  Share,
  Download,
  Upload,
  Settings,
  Trash2,
  Copy,
  Phone,
  Mail,
  Database,
  Globe,
  MessageSquare,
  Calendar,
  Zap,
  CheckCircle,
  XCircle,
  GitBranch,
  Filter,
  Clock,
  Bot,
  Workflow,
  Code,
  Webhook,
  AlertTriangle
} from 'lucide-react'

// Custom Node Types
interface WorkflowNodeData {
  label: string
  type: string
  icon: React.ElementType
  description?: string
  config?: Record<string, any>
  status?: 'idle' | 'running' | 'success' | 'error'
}

const CustomNode: React.FC<{ data: WorkflowNodeData; selected: boolean }> = ({ data, selected }) => {
  const Icon = data.icon
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-blue-500 bg-blue-50'
      case 'success': return 'border-green-500 bg-green-50'
      case 'error': return 'border-red-500 bg-red-50'
      default: return selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
    }
  }

  return (
    <div className={`px-4 py-3 border-2 rounded-lg min-w-[150px] ${getStatusColor()} transition-all duration-200`}>
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-gray-600" />
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500 mt-1">{data.description}</div>
          )}
        </div>
        {data.status && (
          <div className={`w-2 h-2 rounded-full ${
            data.status === 'running' ? 'bg-blue-500' :
            data.status === 'success' ? 'bg-green-500' :
            data.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
          }`} />
        )}
      </div>
    </div>
  )
}

// Node palette items
const nodeCategories = {
  triggers: [
    { type: 'webhook', label: 'Webhook', icon: Globe, description: 'HTTP webhook trigger' },
    { type: 'schedule', label: 'Schedule', icon: Clock, description: 'Time-based trigger' },
    { type: 'vapi-call', label: 'Vapi Call', icon: Phone, description: 'Voice call events' },
    { type: 'manual', label: 'Manual', icon: Play, description: 'Manual execution' },
  ],
  actions: [
    { type: 'http-request', label: 'HTTP Request', icon: Globe, description: 'Make API calls' },
    { type: 'email', label: 'Send Email', icon: Mail, description: 'Send email messages' },
    { type: 'slack', label: 'Slack', icon: MessageSquare, description: 'Send Slack messages' },
    { type: 'database', label: 'Database', icon: Database, description: 'Database operations' },
    { type: 'openai', label: 'OpenAI', icon: Bot, description: 'AI text generation' },
    { type: 'vapi-create', label: 'Create Agent', icon: Bot, description: 'Create Vapi agent' },
  ],
  logic: [
    { type: 'condition', label: 'IF Condition', icon: GitBranch, description: 'Conditional logic' },
    { type: 'switch', label: 'Switch', icon: Filter, description: 'Multiple conditions' },
    { type: 'merge', label: 'Merge', icon: Zap, description: 'Combine data streams' },
    { type: 'code', label: 'Code', icon: Code, description: 'Custom JavaScript' },
  ],
  data: [
    { type: 'set', label: 'Set Variable', icon: Settings, description: 'Set workflow variables' },
    { type: 'transform', label: 'Transform', icon: Zap, description: 'Transform data' },
    { type: 'filter', label: 'Filter', icon: Filter, description: 'Filter data' },
    { type: 'sort', label: 'Sort', icon: Settings, description: 'Sort data' },
  ]
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

export default function VisualWorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showNodeConfig, setShowNodeConfig] = useState(false)
  const [workflowName, setWorkflowName] = useState('Untitled Workflow')
  const [isExecuting, setIsExecuting] = useState(false)
  const [showPalette, setShowPalette] = useState(true)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'))
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${nodeData.type}_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeData.label,
          type: nodeData.type,
          icon: nodeData.icon,
          description: nodeData.description,
          status: 'idle'
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setShowNodeConfig(true)
  }, [])

  const executeWorkflow = async () => {
    setIsExecuting(true)
    
    // Simulate workflow execution
    for (const node of nodes) {
      // Update node status to running
      setNodes((nds) => 
        nds.map((n) => 
          n.id === node.id 
            ? { ...n, data: { ...n.data, status: 'running' } }
            : n
        )
      )
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update to success (or error randomly)
      const success = Math.random() > 0.1 // 90% success rate
      setNodes((nds) => 
        nds.map((n) => 
          n.id === node.id 
            ? { ...n, data: { ...n.data, status: success ? 'success' : 'error' } }
            : n
        )
      )
      
      if (!success) break
    }
    
    setIsExecuting(false)
  }

  const saveWorkflow = () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      createdAt: new Date().toISOString()
    }
    
    // Save to localStorage for demo
    const savedWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]')
    savedWorkflows.push(workflow)
    localStorage.setItem('workflows', JSON.stringify(savedWorkflows))
    
    alert('Workflow saved successfully!')
  }

  const clearWorkflow = () => {
    setNodes([])
    setEdges([])
    setWorkflowName('Untitled Workflow')
  }

  return (
    <div className="flex h-[800px] border rounded-lg overflow-hidden">
      {/* Node Palette */}
      {showPalette && (
        <div className="w-80 bg-gray-50 border-r overflow-y-auto">
          <div className="p-4 border-b bg-white">
            <h3 className="font-semibold text-gray-900">Node Palette</h3>
            <p className="text-sm text-gray-600 mt-1">Drag nodes onto the canvas</p>
          </div>
          
          <div className="p-4 space-y-6">
            {Object.entries(nodeCategories).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-3 capitalize">{category}</h4>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center space-x-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-sm transition-shadow"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify(item))
                        event.dataTransfer.effectAllowed = 'move'
                      }}
                    >
                      <item.icon className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Canvas */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-64"
                placeholder="Workflow name"
              />
              <Badge variant="outline">
                {nodes.length} nodes
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPalette(!showPalette)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearWorkflow}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveWorkflow}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                size="sm"
                onClick={executeWorkflow}
                disabled={isExecuting || nodes.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Execute'}
              </Button>
            </div>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div ref={reactFlowWrapper} className="w-full h-full pt-16">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            
            {nodes.length === 0 && (
              <Panel position="center">
                <div className="text-center p-8 bg-white/90 rounded-lg border border-dashed border-gray-300">
                  <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Workflow</h3>
                  <p className="text-gray-600 mb-4">
                    Drag nodes from the palette to create your automation workflow
                  </p>
                  <div className="text-sm text-gray-500">
                    Start with a trigger, add actions, and connect them together
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Dialog */}
      <Dialog open={showNodeConfig} onOpenChange={setShowNodeConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Node: {selectedNode?.data.label}</DialogTitle>
            <DialogDescription>
              Set up the configuration for this workflow node
            </DialogDescription>
          </DialogHeader>
          
          {selectedNode && (
            <div className="space-y-6">
              <div>
                <Label>Node Name</Label>
                <Input 
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    )
                  }}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={selectedNode.data.description || ''}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, description: e.target.value } }
                          : node
                      )
                    )
                  }}
                  placeholder="Describe what this node does..."
                />
              </div>

              {/* Node-specific configuration would go here */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Node type: <span className="font-medium">{selectedNode.data.type}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Additional configuration options would appear here based on the node type
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
                    setShowNodeConfig(false)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
                <Button onClick={() => setShowNodeConfig(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}