import { NextRequest, NextResponse } from 'next/server'

// Enhanced phone number data structure
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
  twilioSid?: string
  twilioAccountSid?: string
}

// Mock phone numbers storage (in production, use database)
let phoneNumbers: PhoneNumber[] = [
  {
    id: 'pn_001',
    phoneNumber: '+49 30 12345678',
    friendlyName: 'Berlin Hauptnummer',
    capabilities: {
      voice: true,
      sms: true,
      mms: false,
      fax: false
    },
    status: 'active',
    assistantId: '1',
    assistantName: 'Terminbuchung Assistant',
    country: 'DE',
    region: 'Berlin',
    locality: 'Berlin',
    provider: 'twilio',
    monthlyPrice: 2.50,
    currency: 'EUR',
    purchasedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user_demo',
    configuration: {
      webhookUrl: 'https://voicepartner-platform.vercel.app/api/phone-numbers/webhook',
      voiceMethod: 'POST',
      smsMethod: 'POST'
    },
    usage: {
      totalCalls: 156,
      totalSms: 23,
      monthlyMinutes: 245,
      monthlyCost: 12.45
    },
    twilioSid: 'PN123abc456def',
    twilioAccountSid: 'AC123...'
  },
  {
    id: 'pn_002',
    phoneNumber: '+49 89 98765432',
    friendlyName: 'München Support',
    capabilities: {
      voice: true,
      sms: true,
      mms: true,
      fax: false
    },
    status: 'active',
    assistantId: '2',
    assistantName: 'Kundenservice Bot',
    country: 'DE',
    region: 'Bayern',
    locality: 'München',
    provider: 'twilio',
    monthlyPrice: 2.50,
    currency: 'EUR',
    purchasedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ownerId: 'user_demo',
    configuration: {
      webhookUrl: 'https://voicepartner-platform.vercel.app/api/phone-numbers/webhook',
      voiceMethod: 'POST',
      smsMethod: 'POST'
    },
    usage: {
      totalCalls: 89,
      totalSms: 45,
      monthlyMinutes: 167,
      monthlyCost: 8.92
    },
    twilioSid: 'PN789ghi012jkl',
    twilioAccountSid: 'AC123...'
  },
  {
    id: 'pn_003',
    phoneNumber: '+1 555 123 4567',
    friendlyName: 'US Test Number',
    capabilities: {
      voice: true,
      sms: true,
      mms: true,
      fax: true
    },
    status: 'inactive',
    country: 'US',
    region: 'California',
    locality: 'San Francisco',
    provider: 'twilio',
    monthlyPrice: 1.15,
    currency: 'USD',
    purchasedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    ownerId: 'user_demo',
    configuration: {
      voiceMethod: 'POST',
      smsMethod: 'POST'
    },
    usage: {
      totalCalls: 12,
      totalSms: 3,
      monthlyMinutes: 23,
      monthlyCost: 2.34
    },
    twilioSid: 'PN345mno678pqr',
    twilioAccountSid: 'AC123...'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const country = searchParams.get('country')
    
    // In production, get user ID from authentication
    const userId = 'user_demo'
    
    // Filter phone numbers by user and optional filters
    let userNumbers = phoneNumbers.filter(number => number.ownerId === userId)
    
    if (status) {
      userNumbers = userNumbers.filter(number => number.status === status)
    }
    
    if (country) {
      userNumbers = userNumbers.filter(number => number.country === country)
    }
    
    // Apply pagination
    const paginatedNumbers = userNumbers.slice(offset, offset + limit)
    
    // Calculate statistics
    const stats = {
      totalNumbers: userNumbers.length,
      activeNumbers: userNumbers.filter(n => n.status === 'active').length,
      totalCalls: userNumbers.reduce((sum, n) => sum + n.usage.totalCalls, 0),
      totalSms: userNumbers.reduce((sum, n) => sum + n.usage.totalSms, 0),
      monthlyCost: userNumbers.reduce((sum, n) => sum + n.usage.monthlyCost, 0),
      byCountry: userNumbers.reduce((acc, n) => {
        acc[n.country] = (acc[n.country] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byProvider: userNumbers.reduce((acc, n) => {
        acc[n.provider] = (acc[n.provider] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        phoneNumbers: paginatedNumbers,
        pagination: {
          total: userNumbers.length,
          limit,
          offset,
          hasMore: offset + limit < userNumbers.length
        },
        stats
      }
    })
  } catch (error) {
    console.error('Phone Numbers GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch phone numbers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.number || !body.provider) {
      return NextResponse.json(
        { success: false, error: 'Number and provider are required' },
        { status: 400 }
      )
    }

    const newPhoneNumber = {
      id: `pn_${Date.now()}`,
      number: body.number,
      provider: body.provider,
      assignedToAssistantId: body.assignedToAssistantId || null,
      capabilities: body.capabilities || ['voice'],
      fallbackDestination: body.fallbackDestination || {
        type: 'number',
        value: '+49 30 DEFAULT'
      },
      ...(body.provider === 'twilio' && {
        twilioAccountSid: body.twilioAccountSid,
        twilioAuthToken: body.twilioAuthToken
      }),
      ...(body.provider === 'vonage' && {
        vonageApplicationId: body.vonageApplicationId,
        vonagePrivateKey: body.vonagePrivateKey
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    phoneNumbers.push(newPhoneNumber)

    return NextResponse.json({
      success: true,
      data: newPhoneNumber,
      message: 'Phone number created successfully'
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create phone number' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Phone number ID is required' },
        { status: 400 }
      )
    }

    const phoneNumberIndex = phoneNumbers.findIndex(pn => pn.id === id)
    if (phoneNumberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Phone number not found' },
        { status: 404 }
      )
    }

    phoneNumbers[phoneNumberIndex] = {
      ...phoneNumbers[phoneNumberIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: phoneNumbers[phoneNumberIndex],
      message: 'Phone number updated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update phone number' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Phone number ID is required' },
        { status: 400 }
      )
    }

    const phoneNumberIndex = phoneNumbers.findIndex(pn => pn.id === id)
    if (phoneNumberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Phone number not found' },
        { status: 404 }
      )
    }

    phoneNumbers.splice(phoneNumberIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Phone number deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete phone number' },
      { status: 500 }
    )
  }
}