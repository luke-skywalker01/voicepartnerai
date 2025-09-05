'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  useReactFlow,
  Panel,
  MarkerType,
  ConnectionLineType,
  addEdge
} from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  Play, 
  Square, 
  Zap, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react'

import { useWorkflowStore } from '@/lib/workflow/store'
import { WorkflowNodeComponent } from './WorkflowNode'
import { WorkflowEdge } from './WorkflowEdge'

const nodeTypes = {
  workflowNode: WorkflowNodeComponent
}

const edgeTypes = {
  workflowEdge: WorkflowEdge
}

interface WorkflowCanvasProps {
  className?: string
}

const WorkflowCanvasInner = ({ className }: WorkflowCanvasProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project, getNodes, getEdges, fitView } = useReactFlow()
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionStats, setExecutionStats] = useState({
    totalNodes: 0,
    executedNodes: 0,
    failedNodes: 0,
    duration: 0
  })
  const [executionLog, setExecutionLog] = useState<Array<{
    nodeId: string,
    status: 'running' | 'success' | 'error',
    timestamp: number,
    message?: string
  }>>([])
  
  const {
    nodes,
    edges,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    deleteNode,
    duplicateNode,
    updateNode,
    workflowName,
    isDirty
  } = useWorkflowStore()

  // Enhanced node data with execution state
  const enhancedNodes = nodes.map(node => {
    const executionState = executionLog.find(log => log.nodeId === node.id)
    return {
      ...node,
      data: {
        ...node.data,
        onSelect: selectNode,
        onDelete: deleteNode,
        onDuplicate: duplicateNode,
        onTest: (nodeId: string) => executeNode(nodeId),
        selected: node.id === selectedNode,
        executionState: executionState?.status,
        executionMessage: executionState?.message
      }
    }
  })

  // Simulate node execution
  const executeNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    // Add to execution log
    setExecutionLog(prev => [...prev, {
      nodeId,
      status: 'running',
      timestamp: Date.now()
    }])

    // Simulate execution time
    const executionTime = Math.random() * 2000 + 500
    await new Promise(resolve => setTimeout(resolve, executionTime))

    // Random success/failure (90% success rate)
    const success = Math.random() > 0.1
    
    setExecutionLog(prev => prev.map(log => 
      log.nodeId === nodeId && log.status === 'running'
        ? {
            ...log,
            status: success ? 'success' : 'error',
            message: success 
              ? `${node.data.type} executed successfully`
              : `Failed to execute ${node.data.type}`
          }
        : log
    ))
  }

  // Execute entire workflow
  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Workflow is empty. Add nodes first.')
      return
    }

    setIsExecuting(true)
    setExecutionLog([])
    const startTime = Date.now()

    setExecutionStats({
      totalNodes: nodes.length,
      executedNodes: 0,
      failedNodes: 0,
      duration: 0
    })

    // Find start nodes (nodes with no incoming edges)
    const startNodes = nodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    )

    if (startNodes.length === 0) {
      alert('No start node found. Workflow needs at least one node without incoming connections.')
      setIsExecuting(false)
      return
    }

    // Execute nodes in order (simplified breadth-first execution)
    const executedNodes = new Set<string>()
    const nodesToExecute = [...startNodes.map(n => n.id)]

    while (nodesToExecute.length > 0) {
      const currentNodeId = nodesToExecute.shift()!
      
      if (executedNodes.has(currentNodeId)) continue
      
      await executeNode(currentNodeId)
      executedNodes.add(currentNodeId)

      // Add connected nodes to execution queue
      const connectedNodes = edges
        .filter(edge => edge.source === currentNodeId)
        .map(edge => edge.target)
        .filter((nodeId: string | null): nodeId is string => nodeId !== null && !executedNodes.has(nodeId))

      nodesToExecute.push(...connectedNodes)
    }

    const endTime = Date.now()
    const failedCount = executionLog.filter(log => log.status === 'error').length

    setExecutionStats({
      totalNodes: nodes.length,
      executedNodes: executedNodes.size,
      failedNodes: failedCount,
      duration: endTime - startTime
    })

    setIsExecuting(false)
  }

  // Clear execution state
  const clearExecution = () => {
    setExecutionLog([])
    setExecutionStats({
      totalNodes: 0,
      executedNodes: 0,
      failedNodes: 0,
      duration: 0
    })
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (typeof type === 'undefined' || !type) {
        return
      }

      const position = project({
        x: event.clientX - (reactFlowWrapper.current?.getBoundingClientRect().left || 0),
        y: event.clientY - (reactFlowWrapper.current?.getBoundingClientRect().top || 0)
      })

      addNode(type, position)
    },
    [project, addNode]
  )

  const onConnectStart = useCallback((event: any, params: any) => {
    console.log('Connection started from:', params.nodeId)
  }, [])

  const onConnectEnd = useCallback(() => {
    console.log('Connection ended')
  }, [])

  return (
    <div className={`w-full h-full ${className}`} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges as any}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#6366f1',
          }
        }}
        fitView
        fitViewOptions={{
          padding: 0.1,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
        minZoom={0.1}
        maxZoom={3}
        snapToGrid={true}
        snapGrid={[20, 20]}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        panOnScroll={true}
        panOnScrollSpeed={2}
        zoomOnDoubleClick={false}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#e5e7eb"
        />
        
        <Controls 
          position="bottom-right"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          className="bg-white border border-gray-300 rounded-lg shadow-lg"
        />
        
        <MiniMap 
          nodeColor={(node) => {
            const type = node.data?.type
            const executionState = node.data?.executionState
            
            // Color based on execution state first
            if (executionState === 'running') return '#f59e0b'
            if (executionState === 'success') return '#10b981'
            if (executionState === 'error') return '#ef4444'
            
            // Default colors by type
            const colors = {
              conversation: '#3b82f6',
              api_request: '#10b981',
              tool: '#8b5cf6',
              transfer_call: '#f59e0b',
              end_call: '#ef4444',
              global: '#6366f1'
            }
            return colors[type as keyof typeof colors] || '#6b7280'
          }}
          position="bottom-left"
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
        />

        {/* Execution Panel */}
        <Panel position="top-center" className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{workflowName || 'Unnamed Workflow'}</h3>
              {isDirty && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Unsaved</span>}
            </div>
            
            <div className="h-4 w-px bg-gray-300" />
            
            <div className="flex items-center space-x-3">
              <button
                onClick={executeWorkflow}
                disabled={isExecuting || nodes.length === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isExecuting || nodes.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Execute</span>
                  </>
                )}
              </button>
              
              {executionLog.length > 0 && (
                <button
                  onClick={clearExecution}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Execution Stats */}
            {executionStats.totalNodes > 0 && (
              <>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{executionStats.totalNodes}</span>
                    <span className="text-gray-500">nodes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{executionStats.executedNodes}</span>
                    <span className="text-gray-500">executed</span>
                  </div>
                  {executionStats.failedNodes > 0 && (
                    <div className="flex items-center space-x-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{executionStats.failedNodes}</span>
                      <span className="text-gray-500">failed</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{executionStats.duration}ms</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* Help Panel for empty canvas */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="pointer-events-none">
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-gray-200 shadow-lg max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Your Voice AI Workflow</h3>
              <p className="text-gray-600 mb-4">
                Drag components from the left panel to create your conversational AI workflow. 
                Connect nodes to define the conversation flow.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Drag & Drop</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Play className="w-4 h-4" />
                  <span>Test & Execute</span>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}

export const WorkflowCanvas = ({ className }: WorkflowCanvasProps) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner className={className} />
    </ReactFlowProvider>
  )
}