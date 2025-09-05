'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  Plus, 
  Search, 
  Filter,
  Globe,
  Settings,
  Activity,
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PhoneCall
} from 'lucide-react'

interface PhoneNumber {
  id: string
  number: string
  country: string
  countryCode: string
  type: 'local' | 'toll-free' | 'mobile'
  status: 'active' | 'inactive' | 'pending'
  assignedAgent?: string
  monthlyPrice: number
  features: string[]
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
  }
  usage: {
    inbound: number
    outbound: number
    minutes: number
  }
}

const mockPhoneNumbers: PhoneNumber[] = [
  {
    id: '1',
    number: '+49 30 12345678',
    country: 'Deutschland',
    countryCode: 'DE',
    type: 'local',
    status: 'active',
    assignedAgent: 'Termin-Buchungs-Agent',
    monthlyPrice: 5.99,
    features: ['Anrufweiterleitung', 'Voicemail', 'Call Recording'],
    capabilities: {
      voice: true,
      sms: true,
      mms: false
    },
    usage: {
      inbound: 156,
      outbound: 23,
      minutes: 1247
    }
  },
  {
    id: '2',
    number: '+49 800 1234567',
    country: 'Deutschland',
    countryCode: 'DE',
    type: 'toll-free',  
    status: 'active',
    assignedAgent: 'Kunden-Support-Agent',
    monthlyPrice: 12.99,
    features: ['Kostenlose Anrufe', 'IVR', 'Analytics'],
    capabilities: {
      voice: true,
      sms: false,
      mms: false
    },
    usage: {
      inbound: 423,
      outbound: 5,
      minutes: 3567
    }
  },
  {
    id: '3',
    number: '+43 1 9876543',
    country: 'Österreich',
    countryCode: 'AT',
    type: 'local',
    status: 'inactive',
    monthlyPrice: 6.99,
    features: ['Anrufweiterleitung', 'SMS'],
    capabilities: {
      voice: true,
      sms: true,
      mms: false
    },
    usage: {
      inbound: 0,
      outbound: 0,
      minutes: 0
    }
  }
]

const availableCountries = [
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
  { code: 'AT', name: 'Österreich', flag: '🇦🇹' },
  { code: 'CH', name: 'Schweiz', flag: '🇨🇭' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'GB', name: 'Großbritannien', flag: '🇬🇧' },
  { code: 'FR', name: 'Frankreich', flag: '🇫🇷' }
]

export default function PhoneNumbersPage() {
  const [phoneNumbers] = useState<PhoneNumber[]>(mockPhoneNumbers)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const filteredNumbers = phoneNumbers.filter(number => {
    const matchesSearch = number.number.includes(searchQuery) || 
                         number.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (number.assignedAgent && number.assignedAgent.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || number.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'toll-free':
        return '📞'
      case 'mobile':
        return '📱'
      default:
        return '☎️'
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="p-2 hover:bg-muted rounded-md">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Phone Numbers</h1>
                <p className="text-muted-foreground">Verwalten Sie Ihre Telefonnummern für Voice Agents</p>
              </div>
            </div>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nummer kaufen
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt Nummern</p>
                <p className="text-3xl font-bold text-foreground">{phoneNumbers.length}</p>
              </div>
              <Phone className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktive Nummern</p>
                <p className="text-3xl font-bold text-foreground">
                  {phoneNumbers.filter(n => n.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monatliche Kosten</p>
                <p className="text-3xl font-bold text-foreground">
                  €{phoneNumbers.reduce((sum, n) => sum + n.monthlyPrice, 0).toFixed(2)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt Minuten</p>
                <p className="text-3xl font-bold text-foreground">
                  {phoneNumbers.reduce((sum, n) => sum + n.usage.minutes, 0).toLocaleString()}
                </p>
              </div>
              <PhoneCall className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nummern suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="pending">Ausstehend</option>
            </select>
          </div>
        </div>

        {/* Phone Numbers List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Land
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Zugewiesener Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nutzung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Preis/Monat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNumbers.map((number) => (
                  <tr key={number.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTypeIcon(number.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-foreground">{number.number}</div>
                          <div className="flex space-x-1 mt-1">
                            {number.capabilities.voice && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Voice</span>
                            )}
                            {number.capabilities.sms && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">SMS</span>
                            )}
                            {number.capabilities.mms && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">MMS</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {availableCountries.find(c => c.code === number.countryCode)?.flag}
                        </span>
                        <span className="text-sm text-muted-foreground">{number.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground capitalize">
                      {number.type === 'toll-free' ? 'Kostenlos' : 
                       number.type === 'mobile' ? 'Mobil' : 'Festnetz'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(number.status)}`}>
                        {number.status === 'active' ? 'Aktiv' :
                         number.status === 'inactive' ? 'Inaktiv' : 'Ausstehend'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {number.assignedAgent ? (
                        <div className="text-foreground">{number.assignedAgent}</div>
                      ) : (
                        <span className="text-muted-foreground">Nicht zugewiesen</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <div>↓ {number.usage.inbound} Anrufe</div>
                        <div>↑ {number.usage.outbound} Anrufe</div>
                        <div className="text-xs text-muted-foreground">
                          {number.usage.minutes} Min.
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      €{number.monthlyPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Testen"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Kopieren"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredNumbers.length === 0 && (
          <div className="text-center py-12">
            <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine Telefonnummern gefunden</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
                : 'Kaufen Sie Ihre erste Telefonnummer für Voice Agents.'
              }
            </p>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Erste Nummer kaufen
            </button>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Neue Telefonnummer kaufen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Land auswählen</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  {availableCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nummerntyp</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option value="local">Festnetz</option>
                  <option value="toll-free">Kostenlos</option>
                  <option value="mobile">Mobil</option>
                </select>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Preis: €5.99/Monat (Festnetz Deutschland)
                </p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowPurchaseModal(false)
                  alert('Nummer wird bestellt...')
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Kaufen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}