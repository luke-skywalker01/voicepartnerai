'use client'

import React from 'react'
import { 
  MessageSquare, 
  Code, 
  Zap, 
  Phone, 
  AlertTriangle, 
  Globe,
  Plus
} from 'lucide-react'

const nodeTypes = [
  {
    type: 'conversation',
    title: 'Conversation Node',
    icon: MessageSquare,
    description: 'Führe ein Gespräch mit dem Benutzer',
    color: 'bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100',
    category: 'Conversation'
  },
  {
    type: 'api_request',
    title: 'API Request',
    icon: Code,
    description: 'HTTP-Anfrage an externe API',
    color: 'bg-green-50 border-green-300 text-green-900 hover:bg-green-100',
    category: 'Integration'
  },
  {
    type: 'tool',
    title: 'Tool Call',
    icon: Zap,
    description: 'Rufe ein Tool oder eine Funktion auf',
    color: 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100',
    category: 'Tools'
  },
  {
    type: 'transfer_call',
    title: 'Transfer Call',
    icon: Phone,
    description: 'Weiterleitung an menschlichen Agent',
    color: 'bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100',
    category: 'Call Control'
  },
  {
    type: 'end_call',
    title: 'End Call',
    icon: AlertTriangle,
    description: 'Beende das Gespräch',
    color: 'bg-red-50 border-red-300 text-red-900 hover:bg-red-100',
    category: 'Call Control'
  },
  {
    type: 'global',
    title: 'Global Node',
    icon: Globe,
    description: 'Von überall im Workflow erreichbar',
    color: 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100',
    category: 'Advanced'
  }
]

const categories = [
  'Conversation',
  'Integration', 
  'Tools',
  'Call Control',
  'Advanced'
]

interface NodePaletteProps {
  className?: string
}

export const NodePalette = ({ className }: NodePaletteProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const groupedNodes = categories.reduce((acc, category) => {
    acc[category] = nodeTypes.filter(node => node.category === category)
    return acc
  }, {} as Record<string, typeof nodeTypes>)

  return (
    <div className={`bg-white border-r border-gray-200 overflow-y-auto ${className}`}>
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Node Library</h3>
            <p className="text-sm text-gray-500">Ziehe Nodes auf das Canvas</p>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                {category}
              </h4>
              <div className="space-y-2">
                {groupedNodes[category]?.map(node => (
                  <div
                    key={node.type}
                    className={`
                      p-4 border-2 border-dashed rounded-lg cursor-grab active:cursor-grabbing
                      transition-all duration-200 ${node.color}
                    `}
                    draggable
                    onDragStart={(event) => onDragStart(event, node.type)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <node.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate">
                          {node.title}
                        </h5>
                        <p className="text-xs mt-1 leading-relaxed">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Templates */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Quick Start</h4>
          <p className="text-xs text-gray-600 mb-3">
            Häufig verwendete Node-Kombinationen
          </p>
          <div className="space-y-2">
            <button className="w-full text-left p-2 text-xs bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors">
              🎯 Einfache Begrüßung
            </button>
            <button className="w-full text-left p-2 text-xs bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors">
              📅 Terminbuchung
            </button>
            <button className="w-full text-left p-2 text-xs bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors">
              🔄 API Integration
            </button>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tipps</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Ziehe Nodes auf das Canvas</li>
            <li>• Verbinde Nodes durch Ziehen</li>
            <li>• Klicke auf Nodes zum Konfigurieren</li>
            <li>• Start-Node ist automatisch markiert</li>
          </ul>
        </div>
      </div>
    </div>
  )
}