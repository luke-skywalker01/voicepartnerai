import { EventEmitter } from 'events'

export interface PipecatConfig {
  transport: 'daily' | 'webrtc' | 'websocket'
  stt: 'deepgram' | 'whisper' | 'speechmatics'
  tts: 'elevenlabs' | 'azure' | 'openai'
  llm: 'openai' | 'anthropic' | 'groq'
  apiKeys: {
    openai?: string
    deepgram?: string
    elevenlabs?: string
    daily?: string
  }
}

export interface VoiceSession {
  id: string
  status: 'idle' | 'listening' | 'thinking' | 'speaking'
  transcript: string
  duration: number
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
}

export class PipecatClient extends EventEmitter {
  private config: PipecatConfig
  private session: VoiceSession | null = null
  private ws: WebSocket | null = null
  private isConnected = false

  constructor(config: PipecatConfig) {
    super()
    this.config = config
  }

  async connect(botId: string): Promise<void> {
    try {
      // In production, this would connect to your Pipecat server
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/voice/${botId}`
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        this.isConnected = true
        this.session = {
          id: this.generateSessionId(),
          status: 'idle',
          transcript: '',
          duration: 0,
          messages: []
        }
        this.emit('connected', this.session)
      }

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      }

      this.ws.onclose = () => {
        this.isConnected = false
        this.emit('disconnected')
      }

      this.ws.onerror = (error) => {
        this.emit('error', error)
      }

    } catch (error) {
      throw new Error(`Failed to connect to Pipecat: ${error}`)
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.session = null
  }

  startListening(): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to Pipecat server')
    }

    this.ws.send(JSON.stringify({
      type: 'start_listening'
    }))

    if (this.session) {
      this.session.status = 'listening'
      this.emit('statusChanged', this.session.status)
    }
  }

  stopListening(): void {
    if (!this.isConnected || !this.ws) return

    this.ws.send(JSON.stringify({
      type: 'stop_listening'
    }))

    if (this.session) {
      this.session.status = 'idle'
      this.emit('statusChanged', this.session.status)
    }
  }

  sendText(text: string): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to Pipecat server')
    }

    this.ws.send(JSON.stringify({
      type: 'text_input',
      text
    }))

    if (this.session) {
      this.session.messages.push({
        role: 'user',
        content: text,
        timestamp: Date.now()
      })
      this.emit('messageAdded', this.session.messages[this.session.messages.length - 1])
    }
  }

  private handleMessage(data: any): void {
    if (!this.session) return

    switch (data.type) {
      case 'transcript':
        this.session.transcript = data.text
        this.emit('transcript', data.text)
        break

      case 'status_change':
        this.session.status = data.status
        this.emit('statusChanged', data.status)
        break

      case 'bot_response':
        this.session.messages.push({
          role: 'assistant',
          content: data.text,
          timestamp: Date.now()
        })
        this.emit('botResponse', data.text)
        this.emit('messageAdded', this.session.messages[this.session.messages.length - 1])
        break

      case 'audio_data':
        // Handle audio playback
        this.emit('audioData', data.audio)
        break

      case 'session_ended':
        this.session.duration = data.duration
        this.emit('sessionEnded', this.session)
        break

      case 'error':
        this.emit('error', new Error(data.message))
        break
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  getSession(): VoiceSession | null {
    return this.session
  }

  isConnectedToServer(): boolean {
    return this.isConnected
  }
}

// Factory function to create Pipecat client
export function createPipecatClient(config: PipecatConfig): PipecatClient {
  return new PipecatClient(config)
}