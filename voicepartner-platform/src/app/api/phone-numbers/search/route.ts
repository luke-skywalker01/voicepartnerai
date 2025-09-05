import { NextRequest, NextResponse } from 'next/server'

// Available phone numbers for purchase
interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  locality: string
  region: string
  country: string
  countryCode: string
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

// GET - Search available phone numbers for purchase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'DE'
    const locality = searchParams.get('locality')
    const contains = searchParams.get('contains')
    const type = searchParams.get('type') || 'local'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Simulate Twilio available phone numbers search
    // In production, use Twilio SDK:
    // const twilioClient = twilio(accountSid, authToken)
    // const availableNumbers = await twilioClient.availablePhoneNumbers(country)
    //   .local.list({
    //     nearLatLong: coordinates,
    //     contains: contains,
    //     limit: limit
    //   })
    
    const mockAvailableNumbers: AvailableNumber[] = generateMockAvailableNumbers(
      country, 
      locality, 
      contains, 
      type, 
      limit
    )
    
    return NextResponse.json({
      success: true,
      data: {
        availableNumbers: mockAvailableNumbers,
        searchParams: {
          country,
          locality,
          contains,
          type,
          limit
        },
        total: mockAvailableNumbers.length
      }
    })
    
  } catch (error: any) {
    console.error('Phone numbers search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}

function generateMockAvailableNumbers(
  country: string, 
  locality?: string | null, 
  contains?: string | null,
  type: string = 'local',
  limit: number = 20
): AvailableNumber[] {
  const numbers: AvailableNumber[] = []
  
  // Generate based on country
  let countryCode = ''
  let regionData = { regions: [''], prices: { local: 1.0, tollFree: 2.0, mobile: 3.0 }, currency: 'USD' }
  
  switch (country.toUpperCase()) {
    case 'DE':
      countryCode = '+49'
      regionData = {
        regions: ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig'],
        prices: { local: 2.50, tollFree: 4.00, mobile: 5.50 },
        currency: 'EUR'
      }
      break
    case 'US':
      countryCode = '+1'
      regionData = {
        regions: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'],
        prices: { local: 1.15, tollFree: 2.00, mobile: 3.50 },
        currency: 'USD'
      }
      break
    case 'GB':
      countryCode = '+44'
      regionData = {
        regions: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bradford', 'Liverpool'],
        prices: { local: 1.50, tollFree: 3.00, mobile: 4.00 },
        currency: 'GBP'
      }
      break
    case 'FR':
      countryCode = '+33'
      regionData = {
        regions: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier'],
        prices: { local: 2.00, tollFree: 3.50, mobile: 4.50 },
        currency: 'EUR'
      }
      break
    default:
      countryCode = '+1'
      regionData = {
        regions: ['Generic City'],
        prices: { local: 1.00, tollFree: 2.00, mobile: 3.00 },
        currency: 'USD'
      }
  }
  
  // Filter regions if locality specified
  let regions = regionData.regions
  if (locality) {
    regions = regions.filter(region => 
      region.toLowerCase().includes(locality.toLowerCase())
    )
    if (regions.length === 0) {
      regions = [locality] // Allow custom locality
    }
  }
  
  for (let i = 0; i < limit; i++) {
    const region = regions[i % regions.length]
    
    // Generate phone number
    let phoneNumber = ''
    if (country === 'DE') {
      // German format
      const areaCode = ['30', '89', '40', '221', '69', '711', '211', '341'][i % 8]
      const number = String(Math.floor(Math.random() * 90000000) + 10000000)
      phoneNumber = `${countryCode} ${areaCode} ${number.substring(0, 4)} ${number.substring(4)}`
    } else if (country === 'US') {
      // US format
      const areaCode = ['212', '310', '312', '713', '602', '215', '210', '619'][i % 8]
      const exchange = String(Math.floor(Math.random() * 900) + 100)
      const number = String(Math.floor(Math.random() * 9000) + 1000)
      phoneNumber = `${countryCode} ${areaCode} ${exchange} ${number}`
    } else {
      // Generic international format
      phoneNumber = `${countryCode} ${Math.floor(Math.random() * 900000000) + 100000000}`
    }
    
    // Apply contains filter
    if (contains && !phoneNumber.includes(contains)) {
      // Try to incorporate the contains string
      const digits = contains.replace(/\D/g, '')
      if (digits.length > 0) {
        phoneNumber = phoneNumber.replace(/\d+$/, digits + String(Math.floor(Math.random() * 1000)).padStart(3, '0'))
      }
    }
    
    // Generate capabilities based on type
    let capabilities = { voice: true, sms: true, mms: true, fax: false }
    if (type === 'toll-free') {
      capabilities = { voice: true, sms: false, mms: false, fax: true }
    } else if (type === 'mobile') {
      capabilities = { voice: true, sms: true, mms: true, fax: false }
    }
    
    const priceKey = type as keyof typeof regionData.prices
    const monthlyPrice = regionData.prices[priceKey] || regionData.prices.local
    
    numbers.push({
      phoneNumber,
      friendlyName: `${region} ${type} number`,
      locality: region,
      region: region,
      country: country.toUpperCase(),
      countryCode,
      capabilities,
      monthlyPrice,
      setupFee: type === 'toll-free' ? 1.00 : 0.00,
      currency: regionData.currency,
      provider: 'twilio',
      type: type as 'local' | 'toll-free' | 'mobile'
    })
  }
  
  return numbers
}