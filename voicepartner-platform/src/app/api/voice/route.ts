import { NextRequest, NextResponse } from 'next/server'

// Mock voice processing for demo purposes
// In production, this would integrate with actual TTS/STT services

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, text, audioData, options = {} } = body

    switch (action) {
      case 'text_to_speech':
        if (!text) {
          return NextResponse.json(
            { success: false, error: 'Text is required for TTS' },
            { status: 400 }
          )
        }

        // Simulate TTS processing delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        return NextResponse.json({
          success: true,
          data: {
            audioUrl: `data:audio/mpeg;base64,${Buffer.from('mock-audio-data').toString('base64')}`,
            duration: Math.ceil(text.length / 10), // Estimate duration
            text,
            voice: options.voice || 'default',
            language: options.language || 'de-DE'
          },
          message: 'Text converted to speech successfully'
        })

      case 'speech_to_text':
        if (!audioData) {
          return NextResponse.json(
            { success: false, error: 'Audio data is required for STT' },
            { status: 400 }
          )
        }

        // Simulate STT processing delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Mock transcription based on common appointment booking phrases
        const mockTranscriptions = [
          'Ich möchte einen Termin buchen',
          'Mein Name ist Max Mustermann',
          'Meine Telefonnummer ist 030 12345678',
          'Ich hätte gerne eine Wellness-Behandlung',
          'Morgen um 14 Uhr wäre perfekt',
          'Den ersten Termin bitte',
          'Ja, das passt mir gut',
          'Nein danke, das war alles'
        ]

        const randomIndex = Math.floor(Math.random() * mockTranscriptions.length)
        const transcript = mockTranscriptions[randomIndex]

        return NextResponse.json({
          success: true,
          data: {
            transcript,
            confidence: 0.85 + Math.random() * 0.14, // 85-99% confidence
            language: options.language || 'de-DE',
            duration: options.duration || 3.2
          },
          message: 'Speech converted to text successfully'
        })

      case 'get_voices':
        return NextResponse.json({
          success: true,
          data: {
            voices: [
              {
                id: 'german-female-1',
                name: 'Anna',
                language: 'de-DE',
                gender: 'female',
                description: 'Freundliche deutsche Frauenstimme'
              },
              {
                id: 'german-male-1',
                name: 'Max',
                language: 'de-DE',
                gender: 'male',
                description: 'Professionelle deutsche Männerstimme'
              },
              {
                id: 'english-female-1',
                name: 'Sarah',
                language: 'en-US',
                gender: 'female',
                description: 'Clear American English female voice'
              }
            ]
          }
        })

      case 'process_conversation':
        const { userInput, conversationContext = {} } = body
        
        if (!userInput) {
          return NextResponse.json(
            { success: false, error: 'User input is required' },
            { status: 400 }
          )
        }

        // Process conversation for appointment booking
        const response = await processAppointmentConversation(userInput, conversationContext)
        
        return NextResponse.json({
          success: true,
          data: response
        })

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Voice API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

async function processAppointmentConversation(userInput: string, context: any) {
  const input = userInput.toLowerCase()
  
  // Simple conversation flow for appointment booking
  if (!context.step) {
    context.step = 'greeting'
  }

  let response = {
    text: '',
    nextStep: context.step,
    extractedData: context.extractedData || {},
    shouldEndConversation: false,
    actionRequired: null as string | null
  }

  switch (context.step) {
    case 'greeting':
      if (input.includes('termin') || input.includes('buchen')) {
        response.text = 'Gerne helfe ich Ihnen bei der Terminbuchung! Wie ist Ihr Name?'
        response.nextStep = 'collect_name'
      } else {
        response.text = 'Hallo! Möchten Sie einen Termin buchen?'
      }
      break

    case 'collect_name':
      const nameMatch = userInput.match(/(?:ich bin|mein name ist|ich heiße)\s+([a-züäöß\s]+)/i)
      if (nameMatch || userInput.match(/^[a-züäöß\s]+$/i)) {
        const name = nameMatch ? nameMatch[1].trim() : userInput.trim()
        response.extractedData.customerName = name
        response.text = `Schön Sie kennenzulernen, ${name}! Können Sie mir Ihre Telefonnummer geben?`
        response.nextStep = 'collect_phone'
      } else {
        response.text = 'Entschuldigung, ich habe Ihren Namen nicht verstanden. Können Sie ihn wiederholen?'
      }
      break

    case 'collect_phone':
      const phoneMatch = userInput.match(/(\+?49\s?)?(\d{2,4}[\s\-]?\d{6,8}|\d{10,11})/g)
      if (phoneMatch) {
        response.extractedData.customerPhone = phoneMatch[0]
        response.text = 'Perfekt! Für welchen Service möchten Sie einen Termin? Wir bieten Massage, Beratung und Wellness an.'
        response.nextStep = 'collect_service'
      } else {
        response.text = 'Ich konnte die Telefonnummer nicht verstehen. Bitte wiederholen Sie sie.'
      }
      break

    case 'collect_service':
      if (input.includes('wellness') || input.includes('behandlung')) {
        response.extractedData.serviceType = 'Wellness-Behandlung'
      } else if (input.includes('beratung')) {
        response.extractedData.serviceType = 'Beratungsgespräch'
      } else {
        response.extractedData.serviceType = userInput
      }
      
      response.text = `${response.extractedData.serviceType} - ausgezeichnet! Wann hätten Sie gerne Ihren Termin?`
      response.nextStep = 'collect_date'
      response.actionRequired = 'check_calendar'
      break

    case 'collect_date':
      response.text = 'Einen Moment, ich prüfe die Verfügbarkeit...'
      response.nextStep = 'present_options'
      response.actionRequired = 'check_calendar'
      break

    case 'present_options':
      if (input.includes('1') || input.includes('morgen')) {
        response.extractedData.selectedSlot = 'morgen um 14:00'
        response.text = 'Perfekt! Ich buche den Termin morgen um 14:00 für Sie.'
        response.nextStep = 'confirm_booking'
        response.actionRequired = 'book_appointment'
      } else if (input.includes('2') || input.includes('übermorgen')) {
        response.extractedData.selectedSlot = 'übermorgen um 10:30'
        response.text = 'Ausgezeichnet! Ich buche den Termin übermorgen um 10:30 für Sie.'
        response.nextStep = 'confirm_booking'
        response.actionRequired = 'book_appointment'
      } else {
        response.text = 'Welchen Termin hätten Sie gerne? Sagen Sie einfach die Nummer oder den Tag.'
      }
      break

    case 'confirm_booking':
      response.text = `Ihr Termin wurde gebucht!\n\nDetails:\n• Name: ${response.extractedData.customerName}\n• Service: ${response.extractedData.serviceType}\n• Termin: ${response.extractedData.selectedSlot}\n\nSie erhalten eine Bestätigung per E-Mail. Vielen Dank!`
      response.shouldEndConversation = true
      break

    default:
      response.text = 'Entschuldigung, ich habe Sie nicht verstanden. Können Sie das wiederholen?'
  }

  return response
}