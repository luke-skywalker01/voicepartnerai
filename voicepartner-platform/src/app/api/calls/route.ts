import { NextRequest, NextResponse } from 'next/server'

// Mock call data similar to Vapi
let calls = [
  {
    id: 'call_001',
    assistantId: '1',
    type: 'inboundPhoneCall',
    status: 'ended',
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    transcript: 'Hallo! Wie kann ich Ihnen helfen? - Ich hätte gerne einen Termin. - Gerne! Für welchen Tag?',
    duration: 180,
    cost: 0.12,
    phoneNumberId: '+49123456789',
    customer: {
      number: '+49987654321',
      name: 'Max Mustermann'
    },
    analysis: {
      summary: 'Kunde wollte einen Termin buchen',
      sentiment: 'positive',
      structuredData: {
        appointmentRequested: true,
        preferredDate: '2024-08-15',
        service: 'Massage'
      }
    }
  },
  {
    id: 'call_002', 
    assistantId: '2',
    type: 'outboundPhoneCall',
    status: 'ended',
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    transcript: 'Guten Tag, hier spricht Ihr Voice-Assistent. - Hallo! - Ich rufe wegen Ihres Termins morgen an.',
    duration: 145,
    cost: 0.09,
    phoneNumberId: '+49123456789',
    customer: {
      number: '+49555123456',
      name: 'Lisa Schmidt'
    },
    analysis: {
      summary: 'Terminerinnerung erfolgreich übermittelt',
      sentiment: 'neutral',
      structuredData: {
        reminderConfirmed: true,
        appointmentDate: '2024-08-10'
      }
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const assistantId = url.searchParams.get('assistantId')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let filteredCalls = calls

    if (assistantId) {
      filteredCalls = filteredCalls.filter(call => call.assistantId === assistantId)
    }

    if (status) {
      filteredCalls = filteredCalls.filter(call => call.status === status)
    }

    const paginatedCalls = filteredCalls.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedCalls,
      pagination: {
        total: filteredCalls.length,
        limit,
        offset,
        hasMore: offset + limit < filteredCalls.length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newCall = {
      id: `call_${Date.now()}`,
      assistantId: body.assistantId,
      type: body.type || 'outboundPhoneCall',
      status: 'queued',
      phoneNumberId: body.phoneNumberId,
      customer: {
        number: body.customer?.number,
        name: body.customer?.name || 'Unknown'
      },
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      transcript: '',
      duration: 0,
      cost: 0,
      analysis: null
    }

    // Simulate call initiation
    setTimeout(() => {
      const callIndex = calls.findIndex(c => c.id === newCall.id)
      if (callIndex !== -1) {
        calls[callIndex] = {
          ...calls[callIndex],
          status: 'in-progress',
          startedAt: new Date().toISOString()
        }
      }
    }, 1000)

    calls.push(newCall as any)

    return NextResponse.json({
      success: true,
      data: newCall,
      message: 'Call initiated successfully'
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initiate call' },
      { status: 500 }
    )
  }
}

