'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Bot, Wand2, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import PromptOptimizer from '@/components/agents/PromptOptimizer'
import AIWorkflowGenerator from '@/components/workflow/AIWorkflowGenerator'

export default function NewAIAssistantPage() {
  const router = useRouter()
  const [step, setStep] = useState<'prompt' | 'workflow' | 'review'>('prompt')
  const [assistantData, setAssistantData] = useState({
    name: '',
    description: '',
    prompt: '',
    optimizedPrompt: '',
    workflow: null as any,
    context: ''
  })

  const handleOptimizedPrompt = (optimizedPrompt: string) => {
    setAssistantData(prev => ({ ...prev, optimizedPrompt }))
  }

  const handleWorkflowGenerated = (workflow: any) => {
    setAssistantData(prev => ({ ...prev, workflow }))
  }

  const handleCreateAssistant = () => {
    // Create assistant with AI-generated data
    const newAssistant = {
      id: Date.now().toString(),
      name: assistantData.name || assistantData.workflow?.name || 'KI-generierter Assistant',
      description: assistantData.description || assistantData.workflow?.description || 'Mit KI erstellt',
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      voice: {
        provider: 'eleven_labs',
        voiceId: 'default'
      },
      model: {
        provider: 'openai',
        model: 'gpt-4'
      },
      firstMessage: assistantData.optimizedPrompt || assistantData.prompt,
      workflow: assistantData.workflow,
      aiGenerated: true
    }

    // Save to localStorage
    const existingAssistants = JSON.parse(localStorage.getItem('voicepartner_assistants') || '[]')
    existingAssistants.push(newAssistant)
    localStorage.setItem('voicepartner_assistants', JSON.stringify(existingAssistants))

    // Redirect to assistants list
    router.push('/dashboard/assistants')
  }

  const examples = [
    {
      title: "E-Commerce Kundenservice",
      description: "Kundenbetreuung für Online-Shop",
      prompt: "Du bist ein freundlicher Kundenservice-Bot für einen E-Commerce Shop. Hilf Kunden bei Bestellungen, Rücksendungen und Produktfragen. Sei immer höflich und lösungsorientiert.",
      context: "Online-Shop für Elektronik und Technik-Produkte"
    },
    {
      title: "Arztpraxis Terminbuchung",
      description: "Terminverwaltung für medizinische Praxis",
      prompt: "Du hilfst Patienten bei der Terminbuchung in unserer Arztpraxis. Erfrage verfügbare Zeiten, Patientendaten und den Grund des Besuchs. Sei empathisch und professionell.",
      context: "Allgemeinmedizinische Praxis mit Online-Terminbuchung"
    },
    {
      title: "Restaurant Reservierungen",
      description: "Tischreservierung und Kundenbetreuung",
      prompt: "Du nimmst Reservierungen für unser Restaurant entgegen. Erfrage Datum, Uhrzeit, Personenanzahl und besondere Wünsche. Sei gastfreundlich und hilfsbereit.",
      context: "Gehobenes Restaurant mit 50 Plätzen, internationale Küche"
    },
    {
      title: "Tech Support",
      description: "Technischer Support und Problemlösung",
      prompt: "Du hilfst bei technischen Problemen mit Software und Hardware. Stelle gezielte Fragen zur Problemdiagnose und biete Schritt-für-Schritt Lösungen. Sei geduldig und verständlich.",
      context: "IT-Support für Software-Unternehmen"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/assistants"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-accent" />
            <span>KI-Assistant erstellen</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Lassen Sie unsere KI einen optimierten Voice Assistant für Sie erstellen
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-8">
        {[
          { key: 'prompt', label: 'Prompt & Optimierung', icon: Wand2 },
          { key: 'workflow', label: 'Workflow-Generierung', icon: Bot },
          { key: 'review', label: 'Überprüfung & Erstellung', icon: CheckCircle }
        ].map((stepInfo, index) => (
          <div key={stepInfo.key} className="flex items-center">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              step === stepInfo.key 
                ? 'bg-accent text-accent-foreground' 
                : index < ['prompt', 'workflow', 'review'].indexOf(step)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-muted text-muted-foreground'
            }`}>
              <stepInfo.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{stepInfo.label}</span>
            </div>
            {index < 2 && (
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'prompt' && (
        <div className="space-y-6">
          {/* Example Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Schnellstart-Vorlagen</CardTitle>
              <CardDescription>
                Wählen Sie eine Vorlage als Ausgangspunkt oder erstellen Sie einen eigenen Prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {examples.map((example, index) => (
                  <div 
                    key={index}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setAssistantData(prev => ({
                        ...prev,
                        name: example.title,
                        description: example.description,
                        prompt: example.prompt,
                        context: example.context
                      }))
                    }}
                  >
                    <h4 className="font-medium text-foreground mb-2">{example.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{example.description}</p>
                    <Badge variant="outline" className="text-xs">
                      Vorlage verwenden
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Input */}
          <Card>
            <CardHeader>
              <CardTitle>Oder eigenen Assistant beschreiben</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Assistant Name (optional)
                </label>
                <input
                  type="text"
                  value={assistantData.name}
                  onChange={(e) => setAssistantData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Kundenservice Bot"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Beschreibung/Kontext
                </label>
                <Textarea
                  value={assistantData.context}
                  onChange={(e) => setAssistantData(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Beschreiben Sie den Anwendungsbereich, die Zielgruppe und den Zweck des Assistants..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Grundlegender Prompt
                </label>
                <Textarea
                  value={assistantData.prompt}
                  onChange={(e) => setAssistantData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Beschreiben Sie, was Ihr Assistant tun soll..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Prompt Optimizer */}
          {assistantData.prompt && (
            <PromptOptimizer
              initialPrompt={assistantData.prompt}
              context={assistantData.context}
              onOptimizedPrompt={handleOptimizedPrompt}
            />
          )}

          {/* Next Step */}
          <div className="flex justify-end">
            <Button 
              onClick={() => setStep('workflow')}
              disabled={!assistantData.prompt}
            >
              Weiter zum Workflow
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'workflow' && (
        <div className="space-y-6">
          <AIWorkflowGenerator
            onWorkflowGenerated={handleWorkflowGenerated}
          />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setStep('prompt')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <Button 
              onClick={() => setStep('review')}
              disabled={!assistantData.workflow}
            >
              Zur Überprüfung
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant-Übersicht</CardTitle>
              <CardDescription>
                Überprüfen Sie die KI-generierten Inhalte vor der Erstellung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Grundinformationen</h4>
                <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {assistantData.name || assistantData.workflow?.name || 'KI-generierter Assistant'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Beschreibung:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {assistantData.description || assistantData.workflow?.description || 'Mit KI erstellt'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Optimized Prompt */}
              {assistantData.optimizedPrompt && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Optimierter Prompt</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {assistantData.optimizedPrompt}
                    </p>
                  </div>
                </div>
              )}

              {/* Workflow Preview */}
              {assistantData.workflow && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Generierter Workflow</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium">Workflow:</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {assistantData.workflow.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Schritte:</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {assistantData.workflow.nodes?.length || 0} Workflow-Knoten
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Variablen:</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {assistantData.workflow.variables?.length || 0} definierte Variablen
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setStep('workflow')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <Button 
              onClick={handleCreateAssistant}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Assistant erstellen
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}