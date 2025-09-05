'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  CreditCard, 
  Download, 
  Calendar, 
  Check,
  Star,
  Zap,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Phone,
  RefreshCw,
  Brain,
  Mic,
  Volume2,
  Activity,
  BarChart3
} from 'lucide-react'

interface VapiBillingData {
  currentBalance: number
  currency: string
  nextBillingDate: string
  usage: {
    currentPeriod: {
      startDate: string
      endDate: string
      totalCalls: number
      totalMinutes: number
      totalCost: number
      breakdown: {
        llm: {
          promptTokens: number
          completionTokens: number
          cost: number
        }
        stt: {
          seconds: number
          cost: number
        }
        tts: {
          characters: number
          cost: number
        }
        vapi: {
          minutes: number
          cost: number
        }
        telephony: {
          minutes: number
          cost: number
        }
      }
    }
    previousPeriods: Array<{
      period: string
      totalCost: number
      totalMinutes: number
      totalCalls: number
    }>
  }
  subscription: {
    plan: string
    features: string[]
    limits: {
      concurrentCalls: number
      monthlyMinutes: number
      assistants: number
      phoneNumbers: number
    }
    pricing: {
      baseMonthlyFee: number
      perMinuteRate: number
      overageRate: number
    }
  }
  paymentMethod: {
    type: string
    last4: string
    expiryDate?: string
  }
  invoices: Array<{
    id: string
    date: string
    amount: number
    status: 'paid' | 'pending' | 'failed'
    downloadUrl: string
  }>
}

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
    price: 79,
    billing: 'monthly',
    features: [
      'Bis zu 5 Voice Assistants',
      '300 Voice-Minuten inklusive',
      'Danach: €0,40/Minute',
      'Priority Support',
      'Analytics Dashboard'
    ]
  },
  usage: {
    voiceMinutes: { used: 187, limit: 300 },
    agents: { used: 3, limit: 5 },
    apiCalls: { used: 12450, limit: -1 }
  },
  invoices: [
    {
      id: 'INV-2024-001',
      date: '2024-01-01',
      amount: 79,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-01',
      amount: 79,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-01',
      amount: 79,
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
      '50 Minuten inklusive',
      'Danach: €0,50/Minute',
      'E-Mail Support'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: 79,
    billing: 'monthly',
    description: 'Ideal für wachsende Unternehmen',
    features: [
      '300 Minuten inklusive',
      'Danach: €0,40/Minute',
      'Priority Support',
      'Analytics Dashboard'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 299,
    billing: 'monthly',
    description: 'Für große Unternehmen',
    features: [
      '1.000 Minuten inklusive',
      'Danach: €0,30/Minute',
      '24/7 Support',
      'Custom Models'
    ],
    popular: false
  }
]

export default function BillingPage() {
  const [billingData] = useState<BillingData>(mockBillingData)
  const [vapiBillingData, setVapiBillingData] = useState<VapiBillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPlans, setShowPlans] = useState(false)

  const loadVapiBillingData = async () => {
    try {
      const response = await fetch('/api/vapi/billing')
      const data = await response.json()
      setVapiBillingData(data)
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshBilling = async () => {
    setRefreshing(true)
    await loadVapiBillingData()
  }

  useEffect(() => {
    loadVapiBillingData()
  }, [])

  const getUsagePercentage = useMemo(() => (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }, [])

  const nextBillingDate = useMemo(() => {
    if (vapiBillingData?.nextBillingDate) {
      return new Date(vapiBillingData.nextBillingDate).toLocaleDateString('de-DE')
    }
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
    return nextMonth.toLocaleDateString('de-DE')
  }, [vapiBillingData])

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`
    }
    return tokens.toString()
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <CreditCard className="h-8 w-8 mr-3 text-primary" />
            Billing & Usage
          </h1>
          <p className="text-muted-foreground mt-1">
            Vapi.ai-compatible billing with detailed cost breakdown
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshBilling}
            disabled={refreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowPlans(!showPlans)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>

      {/* Current Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(vapiBillingData?.currentBalance || 25.75, vapiBillingData?.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Available credit</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Period</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(vapiBillingData?.usage.currentPeriod.totalCost || 42.50, vapiBillingData?.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {vapiBillingData?.usage.currentPeriod.totalCalls || 150} calls
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Minutes</p>
              <p className="text-3xl font-bold text-foreground">
                {vapiBillingData?.usage.currentPeriod.totalMinutes || 480}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                @ {formatCurrency(vapiBillingData?.subscription.pricing.perMinuteRate || 0.05)}/min
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
              <p className="text-lg font-bold text-foreground">{nextBillingDate}</p>
              <p className="text-xs text-muted-foreground mt-1">Pay-as-you-go</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Detailed Cost Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Current Period Cost Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* LLM Costs */}
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <span className="font-medium">LLM</span>
              </div>
              <span className="text-sm font-bold">
                {formatCurrency(vapiBillingData?.usage.currentPeriod.breakdown.llm.cost || 15.40)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Prompt Tokens:</span>
                <span>{formatTokens(vapiBillingData?.usage.currentPeriod.breakdown.llm.promptTokens || 45000)}</span>
              </div>
              <div className="flex justify-between">
                <span>Completion:</span>
                <span>{formatTokens(vapiBillingData?.usage.currentPeriod.breakdown.llm.completionTokens || 32000)}</span>
              </div>
            </div>
          </div>

          {/* STT Costs */}
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Mic className="h-5 w-5 text-green-600" />
                <span className="font-medium">Speech-to-Text</span>
              </div>
              <span className="text-sm font-bold">
                {formatCurrency(vapiBillingData?.usage.currentPeriod.breakdown.stt.cost || 8.64)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Seconds:</span>
                <span>{(vapiBillingData?.usage.currentPeriod.breakdown.stt.seconds || 28800).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>$0.0003/sec</span>
              </div>
            </div>
          </div>

          {/* TTS Costs */}
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Text-to-Speech</span>
              </div>
              <span className="text-sm font-bold">
                {formatCurrency(vapiBillingData?.usage.currentPeriod.breakdown.tts.cost || 12.50)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Characters:</span>
                <span>{(vapiBillingData?.usage.currentPeriod.breakdown.tts.characters || 125000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>$0.0001/char</span>
              </div>
            </div>
          </div>

          {/* Vapi Platform Costs */}
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">Vapi Platform</span>
              </div>
              <span className="text-sm font-bold">
                {formatCurrency(vapiBillingData?.usage.currentPeriod.breakdown.vapi.cost || 24.00)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Minutes:</span>
                <span>{vapiBillingData?.usage.currentPeriod.breakdown.vapi.minutes || 480}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>$0.05/min</span>
              </div>
            </div>
          </div>

          {/* Telephony Costs */}
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Telephony</span>
              </div>
              <span className="text-sm font-bold">
                {formatCurrency(vapiBillingData?.usage.currentPeriod.breakdown.telephony.cost || 4.80)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Minutes:</span>
                <span>{vapiBillingData?.usage.currentPeriod.breakdown.telephony.minutes || 480}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>$0.01/min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage History Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Usage History</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Trend */}
          <div>
            <h3 className="font-medium mb-4">Monthly Costs</h3>
            <div className="h-40 flex items-end space-x-2">
              {(vapiBillingData?.usage.previousPeriods || []).slice(-6).map((period, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary/20 rounded-t hover:bg-primary/30 transition-colors mb-2"
                    style={{ height: `${Math.max((period.totalCost / 50) * 100, 8)}px` }}
                    title={`${period.period}: ${formatCurrency(period.totalCost)}`}
                  />
                  <span className="text-xs text-muted-foreground">{period.period}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Minutes Trend */}
          <div>
            <h3 className="font-medium mb-4">Monthly Minutes</h3>
            <div className="h-40 flex items-end space-x-2">
              {(vapiBillingData?.usage.previousPeriods || []).slice(-6).map((period, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500/20 rounded-t hover:bg-blue-500/30 transition-colors mb-2"
                    style={{ height: `${Math.max((period.totalMinutes / 600) * 100, 8)}px` }}
                    title={`${period.period}: ${period.totalMinutes} minutes`}
                  />
                  <span className="text-xs text-muted-foreground">{period.period}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{billingData.currentPlan.name} Plan</h2>
            <p className="text-muted-foreground">
              €{billingData.currentPlan.price}/{billingData.currentPlan.billing === 'monthly' ? 'Monat' : 'Jahr'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
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
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Nächste Abrechnung:</h3>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{nextBillingDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">€{billingData.currentPlan.price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div>
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
            
            <div className="w-full bg-muted rounded-full h-3 mb-2">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500"
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
                <h3 className="font-semibold">Voice Assistants</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {billingData.usage.agents.used} / {billingData.usage.agents.limit}
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-3 mb-2">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
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
            
            <div className="w-full bg-muted rounded-full h-3 mb-2">
              <div className="bg-green-500 h-3 rounded-full w-full"></div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Unlimited verfügbar
            </p>
          </div>
        </div>
      </div>

      {/* Plans (wenn angezeigt) */}
      {showPlans && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Verfügbare Pläne</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-card border rounded-lg p-6 relative transition-all hover:shadow-md ${
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
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {invoice.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                      €{invoice.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {invoice.status === 'paid' ? 'Bezahlt' :
                         invoice.status === 'pending' ? 'Ausstehend' : 'Überfällig'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invoice.downloadUrl && (
                        <button className="text-primary hover:text-primary/80 flex items-center space-x-1 transition-colors">
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
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Zahlungsmethode</h3>
          <button className="text-primary hover:text-primary/80 text-sm transition-colors">
            Ändern
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">•••• •••• •••• 4242</p>
            <p className="text-sm text-muted-foreground">Läuft ab 12/25</p>
          </div>
        </div>
      </div>
    </div>
  )
}