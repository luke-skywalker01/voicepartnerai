'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  PhoneCall,
  Clock,
  Download,
  Filter,
  Search,
  Calendar,
  MoreVertical,
  Play,
  Eye,
  FileText,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react'

interface Call {
  id: string
  phoneNumber: string
  assistantName: string
  direction: 'inbound' | 'outbound'
  status: 'completed' | 'failed' | 'no-answer' | 'busy'
  duration: number // in seconds
  startedAt: string
  endedAt?: string
  cost: number
  summary?: string
  recording?: string
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'no-answer'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadCalls()
  }, [])

  const loadCalls = async () => {
    try {
      // Load from Vapi-compatible API
      const response = await fetch('/api/vapi/calls?limit=50')
      const data = await response.json()
      
      if (data.calls) {
        // Transform Vapi calls to our format
        const transformedCalls = data.calls.map((call: any) => ({
          id: call.id,
          phoneNumber: call.customer?.number || call.phoneNumberId || 'Unknown',
          assistantName: call.assistantId ? 'AI Assistant' : 'No Assistant',
          direction: call.type === 'inboundPhoneCall' ? 'inbound' : 'outbound',
          status: call.status === 'ended' ? 'completed' : 
                  call.status === 'in-progress' ? 'completed' : 'failed',
          duration: call.duration || 0,
          startedAt: call.startedAt || call.createdAt,
          endedAt: call.endedAt,
          cost: call.costBreakdown?.total || 0,
          summary: call.analysis?.summary,
          recording: call.recordingUrl
        }))
        setCalls(transformedCalls)
      } else {
        // Create demo calls if none exist
        const demoCalls: Call[] = [
          {
            id: 'call_demo_1',
            phoneNumber: '+1-555-0123',
            assistantName: 'Customer Service Bot',
            direction: 'inbound',
            status: 'completed',
            duration: 245,
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 245000).toISOString(),
            cost: 0.25,
            summary: 'Customer inquiry about order status. Successfully provided assistance.',
            recording: 'recording_1.mp3'
          },
          {
            id: 'call_2',
            phoneNumber: '+49 800 1234567',
            assistantName: 'Terminbuchung Assistant',
            direction: 'inbound',
            status: 'completed',
            duration: 180,
            startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            endedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 180000).toISOString(),
            cost: 0.09,
            summary: 'Erfolgreiche Terminbuchung für Donnerstag 14:00 Uhr',
            recording: 'recording_2.mp3'
          },
          {
            id: 'call_3',
            phoneNumber: '+49 30 12345678',
            assistantName: 'Kundenservice Assistant',
            direction: 'inbound',
            status: 'no-answer',
            duration: 0,
            startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            cost: 0.00
          },
          {
            id: 'call_4',
            phoneNumber: '+49 800 1234567',
            assistantName: 'Terminbuchung Assistant',
            direction: 'inbound',
            status: 'completed',
            duration: 320,
            startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 320000).toISOString(),
            cost: 0.16,
            summary: 'Terminbuchung und Rückfragen zur Anfahrt',
            recording: 'recording_4.mp3'
          },
          {
            id: 'call_5',
            phoneNumber: '+49 30 12345678',
            assistantName: 'Kundenservice Assistant',
            direction: 'inbound',
            status: 'failed',
            duration: 15,
            startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15000).toISOString(),
            cost: 0.01
          }
        ]
        setCalls(demoCalls)
        localStorage.setItem('voicepartner_calls', JSON.stringify(demoCalls))
      }
    } catch (error) {
      console.error('Failed to load calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCalls = calls.filter(call => {
    const matchesFilter = filter === 'all' || call.status === filter
    const matchesSearch = call.phoneNumber.includes(searchTerm) || 
                         call.assistantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (call.summary && call.summary.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'no-answer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'busy':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
      case 'no-answer':
        return '📵'
      case 'busy':
        return '📞'
      default:
        return '⚪'
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0s'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`
  }

  const totalCalls = calls.length
  const completedCalls = calls.filter(c => c.status === 'completed').length
  const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0)
  const totalCost = calls.reduce((sum, call) => sum + call.cost, 0)
  const successRate = totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calls</h1>
          <p className="text-muted-foreground mt-1">Übersicht über alle Anrufe und deren Verläufe</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="border border-border text-foreground hover:bg-muted px-4 py-2 rounded-md flex items-center font-medium transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="1d">Letzter Tag</option>
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzter Monat</option>
            <option value="90d">Letzte 3 Monate</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gesamt Anrufe</p>
              <p className="text-2xl font-bold">{totalCalls}</p>
            </div>
            <Phone className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Erfolgreich</p>
              <p className="text-2xl font-bold text-green-600">{completedCalls}</p>
            </div>
            <PhoneCall className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Erfolgsrate</p>
              <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gesamt-Dauer</p>
              <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
            </div>
            <Clock className="h-8 w-8 text-accent" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gesamt-Kosten</p>
              <p className="text-2xl font-bold">€{totalCost.toFixed(2)}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Filter Tabs */}
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Alle', count: calls.length },
              { key: 'completed', label: 'Erfolgreich', count: calls.filter(c => c.status === 'completed').length },
              { key: 'failed', label: 'Fehlgeschlagen', count: calls.filter(c => c.status === 'failed').length },
              { key: 'no-answer', label: 'Keine Antwort', count: calls.filter(c => c.status === 'no-answer').length },
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Suche nach Nummer, Assistant oder Inhalt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-md bg-background w-80"
          />
        </div>
      </div>

      {/* Calls Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Keine Anrufe gefunden</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchTerm ? 'Keine Anrufe entsprechen Ihren Suchkriterien.' : 'Noch keine Anrufe eingegangen.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-muted/50 px-6 py-3 border-b border-border">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-2">Nummer</div>
              <div className="col-span-2">Assistant</div>
              <div className="col-span-1">Typ</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Zeitpunkt</div>
              <div className="col-span-1">Dauer</div>
              <div className="col-span-1">Kosten</div>
              <div className="col-span-1">Recording</div>
              <div className="col-span-1">Aktionen</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {filteredCalls.map((call) => (
              <div key={call.id} className="px-6 py-4 hover:bg-muted/25 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Phone Number */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{call.phoneNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assistant */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center">
                        <Users className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-sm text-foreground">{call.assistantName}</span>
                    </div>
                  </div>

                  {/* Direction */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      call.direction === 'inbound' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {call.direction === 'inbound' ? '📞 Eingehend' : '📱 Ausgehend'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(call.status)}`}>
                      {getStatusIcon(call.status)} {call.status}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="col-span-2">
                    <p className="text-sm text-foreground">
                      {new Date(call.startedAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="col-span-1">
                    <p className="text-sm font-medium">{formatDuration(call.duration)}</p>
                  </div>

                  {/* Cost */}
                  <div className="col-span-1">
                    <p className="text-sm font-medium">€{call.cost.toFixed(2)}</p>
                  </div>

                  {/* Recording */}
                  <div className="col-span-1">
                    {call.recording ? (
                      <button className="p-1 text-blue-600 hover:text-blue-700 rounded transition-colors">
                        <Play className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-1">
                      {call.summary && (
                        <button 
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                          title="Details anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Call Summary (if exists) */}
                {call.summary && (
                  <div className="mt-3 pl-11">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground">{call.summary}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}