import { NextRequest, NextResponse } from 'next/server'

// TTS Provider voice configurations
const ttsProviderVoices = {
  elevenlabs: [
    {
      voice_id: 'Rachel',
      name: 'Rachel',
      category: 'premade',
      labels: {
        accent: 'American',
        description: 'Calm',
        age: 'young',
        gender: 'female'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Rachel/6614e4ce-b398-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    },
    {
      voice_id: 'Drew',
      name: 'Drew',
      category: 'premade',
      labels: {
        accent: 'American',
        description: 'Well-rounded',
        age: 'middle-aged',
        gender: 'male'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Drew/8b1e8d50-b7a9-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    },
    {
      voice_id: 'Clyde',
      name: 'Clyde',
      category: 'premade', 
      labels: {
        accent: 'American',
        description: 'War veteran',
        age: 'middle-aged',
        gender: 'male'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Clyde/9c1e8d50-b7a9-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    },
    {
      voice_id: 'Paul',
      name: 'Paul',
      category: 'premade',
      labels: {
        accent: 'American',
        description: 'Authoritative',
        age: 'middle-aged',
        gender: 'male'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Paul/1c1e8d50-b7a9-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    },
    {
      voice_id: 'Domi',
      name: 'Domi',
      category: 'premade',
      labels: {
        accent: 'American',
        description: 'Strong',
        age: 'young',
        gender: 'female'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Domi/2c1e8d50-b7a9-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    },
    {
      voice_id: 'Dave',
      name: 'Dave',
      category: 'premade',
      labels: {
        accent: 'British-Essex',
        description: 'Conversational',
        age: 'young',
        gender: 'male'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Dave/3c1e8d50-b7a9-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    },
    {
      voice_id: 'Fin',
      name: 'Fin',
      category: 'premade',
      labels: {
        accent: 'Irish',
        description: 'Sailor',
        age: 'old',
        gender: 'male'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Fin/4c1e8d50-b7a9-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    },
    {
      voice_id: 'Sarah',
      name: 'Sarah',
      category: 'premade',
      labels: {
        accent: 'American',
        description: 'Soft',
        age: 'young',
        gender: 'female'
      },
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Sarah/5c1e8d50-b7a9-4d9e-b7a9-8e8a4d3e2e3f/preview_voice.mp3'
    }
  ],
  openai: [
    {
      voice_id: 'alloy',
      name: 'Alloy',
      category: 'standard',
      labels: {
        description: 'Balanced, natural-sounding voice',
        gender: 'neutral'
      }
    },
    {
      voice_id: 'echo',
      name: 'Echo',
      category: 'standard',
      labels: {
        description: 'Clear and articulate',
        gender: 'neutral'
      }
    },
    {
      voice_id: 'fable',
      name: 'Fable',
      category: 'standard',
      labels: {
        description: 'Warm and expressive',
        gender: 'neutral'
      }
    },
    {
      voice_id: 'onyx',
      name: 'Onyx',
      category: 'standard',
      labels: {
        description: 'Deep and resonant',
        gender: 'neutral'
      }
    },
    {
      voice_id: 'nova',
      name: 'Nova',
      category: 'standard',
      labels: {
        description: 'Bright and energetic',
        gender: 'neutral'
      }
    },
    {
      voice_id: 'shimmer',
      name: 'Shimmer',
      category: 'standard',
      labels: {
        description: 'Gentle and soothing',
        gender: 'neutral'
      }
    }
  ],
  azure: [
    {
      voice_id: 'de-DE-KatjaNeural',
      name: 'Katja (German)',
      category: 'neural',
      labels: {
        accent: 'German',
        description: 'Professional German female voice',
        age: 'adult',
        gender: 'female',
        language: 'de-DE'
      }
    },
    {
      voice_id: 'de-DE-ConradNeural',
      name: 'Conrad (German)',
      category: 'neural',
      labels: {
        accent: 'German',
        description: 'Professional German male voice',
        age: 'adult',
        gender: 'male',
        language: 'de-DE'
      }
    },
    {
      voice_id: 'en-US-JennyMultilingualNeural',
      name: 'Jenny Multilingual',
      category: 'neural',
      labels: {
        accent: 'American',
        description: 'Multilingual female voice',
        age: 'adult',
        gender: 'female',
        language: 'en-US'
      }
    },
    {
      voice_id: 'en-US-RyanMultilingualNeural',
      name: 'Ryan Multilingual',
      category: 'neural',
      labels: {
        accent: 'American',
        description: 'Multilingual male voice',
        age: 'adult',
        gender: 'male',
        language: 'en-US'
      }
    }
  ],
  google: [
    {
      voice_id: 'de-DE-Wavenet-A',
      name: 'German Female (WaveNet)',
      category: 'wavenet',
      labels: {
        accent: 'German',
        description: 'High-quality German female voice',
        gender: 'female',
        language: 'de-DE'
      }
    },
    {
      voice_id: 'de-DE-Wavenet-B',
      name: 'German Male (WaveNet)',
      category: 'wavenet',
      labels: {
        accent: 'German',
        description: 'High-quality German male voice',
        gender: 'male',
        language: 'de-DE'
      }
    },
    {
      voice_id: 'en-US-Wavenet-D',
      name: 'English Male (WaveNet)',
      category: 'wavenet',
      labels: {
        accent: 'American',
        description: 'High-quality American English male voice',
        gender: 'male',
        language: 'en-US'
      }
    },
    {
      voice_id: 'en-US-Wavenet-F',
      name: 'English Female (WaveNet)',
      category: 'wavenet',
      labels: {
        accent: 'American',
        description: 'High-quality American English female voice',
        gender: 'female',
        language: 'en-US'
      }
    }
  ]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    
    // Validate provider
    const validProviders = ['elevenlabs', 'openai', 'azure', 'google']
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid provider. Supported providers: ${validProviders.join(', ')}` 
        },
        { status: 400 }
      )
    }

    const providerKey = provider.toLowerCase() as keyof typeof ttsProviderVoices
    const voices = ttsProviderVoices[providerKey] || []

    // For ElevenLabs, we could potentially make a real API call if API key is provided
    // But for demo purposes, we'll use the mock data
    if (provider.toLowerCase() === 'elevenlabs') {
      // In production, you would check for API key and make real API call:
      // const apiKey = request.headers.get('x-api-key')
      // if (apiKey) {
      //   const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      //     headers: { 'xi-api-key': apiKey }
      //   })
      //   const data = await response.json()
      //   return NextResponse.json({ success: true, data: { voices: data.voices } })
      // }
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: provider.toLowerCase(),
        voices: voices,
        total_count: voices.length
      }
    })

  } catch (error: any) {
    console.error(`TTS Provider voices API error:`, error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}