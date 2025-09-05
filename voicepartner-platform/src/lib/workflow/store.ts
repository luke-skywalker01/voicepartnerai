import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'

// Simple UUID generator to avoid import issues
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export interface WorkflowNode extends Node {
  data: {
    title: string
    description?: string
    type: 'conversation' | 'api_request' | 'tool' | 'transfer_call' | 'end_call' | 'global'
    config: any
    variables?: string[]
    conditions?: Array<{
      id: string
      description: string
      type: 'ai' | 'logical'
      expression?: string
    }>
  }
}

export interface WorkflowEdge {
  id: string
  source: string | null
  target: string | null
  type?: string
  sourceHandle?: string | null
  targetHandle?: string | null
  data?: {
    condition?: {
      type: 'ai' | 'logical'
      description: string
      expression?: string
    }
  }
}

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNode: string | null
  selectedEdge: string | null
  isConnecting: boolean
  connectionStart: string | null
  workflowName: string
  isDirty: boolean
  
  // Actions
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: WorkflowEdge[]) => void
  onNodesChange: (changes: any[]) => void
  onEdgesChange: (changes: any[]) => void
  onConnect: (connection: Connection) => void
  
  addNode: (type: string, position: { x: number; y: number }) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNode['data']>) => void
  deleteNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  
  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void
  
  startConnection: (nodeId: string) => void
  endConnection: () => void
  
  setWorkflowName: (name: string) => void
  markDirty: () => void
  markClean: () => void
  
  // Workflow operations
  exportWorkflow: () => object
  importWorkflow: (workflow: any) => void
  resetWorkflow: () => void
}

const getDefaultNodeConfig = (type: string) => {
  switch (type) {
    case 'conversation':
      return {
        firstMessage: 'Hallo! Wie kann ich Ihnen helfen?',
        prompt: 'Du bist ein hilfsreicher Assistent.',
        model: 'gpt-4o',
        voice: {
          provider: 'elevenlabs',
          voiceId: 'german-female-1',
          stability: 0.75,
          similarityBoost: 0.75
        },
        temperature: 0.7,
        maxTokens: 150
      }
    case 'api_request':
      return {
        method: 'GET',
        url: 'https://api.example.com',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {},
        timeout: 10000
      }
    case 'tool':
      return {
        toolName: 'custom_tool',
        description: 'Tool-Beschreibung',
        function: {
          name: 'tool_function',
          description: 'Was macht dieses Tool?',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      }
    case 'transfer_call':
      return {
        destination: '+49123456789',
        message: 'Ich verbinde Sie weiter.'
      }
    case 'end_call':
      return {
        message: 'Auf Wiederhören!'
      }
    case 'global':
      return {
        description: 'Globaler Node - von überall erreichbar',
        trigger: 'always_available'
      }
    default:
      return {}
  }
}

const getNodeTitle = (type: string) => {
  const titles = {
    conversation: 'Conversation Node',
    api_request: 'API Request',
    tool: 'Tool Call',
    transfer_call: 'Transfer Call',
    end_call: 'End Call',
    global: 'Global Node'
  }
  return titles[type as keyof typeof titles] || 'Unknown Node'
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  isConnecting: false,
  connectionStart: null,
  workflowName: 'Neuer Workflow',
  isDirty: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges as any) as WorkflowEdge[],
      isDirty: true
    })
  },

  onConnect: (connection) => {
    const newEdge: WorkflowEdge = {
      id: generateId(),
      ...connection,
      type: 'smoothstep',
      data: {
        condition: {
          type: 'ai',
          description: 'Bedingung definieren...'
        }
      }
    }
    
    set({
      edges: addEdge(newEdge as any, get().edges as any) as WorkflowEdge[],
      isDirty: true
    })
  },

  addNode: (type, position) => {
    const newNode: WorkflowNode = {
      id: generateId(),
      type: 'workflowNode',
      position,
      data: {
        title: getNodeTitle(type),
        type: type as any,
        config: getDefaultNodeConfig(type),
        variables: [],
        conditions: []
      }
    }

    set({
      nodes: [...get().nodes, newNode],
      isDirty: true
    })
  },

  updateNode: (nodeId, updates) => {
    set({
      nodes: get().nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      ),
      isDirty: true
    })
  },

  deleteNode: (nodeId) => {
    // Don't delete start nodes
    const node = get().nodes.find(n => n.id === nodeId)
    if (node?.data.type === 'conversation' && node.data.config?.isStart) {
      return
    }

    set({
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode === nodeId ? null : get().selectedNode,
      isDirty: true
    })
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find(n => n.id === nodeId)
    if (!node) return

    const duplicatedNode: WorkflowNode = {
      ...node,
      id: generateId(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      },
      data: {
        ...node.data,
        title: `${node.data.title} (Kopie)`
      }
    }

    set({
      nodes: [...get().nodes, duplicatedNode],
      isDirty: true
    })
  },

  selectNode: (nodeId) => set({ selectedNode: nodeId, selectedEdge: null }),
  selectEdge: (edgeId) => set({ selectedEdge: edgeId, selectedNode: null }),

  startConnection: (nodeId) => set({ 
    isConnecting: true, 
    connectionStart: nodeId 
  }),

  endConnection: () => set({ 
    isConnecting: false, 
    connectionStart: null 
  }),

  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  exportWorkflow: () => {
    const { nodes, edges, workflowName } = get()
    return {
      name: workflowName,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        title: node.data.title,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: edge.data
      })),
      created: new Date().toISOString(),
      version: '1.0'
    }
  },

  importWorkflow: (workflow) => {
    const nodes: WorkflowNode[] = workflow.nodes.map((node: any) => ({
      id: node.id,
      type: 'workflowNode',
      position: node.position,
      data: node.data
    }))

    const edges: WorkflowEdge[] = workflow.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      data: edge.data
    }))

    set({
      nodes,
      edges,
      workflowName: workflow.name || 'Importierter Workflow',
      isDirty: false
    })
  },

  resetWorkflow: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,
    isConnecting: false,
    connectionStart: null,
    workflowName: 'Neuer Workflow',
    isDirty: false
  })
}))