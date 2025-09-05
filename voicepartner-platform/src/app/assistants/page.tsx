'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import VapiMainLayout from '@/components/layout/VapiMainLayout'
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Settings,
  Copy,
  Trash2,
  Bot,
  Phone,
  Calendar,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assistant {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'draft'
  calls: number
  lastCall: string | null
  avgDuration: string
  successRate: number
  voice: {
    provider: string
    name: string
  }
  model: {
    provider: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

const mockAssistants: Assistant[] = [
  {
    id: '1',
    name: 'Customer Support Bot',
    description: 'Handles customer inquiries and support requests',
    status: 'active',
    calls: 1247,
    lastCall: '2 minutes ago',
    avgDuration: '4m 32s',
    successRate: 94.2,
    voice: { provider: 'ElevenLabs', name: 'Rachel' },
    model: { provider: 'OpenAI', name: 'GPT-4' },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'Sales Assistant',
    description: 'Qualifies leads and schedules appointments',
    status: 'active',
    calls: 892,
    lastCall: '1 hour ago',
    avgDuration: '6m 18s',
    successRate: 87.5,
    voice: { provider: 'OpenAI', name: 'Alloy' },
    model: { provider: 'Anthropic', name: 'Claude 3' },
    createdAt: '2024-01-10',
    updatedAt: '2024-01-19'
  },
  {
    id: '3',
    name: 'Appointment Scheduler',
    description: 'Books and manages appointments',
    status: 'paused',
    calls: 456,
    lastCall: '3 hours ago',
    avgDuration: '2m 45s',
    successRate: 96.8,
    voice: { provider: 'ElevenLabs', name: 'Domi' },
    model: { provider: 'OpenAI', name: 'GPT-3.5' },
    createdAt: '2024-01-08',
    updatedAt: '2024-01-18'
  },
  {
    id: '4',
    name: 'Lead Qualifier',
    description: 'Identifies and qualifies potential customers',
    status: 'draft',
    calls: 0,
    lastCall: null,
    avgDuration: '0m 0s',
    successRate: 0,
    voice: { provider: 'OpenAI', name: 'Echo' },
    model: { provider: 'OpenAI', name: 'GPT-4' },
    createdAt: '2024-01-22',
    updatedAt: '2024-01-22'
  }
]

const statusColors = {
  active: 'bg-vapi-emerald/20 text-vapi-emerald border-vapi-emerald/30',
  paused: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

const statusIcons = {
  active: Activity,
  paused: Pause,
  draft: Settings
}

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>(mockAssistants)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all')
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([])

  const filteredAssistants = assistants.filter(assistant => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assistant.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || assistant.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const toggleAssistantSelection = (id: string) => {
    setSelectedAssistants(prev => 
      prev.includes(id) 
        ? prev.filter(assistantId => assistantId !== id)
        : [...prev, id]
    )
  }

  const toggleAllSelection = () => {
    if (selectedAssistants.length === filteredAssistants.length) {
      setSelectedAssistants([])
    } else {
      setSelectedAssistants(filteredAssistants.map(a => a.id))
    }
  }

  const duplicateAssistant = (assistant: Assistant) => {
    const newAssistant: Assistant = {
      ...assistant,
      id: Date.now().toString(),
      name: `${assistant.name} (Copy)`,
      status: 'draft',
      calls: 0,
      lastCall: null,
      avgDuration: '0m 0s',
      successRate: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    setAssistants(prev => [...prev, newAssistant])
  }

  const deleteAssistant = (id: string) => {
    if (confirm('Are you sure you want to delete this assistant?')) {
      setAssistants(prev => prev.filter(a => a.id !== id))
      setSelectedAssistants(prev => prev.filter(assistantId => assistantId !== id))
    }
  }

  const toggleAssistantStatus = (id: string) => {
    setAssistants(prev => prev.map(assistant => 
      assistant.id === id 
        ? { 
            ...assistant, 
            status: assistant.status === 'active' ? 'paused' : 'active'
          }
        : assistant
    ))
  }

  return (
    <VapiMainLayout
      title="Assistants"
      subtitle="Manage your voice AI assistants"
      actions={
        <Link
          href="/assistants/create"
          className="bg-vapi-indigo text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-vapi-indigo/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Assistant</span>
        </Link>
      }
    >
      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-vapi-text-secondary absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assistants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-vapi-dark-gray border border-vapi-border-gray rounded-lg text-vapi-text-primary placeholder-vapi-text-secondary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-vapi-dark-gray border border-vapi-border-gray rounded-lg text-vapi-text-primary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedAssistants.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-vapi-text-secondary">
              {selectedAssistants.length} selected
            </span>
            <button className="p-2 text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-dark-gray rounded-lg transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            <button className="p-2 text-vapi-red hover:text-vapi-red/80 hover:bg-vapi-dark-gray rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Assistants Grid */}
      {filteredAssistants.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssistants.map((assistant) => {
            const StatusIcon = statusIcons[assistant.status]
            
            return (
              <div
                key={assistant.id}
                className={cn(
                  "bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6 hover:shadow-lg transition-all relative",
                  selectedAssistants.includes(assistant.id) && "ring-2 ring-vapi-indigo border-vapi-indigo"
                )}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4">
                  <input
                    type="checkbox"
                    checked={selectedAssistants.includes(assistant.id)}
                    onChange={() => toggleAssistantSelection(assistant.id)}
                    className="h-4 w-4 text-vapi-indigo focus:ring-vapi-indigo border-vapi-border-gray rounded bg-vapi-black"
                  />
                </div>

                {/* Actions Menu */}
                <div className="absolute top-4 right-4">
                  <button className="p-1 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Assistant Info */}
                <div className="mt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-vapi-text-primary mb-1">
                        {assistant.name}
                      </h3>
                      <p className="text-sm text-vapi-text-secondary line-clamp-2">
                        {assistant.description}
                      </p>
                    </div>
                  </div>

                  {/* Status and Stats */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={cn(
                      "inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border",
                      statusColors[assistant.status]
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{assistant.status}</span>
                    </span>
                    
                    {assistant.calls > 0 && (
                      <span className="text-xs text-vapi-text-secondary">
                        {assistant.calls} calls
                      </span>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  {assistant.calls > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-vapi-text-primary">
                          {assistant.avgDuration}
                        </div>
                        <div className="text-xs text-vapi-text-secondary">
                          Avg Duration
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-vapi-emerald">
                          {assistant.successRate}%
                        </div>
                        <div className="text-xs text-vapi-text-secondary">
                          Success Rate
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-vapi-text-primary">
                          {assistant.calls}
                        </div>
                        <div className="text-xs text-vapi-text-secondary">
                          Total Calls
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voice & Model Info */}
                  <div className="text-xs text-vapi-text-secondary mb-4 space-y-1">
                    <div className="flex justify-between">
                      <span>Voice:</span>
                      <span>{assistant.voice.provider} • {assistant.voice.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <span>{assistant.model.provider} • {assistant.model.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last call:</span>
                      <span>{assistant.lastCall || 'Never'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAssistantStatus(assistant.id)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1",
                        assistant.status === 'active' 
                          ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30" 
                          : "bg-vapi-emerald/20 text-vapi-emerald hover:bg-vapi-emerald/30"
                      )}
                    >
                      {assistant.status === 'active' ? (
                        <>
                          <Pause className="h-3 w-3" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/assistants/${assistant.id}/edit`}
                      className="p-2 text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-black rounded-lg transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => duplicateAssistant(assistant)}
                      className="p-2 text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-black rounded-lg transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => deleteAssistant(assistant.id)}
                      className="p-2 text-vapi-red hover:text-vapi-red/80 hover:bg-vapi-black rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-vapi-dark-gray rounded-2xl flex items-center justify-center">
              <Bot className="w-10 h-10 text-vapi-indigo" />
            </div>
            
            <h2 className="text-2xl font-bold text-vapi-text-primary mb-4">
              {searchQuery || statusFilter !== 'all' ? 'No assistants found' : 'Create your first assistant'}
            </h2>
            
            <p className="text-vapi-text-secondary mb-8 leading-relaxed">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Build intelligent voice assistants that can handle calls, answer questions, and automate your business processes.'
              }
            </p>
            
            <div className="space-y-4">
              <Link
                href="/assistants/create"
                className="inline-flex items-center justify-center bg-vapi-indigo text-white hover:bg-vapi-indigo/90 px-8 py-4 rounded-lg font-semibold transition-colors space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Assistant</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {filteredAssistants.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-vapi-text-secondary">Total Assistants</p>
                <p className="text-2xl font-bold text-vapi-text-primary">
                  {assistants.length}
                </p>
              </div>
              <Bot className="h-6 w-6 text-vapi-indigo" />
            </div>
          </div>

          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-vapi-text-secondary">Active</p>
                <p className="text-2xl font-bold text-vapi-emerald">
                  {assistants.filter(a => a.status === 'active').length}
                </p>
              </div>
              <Activity className="h-6 w-6 text-vapi-emerald" />
            </div>
          </div>

          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-vapi-text-secondary">Total Calls</p>
                <p className="text-2xl font-bold text-vapi-text-primary">
                  {assistants.reduce((sum, a) => sum + a.calls, 0).toLocaleString()}
                </p>
              </div>
              <Phone className="h-6 w-6 text-vapi-teal" />
            </div>
          </div>

          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-vapi-text-secondary">Avg Success Rate</p>
                <p className="text-2xl font-bold text-vapi-emerald">
                  {Math.round(assistants.reduce((sum, a) => sum + a.successRate, 0) / assistants.length)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-vapi-emerald" />
            </div>
          </div>
        </div>
      )}
    </VapiMainLayout>
  )
}