'use client'

import React from 'react'
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge
} from 'reactflow'
import { X, Settings } from 'lucide-react'

export const WorkflowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20
  })

  const onEdgeClick = (evt: React.MouseEvent, id: string) => {
    evt.stopPropagation()
    console.log('Edge clicked:', id)
    // TODO: Implement edge selection
  }

  const onDeleteEdge = (evt: React.MouseEvent) => {
    evt.stopPropagation()
    console.log('Delete edge:', id)
    // TODO: Implement edge deletion
  }

  const onConfigureEdge = (evt: React.MouseEvent) => {
    evt.stopPropagation()
    console.log('Configure edge:', id)
    // TODO: Implement edge configuration
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd="url(#workflow-arrow)"
        style={{
          stroke: selected ? '#3b82f6' : '#6366f1',
          strokeWidth: selected ? 3 : 2
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all'
          }}
          className="nodrag nopan"
        >
          <div 
            className={`
              bg-white border rounded-md px-2 py-1 shadow-sm cursor-pointer
              hover:shadow-md transition-shadow max-w-[200px]
              ${selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}
            `}
            onClick={(event) => onEdgeClick(event, id)}
          >
            <div className="flex items-center justify-between space-x-2">
              <span className="text-xs text-gray-600 truncate">
                {data?.condition?.description || 'Bedingung'}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={onConfigureEdge}
                  className="p-0.5 hover:bg-gray-100 rounded"
                  title="Bedingung konfigurieren"
                >
                  <Settings className="h-3 w-3 text-gray-500" />
                </button>
                <button
                  onClick={onDeleteEdge}
                  className="p-0.5 hover:bg-red-100 rounded"
                  title="Verbindung löschen"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </div>
            </div>
            
            {/* Condition type indicator */}
            <div className="mt-1">
              <span className={`
                inline-block px-1.5 py-0.5 text-xs rounded-full
                ${data?.condition?.type === 'ai' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
                }
              `}>
                {data?.condition?.type === 'ai' ? 'KI' : 'Logik'}
              </span>
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Arrow marker definition */}
      <defs>
        <marker
          id="workflow-arrow"
          markerWidth="12.5"
          markerHeight="12.5"
          viewBox="-10 -10 20 20"
          refX="0"
          refY="0"
          markerUnits="strokeWidth"
          orient="auto"
        >
          <polyline
            stroke="#6366f1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            fill="none"
            points="-5,-4 0,0 -5,4"
          />
        </marker>
      </defs>
    </>
  )
}