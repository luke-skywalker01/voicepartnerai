import { useState } from 'react'

interface WorkflowGenerationResponse {
  success: boolean
  workflow?: any
  tips?: string[]
  generatedAt?: string
  error?: string
}

interface PromptOptimizationResponse {
  success: boolean
  original_prompt?: string
  optimized_prompt?: string
  improvements?: string[]
  voice_tips?: string[]
  personality_suggestions?: {
    tone: string
    style: string
    examples: string[]
  }
  optimizedAt?: string
  error?: string
}

export const useClaude = () => {
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false)
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false)

  const generateWorkflow = async (prompt: string): Promise<WorkflowGenerationResponse> => {
    setIsGeneratingWorkflow(true)
    
    try {
      const response = await fetch('/api/claude/workflow-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler bei der Workflow-Generierung')
      }

      return data
    } catch (error) {
      console.error('Workflow generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    } finally {
      setIsGeneratingWorkflow(false)
    }
  }

  const optimizePrompt = async (
    prompt: string, 
    context?: string
  ): Promise<PromptOptimizationResponse> => {
    setIsOptimizingPrompt(true)
    
    try {
      const response = await fetch('/api/claude/prompt-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, context }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler bei der Prompt-Optimierung')
      }

      return data
    } catch (error) {
      console.error('Prompt optimization error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    } finally {
      setIsOptimizingPrompt(false)
    }
  }

  return {
    generateWorkflow,
    optimizePrompt,
    isGeneratingWorkflow,
    isOptimizingPrompt,
  }
}