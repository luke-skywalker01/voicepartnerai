'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Bot,
  Settings,
  Mic,
  Zap,
  Webhook,
  ArrowRight,
  Save,
  Play,
  Pause,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'

interface VoiceProvider {
  id: string
  name: string
  voices: { id: string; name: string; preview?: string }[]
}

interface ModelProvider {
  id: string
  name: string
  models: { id: string; name: string; maxTokens: number }[]
}

const voiceProviders: VoiceProvider[] = [
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    voices: [
      { id: 'rachel', name: 'Rachel', preview: 'Professional, clear' },
      { id: 'domi', name: 'Domi', preview: 'Friendly, warm' },
      { id: 'bella', name: 'Bella', preview: 'Energetic, young' },
      { id: 'antoni', name: 'Antoni', preview: 'Deep, authoritative' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI TTS',
    voices: [
      { id: 'alloy', name: 'Alloy', preview: 'Balanced, neutral' },
      { id: 'echo', name: 'Echo', preview: 'Clear, direct' },
      { id: 'fable', name: 'Fable', preview: 'Warm, expressive' },
      { id: 'onyx', name: 'Onyx', preview: 'Deep, smooth' }
    ]
  }
]

const modelProviders: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', maxTokens: 200000 },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', maxTokens: 200000 },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', maxTokens: 200000 }
    ]
  }
]

interface AssistantFormData {
  name: string
  firstMessage: string
  systemPrompt: string
  voiceProvider: string
  voiceId: string
  modelProvider: string
  modelId: string
  temperature: number
  maxTokens: number
  voiceSpeed: number
  voiceStability: number
  functions: Array<{
    name: string
    description: string
    parameters: object
  }>
  webhooks: Array<{
    url: string
    event: string
  }>
  transfers: Array<{
    phoneNumber: string
    description: string
  }>
}

const defaultFormData: AssistantFormData = {
  name: '',
  firstMessage: 'Hello! How can I help you today?',
  systemPrompt: `You are a helpful AI assistant. Keep responses concise and friendly.

Key guidelines:
- Be helpful and professional
- Keep responses under 100 words
- Ask clarifying questions when needed
- End conversations naturally when appropriate`,
  voiceProvider: 'elevenlabs',
  voiceId: 'rachel',
  modelProvider: 'openai',
  modelId: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 150,
  voiceSpeed: 1.0,
  voiceStability: 0.8,
  functions: [],
  webhooks: [],
  transfers: []
}

interface VapiAssistantFormProps {
  initialData?: Partial<AssistantFormData>
  onSave: (data: AssistantFormData) => Promise<void>
  onTest?: (data: AssistantFormData) => void
  isLoading?: boolean
}

export default function VapiAssistantForm({ 
  initialData, 
  onSave, 
  onTest,
  isLoading = false 
}: VapiAssistantFormProps) {
  const [formData, setFormData] = useState<AssistantFormData>({
    ...defaultFormData,
    ...initialData
  })
  
  const [activeTab, setActiveTab] = useState<'functions' | 'webhooks' | 'transfers'>('functions')
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const updateField = (field: keyof AssistantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectedVoiceProvider = voiceProviders.find(p => p.id === formData.voiceProvider)
  const selectedModelProvider = modelProviders.find(p => p.id === formData.modelProvider)
  const selectedModel = selectedModelProvider?.models.find(m => m.id === formData.modelId)

  const handleSave = async () => {
    await onSave(formData)
  }

  const handleTest = () => {
    if (onTest) {
      onTest(formData)
    }
  }

  const playVoicePreview = () => {
    setIsPlaying(true)
    // Simulate voice preview
    setTimeout(() => setIsPlaying(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-vapi-text-primary mb-2">
            {initialData ? 'Edit Assistant' : 'Create Assistant'}
          </h1>
          <p className="text-vapi-text-secondary">
            Build and configure your voice AI assistant
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-vapi-dark-gray border border-vapi-border-gray text-vapi-text-primary rounded-lg hover:bg-vapi-border-gray transition-colors flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Test</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-vapi-indigo text-white rounded-lg hover:bg-vapi-indigo/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Assistant'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bot className="h-5 w-5 text-vapi-indigo" />
              <h3 className="text-lg font-semibold text-vapi-text-primary">
                Basic Information
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Customer Support Assistant"
                  className="w-full px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary placeholder-vapi-text-secondary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  First Message
                </label>
                <textarea
                  value={formData.firstMessage}
                  onChange={(e) => updateField('firstMessage', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary placeholder-vapi-text-secondary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-vapi-text-primary">
                    System Prompt
                  </label>
                  <button
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="flex items-center space-x-1 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors"
                  >
                    {showSystemPrompt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-sm">{showSystemPrompt ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => updateField('systemPrompt', e.target.value)}
                  rows={showSystemPrompt ? 10 : 4}
                  className={cn(
                    "w-full px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary placeholder-vapi-text-secondary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent resize-none transition-all",
                    !showSystemPrompt && "text-transparent"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Mic className="h-5 w-5 text-vapi-teal" />
              <h3 className="text-lg font-semibold text-vapi-text-primary">
                Voice Settings
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  Voice Provider
                </label>
                <select
                  value={formData.voiceProvider}
                  onChange={(e) => {
                    updateField('voiceProvider', e.target.value)
                    const provider = voiceProviders.find(p => p.id === e.target.value)
                    if (provider && provider.voices.length > 0) {
                      updateField('voiceId', provider.voices[0].id)
                    }
                  }}
                  className="w-full px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
                >
                  {voiceProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  Voice
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.voiceId}
                    onChange={(e) => updateField('voiceId', e.target.value)}
                    className="flex-1 px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
                  >
                    {selectedVoiceProvider?.voices.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={playVoicePreview}
                    className="px-3 py-2 bg-vapi-indigo text-white rounded-lg hover:bg-vapi-indigo/90 transition-colors"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
                {selectedVoiceProvider?.voices.find(v => v.id === formData.voiceId)?.preview && (
                  <p className="text-xs text-vapi-text-secondary mt-1">
                    {selectedVoiceProvider.voices.find(v => v.id === formData.voiceId)?.preview}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                    Speed: {formData.voiceSpeed}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.voiceSpeed}
                    onChange={(e) => updateField('voiceSpeed', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                    Stability: {formData.voiceStability}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.voiceStability}
                    onChange={(e) => updateField('voiceStability', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Model Settings */}
          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-vapi-indigo" />
              <h3 className="text-lg font-semibold text-vapi-text-primary">
                Model
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  Provider
                </label>
                <select
                  value={formData.modelProvider}
                  onChange={(e) => {
                    updateField('modelProvider', e.target.value)
                    const provider = modelProviders.find(p => p.id === e.target.value)
                    if (provider && provider.models.length > 0) {
                      updateField('modelId', provider.models[0].id)
                      updateField('maxTokens', Math.min(150, provider.models[0].maxTokens))
                    }
                  }}
                  className="w-full px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
                >
                  {modelProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  Model
                </label>
                <select
                  value={formData.modelId}
                  onChange={(e) => {
                    updateField('modelId', e.target.value)
                    const model = selectedModelProvider?.models.find(m => m.id === e.target.value)
                    if (model) {
                      updateField('maxTokens', Math.min(formData.maxTokens, model.maxTokens))
                    }
                  }}
                  className="w-full px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
                >
                  {selectedModelProvider?.models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  Temperature: {formData.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-vapi-text-secondary mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-vapi-text-primary mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
                  min="50"
                  max={selectedModel?.maxTokens || 4096}
                  className="w-full px-3 py-2 bg-vapi-black border border-vapi-border-gray rounded-lg text-vapi-text-primary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
                />
                <p className="text-xs text-vapi-text-secondary mt-1">
                  Max: {selectedModel?.maxTokens.toLocaleString() || 'N/A'} tokens
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-vapi-dark-gray border border-vapi-border-gray rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-5 w-5 text-vapi-emerald" />
              <h3 className="text-lg font-semibold text-vapi-text-primary">
                Advanced
              </h3>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-vapi-black rounded-lg p-1">
              {(['functions', 'webhooks', 'transfers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "bg-vapi-indigo text-white"
                      : "text-vapi-text-secondary hover:text-vapi-text-primary"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === 'functions' && (
                <div>
                  <div className="text-center py-8 text-vapi-text-secondary">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No functions configured</p>
                    <button className="mt-2 text-vapi-indigo hover:text-vapi-indigo/80 transition-colors text-sm">
                      Add Function
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'webhooks' && (
                <div>
                  <div className="text-center py-8 text-vapi-text-secondary">
                    <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No webhooks configured</p>
                    <button className="mt-2 text-vapi-indigo hover:text-vapi-indigo/80 transition-colors text-sm">
                      Add Webhook
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'transfers' && (
                <div>
                  <div className="text-center py-8 text-vapi-text-secondary">
                    <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No transfers configured</p>
                    <button className="mt-2 text-vapi-indigo hover:text-vapi-indigo/80 transition-colors text-sm">
                      Add Transfer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}