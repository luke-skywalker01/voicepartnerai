'use client'

import React, { useCallback, useRef, useState } from 'react'
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

interface SimpleWorkflowCanvasProps {
  className?: string
}

export const SimpleWorkflowCanvas = ({ className }: SimpleWorkflowCanvasProps) => {
  const [isExecuting, setIsExecuting] = useState(false)

  const executeWorkflow = () => {
    setIsExecuting(true)
    setTimeout(() => {
      setIsExecuting(false)
      alert('Workflow Test abgeschlossen!')
    }, 2000)
  }

  return (
    <div className={`w-full h-full bg-gray-50 relative ${className}`}>
      {/* Canvas Background */}
      <div className="absolute inset-0 bg-gray-50">
        <div className="w-full h-full" style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Top Panel */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 m-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">Workflow Canvas</h3>
            </div>
            
            <div className="h-4 w-px bg-gray-300" />
            
            <div className="flex items-center space-x-3">
              <button
                onClick={executeWorkflow}
                disabled={isExecuting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isExecuting
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
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-gray-200 shadow-lg max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Vereinfachter Workflow Builder</h3>
            <p className="text-gray-600 mb-4">
              Temporäre vereinfachte Version während der Fehlerbehebung.
              Der vollständige ReactFlow-basierte Builder wird bald verfügbar sein.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Drag & Drop kommt bald</span>
              </div>
              <div className="flex items-center space-x-1">
                <Play className="w-4 h-4" />
                <span>Test verfügbar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}