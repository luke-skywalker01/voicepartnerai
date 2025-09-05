'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Mic, 
  Square, 
  Download,
  MessageSquare,
  Phone,
  User,
  Bot,
  AlertCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings,
  Calendar,
  CheckCircle
} from 'lucide-react'
// import { EnhancedVoiceService, VoiceConfig } from '@/lib/voice/enhanced-voice-service'

export default function VoiceTestPage() {
  const [selectedAgent, setSelectedAgent] = useState('2')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle')
  const [conversationLog, setConversationLog] = useState<Array<{
    id: string
    type: 'user' | 'agent' | 'system'
    message: string
    timestamp: Date
    duration?: string
    audioUrl?: string
  }>>([])
  
  const [voiceService, setVoiceService] = useState<any>(null)
  const [apiKeys, setApiKeys] = useState({
    elevenlabs: '',
    openai: '',
  })
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')

  // New state for provider and model selection
  const [ttsProvider, setTtsProvider] = useState('elevenlabs')
  const [selectedVoice, setSelectedVoice] = useState('')
  const [llmProvider, setLlmProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('')
  const [availableVoices, setAvailableVoices] = useState<any[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)

  const [conversationState, setConversationState] = useState({
    customerName: '',
    customerPhone: '',
    serviceType: '',
    preferredDate: '',
    selectedDateTime: '',
    currentStep: 'greeting'
  })

  const agents = [
    { 
      id: '1', 
      name: 'Kundenservice Bot', 
      status: 'active',
      description: 'Allgemeine Kundenanfragen'
    },
    { 
      id: '2', 
      name: 'Terminbuchung Assistant', 
      status: 'active',
      description: 'Spezialisiert auf Terminvereinbarungen'
    },
    { 
      id: '3', 
      name: 'Sales Qualifier', 
      status: 'paused',
      description: 'Verkaufsqualifikation'
    }
  ]

  useEffect(() => {
    // Demo mode - voice service simulation
    setConnectionStatus('connected')
  }, [apiKeys.elevenlabs, apiKeys.openai])

  // Load available voices when TTS provider changes
  useEffect(() => {
    loadAvailableVoices()
  }, [ttsProvider])

  // Load available models when LLM provider changes
  useEffect(() => {
    loadAvailableModels()
  }, [llmProvider])

  const loadAvailableVoices = async () => {
    setLoadingVoices(true)
    try {
      const response = await fetch(`/api/tts-providers/${ttsProvider}/voices`)
      const data = await response.json()
      
      if (data.success) {
        setAvailableVoices(data.data.voices)
        // Auto-select first voice if none selected
        if (data.data.voices.length > 0 && !selectedVoice) {
          setSelectedVoice(data.data.voices[0].voice_id)
        }
      } else {
        console.error('Failed to load voices:', data.error)
        setAvailableVoices([])
      }
    } catch (error) {
      console.error('Error loading voices:', error)
      setAvailableVoices([])
    } finally {
      setLoadingVoices(false)
    }
  }

  const loadAvailableModels = async () => {
    setLoadingModels(true)
    try {
      const response = await fetch(`/api/llm-providers/${llmProvider}/models`)
      const data = await response.json()
      
      if (data.success) {
        setAvailableModels(data.data.models)
        // Auto-select first model if none selected
        if (data.data.models.length > 0 && !selectedModel) {
          setSelectedModel(data.data.models[0].model_id)
        }
      } else {
        console.error('Failed to load models:', data.error)
        setAvailableModels([])
      }
    } catch (error) {
      console.error('Error loading models:', error)
      setAvailableModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  const addToConversationLog = (type: 'user' | 'agent' | 'system', message: string, audioUrl?: string) => {
    setConversationLog(prev => [...prev, {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      duration: type === 'agent' ? `${(Math.random() * 3 + 1).toFixed(1)}s` : undefined,
      audioUrl
    }])
  }

  const startCall = async () => {
    setCallStatus('connecting')
    addToConversationLog('system', 'Verbindung wird aufgebaut...')

    setTimeout(async () => {
      setCallStatus('connected')
      const selectedAgentName = agents.find(a => a.id === selectedAgent)?.name || 'Voice Agent'
      addToConversationLog('system', `Verbunden mit ${selectedAgentName}`)
      
      let greeting = 'Hallo! Wie kann ich Ihnen heute helfen?'
      
      if (selectedAgent === '2') {
        greeting = 'Hallo! Willkommen bei VoicePartnerAI Terminservice. Ich bin Ihr persönlicher Terminassistent. Wie kann ich Ihnen heute bei der Terminbuchung helfen?'
        setConversationState(prev => ({ ...prev, currentStep: 'greeting' }))
      }

      addToConversationLog('agent', greeting)
      addToConversationLog('system', 'Demo-Modus: TTS würde hier Audio abspielen.')
    }, 2000)
  }

  const startRecording = async () => {
    // Check if provider and model are selected
    if (!selectedVoice || !selectedModel) {
      alert('Bitte wählen Sie eine Stimme und ein Modell aus.')
      return
    }

    try {
      setIsRecording(true)
      addToConversationLog('system', '🎤 Aufnahme gestartet... Sprechen Sie jetzt!')
      
      // Start browser audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        await processVoicePipeline(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      
      // Store recorder reference for stopping
      ;(window as any).currentMediaRecorder = mediaRecorder
      
    } catch (error) {
      console.error('Recording error:', error)
      setIsRecording(false)
      addToConversationLog('system', 'Fehler beim Starten der Aufnahme')
    }
  }

  const stopRecording = async () => {
    try {
      setIsRecording(false)
      addToConversationLog('system', '🎤 Aufnahme beendet, wird verarbeitet...')
      
      // Stop the media recorder
      const mediaRecorder = (window as any).currentMediaRecorder
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
      
    } catch (error) {
      console.error('Stop recording error:', error)
      addToConversationLog('system', 'Fehler beim Verarbeiten der Aufnahme')
    }
  }

  const processVoicePipeline = async (audioBlob: Blob) => {
    try {
      addToConversationLog('system', '⚡ Pipeline wird verarbeitet: STT → LLM → TTS...')
      
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString('base64')
      
      // Call the voice pipeline API
      const response = await fetch('/api/voice/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process_voice_pipeline',
          audioData: base64Audio,
          sessionId: `session_${Date.now()}`,
          config: {
            ttsProvider,
            selectedVoice,
            llmProvider,
            selectedModel
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const { pipeline } = result.data
        
        // Add user transcript to conversation
        addToConversationLog('user', pipeline.stt.transcript)
        
        // Add processing info
        addToConversationLog('system', 
          `📊 Verarbeitet: ${pipeline.stt.confidence.toFixed(2)} Konfidenz | ` +
          `${pipeline.llm.tokens_used} Tokens | ${pipeline.llm.model}`
        )
        
        // Add agent response
        addToConversationLog('agent', pipeline.llm.response, pipeline.tts.audioUrl)
        
        // Play the audio response
        await playAudioResponse(pipeline.tts.audioUrl)
        
      } else {
        addToConversationLog('system', `❌ Pipeline Fehler: ${result.error}`)
      }
      
    } catch (error) {
      console.error('Voice pipeline error:', error)
      addToConversationLog('system', '❌ Fehler bei der Voice Pipeline Verarbeitung')
    }
  }

  const playAudioResponse = async (audioUrl: string) => {
    try {
      setIsPlaying(true)
      const audio = new Audio(audioUrl)
      
      audio.onended = () => {
        setIsPlaying(false)
      }
      
      audio.onerror = () => {
        setIsPlaying(false)
        addToConversationLog('system', 'Fehler beim Abspielen der Audio-Antwort')
      }
      
      await audio.play()
      
    } catch (error) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
      addToConversationLog('system', 'Fehler beim Abspielen der Audio-Antwort')
    }
  }

  const endCall = () => {
    setCallStatus('ended')
    addToConversationLog('system', 'Gespräch beendet')
    setConversationState({
      customerName: '',
      customerPhone: '',
      serviceType: '',
      preferredDate: '',
      selectedDateTime: '',
      currentStep: 'greeting'
    })
  }

  const resetTest = () => {
    setCallStatus('idle')
    setConversationLog([])
    setConversationState({
      customerName: '',
      customerPhone: '',
      serviceType: '',
      preferredDate: '',
      selectedDateTime: '',
      currentStep: 'greeting'
    })
  }

  const exportConversation = () => {
    const data = {
      agent: agents.find(a => a.id === selectedAgent)?.name,
      timestamp: new Date().toISOString(),
      conversation: conversationLog,
      bookingDetails: conversationState
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice-test-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🎙️ Live Voice Test</h1>
                <p className="text-gray-500">Testen Sie Ihre Voice Agents mit echter Spracherkennung</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {conversationLog.length > 0 && (
                <button 
                  onClick={exportConversation}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              )}
              <button 
                onClick={resetTest}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* API Configuration */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  API Konfiguration
                </h3>
                <div className="space-y-4">
                  {/* TTS Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">TTS Provider</label>
                    <select
                      value={ttsProvider}
                      onChange={(e) => {
                        setTtsProvider(e.target.value)
                        setSelectedVoice('') // Reset voice selection
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="elevenlabs">ElevenLabs</option>
                      <option value="openai">OpenAI TTS</option>
                      <option value="azure">Azure Cognitive Services</option>
                      <option value="google">Google Cloud TTS</option>
                    </select>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Stimme (Voice)</label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      disabled={loadingVoices || availableVoices.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {loadingVoices ? (
                        <option>Stimmen werden geladen...</option>
                      ) : availableVoices.length === 0 ? (
                        <option>Keine Stimmen verfügbar</option>
                      ) : (
                        <>
                          <option value="">Stimme auswählen</option>
                          {availableVoices.map((voice) => (
                            <option key={voice.voice_id} value={voice.voice_id}>
                              {voice.name} {voice.labels?.gender && `(${voice.labels.gender})`} 
                              {voice.labels?.accent && ` - ${voice.labels.accent}`}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {selectedVoice && (
                      <p className="text-xs text-gray-500 mt-1">
                        {availableVoices.find(v => v.voice_id === selectedVoice)?.labels?.description || 'Ausgewählte Stimme'}
                      </p>
                    )}
                  </div>

                  {/* LLM Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">LLM Provider</label>
                    <select
                      value={llmProvider}
                      onChange={(e) => {
                        setLlmProvider(e.target.value)
                        setSelectedModel('') // Reset model selection
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google Gemini</option>
                      <option value="mistral">Mistral AI</option>
                      <option value="cohere">Cohere</option>
                    </select>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Modell</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={loadingModels || availableModels.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {loadingModels ? (
                        <option>Modelle werden geladen...</option>
                      ) : availableModels.length === 0 ? (
                        <option>Keine Modelle verfügbar</option>
                      ) : (
                        <>
                          <option value="">Modell auswählen</option>
                          {availableModels.map((model) => (
                            <option key={model.model_id} value={model.model_id}>
                              {model.name} ({model.category})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {selectedModel && (
                      <p className="text-xs text-gray-500 mt-1">
                        {availableModels.find(m => m.model_id === selectedModel)?.description || 'Ausgewähltes Modell'}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">API Keys</label>
                      {connectionStatus === 'connected' && (
                        <div className="flex items-center text-green-600 text-xs">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verbunden
                        </div>
                      )}
                      {connectionStatus === 'error' && (
                        <div className="flex items-center text-red-600 text-xs">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Fehler
                        </div>
                      )}
                    </div>
                    <input
                      type="password"
                      value={apiKeys.elevenlabs}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, elevenlabs: e.target.value }))}
                      placeholder={`${ttsProvider.toUpperCase()} API Key`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                      placeholder={`${llmProvider.toUpperCase()} API Key`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Für Voice AI Pipeline (ohne: Demo-Modus)
                    </p>
                  </div>
                </div>
              </div>

              {/* Call Controls */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Anruf-Steuerung</h3>
                <div className="space-y-4">
                  {callStatus === 'idle' && (
                    <button
                      onClick={startCall}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Voice Test starten
                    </button>
                  )}

                  {callStatus === 'connecting' && (
                    <div className="text-center py-4">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Verbindung wird aufgebaut...</p>
                    </div>
                  )}

                  {callStatus === 'connected' && (
                    <div className="space-y-3">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isPlaying}
                        className={`w-full px-4 py-3 rounded-md flex items-center justify-center transition-colors ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="h-5 w-5 mr-2" />
                            Aufnahme stoppen
                          </>
                        ) : (
                          <>
                            <Mic className="h-5 w-5 mr-2" />
                            Sprechen
                          </>
                        )}
                      </button>

                      {isPlaying && (
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <Volume2 className="h-4 w-4 animate-pulse" />
                            <span>Agent spricht...</span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={endCall}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-md flex items-center justify-center"
                      >
                        <Phone className="h-5 w-5 mr-2 rotate-135" />
                        Anruf beenden
                      </button>
                    </div>
                  )}

                  {callStatus === 'ended' && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-500">Gespräch beendet</p>
                      <button
                        onClick={() => setCallStatus('idle')}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Neuen Test starten
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Display */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg h-[700px] flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Live Gespräch</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                        callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-500 capitalize">
                        {callStatus === 'connected' ? 'Live' : callStatus}
                      </span>
                    </div>
                    {isRecording && (
                      <div className="flex items-center space-x-2 text-red-500">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Aufnahme</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {conversationLog.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Starten Sie einen Voice Test</p>
                      <p className="text-sm">Echte Spracherkennung und Text-to-Speech</p>
                    </div>
                  ) : (
                    conversationLog.map((log) => (
                      <div key={log.id} className={`flex ${log.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs sm:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
                          log.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : log.type === 'agent'
                            ? 'bg-gray-50 border border-gray-200'
                            : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {log.type === 'user' ? (
                                <User className="h-4 w-4" />
                              ) : log.type === 'agent' ? (
                                <Bot className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                              <span className="text-xs opacity-75">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                              {log.duration && (
                                <span className="text-xs opacity-75">({log.duration})</span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm whitespace-pre-line">{log.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}