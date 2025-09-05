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
  ArrowRight,
  Copy,
  RefreshCw,
  Target
} from 'lucide-react'

interface PromptOptimizerProps {
  initialPrompt?: string
  context?: string
  onOptimizedPrompt?: (optimizedPrompt: string) => void
  className?: string
}

export default function PromptOptimizer({ 
  initialPrompt = '',
  context = '',
  onOptimizedPrompt,
  className = '' 
}: PromptOptimizerProps) {
  const [originalPrompt, setOriginalPrompt] = useState(initialPrompt)
  const [optimizedData, setOptimizedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { optimizePrompt, isOptimizingPrompt } = useClaude()

  const handleOptimize = async () => {
    if (!originalPrompt.trim()) {
      setError('Bitte geben Sie einen Prompt ein, der optimiert werden soll.')
      return
    }

    setError(null)
    const result = await optimizePrompt(originalPrompt, context)

    if (result.success) {
      setOptimizedData(result)
    } else {
      setError(result.error || 'Fehler bei der Prompt-Optimierung')
    }
  }

  const handleCopyOptimized = async () => {
    if (optimizedData?.optimized_prompt) {
      await navigator.clipboard.writeText(optimizedData.optimized_prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUseOptimized = () => {
    if (optimizedData?.optimized_prompt && onOptimizedPrompt) {
      onOptimizedPrompt(optimizedData.optimized_prompt)
    }
  }

  const examplePrompts = [
    "Du bist ein freundlicher Kundenservice-Bot für ein E-Commerce Unternehmen. Hilf Kunden bei Fragen.",
    "Beantworte Fragen zu Terminen in einer Arztpraxis. Sei professionell und empathisch.",
    "Du hilfst bei technischen Problemen mit Software. Stelle gezielte Fragen zur Problemlösung.",
    "Berate Kunden bei Produktfragen in einem Online-Shop. Sei hilfsbereit und kompetent."
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-accent" />
            <CardTitle>KI Prompt-Optimierung</CardTitle>
          </div>
          <CardDescription>
            Lassen Sie Ihre Prompts von unserer KI für maximale Effektivität in Voice AI Anwendungen optimieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Prompt Input */}
          <div>
            <label htmlFor="original-prompt" className="text-sm font-medium text-foreground mb-2 block">
              Zu optimierender Prompt
            </label>
            <Textarea
              id="original-prompt"
              placeholder="Beispiel: Du bist ein Kundenservice-Bot. Hilf den Kunden bei ihren Fragen..."
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          {/* Context Input */}
          <div>
            <label htmlFor="context" className="text-sm font-medium text-foreground mb-2 block">
              Kontext/Anwendungsbereich (optional)
            </label>
            <Textarea
              id="context"
              placeholder="Beispiel: E-Commerce Shop für Elektronik, Zielgruppe: technikaffine Kunden..."
              value={context}
              onChange={(e) => setError(null)}
              rows={2}
              className="w-full"
            />
          </div>

          {/* Example Prompts */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Beispiel-Prompts:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs p-2 max-w-xs"
                  onClick={() => setOriginalPrompt(example)}
                >
                  {example.substring(0, 40)}...
                </Badge>
              ))}
            </div>
          </div>

          {/* Optimize Button */}
          <Button
            onClick={handleOptimize}
            disabled={isOptimizingPrompt || !originalPrompt.trim()}
            className="w-full"
          >
            {isOptimizingPrompt ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Prompt wird optimiert...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Prompt optimieren
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

      {/* Optimization Results */}
      {optimizedData && (
        <div className="space-y-6">
          {/* Optimized Prompt */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">Optimierter Prompt</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyOptimized}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                  {onOptimizedPrompt && (
                    <Button onClick={handleUseOptimized} size="sm">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Verwenden
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {optimizedData.optimized_prompt}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-accent" />
                <span>Vorher/Nachher Vergleich</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3 text-red-600">Original:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                    <p className="text-foreground leading-relaxed">
                      {optimizedData.original_prompt}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-3 text-green-600">Optimiert:</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                    <p className="text-foreground leading-relaxed">
                      {optimizedData.optimized_prompt}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Improvements */}
          {optimizedData.improvements && optimizedData.improvements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Verbesserungen</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {optimizedData.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs flex items-center justify-center font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-muted-foreground text-sm leading-relaxed">
                        {improvement}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Voice AI Tips */}
          {optimizedData.voice_tips && optimizedData.voice_tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  <span>Voice AI Optimierungs-Tipps</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {optimizedData.voice_tips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-muted-foreground text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Personality Suggestions */}
          {optimizedData.personality_suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persönlichkeits-Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Empfohlener Ton:</h4>
                    <Badge variant="secondary" className="text-sm">
                      {optimizedData.personality_suggestions.tone}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Kommunikationsstil:</h4>
                    <p className="text-muted-foreground text-sm">
                      {optimizedData.personality_suggestions.style}
                    </p>
                  </div>
                </div>
                
                {optimizedData.personality_suggestions.examples && optimizedData.personality_suggestions.examples.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Beispielphrasen:</h4>
                    <div className="space-y-2">
                      {optimizedData.personality_suggestions.examples.map((example: string, index: number) => (
                        <div key={index} className="bg-muted/20 rounded p-3 text-sm italic">
                          "{example}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}