'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useClaude } from '@/hooks/useClaude'
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  Download,
  Eye
} from 'lucide-react'

interface AIWorkflowGeneratorProps {
  onWorkflowGenerated?: (workflow: any) => void
  className?: string
}

export default function AIWorkflowGenerator({ 
  onWorkflowGenerated,
  className = '' 
}: AIWorkflowGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null)
  const [tips, setTips] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const { generateWorkflow, isGeneratingWorkflow } = useClaude()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Bitte geben Sie eine Beschreibung für Ihren Workflow ein.')
      return
    }

    setError(null)
    const result = await generateWorkflow(prompt)

    if (result.success && result.workflow) {
      setGeneratedWorkflow(result.workflow)
      setTips(result.tips || [])
      if (onWorkflowGenerated) {
        onWorkflowGenerated(result.workflow)
      }
    } else {
      setError(result.error || 'Fehler bei der Workflow-Generierung')
    }
  }

  const handleUseWorkflow = () => {
    if (generatedWorkflow && onWorkflowGenerated) {
      onWorkflowGenerated(generatedWorkflow)
    }
  }

  const examplePrompts = [
    "Kundenservice für ein E-Commerce Unternehmen mit Bestellstatus, Rücksendungen und Produktfragen",
    "Terminbuchung für eine Arztpraxis mit Verfügbarkeitsprüfung und Patientendaten",
    "Restaurant-Reservierungen mit Tischauswahl und speziellen Wünschen",
    "Technischer Support mit Problemdiagnose und Lösungsschritten",
    "Immobilien-Anfragen mit Kriterien-Erfassung und Terminvereinbarung"
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <CardTitle>KI Workflow Generator</CardTitle>
          </div>
          <CardDescription>
            Beschreiben Sie Ihren gewünschten Voice AI Workflow in natürlicher Sprache. 
            Unsere KI erstellt automatisch einen optimierten Gesprächsfluss.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label htmlFor="workflow-prompt" className="text-sm font-medium text-foreground mb-2 block">
              Workflow Beschreibung
            </label>
            <Textarea
              id="workflow-prompt"
              placeholder="Beispiel: Erstelle einen Workflow für Kundenservice eines Online-Shops. Kunden sollen Bestellstatus abfragen, Rücksendungen initiieren und Produktfragen stellen können..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          {/* Example Prompts */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Beispiele:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs p-2 max-w-xs"
                  onClick={() => setPrompt(example)}
                >
                  {example.substring(0, 50)}...
                </Badge>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGeneratingWorkflow || !prompt.trim()}
            className="w-full"
          >
            {isGeneratingWorkflow ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Workflow wird generiert...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Workflow generieren
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Workflow */}
      {generatedWorkflow && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <CardTitle className="text-lg">Generierter Workflow</CardTitle>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Vorschau
                </Button>
                <Button onClick={handleUseWorkflow} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Workflow verwenden
                </Button>
              </div>
            </div>
            <CardDescription>
              {generatedWorkflow.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workflow Overview */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">Workflow: {generatedWorkflow.name}</h4>
              <p className="text-muted-foreground text-sm mb-4">{generatedWorkflow.description}</p>
              
              {/* Workflow Steps Preview */}
              <div className="bg-muted/20 rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-3">Workflow-Schritte:</h5>
                <div className="space-y-2">
                  {generatedWorkflow.nodes?.slice(0, 5).map((node: any, index: number) => (
                    <div key={node.id} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-accent/20 text-accent rounded-full text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">{node.title}</span>
                        <p className="text-xs text-muted-foreground">{node.content?.substring(0, 60)}...</p>
                      </div>
                    </div>
                  ))}
                  {generatedWorkflow.nodes?.length > 5 && (
                    <div className="text-xs text-muted-foreground pl-9">
                      ... und {generatedWorkflow.nodes.length - 5} weitere Schritte
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Variables */}
            {generatedWorkflow.variables && generatedWorkflow.variables.length > 0 && (
              <div>
                <h5 className="font-medium text-foreground mb-2">Variablen:</h5>
                <div className="flex flex-wrap gap-2">
                  {generatedWorkflow.variables.map((variable: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {variable.name} ({variable.type})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {tips.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-accent" />
                  <h5 className="font-medium text-foreground">KI-Empfehlungen:</h5>
                </div>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}