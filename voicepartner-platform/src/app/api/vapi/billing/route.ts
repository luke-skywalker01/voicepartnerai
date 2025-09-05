import { NextRequest, NextResponse } from 'next/server'

export interface VapiBillingInfo {
  orgId: string
  currentBalance: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
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
    plan: 'starter' | 'professional' | 'enterprise' | 'pay-as-you-go'
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
    type: 'card' | 'bank' | 'paypal'
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

// Mock billing data
const generateBillingInfo = (): VapiBillingInfo => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  
  return {
    orgId: 'org_default',
    currentBalance: 25.75,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: nextMonth.toISOString(),
    usage: {
      currentPeriod: {
        startDate: startOfMonth.toISOString(),
        endDate: nextMonth.toISOString(),
        totalCalls: 150,
        totalMinutes: 480,
        totalCost: 42.50,
        breakdown: {
          llm: {
            promptTokens: 45000,
            completionTokens: 32000,
            cost: 15.40
          },
          stt: {
            seconds: 28800, // 480 minutes
            cost: 8.64
          },
          tts: {
            characters: 125000,
            cost: 12.50
          },
          vapi: {
            minutes: 480,
            cost: 24.00 // $0.05 per minute
          },
          telephony: {
            minutes: 480,
            cost: 4.80 // $0.01 per minute
          }
        }
      },
      previousPeriods: [
        {
          period: '2024-11',
          totalCost: 38.75,
          totalMinutes: 420,
          totalCalls: 135
        },
        {
          period: '2024-10',
          totalCost: 45.20,
          totalMinutes: 510,
          totalCalls: 162
        },
        {
          period: '2024-09',
          totalCost: 32.10,
          totalMinutes: 340,
          totalCalls: 118
        }
      ]
    },
    subscription: {
      plan: 'professional',
      features: [
        'Unlimited assistants',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'Webhook endpoints',
        'Advanced voice options'
      ],
      limits: {
        concurrentCalls: 10,
        monthlyMinutes: 1000,
        assistants: -1, // unlimited
        phoneNumbers: 5
      },
      pricing: {
        baseMonthlyFee: 0, // Pay-as-you-go
        perMinuteRate: 0.05,
        overageRate: 0.07
      }
    },
    paymentMethod: {
      type: 'card',
      last4: '4242',
      expiryDate: '12/25'
    },
    invoices: [
      {
        id: 'inv_2024_12',
        date: new Date().toISOString(),
        amount: 42.50,
        status: 'pending',
        downloadUrl: '/api/billing/invoices/inv_2024_12.pdf'
      },
      {
        id: 'inv_2024_11',
        date: new Date(2024, 10, 1).toISOString(),
        amount: 38.75,
        status: 'paid',
        downloadUrl: '/api/billing/invoices/inv_2024_11.pdf'
      },
      {
        id: 'inv_2024_10',
        date: new Date(2024, 9, 1).toISOString(),
        amount: 45.20,
        status: 'paid',
        downloadUrl: '/api/billing/invoices/inv_2024_10.pdf'
      }
    ]
  }
}

// GET /api/vapi/billing - Get billing information
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') // 'current', 'previous', or specific period
    
    const billingInfo = generateBillingInfo()
    
    return NextResponse.json(billingInfo)
  } catch (error) {
    console.error('Error fetching billing info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/billing/payment-method - Update payment method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate payment method data
    if (!body.type || !body.token) {
      return NextResponse.json(
        { error: 'Payment method type and token are required' },
        { status: 400 }
      )
    }
    
    // In production, integrate with Stripe, PayPal, etc.
    const updatedPaymentMethod = {
      type: body.type,
      last4: body.last4 || '****',
      expiryDate: body.expiryDate,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(updatedPaymentMethod)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}