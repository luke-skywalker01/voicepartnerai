'use client'

import { useState, useEffect } from 'react'
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Play,
  Pause,
  Settings,
  Volume2,
  TestTube,
  Bot,
  RefreshCw,
  Activity
} from 'lucide-react'

interface Assistant {
  id: string
  name: string
  description: string
  firstMessage?: string
  voice: {
    provider: string
    voiceId: string
  }
  model: {
    provider: string
    model: string
  }
}

export default function TestPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([])
  const [connectionTime, setConnectionTime] = useState(0)
  const [callQuality, setCallQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent')
  const [latency, setLatency] = useState(0)

  useEffect(() => {
    loadAssistants()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isConnected) {
      interval = setInterval(() => {
        setConnectionTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isConnected])

  const loadAssistants = () => {
    try {
      const savedAssistants = localStorage.getItem('voicepartner_assistants')
      if (savedAssistants) {
        const parsedAssistants = JSON.parse(savedAssistants)
        setAssistants(parsedAssistants)
        if (parsedAssistants.length > 0) {
          setSelectedAssistant(parsedAssistants[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load assistants:', error)
    }
  }

  const selectedAssistantData = assistants.find(a => a.id === selectedAssistant)

  const startCall = async () => {
    if (!selectedAssistant) return
    
    setIsConnected(true)
    setConnectionTime(0)
    setConversation([])
    
    // Simulate initial greeting
    setTimeout(() => {
      const greeting = selectedAssistantData?.firstMessage || 'Hallo! Wie kann ich Ihnen helfen?'
      setConversation([{
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }])
      setIsPlaying(true)
      
      // Simulate response time
      setLatency(Math.floor(Math.random() * 200) + 100)
      
      setTimeout(() => {
        setIsPlaying(false)
      }, 2000)
    }, 500)
  }

  const endCall = () => {
    setIsConnected(false)
    setIsRecording(false)
    setIsPlaying(false)
    setConnectionTime(0)
  }

  const toggleRecording = () => {
    if (!isConnected) return
    
    setIsRecording(!isRecording)
    
    if (!isRecording) {
      // Simulate user input after recording
      setTimeout(() => {
        setIsRecording(false)
        
        const userMessages = [
          'Hallo, ich hätte gerne Informationen zu Ihren Öffnungszeiten.',
          'Können Sie mir bei der Terminbuchung helfen?',
          'Ich habe eine Frage zu Ihrem Service.',
          'Wie kann ich einen Termin stornieren?',
          'Welche Unterlagen benötige ich für den Termin?'
        ]
        
        const userMessage = userMessages[Math.floor(Math.random() * userMessages.length)]
        
        setConversation(prev => [...prev, {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        }])
        
        // Simulate assistant response
        setTimeout(() => {
          const assistantResponses = [
            'Gerne helfe ich Ihnen! Unsere Öffnungszeiten sind Montag bis Freitag von 9:00 bis 18:00 Uhr.',
            'Selbstverständlich! Für welchen Tag möchten Sie einen Termin buchen?',
            'Gerne beantworte ich Ihre Frage. Worum geht es denn?',
            'Kein Problem! Können Sie mir bitte Ihre Terminreferenznummer nennen?',
            'Für Ihren Termin benötigen Sie einen gültigen Ausweis und Ihre Versicherungskarte.'
          ]
          
          const response = assistantResponses[Math.floor(Math.random() * assistantResponses.length)]
          
          setConversation(prev => [...prev, {
            role: 'assistant',
            content: response,
            timestamp: new Date()
          }])
          
          setIsPlaying(true)
          setLatency(Math.floor(Math.random() * 200) + 80)
          
          setTimeout(() => {
            setIsPlaying(false)
          }, 3000)
        }, 800)
      }, 2000)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'fair':
        return 'text-yellow-600'
      case 'poor':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Voice Test</h1>
        <p className="text-muted-foreground mt-1">Testen Sie Ihre Voice AI Assistants in Echtzeit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assistant Selection */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Assistant auswählen</h3>
            <div className="grid grid-cols-1 gap-3">
              {assistants.map((assistant) => (
                <button
                  key={assistant.id}
                  onClick={() => setSelectedAssistant(assistant.id)}
                  disabled={isConnected}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedAssistant === assistant.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{assistant.name}</h4>
                      <p className="text-sm text-muted-foreground">{assistant.description}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span>{assistant.voice.provider} ({assistant.voice.voiceId})</span>
                        <span>{assistant.model.model}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Call Controls */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-center space-y-6">
              {/* Call Status */}
              <div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Activity className={`w-4 h-4 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">
                    {isConnected ? 'Verbunden' : 'Getrennt'}
                  </span>
                </div>
                {isConnected && (
                  <div className="text-2xl font-mono font-bold text-foreground">
                    {formatTime(connectionTime)}
                  </div>
                )}
              </div>

              {/* Main Call Button */}
              <div>
                {!isConnected ? (
                  <button
                    onClick={startCall}
                    disabled={!selectedAssistant}
                    className="w-20 h-20 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Phone className="w-8 h-8" />
                  </button>
                ) : (
                  <button
                    onClick={endCall}
                    className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <PhoneOff className="w-8 h-8" />
                  </button>
                )}
              </div>

              {/* Recording Button */}
              {isConnected && (
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={toggleRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isRecording ? 'Aufnahme läuft...' : 'Klicken zum Sprechen'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRecording ? 'Loslassen zum Senden' : 'Halten Sie die Taste gedrückt'}
                    </p>
                  </div>
                </div>
              )}

              {/* Audio Status */}
              {isPlaying && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">Assistant spricht...</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-blue-600 rounded animate-pulse"></div>
                    <div className="w-1 h-2 bg-blue-600 rounded animate-pulse animation-delay-75"></div>
                    <div className="w-1 h-4 bg-blue-600 rounded animate-pulse animation-delay-150"></div>
                    <div className="w-1 h-2 bg-blue-600 rounded animate-pulse animation-delay-300"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Log */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Gesprächsverlauf</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Starten Sie einen Anruf um den Gesprächsverlauf zu sehen
                </p>
              ) : (
                conversation.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="space-y-6">
          {/* Call Quality */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Anrufqualität</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verbindung</span>
                <span className={`text-sm font-medium ${getQualityColor(callQuality)}`}>
                  {callQuality}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latenz</span>
                <span className="text-sm font-medium">
                  {isConnected ? `${latency}ms` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nachrichten</span>
                <span className="text-sm font-medium">{conversation.length}</span>
              </div>
            </div>
          </div>

          {/* Assistant Info */}
          {selectedAssistantData && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Assistant Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedAssistantData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Voice Provider</p>
                  <p className="font-medium">
                    {selectedAssistantData.voice.provider} - {selectedAssistantData.voice.voiceId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Language Model</p>
                  <p className="font-medium">{selectedAssistantData.model.model}</p>
                </div>
                {selectedAssistantData.firstMessage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Erste Nachricht</p>
                    <p className="text-sm bg-muted p-2 rounded">
                      "{selectedAssistantData.firstMessage}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Options */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Test Optionen</h3>
            <div className="space-y-3">
              <button
                disabled={isConnected}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Test</span>
              </button>
              <button
                disabled={!isConnected}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Settings className="w-4 h-4" />
                <span>Erweiterte Einstellungen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}