import { NextRequest, NextResponse } from 'next/server'

// Twilio webhook handler for incoming calls and SMS
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract Twilio webhook parameters
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const direction = formData.get('Direction') as string
    
    // Log incoming call/SMS for debugging
    console.log('Twilio Webhook:', {
      from,
      to,
      callSid,
      callStatus,
      direction,
      timestamp: new Date().toISOString()
    })
    
    // Find the phone number configuration
    const phoneNumber = findPhoneNumberByTwilioNumber(to)
    
    if (!phoneNumber) {
      console.error(`No configuration found for phone number: ${to}`)
      return new Response(generateTwiMLError('Number not configured'), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      })
    }
    
    // Check if phone number is active
    if (phoneNumber.status !== 'active') {
      console.log(`Phone number ${to} is not active (status: ${phoneNumber.status})`)
      return new Response(generateTwiMLError('Number not active'), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      })
    }
    
    // Handle different call statuses
    switch (callStatus) {
      case 'ringing':
        return handleIncomingCall(phoneNumber, from, to, callSid)
      
      case 'in-progress':
        return handleCallInProgress(phoneNumber, from, to, callSid)
      
      case 'completed':
      case 'failed':
      case 'busy':
      case 'no-answer':
        return handleCallEnd(phoneNumber, from, to, callSid, callStatus)
      
      default:
        console.log(`Unhandled call status: ${callStatus}`)
        return new Response(generateTwiMLSay('Call status update received'), {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
    }
    
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(generateTwiMLError('Internal server error'), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}

// Handle incoming call when ringing
async function handleIncomingCall(phoneNumber: any, from: string, to: string, callSid: string) {
  try {
    // Update phone number usage statistics
    await updatePhoneNumberUsage(phoneNumber.id, 'call')
    
    // If assistant is assigned, start voice AI conversation
    if (phoneNumber.assistantId) {
      const assistant = await getAssistantById(phoneNumber.assistantId)
      
      if (assistant) {
        // Generate TwiML to start voice AI conversation
        return new Response(generateTwiMLForAssistant(assistant, from, to), {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        })
      }
    }
    
    // Fallback: Simple greeting
    return new Response(generateTwiMLSay(
      `Hallo! Sie haben ${phoneNumber.friendlyName} erreicht. Unser Voice AI System wird Sie gleich verbinden.`
    ), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })
    
  } catch (error) {
    console.error('Error handling incoming call:', error)
    return new Response(generateTwiMLError('Call handling error'), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}

// Handle call in progress
async function handleCallInProgress(phoneNumber: any, from: string, to: string, callSid: string) {
  // This would be called for ongoing conversation management
  // For now, just acknowledge
  return new Response(generateTwiMLSay('Conversation in progress'), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' }
  })
}

// Handle call end
async function handleCallEnd(phoneNumber: any, from: string, to: string, callSid: string, status: string) {
  try {
    // Log call completion
    console.log(`Call ended: ${callSid}, Status: ${status}`)
    
    // Update statistics (in production, store call logs)
    await updatePhoneNumberUsage(phoneNumber.id, 'call_end', { status })
    
    // Return empty TwiML response
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })
    
  } catch (error) {
    console.error('Error handling call end:', error)
    return new Response('', { status: 200 })
  }
}

// Helper functions

function findPhoneNumberByTwilioNumber(twilioNumber: string) {
  // In production, query database for phone number by Twilio number
  // For demo, return mock data
  return {
    id: 'pn_001',
    phoneNumber: twilioNumber,
    friendlyName: 'Demo Number',
    status: 'active',
    assistantId: '1',
    ownerId: 'user_demo'
  }
}

async function getAssistantById(assistantId: string) {
  // In production, fetch assistant configuration from database
  // For demo, return mock assistant
  return {
    id: assistantId,
    name: 'Terminbuchung Assistant',
    systemMessage: 'Du bist ein freundlicher Terminbuchungsassistent. Hilf den Anrufern bei der Terminvereinbarung.',
    voice: 'alloy',
    language: 'de'
  }
}

async function updatePhoneNumberUsage(phoneNumberId: string, action: string, data?: any) {
  // In production, update database with usage statistics
  console.log(`Usage update: ${phoneNumberId} - ${action}`, data)
}

function generateTwiMLForAssistant(assistant: any, from: string, to: string): string {
  // Generate TwiML to connect to Voice AI assistant
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Marlene" language="de-DE">
    Hallo! Ich bin ${assistant.name}. Wie kann ich Ihnen heute helfen?
  </Say>
  <Gather input="speech" action="/api/phone-numbers/webhook/speech" method="POST" speechTimeout="3" timeout="10">
    <Say voice="Polly.Marlene" language="de-DE">
      Bitte sprechen Sie nach dem Ton.
    </Say>
  </Gather>
  <Say voice="Polly.Marlene" language="de-DE">
    Entschuldigung, ich habe Sie nicht verstanden. Auf Wiederhören.
  </Say>
</Response>`
}

function generateTwiMLSay(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Marlene" language="de-DE">${message}</Say>
</Response>`
}

function generateTwiMLError(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Marlene" language="de-DE">
    Es tut mir leid, es ist ein technischer Fehler aufgetreten. ${message}. Versuchen Sie es später erneut.
  </Say>
</Response>`
}

// Handle SMS webhooks
export async function GET(request: NextRequest) {
  // Handle SMS status callbacks or other GET requests
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint active',
    timestamp: new Date().toISOString()
  })
}