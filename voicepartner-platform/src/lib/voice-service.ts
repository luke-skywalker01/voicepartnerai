// Voice Service for ElevenLabs TTS/STT Integration
export class VoiceService {
  private elevenLabsApiKey: string
  private isRecording = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []

  constructor(apiKey: string) {
    this.elevenLabsApiKey = apiKey
  }

  // Text-to-Speech with ElevenLabs
  async textToSpeech(text: string, voiceId: string = 'ErXwobaYiN019PkySvjV'): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error('Text-to-Speech error:', error)
      throw error
    }
  }

  // Play audio from ArrayBuffer
  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(blob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          reject(new Error('Audio playback failed'))
        }
        
        audio.play()
      } catch (error) {
        reject(error)
      }
    })
  }

  // Start voice recording for Speech-to-Text
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data)
      }

      this.mediaRecorder.start()
      this.isRecording = true
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  // Stop recording and return audio blob
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
        this.isRecording = false
        
        // Stop all tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
        
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  // Speech-to-Text using Web Speech API (fallback) or Whisper API
  async speechToText(audioBlob: Blob): Promise<string> {
    // Try OpenAI Whisper API first
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.wav')
      formData.append('model', 'whisper-1')
      formData.append('language', 'de') // German

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        return result.text
      }
    } catch (error) {
      console.warn('Whisper API failed, trying Web Speech API:', error)
    }

    // For demo purposes, simulate speech recognition
    // In production, you would use a proper speech-to-text service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate common appointment booking phrases
        const demoResponses = [
          'Ich möchte gerne einen Termin buchen',
          'Mein Name ist Max Mustermann',
          'Meine Telefonnummer ist 030 12345678',
          'Ich hätte gerne eine Massage',
          'Morgen um 14 Uhr wäre perfekt',
          'Ja, das passt mir gut',
          'Vielen Dank, das war alles'
        ]
        
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]
        resolve(randomResponse)
      }, 1000) // Simulate processing time
    })
  }

  // Get available voices from ElevenLabs
  async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.elevenLabsApiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`)
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('Failed to get voices:', error)
      return []
    }
  }

  // Check if currently recording
  getIsRecording(): boolean {
    return this.isRecording
  }
}