'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Play, 
  Pause, 
  Square,
  Volume2,
  VolumeX,
  Settings,
  Activity,
  Zap,
  Brain,
  Ear,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Headphones,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react'
import { PipecatClient, PipecatConfig, VoiceSession, createPipecatClient } from '../../lib/voice/pipecat-client'
import { toast } from '../ui/toast'

interface PipecatVoiceInterfaceProps {
  assistantId?: string
  config?: Partial<PipecatConfig>
  onSessionStart?: (session: VoiceSession) => void
  onSessionEnd?: (session: VoiceSession) => void
  onTranscript?: (text: string) => void
  onBotResponse?: (text: string) => void
}

interface AudioVisualizerProps {
  isActive: boolean
  volume: number
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (isActive) {
        const bars = 20
        const barWidth = canvas.width / bars
        
        for (let i = 0; i < bars; i++) {
          const barHeight = Math.random() * canvas.height * (volume / 100)
          const x = i * barWidth
          const y = canvas.height - barHeight
          
          ctx.fillStyle = `hsl(${200 + i * 10}, 70%, 50%)`
          ctx.fillRect(x, y, barWidth - 2, barHeight)
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, volume])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className="w-full h-20 bg-gray-900 rounded"
    />
  )
}

export default function PipecatVoiceInterface({
  assistantId = 'demo-assistant',
  config,
  onSessionStart,
  onSessionEnd,
  onTranscript,
  onBotResponse
}: PipecatVoiceInterfaceProps) {
  const [pipecatClient, setPipecatClient] = useState<PipecatClient | null>(null)
  const [session, setSession] = useState<VoiceSession | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: number
  }>>([])
  const [audioVolume, setAudioVolume] = useState(50)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [latency, setLatency] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  const defaultConfig: PipecatConfig = {
    transport: 'websocket',
    stt: 'deepgram',
    tts: 'elevenlabs',
    llm: 'openai',
    apiKeys: {
      openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      deepgram: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
      elevenlabs: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    }
  }

  const finalConfig = { ...defaultConfig, ...config }

  useEffect(() => {
    const client = createPipecatClient(finalConfig)
    setPipecatClient(client)

    // Set up event listeners
    client.on('connected', (session: VoiceSession) => {
      setSession(session)
      setIsConnected(true)
      setConnectionStatus('connected')
      onSessionStart?.(session)
      toast.success('Connected to voice service')
    })

    client.on('disconnected', () => {
      setIsConnected(false)
      setIsListening(false)
      setConnectionStatus('disconnected')
      toast.info('Disconnected from voice service')
    })

    client.on('statusChanged', (status: VoiceSession['status']) => {
      if (session) {
        setSession({ ...session, status })
        setIsListening(status === 'listening')
      }
    })

    client.on('transcript', (text: string) => {
      setCurrentTranscript(text)
      onTranscript?.(text)
    })

    client.on('botResponse', (text: string) => {
      onBotResponse?.(text)
    })

    client.on('messageAdded', (message: any) => {
      setConversationHistory(prev => [...prev, message])
    })

    client.on('sessionEnded', (endedSession: VoiceSession) => {
      setSession(endedSession)
      onSessionEnd?.(endedSession)
      setIsListening(false)
    })

    client.on('error', (error: Error) => {
      setConnectionStatus('error')
      toast.error(`Voice service error: ${error.message}`)
    })

    return () => {
      client.disconnect()
    }
  }, [assistantId])

  const handleConnect = async () => {
    if (!pipecatClient) return

    setConnectionStatus('connecting')
    try {
      await pipecatClient.connect(assistantId)
    } catch (error) {
      setConnectionStatus('error')
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = () => {
    if (pipecatClient) {
      pipecatClient.disconnect()
      setSession(null)
    }
  }

  const handleStartListening = () => {
    if (!pipecatClient || !isConnected) return

    try {
      pipecatClient.startListening()
      setIsListening(true)
    } catch (error) {
      console.error('Failed to start listening:', error)
      toast.error('Failed to start listening')
    }
  }

  const handleStopListening = () => {
    if (!pipecatClient) return

    pipecatClient.stopListening()
    setIsListening(false)
  }

  const handleSendText = (text: string) => {
    if (!pipecatClient || !isConnected) return

    try {
      pipecatClient.sendText(text)
    } catch (error) {
      console.error('Failed to send text:', error)
      toast.error('Failed to send message')
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4" />
      case 'connecting': return <Radio className="h-4 w-4 animate-pulse" />
      case 'error': return <WifiOff className="h-4 w-4" />
      default: return <WifiOff className="h-4 w-4" />
    }
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipecat Voice Interface</h2>
          <p className="text-gray-600 mt-1">Real-time voice AI powered by Pipecat</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className={`${getStatusColor()} text-white`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </Badge>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Configuration</CardTitle>
            <CardDescription>Configure your voice AI settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Speech-to-Text Provider</Label>
                <select className="w-full p-2 border rounded" value={finalConfig.stt}>
                  <option value="deepgram">Deepgram</option>
                  <option value="whisper">OpenAI Whisper</option>
                  <option value="speechmatics">Speechmatics</option>
                </select>
              </div>
              <div>
                <Label>Text-to-Speech Provider</Label>
                <select className="w-full p-2 border rounded" value={finalConfig.tts}>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="azure">Azure</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>LLM Provider</Label>
                <select className="w-full p-2 border rounded" value={finalConfig.llm}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="groq">Groq</option>
                </select>
              </div>
              <div>
                <Label>Transport Method</Label>
                <select className="w-full p-2 border rounded" value={finalConfig.transport}>
                  <option value="websocket">WebSocket</option>
                  <option value="webrtc">WebRTC</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Audio Enabled</Label>
              <Switch checked={isAudioEnabled} onCheckedChange={setIsAudioEnabled} />
            </div>
            <div>
              <Label>Audio Volume: {audioVolume}%</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Headphones className="mr-2 h-5 w-5" />
              Voice Interface
            </CardTitle>
            <CardDescription>
              {session ? `Session: ${session.id}` : 'No active session'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Visualizer */}
            <div className="space-y-2">
              <Label>Audio Visualizer</Label>
              <AudioVisualizer isActive={isListening} volume={audioVolume} />
            </div>

            {/* Connection Controls */}
            <div className="flex space-x-2">
              {!isConnected ? (
                <Button onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
                  <Phone className="mr-2 h-4 w-4" />
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDisconnect}>
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              )}
            </div>

            {/* Voice Controls */}
            {isConnected && (
              <div className="flex space-x-2">
                {!isListening ? (
                  <Button onClick={handleStartListening}>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Listening
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleStopListening}>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Listening
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => setIsAudioEnabled(!isAudioEnabled)}>
                  {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium text-blue-800">Live Transcript:</Label>
                <p className="text-blue-900 mt-1">{currentTranscript}</p>
              </div>
            )}

            {/* Session Stats */}
            {session && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <p className="font-medium capitalize">{session.status}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Duration</Label>
                  <p className="font-medium">{formatDuration(session.duration)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Messages</Label>
                  <p className="font-medium">{session.messages.length}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Latency</Label>
                  <p className="font-medium">{latency}ms</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Conversation
            </CardTitle>
            <CardDescription>Real-time conversation history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversationHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversation yet. Start talking to begin!</p>
                </div>
              ) : (
                conversationHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : message.role === 'assistant'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-yellow-100 text-yellow-900'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium capitalize">
                          {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System'}
                        </span>
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Text Input */}
            {isConnected && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        handleSendText(target.value)
                        target.value = ''
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement
                      if (input?.value) {
                        handleSendText(input.value)
                        input.value = ''
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Technical Details
          </CardTitle>
          <CardDescription>Real-time performance metrics and system information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Ear className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Speech-to-Text</p>
              <p className="text-lg font-bold text-gray-900">{finalConfig.stt}</p>
            </div>
            
            <div className="text-center">
              <Brain className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Language Model</p>
              <p className="text-lg font-bold text-gray-900">{finalConfig.llm}</p>
            </div>
            
            <div className="text-center">
              <Volume2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Text-to-Speech</p>
              <p className="text-lg font-bold text-gray-900">{finalConfig.tts}</p>
            </div>
            
            <div className="text-center">
              <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Transport</p>
              <p className="text-lg font-bold text-gray-900">{finalConfig.transport}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}