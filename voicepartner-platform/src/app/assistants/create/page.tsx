'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import VapiMainLayout from '@/components/layout/VapiMainLayout'
import VapiAssistantForm from '@/components/assistants/VapiAssistantForm'
import { ArrowLeft } from 'lucide-react'

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

export default function CreateAssistantPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (data: AssistantFormData) => {
    setIsLoading(true)
    
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Creating assistant with data:', data)
      
      // Simulate success
      // In real app, you'd make an API call here
      // const response = await fetch('/api/assistants', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // })
      
      // if (!response.ok) throw new Error('Failed to create assistant')
      
      // Redirect to assistants list
      router.push('/assistants')
      
    } catch (error) {
      console.error('Error creating assistant:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = (data: AssistantFormData) => {
    console.log('Testing assistant with data:', data)
    // Implement test functionality
    // This could open a voice test modal or make a test call
  }

  const goBack = () => {
    router.back()
  }

  return (
    <VapiMainLayout>
      <div className="mb-6">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assistants</span>
        </button>
      </div>

      <VapiAssistantForm
        onSave={handleSave}
        onTest={handleTest}
        isLoading={isLoading}
      />
    </VapiMainLayout>
  )
}