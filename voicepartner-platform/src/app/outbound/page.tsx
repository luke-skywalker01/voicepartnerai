'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Phone, 
  PhoneCall,
  PhoneOutgoing,
  User,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Target,
  TrendingUp,
  History
} from 'lucide-react'

// Types
interface Assistant {
  id: number
  name: string
  description: string
  is_active: boolean
}

interface PhoneNumber {
  id: number
  phone_number: string
  friendly_name: string
  status: string
}

interface CreditInfo {
  current_credits: number
  monthly_limit: number
  cost_per_minute: number
}

interface OutboundCallData {
  assistants: Assistant[]
  phone_numbers: PhoneNumber[]
  credit_info: CreditInfo
}

interface OutboundCall {
  id: number
  call_sid: string
  caller_number: string
  called_number: string
  status: string
  start_time: string
  end_time?: string
  duration_seconds?: number
  credits_consumed: number
  cost_eur?: number
  assistant_name: string
  context_data?: {
    campaign?: string
    [key: string]: any
  }
}

interface CallHistoryData {
  calls: OutboundCall[]
  pagination: {
    total: number
    skip: number
    limit: number
    has_more: boolean
    current_page: number
    total_pages: number
  }
  summary_stats: {
    avg_duration: number
    total_credits: number
    success_rate: number
    completion_rate: number
    avg_cost_per_call: number
    campaign_breakdown: Record<string, number>
  }
}

export default function OutboundPage() {
  const [activeTab, setActiveTab] = useState('start-call')
  const [callData, setCallData] = useState<OutboundCallData | null>(null)
  const [callHistory, setCallHistory] = useState<CallHistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [callInProgress, setCallInProgress] = useState(false)
  
  // Call form state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedAssistant, setSelectedAssistant] = useState<number | ''>('')
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<number | ''>('')
  const [priority, setPriority] = useState('normal')
  const [maxDuration, setMaxDuration] = useState(5)
  const [campaignName, setCampaignName] = useState('')
  const [contextData, setContextData] = useState('')
  
  // History filters
  const [statusFilter, setStatusFilter] = useState('')
  const [assistantFilter, setAssistantFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')

  // Load outbound call data
  useEffect(() => {
    fetchCallData()
    if (activeTab === 'history') {
      fetchCallHistory()
    }
    
    // Check for assistant parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const assistantParam = urlParams.get('assistant')
    if (assistantParam) {
      setSelectedAssistant(Number(assistantParam))
    }
  }, [activeTab])

  const fetchCallData = async () => {
    try {
      const response = await fetch('/api/outbound/start-call')
      const data = await response.json()
      if (data.success) {
        setCallData(data.data)
        // Set default selections
        if (data.data.assistants.length > 0) {
          setSelectedAssistant(data.data.assistants[0].id)
        }
        if (data.data.phone_numbers.length > 0) {
          setSelectedPhoneNumber(data.data.phone_numbers[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch call data:', error)
    }
  }

  const fetchCallHistory = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '20',
        skip: '0'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (assistantFilter) params.append('assistant_id', assistantFilter)
      if (searchTerm) params.append('search', searchTerm)
      if (campaignFilter) params.append('campaign', campaignFilter)

      const response = await fetch(`/api/outbound/history?${params}`)
      const data = await response.json()
      if (data.success) {
        setCallHistory(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch call history:', error)
    } finally {
      setLoading(false)
    }
  }

  const startOutboundCall = async () => {
    if (!phoneNumber || !selectedAssistant) {
      alert('Bitte Telefonnummer und Assistant auswählen')
      return
    }

    try {
      setCallInProgress(true)
      
      const requestData = {
        phone_number_to_call: phoneNumber,
        assistant_id: selectedAssistant,
        phone_number_id: selectedPhoneNumber || undefined,
        priority: priority,
        max_duration_minutes: maxDuration,
        context_data: {
          campaign: campaignName || 'manual_call',
          ...(contextData ? JSON.parse(contextData) : {})
        }
      }

      const response = await fetch('/api/outbound/start-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`Anruf erfolgreich gestartet!\nStatus: ${data.data.status}\nCall-ID: ${data.data.call_sid}\n\n${data.data.message}`)
        // Reset form
        setPhoneNumber('')
        setCampaignName('')
        setContextData('')
        // Refresh history if on history tab
        if (activeTab === 'history') {
          fetchCallHistory()
        }
      } else {
        alert(`Fehler beim Starten des Anrufs:\n${data.error}`)
      }
    } catch (error) {
      console.error('Failed to start call:', error)
      alert('Fehler beim Starten des Anrufs')
    } finally {
      setCallInProgress(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</span>
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center"><XCircle className="w-3 h-3 mr-1" />Fehlgeschlagen</span>
      case 'busy':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />Besetzt</span>
      case 'queued':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center"><Clock className="w-3 h-3 mr-1" />Warteschlange</span>
      case 'initiated':
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center"><PlayCircle className="w-3 h-3 mr-1" />Eingeleitet</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const estimatedCost = callData ? (maxDuration * callData.credit_info.cost_per_minute) : 0

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <PhoneOutgoing className="h-6 w-6 mr-3" />
                Outbound Calling
              </h1>
              <p className="text-muted-foreground">
                Starten Sie ausgehende Anrufe mit Ihren AI-Assistenten
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {callData && (
              <div className="text-right">
                <div className="text-sm font-medium">{callData.credit_info.current_credits.toFixed(1)} Credits</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(callData.credit_info.cost_per_minute)}/Min</div>
              </div>
            )}
            <button 
              onClick={fetchCallData}
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('start-call')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'start-call'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Phone className="h-4 w-4 mr-2" />
            Anruf starten
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4 mr-2" />
            Anruf-Historie
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {activeTab === 'start-call' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Neuen Outbound-Anruf starten
              </h3>
              
              <div className="space-y-6">
                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ziel-Telefonnummer *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+49 171 1234567"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    disabled={callInProgress}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: +49 171 1234567 (mit Ländercode)
                  </p>
                </div>

                {/* Assistant Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Assistant auswählen *
                  </label>
                  <select
                    value={selectedAssistant}
                    onChange={(e) => setSelectedAssistant(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    disabled={callInProgress}
                  >
                    <option value="">Assistant auswählen</option>
                    {callData?.assistants.map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.name} - {assistant.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number From */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ausgehende Nummer
                  </label>
                  <select
                    value={selectedPhoneNumber}
                    onChange={(e) => setSelectedPhoneNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    disabled={callInProgress}
                  >
                    {callData?.phone_numbers.map((phone) => (
                      <option key={phone.id} value={phone.id}>
                        {phone.phone_number} ({phone.friendly_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Advanced Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Priorität
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      disabled={callInProgress}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">Hoch</option>
                      <option value="urgent">Dringend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max. Dauer (Min)
                    </label>
                    <input
                      type="number"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(Number(e.target.value))}
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      disabled={callInProgress}
                    />
                  </div>
                </div>

                {/* Campaign and Context */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kampagne (optional)
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="z.B. appointment_reminder, sales_followup"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    disabled={callInProgress}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Zusätzliche Daten (JSON, optional)
                  </label>
                  <textarea
                    value={contextData}
                    onChange={(e) => setContextData(e.target.value)}
                    placeholder='{"customer_id": "123", "appointment_id": "apt_456"}'
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    disabled={callInProgress}
                  />
                </div>

                {/* Cost Estimation */}
                {callData && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Kostenschätzung
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Aktuelle Credits:</span>
                        <span className="float-right font-medium">{callData.credit_info.current_credits.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Geschätzte Kosten:</span>
                        <span className="float-right font-medium">{estimatedCost.toFixed(1)} Credits</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Verbleibende Credits:</span>
                        <span className="float-right font-medium">{Math.max(0, callData.credit_info.current_credits - estimatedCost).toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kosten in EUR:</span>
                        <span className="float-right font-medium">{formatCurrency(estimatedCost * 0.01)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Start Call Button */}
                <button
                  onClick={startOutboundCall}
                  disabled={callInProgress || !phoneNumber || !selectedAssistant}
                  className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center ${
                    callInProgress || !phoneNumber || !selectedAssistant
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {callInProgress ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Anruf wird gestartet...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Anruf starten
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {callHistory && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <PhoneOutgoing className="h-5 w-5 text-blue-600" />
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{callHistory.pagination.total}</p>
                    <p className="text-sm text-muted-foreground">Outbound Anrufe</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{callHistory.summary_stats.success_rate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Erfolgsrate</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{Math.round(callHistory.summary_stats.avg_duration)}s</p>
                    <p className="text-sm text-muted-foreground">Ø Dauer</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{callHistory.summary_stats.total_credits.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Credits verbraucht</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and History Table */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Outbound Anruf-Historie</h3>
              
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Suche nach Nummer, Kampagne..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-border rounded-md bg-background"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-border bg-background rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Alle Status</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="failed">Fehlgeschlagen</option>
                  <option value="busy">Besetzt</option>
                  <option value="queued">Warteschlange</option>
                </select>
                <select
                  value={assistantFilter}
                  onChange={(e) => setAssistantFilter(e.target.value)}
                  className="border border-border bg-background rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Alle Assistants</option>
                  {callData?.assistants.map((assistant) => (
                    <option key={assistant.id} value={assistant.id.toString()}>
                      {assistant.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchCallHistory}
                  className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aktualisieren
                </button>
              </div>

              {/* History Table */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 font-medium">Ziel</th>
                        <th className="text-left py-3 font-medium">Von</th>
                        <th className="text-left py-3 font-medium">Assistant</th>
                        <th className="text-left py-3 font-medium">Start</th>
                        <th className="text-left py-3 font-medium">Dauer</th>
                        <th className="text-left py-3 font-medium">Status</th>
                        <th className="text-left py-3 font-medium">Credits</th>
                        <th className="text-left py-3 font-medium">Kampagne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callHistory?.calls.map((call) => (
                        <tr key={call.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-4">
                            <div>
                              <div className="font-medium">{call.called_number}</div>
                              <div className="text-sm text-muted-foreground">{call.call_sid}</div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm">{call.caller_number}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm">{call.assistant_name}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm">
                              {new Date(call.start_time).toLocaleString('de-DE')}
                            </div>
                          </td>
                          <td className="py-4">
                            {call.duration_seconds ? formatDuration(call.duration_seconds) : '-'}
                          </td>
                          <td className="py-4">
                            {getStatusBadge(call.status)}
                          </td>
                          <td className="py-4">{call.credits_consumed.toFixed(1)}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {call.context_data?.campaign || 'manual'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {callHistory && callHistory.pagination.total > 0 && (
                <div className="flex items-center justify-between px-2 py-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Seite {callHistory.pagination.current_page} von {callHistory.pagination.total_pages} 
                    ({callHistory.pagination.total} Anrufe gesamt)
                  </div>
                  <div className="text-sm font-medium">
                    Ø Kosten: {formatCurrency(callHistory.summary_stats.avg_cost_per_call)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}