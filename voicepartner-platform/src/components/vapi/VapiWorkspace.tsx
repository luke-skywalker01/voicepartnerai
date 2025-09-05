'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsItem 
} from '../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { 
  Phone, 
  Bot, 
  Workflow, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Mic,
  MicOff,
  PhoneCall,
  MessageSquare,
  Users,
  Zap,
  Clock,
  DollarSign,
  Activity,
  Volume2,
  Brain,
  Ear
} from 'lucide-react'
import { 
  VapiService, 
  VapiAssistant, 
  VapiWorkflow, 
  VapiCall, 
  VapiPhoneNumber,
  VapiPresets,
  createVapiService 
} from '../../lib/vapi-service'
import { toast } from '../ui/toast'

interface VapiWorkspaceProps {
  apiKey?: string
  onApiKeyChange?: (key: string) => void
}

interface AssistantFormData {
  name: string
  systemMessage: string
  firstMessage: string
  transcriber: {
    provider: 'deepgram' | 'assemblyai' | 'gladia' | 'speechmatics'
    model: string
    language: string
  }
  model: {
    provider: 'openai' | 'anthropic' | 'groq' | 'together-ai'
    model: string
    temperature: number
    maxTokens: number
  }
  voice: {
    provider: 'elevenlabs' | 'playht' | 'rime-ai' | 'deepgram' | 'azure'
    voiceId: string
    stability: number
    similarityBoost: number
  }
}

export default function VapiWorkspace({ apiKey, onApiKeyChange }: VapiWorkspaceProps) {
  const [vapiService, setVapiService] = useState<VapiService | null>(null)
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [workflows, setWorkflows] = useState<VapiWorkflow[]>([])
  const [calls, setCalls] = useState<VapiCall[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<VapiPhoneNumber[]>([])
  const [activeTab, setActiveTab] = useState('assistants')
  const [isLoading, setIsLoading] = useState(false)
  const [showAssistantForm, setShowAssistantForm] = useState(false)
  const [editingAssistant, setEditingAssistant] = useState<VapiAssistant | null>(null)
  const [assistantForm, setAssistantForm] = useState<AssistantFormData>({
    name: '',
    systemMessage: '',
    firstMessage: '',
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en'
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 250
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: 'ErXwobaYiN019PkySvjV',
      stability: 0.75,
      similarityBoost: 0.75
    }
  })

  // Mock data for development
  const mockData = {
    assistants: [
      {
        id: 'asst_1',
        name: 'Customer Support Bot',
        transcriber: { provider: 'deepgram' as const, model: 'nova-2', language: 'en' },
        model: { 
          provider: 'openai' as const, 
          model: 'gpt-4o-mini', 
          systemMessage: 'You are a helpful customer support agent.',
          temperature: 0.7
        },
        voice: { provider: 'elevenlabs' as const, voiceId: 'ErXwobaYiN019PkySvjV' },
        firstMessage: 'Hello! How can I help you today?',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'asst_2', 
        name: 'Appointment Booking',
        transcriber: { provider: 'deepgram' as const, model: 'nova-2', language: 'en' },
        model: { 
          provider: 'anthropic' as const, 
          model: 'claude-3-haiku-20240307', 
          systemMessage: 'You help users book appointments.',
          temperature: 0.3
        },
        voice: { provider: 'elevenlabs' as const, voiceId: 'ErXwobaYiN019PkySvjV' },
        firstMessage: 'Hi! I can help you schedule an appointment.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    calls: [
      {
        id: 'call_1',
        assistantId: 'asst_1',
        status: 'ended' as const,
        type: 'inbound' as const,
        transport: 'pstn' as const,
        startedAt: new Date(Date.now() - 300000).toISOString(),
        endedAt: new Date(Date.now() - 60000).toISOString(),
        cost: 0.15,
        transcript: 'User: Hi, I need help with my order. Assistant: I\'d be happy to help you with your order. Could you please provide your order number?',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'call_2',
        assistantId: 'asst_2', 
        status: 'in-progress' as const,
        type: 'outbound' as const,
        transport: 'pstn' as const,
        startedAt: new Date(Date.now() - 30000).toISOString(),
        cost: 0.08,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  useEffect(() => {
    if (apiKey) {
      setVapiService(createVapiService(apiKey))
      loadData()
    } else {
      // Use mock data for demo
      setAssistants(mockData.assistants as VapiAssistant[])
      setCalls(mockData.calls as VapiCall[])
    }
  }, [apiKey])

  const loadData = async () => {
    if (!vapiService) return
    
    setIsLoading(true)
    try {
      const [assistantsData, callsData, phoneNumbersData] = await Promise.all([
        vapiService.listAssistants().catch(() => mockData.assistants),
        vapiService.listCalls().catch(() => mockData.calls),
        vapiService.listPhoneNumbers().catch(() => [])
      ])
      
      setAssistants(assistantsData as VapiAssistant[])
      setCalls(callsData as VapiCall[])
      setPhoneNumbers(phoneNumbersData as VapiPhoneNumber[])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAssistant = async () => {
    if (!vapiService) {
      // Demo mode - just add to local state
      const newAssistant: VapiAssistant = {
        id: `asst_${Date.now()}`,
        ...assistantForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setAssistants([...assistants, newAssistant])
      setShowAssistantForm(false)
      resetAssistantForm()
      toast.success('Assistant created successfully!')
      return
    }

    setIsLoading(true)
    try {
      const newAssistant = await vapiService.createAssistant(assistantForm)
      setAssistants([...assistants, newAssistant])
      setShowAssistantForm(false)
      resetAssistantForm()
      toast.success('Assistant created successfully!')
    } catch (error) {
      console.error('Error creating assistant:', error)
      toast.error('Failed to create assistant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAssistant = async () => {
    if (!editingAssistant || !vapiService) return

    setIsLoading(true)
    try {
      const updatedAssistant = await vapiService.updateAssistant(editingAssistant.id, assistantForm)
      setAssistants(assistants.map(a => a.id === editingAssistant.id ? updatedAssistant : a))
      setEditingAssistant(null)
      setShowAssistantForm(false)
      resetAssistantForm()
      toast.success('Assistant updated successfully!')
    } catch (error) {
      console.error('Error updating assistant:', error)
      toast.error('Failed to update assistant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAssistant = async (id: string) => {
    if (!vapiService) {
      // Demo mode
      setAssistants(assistants.filter(a => a.id !== id))
      toast.success('Assistant deleted successfully!')
      return
    }

    setIsLoading(true)
    try {
      await vapiService.deleteAssistant(id)
      setAssistants(assistants.filter(a => a.id !== id))
      toast.success('Assistant deleted successfully!')
    } catch (error) {
      console.error('Error deleting assistant:', error)
      toast.error('Failed to delete assistant')
    } finally {
      setIsLoading(false)
    }
  }

  const resetAssistantForm = () => {
    setAssistantForm({
      name: '',
      systemMessage: '',
      firstMessage: '',
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en'
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 250
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: 'ErXwobaYiN019PkySvjV',
        stability: 0.75,
        similarityBoost: 0.75
      }
    })
  }

  const loadPreset = (presetName: keyof typeof VapiPresets) => {
    const preset = VapiPresets[presetName]
    setAssistantForm({
      name: `${presetName} Assistant`,
      systemMessage: preset.model.systemMessage,
      firstMessage: preset.firstMessage || '',
      transcriber: preset.transcriber,
      model: preset.model,
      voice: preset.voice
    })
  }

  const getStatusColor = (status: VapiCall['status']) => {
    switch (status) {
      case 'in-progress': return 'bg-green-500'
      case 'ended': return 'bg-gray-500'
      case 'queued': return 'bg-yellow-500'
      case 'ringing': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDuration = (startedAt?: string, endedAt?: string) => {
    if (!startedAt) return 'N/A'
    const start = new Date(startedAt)
    const end = endedAt ? new Date(endedAt) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vapi Workspace</h1>
              <p className="text-gray-600 mt-2">Build and manage voice AI assistants</p>
            </div>
            
            {!apiKey && (
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Demo Mode:</strong> Add your Vapi API key to connect to real data
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const key = prompt('Enter your Vapi API key:')
                    if (key && onApiKeyChange) onApiKeyChange(key)
                  }}
                >
                  Add API Key
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bot className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assistants</p>
                  <p className="text-2xl font-bold text-gray-900">{assistants.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <PhoneCall className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{calls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Calls</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calls.filter(c => c.status === 'in-progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${calls.reduce((sum, call) => sum + (call.cost || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsItem value="assistants">Assistants</TabsItem>
            <TabsItem value="workflows">Workflows</TabsItem>
            <TabsItem value="calls">Calls</TabsItem>
            <TabsItem value="analytics">Analytics</TabsItem>
          </TabsList>

          {/* Assistants Tab */}
          <TabsContent value="assistants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Voice Assistants</h2>
              <Button onClick={() => setShowAssistantForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Assistant
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assistants.map((assistant) => (
                <Card key={assistant.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{assistant.name}</CardTitle>
                        <CardDescription>
                          {assistant.model.provider} • {assistant.voice.provider}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{assistant.transcriber.provider}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">First Message:</p>
                        <p className="text-sm italic">"{assistant.firstMessage}"</p>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Ear className="h-4 w-4" />
                        <span>{assistant.transcriber.model}</span>
                        <Brain className="h-4 w-4 ml-2" />
                        <span>{assistant.model.model}</span>
                        <Volume2 className="h-4 w-4 ml-2" />
                        <span>{assistant.voice.voiceId}</span>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingAssistant(assistant)
                            setAssistantForm({
                              name: assistant.name,
                              systemMessage: assistant.model.systemMessage,
                              firstMessage: assistant.firstMessage || '',
                              transcriber: assistant.transcriber,
                              model: assistant.model,
                              voice: assistant.voice
                            })
                            setShowAssistantForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(assistant.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteAssistant(assistant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Workflows</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-8 text-center">
                <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create visual conversation flows with conditional logic and branching
                </p>
                <Button>Get Started with Workflows</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Call History</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Start Call
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Call ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assistant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calls.map((call) => {
                        const assistant = assistants.find(a => a.id === call.assistantId)
                        return (
                          <tr key={call.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {call.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assistant?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${getStatusColor(call.status)} text-white`}>
                                {call.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {call.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDuration(call.startedAt, call.endedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${call.cost?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                                {call.transcript && (
                                  <Button size="sm" variant="outline">
                                    Transcript
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold">Analytics & Insights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Call Volume</CardTitle>
                  <CardDescription>Calls over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="h-16 w-16" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                  <CardDescription>Call completion metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <Activity className="h-16 w-16" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Assistant Form Dialog */}
        <Dialog open={showAssistantForm} onOpenChange={setShowAssistantForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAssistant ? 'Edit Assistant' : 'Create New Assistant'}
              </DialogTitle>
              <DialogDescription>
                Configure your voice AI assistant with custom settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Preset Buttons */}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadPreset('customerSupport')}
                >
                  Customer Support
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadPreset('appointmentBooking')}
                >
                  Appointment Booking
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadPreset('salesQualification')}
                >
                  Sales Qualification
                </Button>
              </div>

              {/* Basic Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Assistant Name</Label>
                  <Input
                    id="name"
                    value={assistantForm.name}
                    onChange={(e) => setAssistantForm({...assistantForm, name: e.target.value})}
                    placeholder="Enter assistant name"
                  />
                </div>

                <div>
                  <Label htmlFor="systemMessage">System Message</Label>
                  <Textarea
                    id="systemMessage"
                    value={assistantForm.systemMessage}
                    onChange={(e) => setAssistantForm({...assistantForm, systemMessage: e.target.value})}
                    placeholder="Define the assistant's role and behavior"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="firstMessage">First Message</Label>
                  <Input
                    id="firstMessage"
                    value={assistantForm.firstMessage}
                    onChange={(e) => setAssistantForm({...assistantForm, firstMessage: e.target.value})}
                    placeholder="What should the assistant say first?"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <Tabs defaultValue="transcriber" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsItem value="transcriber">Speech-to-Text</TabsItem>
                  <TabsItem value="model">AI Model</TabsItem>
                  <TabsItem value="voice">Text-to-Speech</TabsItem>
                </TabsList>

                <TabsContent value="transcriber" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider</Label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={assistantForm.transcriber.provider}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          transcriber: {
                            ...assistantForm.transcriber,
                            provider: e.target.value as any
                          }
                        })}
                      >
                        <option value="deepgram">Deepgram</option>
                        <option value="assemblyai">AssemblyAI</option>
                        <option value="gladia">Gladia</option>
                        <option value="speechmatics">Speechmatics</option>
                      </select>
                    </div>
                    <div>
                      <Label>Model</Label>
                      <Input
                        value={assistantForm.transcriber.model}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          transcriber: {
                            ...assistantForm.transcriber,
                            model: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="model" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider</Label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={assistantForm.model.provider}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          model: {
                            ...assistantForm.model,
                            provider: e.target.value as any
                          }
                        })}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="groq">Groq</option>
                        <option value="together-ai">Together AI</option>
                      </select>
                    </div>
                    <div>
                      <Label>Model</Label>
                      <Input
                        value={assistantForm.model.model}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          model: {
                            ...assistantForm.model,
                            model: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Temperature: {assistantForm.model.temperature}</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={assistantForm.model.temperature}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          model: {
                            ...assistantForm.model,
                            temperature: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label>Max Tokens</Label>
                      <Input
                        type="number"
                        value={assistantForm.model.maxTokens}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          model: {
                            ...assistantForm.model,
                            maxTokens: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="voice" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider</Label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={assistantForm.voice.provider}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          voice: {
                            ...assistantForm.voice,
                            provider: e.target.value as any
                          }
                        })}
                      >
                        <option value="elevenlabs">ElevenLabs</option>
                        <option value="playht">PlayHT</option>
                        <option value="rime-ai">Rime AI</option>
                        <option value="deepgram">Deepgram</option>
                        <option value="azure">Azure</option>
                      </select>
                    </div>
                    <div>
                      <Label>Voice ID</Label>
                      <Input
                        value={assistantForm.voice.voiceId}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          voice: {
                            ...assistantForm.voice,
                            voiceId: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Stability: {assistantForm.voice.stability}</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={assistantForm.voice.stability}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          voice: {
                            ...assistantForm.voice,
                            stability: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label>Similarity Boost: {assistantForm.voice.similarityBoost}</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={assistantForm.voice.similarityBoost}
                        onChange={(e) => setAssistantForm({
                          ...assistantForm,
                          voice: {
                            ...assistantForm.voice,
                            similarityBoost: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAssistantForm(false)
                    setEditingAssistant(null)
                    resetAssistantForm()
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={editingAssistant ? handleUpdateAssistant : handleCreateAssistant}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingAssistant ? 'Update Assistant' : 'Create Assistant'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}