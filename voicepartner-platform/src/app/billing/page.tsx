'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  CreditCard, 
  Download, 
  Calendar, 
  Check,
  Star,
  Zap,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Phone
} from 'lucide-react'

interface BillingData {
  currentPlan: {
    name: string
    price: number
    billing: 'monthly' | 'annual'
    features: string[]
  }
  usage: {
    voiceMinutes: { used: number; limit: number }
    agents: { used: number; limit: number }
    apiCalls: { used: number; limit: number }
  }
  invoices: {
    id: string
    date: string
    amount: number
    status: 'paid' | 'pending' | 'overdue'
    downloadUrl?: string
  }[]
}

const mockBillingData: BillingData = {
  currentPlan: {
    name: 'Professional',
    price: 49,
    billing: 'monthly',
    features: [
      'Bis zu 5 Voice Agents',
      '1000 Voice-Minuten/Monat',
      'Unlimited API Calls',
      'Premium Support',
      'Custom Workflows'
    ]
  },
  usage: {
    voiceMinutes: { used: 687, limit: 1000 },
    agents: { used: 3, limit: 5 },
    apiCalls: { used: 12450, limit: -1 }
  },
  invoices: [
    {
      id: 'INV-2024-001',
      date: '2024-01-01',
      amount: 49,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-01',
      amount: 49,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-01',
      amount: 49,
      status: 'paid',
      downloadUrl: '#'
    }
  ]
}

const plans = [
  {
    name: 'Starter',
    price: 19,
    billing: 'monthly',
    description: 'Perfekt für kleine Unternehmen',
    features: [
      '2 Voice Agents',
      '500 Voice-Minuten/Monat',
      '5,000 API Calls/Monat',
      'E-Mail Support',
      'Standard Templates'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: 49,
    billing: 'monthly',
    description: 'Ideal für wachsende Unternehmen',
    features: [
      '5 Voice Agents',
      '1,000 Voice-Minuten/Monat',
      'Unlimited API Calls',
      'Premium Support',
      'Custom Workflows'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 99,
    billing: 'monthly',
    description: 'Für große Unternehmen',
    features: [
      'Unlimited Voice Agents',
      '5,000 Voice-Minuten/Monat',
      'Unlimited API Calls',
      '24/7 Priority Support',
      'White-label Solution',
      'Custom Integration'
    ],
    popular: false
  }
]

export default function BillingPage() {
  const [billingData] = useState<BillingData>(mockBillingData)
  const [showPlans, setShowPlans] = useState(false)

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-muted rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Billing & Usage</h1>
                <p className="text-muted-foreground">Verwalten Sie Ihre Abonnements und Nutzung</p>
              </div>
            </div>
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Plan ändern
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Plan */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{billingData.currentPlan.name} Plan</h2>
                <p className="text-muted-foreground">
                  €{billingData.currentPlan.price}/{billingData.currentPlan.billing === 'monthly' ? 'Monat' : 'Jahr'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Aktiv
                </div>
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Plan Features:</h3>
                <ul className="space-y-2">
                  {billingData.currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Nächste Abrechnung:</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">31. Januar 2024</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">€{billingData.currentPlan.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Nutzungsübersicht</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Voice Minutes */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Voice Minutes</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {billingData.usage.voiceMinutes.used} / {billingData.usage.voiceMinutes.limit}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getUsagePercentage(billingData.usage.voiceMinutes.used, billingData.usage.voiceMinutes.limit)}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {Math.round(getUsagePercentage(billingData.usage.voiceMinutes.used, billingData.usage.voiceMinutes.limit))}% verwendet
              </p>
            </div>

            {/* Agents */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Voice Agents</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {billingData.usage.agents.used} / {billingData.usage.agents.limit}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getUsagePercentage(billingData.usage.agents.used, billingData.usage.agents.limit)}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {Math.round(getUsagePercentage(billingData.usage.agents.used, billingData.usage.agents.limit))}% verwendet
              </p>
            </div>

            {/* API Calls */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">API Calls</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {billingData.usage.apiCalls.used.toLocaleString('de-DE')} / Unlimited
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Unlimited verfügbar
              </p>
            </div>
          </div>
        </div>

        {/* Plans (wenn angezeigt) */}
        {showPlans && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Verfügbare Pläne</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`bg-card border rounded-lg p-6 relative ${
                    plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Beliebt
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    <div className="text-3xl font-bold text-foreground">
                      €{plan.price}
                      <span className="text-sm text-muted-foreground font-normal">/Monat</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                      plan.name === billingData.currentPlan.name
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border text-foreground hover:bg-muted'
                    }`}
                    disabled={plan.name === billingData.currentPlan.name}
                  >
                    {plan.name === billingData.currentPlan.name ? 'Aktueller Plan' : 'Plan wählen'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Rechnungshistorie</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rechnungsnummer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Betrag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {billingData.invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {invoice.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        €{invoice.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Bezahlt' :
                           invoice.status === 'pending' ? 'Ausstehend' : 'Überfällig'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.downloadUrl && (
                          <button className="text-primary hover:text-primary/80 flex items-center space-x-1">
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mt-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Zahlungsmethod</h3>
              <button className="text-primary hover:text-primary/80 text-sm">
                Ändern
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Läuft ab 12/25</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}