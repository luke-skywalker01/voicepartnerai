import { NextRequest, NextResponse } from 'next/server'

export interface VapiPhoneNumber {
  id: string
  orgId: string
  createdAt: string
  updatedAt: string
  name?: string
  assistantId?: string
  squadId?: string
  serverUrl?: string
  number: string
  twilioPhoneNumber?: string
  twilioAccountSid?: string
  vonageApplicationId?: string
  provider: 'twilio' | 'vonage' | 'vapi'
  numberE164CheckEnabled?: boolean
  serverPath?: string
  serverUrlSecret?: string
  fallbackDestination?: {
    type: 'number' | 'sip'
    value: string
  }
}

interface CreatePhoneNumberRequest {
  name?: string
  assistantId?: string
  squadId?: string
  serverUrl?: string
  number?: string
  twilioPhoneNumber?: string
  twilioAccountSid?: string
  vonageApplicationId?: string
  provider: 'twilio' | 'vonage' | 'vapi'
  numberE164CheckEnabled?: boolean
  serverPath?: string
  serverUrlSecret?: string
  fallbackDestination?: VapiPhoneNumber['fallbackDestination']
}

interface PurchasePhoneNumberRequest {
  areaCode?: string
  name?: string
  assistantId?: string
  squadId?: string
  serverUrl?: string
  numberE164CheckEnabled?: boolean
  serverPath?: string
  serverUrlSecret?: string
  fallbackDestination?: VapiPhoneNumber['fallbackDestination']
}

// Mock database
const phoneNumbers: VapiPhoneNumber[] = []

// GET /api/vapi/phone-numbers - List all phone numbers
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const cursor = url.searchParams.get('cursor')
    
    // In production, implement proper pagination
    const paginatedNumbers = phoneNumbers.slice(0, limit)
    
    return NextResponse.json({
      phoneNumbers: paginatedNumbers,
      pagination: {
        limit,
        cursor: cursor || null,
        hasMore: phoneNumbers.length > limit
      }
    })
  } catch (error) {
    console.error('Error fetching phone numbers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vapi/phone-numbers - Create/Import phone number
export async function POST(request: NextRequest) {
  try {
    const body: CreatePhoneNumberRequest = await request.json()
    
    // Validate required fields
    if (!body.provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }
    
    if (body.provider !== 'vapi' && !body.number) {
      return NextResponse.json(
        { error: 'Number is required for external providers' },
        { status: 400 }
      )
    }
    
    // Create new phone number
    const newPhoneNumber: VapiPhoneNumber = {
      id: `pn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orgId: 'org_default', // In production, get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: body.name || `Phone Number ${phoneNumbers.length + 1}`,
      assistantId: body.assistantId,
      squadId: body.squadId,
      serverUrl: body.serverUrl,
      number: body.number || generatePhoneNumber(),
      twilioPhoneNumber: body.twilioPhoneNumber,
      twilioAccountSid: body.twilioAccountSid,
      vonageApplicationId: body.vonageApplicationId,
      provider: body.provider,
      numberE164CheckEnabled: body.numberE164CheckEnabled ?? true,
      serverPath: body.serverPath || '/webhook',
      serverUrlSecret: body.serverUrlSecret,
      fallbackDestination: body.fallbackDestination
    }
    
    // Add to mock database
    phoneNumbers.push(newPhoneNumber)
    
    return NextResponse.json(newPhoneNumber, { status: 201 })
  } catch (error) {
    console.error('Error creating phone number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate a fake phone number
function generatePhoneNumber(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100
  const exchange = Math.floor(Math.random() * 900) + 100
  const number = Math.floor(Math.random() * 9000) + 1000
  return `+1${areaCode}${exchange}${number}`
}