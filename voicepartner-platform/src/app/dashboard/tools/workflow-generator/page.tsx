'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Download, FileText, Share2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AIWorkflowGenerator from '@/components/workflow/AIWorkflowGenerator'

export default function WorkflowGeneratorPage() {
  const [generatedWorkflows, setGeneratedWorkflows] = useState<any[]>([])

  const handleWorkflowGenerated = (workflow: any) => {
    // Add to list of generated workflows
    setGeneratedWorkflows(prev => [
      {
        ...workflow,
        id: Date.now().toString(),
        generatedAt: new Date().toISOString()
      },
      ...prev
    ])
  }

  const exportWorkflow = (workflow: any) => {
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `workflow-${workflow.name?.toLowerCase().replace(/\s+/g, '-') || 'generated'}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const copyWorkflowJSON = async (workflow: any) => {
    await navigator.clipboard.writeText(JSON.stringify(workflow, null, 2))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/tools"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-accent" />
            <span>AI Workflow Generator</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Erstellen Sie intelligente Workflows mit Hilfe von KI-Unterstützung
          </p>
        </div>
      </div>

      {/* Main Generator */}
      <AIWorkflowGenerator onWorkflowGenerated={handleWorkflowGenerated} />

      {/* Generated Workflows History */}
      {generatedWorkflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-accent" />
              <span>Generierte Workflows</span>
            </CardTitle>
            <CardDescription>
              Ihre zuletzt generierten Workflows zur Wiederverwendung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedWorkflows.map((workflow, index) => (
                <div key={workflow.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{workflow.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                        <span>{workflow.nodes?.length || 0} Schritte</span>
                        <span>{workflow.variables?.length || 0} Variablen</span>
                        <span>
                          Erstellt: {new Date(workflow.generatedAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyWorkflowJSON(workflow)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportWorkflow(workflow)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Natürliche Sprache</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Beschreiben Sie Ihren gewünschten Workflow in natürlicher Sprache. 
              Unsere KI versteht komplexe Anforderungen und erstellt entsprechende Strukturen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimierte Gesprächsflüsse</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Automatisch generierte Workflows folgen bewährten Praktiken für 
              Voice AI und bieten natürliche, benutzerfreundliche Interaktionen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sofort einsatzbereit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Generierte Workflows können direkt in Ihre Voice AI Assistenten 
              integriert oder als Basis für weitere Anpassungen verwendet werden.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tipps für beste Ergebnisse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Detaillierte Beschreibungen</h4>
              <p className="text-sm text-muted-foreground">
                Je spezifischer Sie Ihre Anforderungen beschreiben, desto besser kann die KI 
                einen passenden Workflow erstellen. Erwähnen Sie Zielgruppe, Anwendungsfall und 
                gewünschte Funktionen.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Iterative Verbesserung</h4>
              <p className="text-sm text-muted-foreground">
                Generierte Workflows können als Ausgangspunkt dienen. Sie können diese 
                anpassen, erweitern oder als Inspiration für weitere Generationen nutzen.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Kontext berücksichtigen</h4>
              <p className="text-sm text-muted-foreground">
                Geben Sie relevanten Kontext wie Branche, Unternehmensgröße oder spezielle 
                Anforderungen an, um optimierte Ergebnisse zu erhalten.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Experimentieren</h4>
              <p className="text-sm text-muted-foreground">
                Probieren Sie verschiedene Formulierungen und Ansätze aus. Die KI kann 
                unterschiedliche Perspektiven auf dasselbe Problem bieten.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}