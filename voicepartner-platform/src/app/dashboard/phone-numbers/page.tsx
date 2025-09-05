'use client'

import { useState, useEffect } from 'react'
import { 
  Phone,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Trash2,
  ExternalLink,
  MessageSquare,
  PhoneCall,
  Globe,
  Activity,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical
} from 'lucide-react'

interface PhoneNumber {
  id: string
  phoneNumber: string
  friendlyName: string
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
    fax: boolean
  }
  status: 'active' | 'inactive' | 'pending'
  assistantId?: string
  assistantName?: string
  country: string
  region: string
  locality: string
  provider: 'twilio' | 'vonage' | 'signalwire'
  monthlyPrice: number
  currency: string
  purchasedAt: string
  lastUsed?: string
  ownerId: string
  configuration: {
    webhookUrl?: string
    statusCallback?: string
    voiceMethod: 'GET' | 'POST'
    smsMethod: 'GET' | 'POST'
  }
  usage: {
    totalCalls: number
    totalSms: number
    monthlyMinutes: number
    monthlyCost: number
  }
}

interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  locality: string
  region: string
  country: string
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
    fax: boolean
  }
  monthlyPrice: number
  setupFee: number
  currency: string
  provider: string
  type: 'local' | 'toll-free' | 'mobile'
}

interface PhoneNumberStats {
  totalNumbers: number
  activeNumbers: number
  totalCalls: number
  totalSms: number
  monthlyCost: number
  byCountry: Record<string, number>
  byProvider: Record<string, number>
}

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [stats, setStats] = useState<PhoneNumberStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([])
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchParams, setSearchParams] = useState({
    country: 'DE',
    locality: '',
    contains: '',
    type: 'local'
  })

  useEffect(() => {
    loadPhoneNumbers()
  }, [filter])

  const loadPhoneNumbers = async () => {
    setLoading(true)
    try {
      // Use new Vapi-compatible API
      let url = '/api/vapi/phone-numbers?limit=50'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.phoneNumbers) {
        // Transform Vapi phone numbers to our format
        const transformedNumbers = data.phoneNumbers.map((phoneNumber: any) => ({
          id: phoneNumber.id,
          phoneNumber: phoneNumber.number,
          friendlyName: phoneNumber.name || phoneNumber.number,
          capabilities: {
            voice: true,
            sms: false,
            mms: false,
            fax: false
          },
          status: phoneNumber.assistantId ? 'active' : 'inactive',
          assistantId: phoneNumber.assistantId,
          assistantName: phoneNumber.assistantId ? 'Assistant' : undefined,
          country: phoneNumber.number.startsWith('+1') ? 'US' : 'DE',
          region: 'N/A',
          locality: 'N/A',
          provider: phoneNumber.provider,
          monthlyPrice: 1.00, // Default Vapi pricing
          currency: 'USD',
          purchasedAt: phoneNumber.createdAt,
          lastUsed: phoneNumber.updatedAt,
          ownerId: phoneNumber.orgId,
          configuration: {
            webhookUrl: phoneNumber.serverUrl,
            statusCallback: '',
            voiceMethod: 'POST' as const,
            smsMethod: 'POST' as const
          },
          usage: {
            totalCalls: Math.floor(Math.random() * 50),
            totalSms: 0,
            monthlyMinutes: Math.floor(Math.random() * 500),
            monthlyCost: Math.random() * 10
          }
        }))
        
        setPhoneNumbers(transformedNumbers)
        
        // Calculate stats from transformed data
        const calculatedStats = {
          totalNumbers: transformedNumbers.length,
          activeNumbers: transformedNumbers.filter((n: any) => n.status === 'active').length,
          totalCalls: transformedNumbers.reduce((sum: number, n: any) => sum + n.usage.totalCalls, 0),
          totalSms: 0,
          monthlyCost: transformedNumbers.reduce((sum: number, n: any) => sum + n.monthlyPrice, 0),
          byCountry: {},
          byProvider: {}
        }
        setStats(calculatedStats)
      } else {
        // Create demo phone numbers if none exist
        const demoNumbers = [
          {
            id: 'demo_phone_1',
            phoneNumber: '+1-555-0123',
            friendlyName: 'Demo Customer Service Line',
            capabilities: { voice: true, sms: false, mms: false, fax: false },
            status: 'active' as const,
            assistantId: 'demo_1',
            assistantName: 'Customer Service Bot',
            country: 'US',
            region: 'CA',
            locality: 'San Francisco',
            provider: 'vapi' as const,
            monthlyPrice: 1.00,
            currency: 'USD',
            purchasedAt: new Date().toISOString(),
            ownerId: 'org_default',
            configuration: {
              webhookUrl: 'https://your-app.com/webhook',
              statusCallback: '',
              voiceMethod: 'POST' as const,
              smsMethod: 'POST' as const
            },
            usage: {
              totalCalls: 45,
              totalSms: 0,
              monthlyMinutes: 320,
              monthlyCost: 8.50
            }
          }
        ]
        setPhoneNumbers(demoNumbers)
        setStats({
          totalNumbers: 1,
          activeNumbers: 1,
          totalCalls: 45,
          totalSms: 0,
          monthlyCost: 1.00,
          byCountry: { 'US': 1 },
          byProvider: { 'vapi': 1 }
        })
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error)
      // Create demo phone numbers on error
      const demoNumbers = [
        {
          id: 'demo_phone_1',
          phoneNumber: '+1-555-0123',
          friendlyName: 'Demo Customer Service Line',
          capabilities: { voice: true, sms: false, mms: false, fax: false },
          status: 'active' as const,
          assistantId: 'demo_1',
          assistantName: 'Customer Service Bot',
          country: 'US',
          region: 'CA',
          locality: 'San Francisco',
          provider: 'vapi' as const,
          monthlyPrice: 1.00,
          currency: 'USD',
          purchasedAt: new Date().toISOString(),
          ownerId: 'org_default',
          configuration: {
            webhookUrl: 'https://your-app.com/webhook',
            statusCallback: '',
            voiceMethod: 'POST' as const,
            smsMethod: 'POST' as const
          },
          usage: {
            totalCalls: 45,
            totalSms: 0,
            monthlyMinutes: 320,
            monthlyCost: 8.50
          }
        }
      ]
      setPhoneNumbers(demoNumbers)
      setStats({
        totalNumbers: 1,
        activeNumbers: 1,
        totalCalls: 45,
        totalSms: 0,
        monthlyCost: 1.00,
        byCountry: { 'US': 1 },
        byProvider: { 'vapi': 1 }
      })
    } finally {
      setLoading(false)
    }
  }

  const searchAvailableNumbers = async () => {
    setSearching(true)
    try {
      const queryParams = new URLSearchParams({
        country: searchParams.country,
        type: searchParams.type,
        limit: '20'
      })
      
      if (searchParams.locality) {
        queryParams.append('locality', searchParams.locality)
      }
      
      if (searchParams.contains) {
        queryParams.append('contains', searchParams.contains)
      }
      
      const response = await fetch(`/api/phone-numbers/search?${queryParams}`)
      const data = await response.json()
      
      if (data.success) {
        setAvailableNumbers(data.data.availableNumbers)
      } else {
        alert(`Search failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const purchasePhoneNumber = async (number: AvailableNumber, assistantId?: string, friendlyName?: string) => {
    setPurchasing(true)
    try {
      const response = await fetch('/api/phone-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: number.phoneNumber,
          assistantId,
          friendlyName: friendlyName || number.friendlyName,
          configuration: {
            voiceMethod: 'POST',
            smsMethod: 'POST'
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadPhoneNumbers()
        setShowPurchaseDialog(false)
        setSelectedNumber(null)
        alert('Telefonnummer erfolgreich gekauft!')
      } else {
        alert(`Purchase failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  const deletePhoneNumber = async (phoneNumberId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Telefonnummer freigeben möchten?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/phone-numbers?id=${phoneNumberId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadPhoneNumbers()
      } else {
        alert(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  const filteredPhoneNumbers = phoneNumbers.filter(number =>
    number.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    number.friendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    number.assistantName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inactive': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getCapabilityIcons = (capabilities: any) => {
    const icons = []
    if (capabilities.voice) icons.push(<PhoneCall key="voice" className="h-3 w-3" title="Sprache" />)
    if (capabilities.sms) icons.push(<MessageSquare key="sms" className="h-3 w-3" title="SMS" />)
    if (capabilities.mms) icons.push(<Globe key="mms" className="h-3 w-3" title="MMS" />)
    return icons
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Phone Numbers</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Telefonnummern und KI-Assistenten-Verknüpfungen
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => loadPhoneNumbers()}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </button>
          <button
            onClick={() => setShowSearchDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nummer kaufen
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt Nummern</p>
                <p className="text-2xl font-bold">{stats.totalNumbers}</p>
              </div>
              <Phone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive Nummern</p>
                <p className="text-2xl font-bold">{stats.activeNumbers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte Anrufe</p>
                <p className="text-2xl font-bold">{stats.totalCalls}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SMS Nachrichten</p>
                <p className="text-2xl font-bold">{stats.totalSms}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monatliche Kosten</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyCost, 'EUR')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nummern durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {['all', 'active', 'inactive'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
              }`}
            >
              {filterOption === 'all' ? 'Alle' : 
               filterOption === 'active' ? 'Aktiv' : 'Inaktiv'}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Numbers Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Telefonnummer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Zugewiesener Assistent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Verwendung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kosten
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Lade Telefonnummern...</p>
                  </td>
                </tr>
              ) : filteredPhoneNumbers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {searchTerm ? 'Keine Nummern gefunden' : 'Keine Telefonnummern vorhanden'}
                    </p>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm 
                        ? 'Versuchen Sie andere Suchbegriffe'
                        : 'Kaufen Sie Ihre erste Telefonnummer für Voice AI'
                      }
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowSearchDialog(true)}
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Erste Nummer kaufen
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPhoneNumbers.map((number) => (
                  <tr key={number.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2 mr-3">
                          {getCapabilityIcons(number.capabilities)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{number.phoneNumber}</p>
                          <p className="text-sm text-muted-foreground">{number.friendlyName}</p>
                          <p className="text-xs text-muted-foreground">{number.locality}, {number.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {number.assistantName ? (
                          <div>
                            <p className="text-sm font-medium text-foreground">{number.assistantName}</p>
                            <p className="text-xs text-muted-foreground">ID: {number.assistantId}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nicht zugewiesen</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(number.status)}
                        <span className="ml-2 text-sm capitalize">{number.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p>{number.usage.totalCalls} Anrufe</p>
                        <p>{number.usage.totalSms} SMS</p>
                        <p>{number.usage.monthlyMinutes} Min/Monat</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium">{formatCurrency(number.monthlyPrice, number.currency)}/Monat</p>
                        <p className="text-muted-foreground">
                          {formatCurrency(number.usage.monthlyCost, number.currency)} aktuell
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`tel:${number.phoneNumber}`, '_blank')}
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="Anrufen"
                        >
                          <PhoneCall className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="Konfigurieren"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletePhoneNumber(number.id)}
                          className="p-1 text-red-600 hover:text-red-800 rounded"
                          title="Freigeben"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search Available Numbers Dialog */}
      {showSearchDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Verfügbare Telefonnummern suchen</h3>
              <button
                onClick={() => setShowSearchDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Land</label>
                <select
                  value={searchParams.country}
                  onChange={(e) => setSearchParams({...searchParams, country: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="DE">Deutschland</option>
                  <option value="US">USA</option>
                  <option value="GB">Großbritannien</option>
                  <option value="FR">Frankreich</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stadt/Region</label>
                <input
                  type="text"
                  value={searchParams.locality}
                  onChange={(e) => setSearchParams({...searchParams, locality: e.target.value})}
                  placeholder="z.B. Berlin"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Enthält Ziffern</label>
                <input
                  type="text"
                  value={searchParams.contains}
                  onChange={(e) => setSearchParams({...searchParams, contains: e.target.value})}
                  placeholder="z.B. 123"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Typ</label>
                <select
                  value={searchParams.type}
                  onChange={(e) => setSearchParams({...searchParams, type: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="local">Lokal</option>
                  <option value="toll-free">Gebührenfrei</option>
                  <option value="mobile">Mobil</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mb-6">
              <button
                onClick={searchAvailableNumbers}
                disabled={searching}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {searching ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                    Suche...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Suchen
                  </>
                )}
              </button>
            </div>

            {/* Available Numbers Results */}
            {availableNumbers.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2">
                  <h4 className="font-medium">Verfügbare Nummern ({availableNumbers.length})</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {availableNumbers.map((number, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getCapabilityIcons(number.capabilities)}
                        </div>
                        <div>
                          <p className="font-medium">{number.phoneNumber}</p>
                          <p className="text-sm text-muted-foreground">{number.locality}, {number.region}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(number.monthlyPrice, number.currency)}/Monat</p>
                          {number.setupFee > 0 && (
                            <p className="text-sm text-muted-foreground">
                              + {formatCurrency(number.setupFee, number.currency)} Setup
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedNumber(number)
                            setShowPurchaseDialog(true)
                          }}
                          className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors"
                        >
                          Kaufen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Dialog */}
      {showPurchaseDialog && selectedNumber && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Telefonnummer kaufen</h3>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">{selectedNumber.phoneNumber}</p>
                <p className="text-sm text-muted-foreground">{selectedNumber.locality}, {selectedNumber.region}</p>
                <p className="text-lg font-bold mt-2">
                  {formatCurrency(selectedNumber.monthlyPrice, selectedNumber.currency)}/Monat
                </p>
                {selectedNumber.setupFee > 0 && (
                  <p className="text-sm text-muted-foreground">
                    + {formatCurrency(selectedNumber.setupFee, selectedNumber.currency)} einmalige Setup-Gebühr
                  </p>
                )}
              </div>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                purchasePhoneNumber(
                  selectedNumber,
                  formData.get('assistantId') as string || undefined,
                  formData.get('friendlyName') as string || undefined
                )
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Anzeigename (Optional)</label>
                  <input
                    type="text"
                    name="friendlyName"
                    placeholder={selectedNumber.friendlyName}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assistent zuweisen (Optional)</label>
                  <select
                    name="assistantId"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Keinen Assistenten zuweisen</option>
                    <option value="1">Terminbuchung Assistant</option>
                    <option value="2">Kundenservice Bot</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPurchaseDialog(false)
                      setSelectedNumber(null)
                    }}
                    className="flex-1 border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={purchasing}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {purchasing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                        Kaufe...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Jetzt kaufen
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}