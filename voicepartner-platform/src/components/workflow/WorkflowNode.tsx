'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  MessageSquare, 
  Code, 
  Zap, 
  Phone, 
  AlertTriangle, 
  Globe,
  Settings,
  Copy,
  Trash2,
  Play
} from 'lucide-react'

interface WorkflowNodeData {
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
  onSelect?: (nodeId: string | null) => void
  onDelete?: (nodeId: string) => void
  onDuplicate?: (nodeId: string) => void
  onTest?: (nodeId: string) => void
  selected?: boolean
  executionState?: 'running' | 'success' | 'error'
  executionMessage?: string
}

const nodeTypeConfig = {
  conversation: {
    icon: MessageSquare,
    color: 'bg-blue-50 border-blue-300 text-blue-900',
    bgColor: 'bg-blue-500'
  },
  api_request: {
    icon: Code,
    color: 'bg-green-50 border-green-300 text-green-900',
    bgColor: 'bg-green-500'
  },
  tool: {
    icon: Zap,
    color: 'bg-purple-50 border-purple-300 text-purple-900',
    bgColor: 'bg-purple-500'
  },
  transfer_call: {
    icon: Phone,
    color: 'bg-orange-50 border-orange-300 text-orange-900',
    bgColor: 'bg-orange-500'
  },
  end_call: {
    icon: AlertTriangle,
    color: 'bg-red-50 border-red-300 text-red-900',
    bgColor: 'bg-red-500'
  },
  global: {
    icon: Globe,
    color: 'bg-indigo-50 border-indigo-300 text-indigo-900',
    bgColor: 'bg-indigo-500'
  }
}

export const WorkflowNodeComponent = memo(({ id, data, selected }: NodeProps<WorkflowNodeData>) => {
  const config = nodeTypeConfig[data.type] || nodeTypeConfig.conversation
  const IconComponent = config.icon

  const handleSelect = () => {
    data.onSelect?.(id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    data.onDelete?.(id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    data.onDuplicate?.(id)
  }

  const handleTest = (e: React.MouseEvent) => {
    e.stopPropagation()
    data.onTest?.(id)
  }

  const getExecutionStateStyle = () => {
    if (data.executionState === 'running') return 'border-amber-400 bg-amber-50'
    if (data.executionState === 'success') return 'border-green-400 bg-green-50'
    if (data.executionState === 'error') return 'border-red-400 bg-red-50'
    return ''
  }

  return (
    <div 
      className={`
        relative min-w-[200px] bg-white border-2 rounded-lg shadow-sm transition-all duration-200
        ${data.selected || selected ? 'border-blue-500 shadow-md' : 'border-gray-300 hover:border-gray-400'}
        ${getExecutionStateStyle()}
      `}
      onClick={handleSelect}
    >
      {/* Execution State Indicator */}
      {data.executionState && (
        <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
          data.executionState === 'running' ? 'bg-amber-400 animate-pulse' :
          data.executionState === 'success' ? 'bg-green-400' :
          'bg-red-400'
        }`} />
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />

      <div className="p-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 text-sm">{data.title}</h3>
            <p className="text-xs text-gray-500 capitalize">{data.type.replace('_', ' ')}</p>
          </div>
        </div>

        {data.description && (
          <p className="text-xs text-gray-600 mb-3">{data.description}</p>
        )}

        {data.executionMessage && (
          <div className={`text-xs p-2 rounded mt-2 ${
            data.executionState === 'success' ? 'bg-green-100 text-green-800' :
            data.executionState === 'error' ? 'bg-red-100 text-red-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {data.executionMessage}
          </div>
        )}

        {/* Node Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {data.variables && data.variables.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {data.variables.length} vars
              </span>
            )}
            {data.conditions && data.conditions.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                {data.conditions.length} conditions
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleTest}
              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
              title="Test Node"
            >
              <Play className="w-3 h-3" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
              title="Duplicate"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  )
})

WorkflowNodeComponent.displayName = 'WorkflowNodeComponent'