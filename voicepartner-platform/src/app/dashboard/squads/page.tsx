'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Users,
  Settings,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Clock,
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Zap,
  Target,
  GitBranch,
  User,
  Star,
  Phone,
  MessageSquare,
  ArrowRight,
  Eye,
  BarChart3
} from 'lucide-react'

interface VapiSquad {
  id: string
  orgId: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'draft'
  createdAt: string
  updatedAt: string
  members: Array<{
    assistantId: string
    assistantName: string
    role: 'primary' | 'fallback' | 'specialist' | 'escalation'
    priority: number
    conditions?: any
    isActive: boolean
  }>
  routingStrategy: {
    type: 'sequential' | 'conditional' | 'load-balanced' | 'skill-based'
    config: any
  }
  escalationRules: {
    enabled: boolean
    triggers: any[]
  }
  performance: {
    totalCalls: number
    successfulCalls: number
    averageHandleTime: number
    escalationRate: number
    customerSatisfaction: number
    lastUsed?: string
  }
  configuration: {
    businessHours?: any
    languages: string[]
    maxConcurrentCalls: number
    callRecording: boolean
    monitoring: boolean
  }
}

export default function SquadsPage() {
  const [squads, setSquads] = useState<VapiSquad[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSquad, setSelectedSquad] = useState<VapiSquad | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadSquads()
  }, [])

  const loadSquads = async () => {
    try {
      const response = await fetch('/api/vapi/squads?includePerformance=true')
      const data = await response.json()
      
      if (data.squads) {
        setSquads(data.squads)
      }
    } catch (error) {
      console.error('Error loading squads:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshSquads = async () => {
    setRefreshing(true)
    await loadSquads()
  }

  const updateSquadStatus = async (squadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/vapi/squads/${squadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await loadSquads()
      } else {
        const error = await response.json()
        alert(`Failed to update squad: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating squad status:', error)
      alert('Failed to update squad status')
    }
  }

  const duplicateSquad = async (squad: VapiSquad) => {
    try {
      const response = await fetch('/api/vapi/squads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${squad.name} (Copy)`,
          description: squad.description,
          members: squad.members,
          routingStrategy: squad.routingStrategy,
          escalationRules: squad.escalationRules,
          configuration: squad.configuration
        })
      })
      
      if (response.ok) {
        await loadSquads()
      }
    } catch (error) {
      console.error('Error duplicating squad:', error)
    }
  }

  const deleteSquad = async (squadId: string) => {
    if (!confirm('Are you sure you want to delete this squad?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/vapi/squads/${squadId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadSquads()
      } else {
        const error = await response.json()
        alert(`Failed to delete squad: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting squad:', error)
    }
  }

  const filteredSquads = squads.filter(squad => {
    const matchesFilter = filter === 'all' || squad.status === filter
    const matchesSearch = squad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         squad.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         squad.members.some(member => member.assistantName.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inactive': return <Pause className="h-4 w-4 text-red-600" />
      case 'draft': return <Edit className="h-4 w-4 text-gray-600" />
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary': return <Star className="h-3 w-3 text-yellow-500" />
      case 'specialist': return <Target className="h-3 w-3 text-blue-500" />
      case 'escalation': return <Shield className="h-3 w-3 text-red-500" />
      case 'fallback': return <User className="h-3 w-3 text-gray-500" />
      default: return <User className="h-3 w-3 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary': return 'bg-yellow-100 text-yellow-800'
      case 'specialist': return 'bg-blue-100 text-blue-800'
      case 'escalation': return 'bg-red-100 text-red-800'
      case 'fallback': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getRoutingStrategyIcon = (type: string) => {
    switch (type) {
      case 'sequential': return <ArrowRight className="h-4 w-4" />
      case 'conditional': return <GitBranch className="h-4 w-4" />
      case 'load-balanced': return <Activity className="h-4 w-4" />
      case 'skill-based': return <Target className="h-4 w-4" />
      default: return <ArrowRight className="h-4 w-4" />
    }
  }

  const formatPerformanceMetric = (value: number, type: 'percentage' | 'time' | 'rating' | 'number' = 'number') => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'time':
        return `${Math.round(value)}s`
      case 'rating':
        return `${value.toFixed(1)}/5`
      case 'number':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Users className="h-8 w-8 mr-3 text-primary" />
            Squads
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage multi-assistant teams for complex workflows
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshSquads}
            disabled={refreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            href="/dashboard/squads/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Squad
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {squads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Squads</p>
                <p className="text-2xl font-bold">{squads.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Squads</p>
                <p className="text-2xl font-bold text-green-600">
                  {squads.filter(s => s.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">
                  {squads.reduce((sum, s) => sum + s.members.length, 0)}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(squads.reduce((sum, s) => sum + s.performance.customerSatisfaction, 0) / squads.length).toFixed(1)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: squads.length },
              { key: 'active', label: 'Active', count: squads.filter(s => s.status === 'active').length },
              { key: 'inactive', label: 'Inactive', count: squads.filter(s => s.status === 'inactive').length },
              { key: 'draft', label: 'Draft', count: squads.filter(s => s.status === 'draft').length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search squads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-md bg-background w-80"
          />
        </div>
      </div>

      {/* Squads List */}
      {filteredSquads.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {searchTerm ? 'No squads found' : 'No squads yet'}
            </h2>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Create your first squad to organize assistants into specialized teams'
              }
            </p>
            
            {!searchTerm && (
              <Link
                href="/dashboard/squads/new"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Squad
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSquads.map((squad) => (
            <div key={squad.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(squad.status)}
                    <h3 className="text-lg font-semibold text-foreground">{squad.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(squad.status)}`}>
                      {squad.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {squad.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => duplicateSquad(squad)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/dashboard/squads/${squad.id}/edit`}
                    className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteSquad(squad.id)}
                    className="p-2 text-red-600 hover:text-red-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Squad Members */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Members ({squad.members.length})</h4>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {getRoutingStrategyIcon(squad.routingStrategy.type)}
                    <span>{squad.routingStrategy.type}</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {squad.members.slice(0, 3).map((member, index) => (
                    <div key={member.assistantId} className="flex items-center justify-between p-2 bg-muted/25 rounded">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <span className="text-sm font-medium">{member.assistantName}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">#{member.priority}</span>
                        <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                    </div>
                  ))}
                  {squad.members.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{squad.members.length - 3} more members
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">Total Calls</p>
                  <p className="text-sm font-bold">{formatPerformanceMetric(squad.performance.totalCalls, 'number')}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-sm font-bold text-green-600">
                    {formatPerformanceMetric(
                      squad.performance.totalCalls > 0 
                        ? (squad.performance.successfulCalls / squad.performance.totalCalls) * 100
                        : 0, 
                      'percentage'
                    )}
                  </p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">Avg Handle Time</p>
                  <p className="text-sm font-bold">{formatPerformanceMetric(squad.performance.averageHandleTime, 'time')}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                  <p className="text-sm font-bold text-purple-600">
                    {formatPerformanceMetric(squad.performance.customerSatisfaction, 'rating')}
                  </p>
                </div>
              </div>

              {/* Configuration Info */}
              <div className="flex items-center justify-between mb-4 pt-3 border-t border-border">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {squad.configuration.maxConcurrentCalls} max calls
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {squad.configuration.languages.join(', ')}
                  </span>
                  {squad.escalationRules.enabled && (
                    <span className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Escalation
                    </span>
                  )}
                </div>
                {squad.performance.lastUsed && (
                  <span className="text-xs text-muted-foreground">
                    Last used: {new Date(squad.performance.lastUsed).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  {squad.status === 'active' ? (
                    <button
                      onClick={() => updateSquadStatus(squad.id, 'inactive')}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                    >
                      <Pause className="h-3 w-3 mr-1 inline" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => updateSquadStatus(squad.id, 'active')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    >
                      <Play className="h-3 w-3 mr-1 inline" />
                      Activate
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedSquad(squad)
                      setShowDetails(true)
                    }}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
                  >
                    <BarChart3 className="h-3 w-3 mr-1 inline" />
                    Analytics
                  </button>
                  <Link
                    href={`/dashboard/squads/${squad.id}`}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
                  >
                    <Eye className="h-3 w-3 mr-1 inline" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Squad Details Modal */}
      {showDetails && selectedSquad && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{selectedSquad.name} - Analytics</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{selectedSquad.performance.totalCalls.toLocaleString()}</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {((selectedSquad.performance.successfulCalls / selectedSquad.performance.totalCalls) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Escalation Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {selectedSquad.performance.escalationRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedSquad.performance.customerSatisfaction.toFixed(1)}/5
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Squad Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Routing Strategy:</span>
                    <span className="font-medium">{selectedSquad.routingStrategy.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Concurrent Calls:</span>
                    <span className="font-medium">{selectedSquad.configuration.maxConcurrentCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Languages:</span>
                    <span className="font-medium">{selectedSquad.configuration.languages.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Call Recording:</span>
                    <span className="font-medium">{selectedSquad.configuration.callRecording ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escalation Rules:</span>
                    <span className="font-medium">{selectedSquad.escalationRules.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Member Details</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSquad.members.map((member) => (
                    <div key={member.assistantId} className="flex items-center justify-between p-2 border border-border rounded">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <span className="text-sm font-medium">{member.assistantName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        <span className="text-xs text-muted-foreground">P{member.priority}</span>
                        <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Close
              </button>
              <Link
                href={`/dashboard/squads/${selectedSquad.id}/edit`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Edit Squad
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}