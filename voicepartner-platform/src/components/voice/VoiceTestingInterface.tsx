'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  RotateCcw,
  Download,
  Waveform,
  Phone,
  PhoneCall,
  PhoneOff
} from 'lucide-react'

type VoiceTestState = 'idle' | 'listening' | 'processing' | 'speaking' | 'completed' | 'error'
type CallState = 'idle' | 'calling' | 'connected' | 'ended'

interface VoiceConfig {
  provider: string
  voiceId: string
  speed: number
  stability: number
  volume: number
}

interface VoiceTestingInterfaceProps {
  voiceConfig: VoiceConfig
  systemPrompt: string
  onConfigChange?: (config: VoiceConfig) => void
  className?: string
}

export default function VoiceTestingInterface({ 
  voiceConfig, 
  systemPrompt,
  onConfigChange,
  className 
}: VoiceTestingInterfaceProps) {
  const [testState, setTestState] = useState<VoiceTestState>('idle')
  const [callState, setCallState] = useState<CallState>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Mock conversation history
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant'
    message: string
    timestamp: Date
    duration?: number
  }>>([])

  useEffect(() => {
    // Initialize audio context for visualization
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let animationFrame: number
    
    if (isRecording && analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const updateAudioLevel = () => {
        analyserRef.current!.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(Math.min(average / 2, 100))
        animationFrame = requestAnimationFrame(updateAudioLevel)
      }
      
      updateAudioLevel()
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Setup audio analysis
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream)
        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser
      }
      
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        // Process audio blob (send to speech recognition)
        processAudio(audioBlob)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setTestState('listening')
      
    } catch (error) {
      console.error('Error starting recording:', error)
      setTestState('error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setTestState('processing')
      setAudioLevel(0)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    // Mock speech-to-text processing
    setTestState('processing')
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockTranscriptions = [
      "Hello, I'd like to know about your services.",
      "Can you help me with my account?",
      "What are your business hours?",
      "I need to schedule an appointment.",
      "Can you tell me about your pricing?"
    ]
    
    const userMessage = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
    setTranscript(userMessage)
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      role: 'user',
      message: userMessage,
      timestamp: new Date()
    }])
    
    // Generate AI response
    await generateResponse(userMessage)
  }

  const generateResponse = async (userInput: string) => {
    setTestState('speaking')
    
    // Mock AI response generation
    const mockResponses = [
      "Hello! I'm here to help you. What can I assist you with today?",
      "I'd be happy to help with your account. Can you provide me with your account number?",
      "Our business hours are Monday through Friday, 9 AM to 6 PM Eastern Time.",
      "I can help you schedule an appointment. What type of appointment are you looking for?",
      "Our pricing varies depending on your needs. Let me get some details to provide you with accurate information."
    ]
    
    // Simulate response generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const aiResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
    setResponse(aiResponse)
    
    // Add AI response to conversation history
    setConversationHistory(prev => [...prev, {
      role: 'assistant',
      message: aiResponse,
      timestamp: new Date(),
      duration: 2.5 // Mock response duration
    }])
    
    // Simulate text-to-speech playback
    setIsPlaying(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsPlaying(false)
    setTestState('completed')
  }

  const resetTest = () => {
    setTestState('idle')
    setTranscript('')
    setResponse('')
    setConversationHistory([])
    setAudioLevel(0)
  }

  const startCall = async () => {
    setCallState('calling')
    
    // Simulate call connection delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setCallState('connected')
    setCallDuration(0)
    
    // Start call timer
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
    
    // Auto-start first message
    setTimeout(() => {
      setConversationHistory([{
        role: 'assistant',
        message: "Hello! Thank you for calling. How can I help you today?",
        timestamp: new Date(),
        duration: 2.0
      }])
    }, 1000)
  }

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }
    setCallState('ended')
    setTimeout(() => {
      setCallState('idle')
      setCallDuration(0)
      setConversationHistory([])
    }, 2000)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn("bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Mic className="h-5 w-5 text-vapi-indigo" />
          <h3 className="text-lg font-semibold text-vapi-text-primary">
            Voice Testing
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={resetTest}
            className="p-2 text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-black rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          
          <button className="p-2 text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-black rounded-lg transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Voice Configuration */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs text-vapi-text-secondary mb-1">
            Speed: {voiceConfig.speed}
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceConfig.speed}
            onChange={(e) => onConfigChange?.({ ...voiceConfig, speed: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-vapi-text-secondary mb-1">
            Stability: {voiceConfig.stability}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voiceConfig.stability}
            onChange={(e) => onConfigChange?.({ ...voiceConfig, stability: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-vapi-text-secondary mb-1">
            Volume: {voiceConfig.volume}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voiceConfig.volume}
            onChange={(e) => onConfigChange?.({ ...voiceConfig, volume: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isMuted 
                ? "bg-vapi-red/20 text-vapi-red" 
                : "bg-vapi-black text-vapi-text-secondary hover:text-vapi-text-primary"
            )}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Test Controls */}
      <div className="flex items-center justify-center space-x-6 mb-8">
        {/* Quick Test */}
        <div className="text-center">
          <p className="text-sm text-vapi-text-secondary mb-3">Quick Test</p>
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={testState === 'processing' || testState === 'speaking'}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                isRecording 
                  ? "bg-vapi-red text-white animate-pulse" 
                  : testState === 'processing' || testState === 'speaking'
                  ? "bg-vapi-border-gray text-vapi-text-secondary cursor-not-allowed"
                  : "bg-vapi-indigo text-white hover:bg-vapi-indigo/90"
              )}
            >
              {testState === 'processing' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : testState === 'speaking' || isPlaying ? (
                <Waveform className="h-6 w-6" />
              ) : isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
            
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-8 bg-vapi-indigo rounded-full transition-all"
                  style={{ height: `${Math.max(audioLevel * 0.3, 8)}px` }}
                />
                <div 
                  className="w-2 h-8 bg-vapi-indigo rounded-full transition-all"
                  style={{ height: `${Math.max(audioLevel * 0.5, 8)}px` }}
                />
                <div 
                  className="w-2 h-8 bg-vapi-indigo rounded-full transition-all"
                  style={{ height: `${Math.max(audioLevel * 0.4, 8)}px` }}
                />
              </div>
            )}
            
            <span className={cn(
              "text-xs font-medium",
              testState === 'idle' ? "text-vapi-text-secondary" :
              testState === 'listening' ? "text-vapi-indigo" :
              testState === 'processing' ? "text-yellow-500" :
              testState === 'speaking' ? "text-vapi-emerald" :
              testState === 'completed' ? "text-vapi-emerald" :
              "text-vapi-red"
            )}>
              {testState === 'idle' ? 'Click to start' :
               testState === 'listening' ? 'Listening...' :
               testState === 'processing' ? 'Processing...' :
               testState === 'speaking' ? 'Speaking...' :
               testState === 'completed' ? 'Completed' :
               'Error'}
            </span>
          </div>
        </div>

        {/* Full Call Test */}
        <div className="text-center">
          <p className="text-sm text-vapi-text-secondary mb-3">Full Call Test</p>
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={callState === 'connected' ? endCall : startCall}
              disabled={callState === 'calling' || callState === 'ended'}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                callState === 'connected' 
                  ? "bg-vapi-red text-white" 
                  : callState === 'calling' || callState === 'ended'
                  ? "bg-vapi-border-gray text-vapi-text-secondary cursor-not-allowed"
                  : "bg-vapi-emerald text-white hover:bg-vapi-emerald/90"
              )}
            >
              {callState === 'calling' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : callState === 'connected' ? (
                <PhoneOff className="h-6 w-6" />
              ) : callState === 'ended' ? (
                <PhoneOff className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </button>
            
            {callState === 'connected' && (
              <div className="text-center">
                <div className="text-lg font-bold text-vapi-emerald">
                  {formatDuration(callDuration)}
                </div>
              </div>
            )}
            
            <span className={cn(
              "text-xs font-medium",
              callState === 'idle' ? "text-vapi-text-secondary" :
              callState === 'calling' ? "text-yellow-500" :
              callState === 'connected' ? "text-vapi-emerald" :
              "text-vapi-text-secondary"
            )}>
              {callState === 'idle' ? 'Click to call' :
               callState === 'calling' ? 'Connecting...' :
               callState === 'connected' ? 'Connected' :
               'Call ended'}
            </span>
          </div>
        </div>
      </div>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div className="bg-vapi-black border border-vapi-border-gray rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-vapi-text-primary">
              Conversation
            </h4>
            <button className="p-1 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {conversationHistory.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  "flex space-x-3 p-3 rounded-lg",
                  entry.role === 'user' 
                    ? "bg-vapi-indigo/10" 
                    : "bg-vapi-emerald/10"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                  entry.role === 'user' 
                    ? "bg-vapi-indigo text-white" 
                    : "bg-vapi-emerald text-white"
                )}>
                  {entry.role === 'user' ? (
                    <Mic className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-xs font-medium",
                      entry.role === 'user' ? "text-vapi-indigo" : "text-vapi-emerald"
                    )}>
                      {entry.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {entry.duration && (
                        <span className="text-xs text-vapi-text-secondary">
                          {entry.duration}s
                        </span>
                      )}
                      <span className="text-xs text-vapi-text-secondary">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-vapi-text-primary">
                    {entry.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {transcript && (
        <div className="mt-4 p-3 bg-vapi-indigo/10 border border-vapi-indigo/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <Mic className="h-4 w-4 text-vapi-indigo flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-vapi-indigo mb-1">You said:</p>
              <p className="text-sm text-vapi-text-primary">{transcript}</p>
            </div>
          </div>
        </div>
      )}

      {response && (
        <div className="mt-3 p-3 bg-vapi-emerald/10 border border-vapi-emerald/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <Volume2 className="h-4 w-4 text-vapi-emerald flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-vapi-emerald mb-1">Assistant response:</p>
              <p className="text-sm text-vapi-text-primary">{response}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}