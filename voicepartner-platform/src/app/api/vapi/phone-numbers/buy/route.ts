import { NextRequest, NextResponse } from 'next/server'
import { VapiPhoneNumber } from '../route'

interface PurchasePhoneNumberRequest {
  areaCode?: string
  name?: string
  assistantId?: string
  squadId?: string
  serverUrl?: string
  numberE164CheckEnabled?: boolean
  serverPath?: string
  serverUrlSecret?: string
  fallbackDestination?: {
    type: 'number' | 'sip'
    value: string
  }
}

interface AvailablePhoneNumber {
  phoneNumber: string
  locality: string
  region: string
  lata?: string
  rateCenter?: string
}

// Mock database
const phoneNumbers: VapiPhoneNumber[] = []

// POST /api/vapi/phone-numbers/buy - Purchase new phone number
export async function POST(request: NextRequest) {
  try {
    const body: PurchasePhoneNumberRequest = await request.json()
    
    // Generate available phone numbers based on area code
    const areaCode = body.areaCode || '555'
    const availableNumbers = generateAvailableNumbers(areaCode)
    
    // Select the first available number
    const selectedNumber = availableNumbers[0]
    
    if (!selectedNumber) {
      return NextResponse.json(
        { error: 'No phone numbers available in the specified area code' },
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
      number: selectedNumber.phoneNumber,
      provider: 'vapi', // Purchased numbers are always through Vapi
      numberE164CheckEnabled: body.numberE164CheckEnabled ?? true,
      serverPath: body.serverPath || '/webhook',
      serverUrlSecret: body.serverUrlSecret,
      fallbackDestination: body.fallbackDestination
    }
    
    // Add to mock database
    phoneNumbers.push(newPhoneNumber)
    
    return NextResponse.json({
      phoneNumber: newPhoneNumber,
      cost: {
        upfront: 1.00, // $1.00 upfront cost
        monthly: 1.00  // $1.00 monthly cost
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error purchasing phone number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate mock available phone numbers
function generateAvailableNumbers(areaCode: string): AvailablePhoneNumber[] {
  const numbers: AvailablePhoneNumber[] = []
  
  for (let i = 0; i < 5; i++) {
    const exchange = Math.floor(Math.random() * 900) + 100
    const number = Math.floor(Math.random() * 9000) + 1000
    
    numbers.push({
      phoneNumber: `+1${areaCode}${exchange}${number}`,
      locality: getLocalityForAreaCode(areaCode),
      region: getRegionForAreaCode(areaCode),
      lata: '132',
      rateCenter: 'NEW YORK'
    })
  }
  
  return numbers
}

// Helper function to get locality for area code
function getLocalityForAreaCode(areaCode: string): string {
  const localities: { [key: string]: string } = {
    '212': 'New York',
    '213': 'Los Angeles',
    '312': 'Chicago',
    '415': 'San Francisco',
    '555': 'Demo City',
    // Add more as needed
  }
  
  return localities[areaCode] || 'Unknown'
}

// Helper function to get region for area code
function getRegionForAreaCode(areaCode: string): string {
  const regions: { [key: string]: string } = {
    '212': 'NY',
    '213': 'CA',
    '312': 'IL',
    '415': 'CA',
    '555': 'DEMO',
    // Add more as needed
  }
  
  return regions[areaCode] || 'XX'
}