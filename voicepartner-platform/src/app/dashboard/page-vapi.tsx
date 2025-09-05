'use client'

import React from 'react'
import VapiMainLayout from '@/components/layout/VapiMainLayout'
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  Users, 
  Phone,
  Bot,
  Activity,
  MoreHorizontal,
  Play,
  Settings,
  Eye
} from 'lucide-react'

// Mock data
const stats = [
  {
    title: 'Total Calls',
    value: '2,847',
    change: '+12%',
    trend: 'up',
    icon: Phone,
    color: 'text-vapi-emerald'
  },
  {
    title: 'Active Assistants',
    value: '8',
    change: '+2',
    trend: 'up',
    icon: Bot,
    color: 'text-vapi-indigo'
  },
  {
    title: 'Avg Duration',
    value: '3m 24s',
    change: '-8%',
    trend: 'down',
    icon: Clock,
    color: 'text-vapi-teal'
  },
  {
    title: 'Success Rate',
    value: '94.2%',
    change: '+2.1%',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-vapi-emerald'
  }
]

const recentAssistants = [
  {
    id: 1,
    name: 'Customer Support Bot',
    status: 'active',
    calls: 1247,
    lastUsed: '2 minutes ago',
    avatar: '🎧'
  },
  {
    id: 2,
    name: 'Sales Assistant',
    status: 'active',
    calls: 892,
    lastUsed: '1 hour ago',
    avatar: '💼'
  },
  {
    id: 3,
    name: 'Appointment Scheduler',
    status: 'paused',
    calls: 456,
    lastUsed: '3 hours ago',
    avatar: '📅'
  },
  {
    id: 4,
    name: 'Lead Qualifier',
    status: 'draft',
    calls: 0,
    lastUsed: 'Never',
    avatar: '🎯'
  }
]

const recentCalls = [
  {
    id: 1,
    assistant: 'Customer Support Bot',
    duration: '4m 32s',
    status: 'completed',
    caller: '+1 (555) 123-4567',
    time: '10 minutes ago'
  },
  {
    id: 2,
    assistant: 'Sales Assistant',
    duration: '2m 18s',
    status: 'completed',
    caller: '+1 (555) 987-6543',
    time: '25 minutes ago'
  },
  {
    id: 3,
    assistant: 'Customer Support Bot',
    duration: '6m 45s',
    status: 'failed',
    caller: '+1 (555) 456-7890',
    time: '1 hour ago'
  },
  {
    id: 4,
    assistant: 'Appointment Scheduler',
    duration: '1m 52s',
    status: 'completed',
    caller: '+1 (555) 321-0987',
    time: '2 hours ago'
  }
]

export default function DashboardPage() {
  return (
    <VapiMainLayout
      title="Dashboard"
      subtitle="Overview of your voice AI assistants and call analytics"
      actions={
        <button className="bg-vapi-indigo text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-vapi-indigo/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Assistant</span>
        </button>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-vapi-emerald' : 'text-vapi-red'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-vapi-text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-vapi-text-secondary">
                  {stat.title}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assistants */}
        <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg">
          <div className="p-6 border-b border-vapi-border-gray">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-vapi-text-primary">
                Recent Assistants
              </h3>
              <button className="text-vapi-text-secondary hover:text-vapi-text-primary transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAssistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="flex items-center justify-between p-4 bg-vapi-black rounded-lg border border-vapi-border-gray hover:shadow-sm transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{assistant.avatar}</div>
                    <div>
                      <h4 className="font-medium text-vapi-text-primary">
                        {assistant.name}
                      </h4>
                      <p className="text-sm text-vapi-text-secondary">
                        {assistant.calls} calls • {assistant.lastUsed}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      assistant.status === 'active'
                        ? 'bg-vapi-emerald/20 text-vapi-emerald'
                        : assistant.status === 'paused'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {assistant.status}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button className="p-1 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="w-full py-2 text-sm text-vapi-indigo hover:text-vapi-indigo/80 transition-colors">
                View All Assistants
              </button>
            </div>
          </div>
        </div>

        {/* Recent Calls */}
        <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg">
          <div className="p-6 border-b border-vapi-border-gray">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-vapi-text-primary">
                Recent Calls
              </h3>
              <button className="text-vapi-text-secondary hover:text-vapi-text-primary transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 bg-vapi-black rounded-lg border border-vapi-border-gray hover:shadow-sm transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-vapi-text-primary text-sm">
                        {call.assistant}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        call.status === 'completed'
                          ? 'bg-vapi-emerald/20 text-vapi-emerald'
                          : 'bg-vapi-red/20 text-vapi-red'
                      }`}>
                        {call.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-vapi-text-secondary">
                      <span>{call.caller}</span>
                      <span>{call.duration}</span>
                    </div>
                    <p className="text-xs text-vapi-text-secondary mt-1">
                      {call.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="w-full py-2 text-sm text-vapi-indigo hover:text-vapi-indigo/80 transition-colors">
                View All Calls
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6">
        <h3 className="text-lg font-semibold text-vapi-text-primary mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-vapi-black border border-vapi-border-gray rounded-lg hover:shadow-sm transition-all text-left">
            <Bot className="h-6 w-6 text-vapi-indigo mb-2" />
            <h4 className="font-medium text-vapi-text-primary mb-1">
              Create Assistant
            </h4>
            <p className="text-sm text-vapi-text-secondary">
              Build a new voice AI assistant from scratch
            </p>
          </button>
          <button className="p-4 bg-vapi-black border border-vapi-border-gray rounded-lg hover:shadow-sm transition-all text-left">
            <Phone className="h-6 w-6 text-vapi-emerald mb-2" />
            <h4 className="font-medium text-vapi-text-primary mb-1">
              Get Phone Number
            </h4>
            <p className="text-sm text-vapi-text-secondary">
              Purchase a new phone number for your assistants
            </p>
          </button>
          <button className="p-4 bg-vapi-black border border-vapi-border-gray rounded-lg hover:shadow-sm transition-all text-left">
            <Activity className="h-6 w-6 text-vapi-teal mb-2" />
            <h4 className="font-medium text-vapi-text-primary mb-1">
              View Analytics
            </h4>
            <p className="text-sm text-vapi-text-secondary">
              Analyze your call performance and metrics
            </p>
          </button>
        </div>
      </div>
    </VapiMainLayout>
  )
}