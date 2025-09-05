import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const PROMPT_OPTIMIZATION_PROMPT = `
Du bist ein Experte für Voice AI Prompt Engineering. Optimiere den gegebenen Prompt für maximale Effektivität in Voice AI Anwendungen.

Fokus auf:
- Klare, natürliche Sprache
- Spezifische Anweisungen
- Konsistente Persönlichkeit
- Fehlerbehandlung
- Benutzerfreundlichkeit
- Professionelle Kommunikation

Berücksichtige diese Voice AI Best Practices:
- Kurze, verständliche Sätze
- Aktive Sprache
- Klare Handlungsaufforderungen
- Empathische Kommunikation
- Strukturierte Informationsabfrage

Antworte im folgenden JSON-Format:

{
  "optimized_prompt": "Der optimierte Prompt",
  "improvements": [
    "Verbesserung 1: Beschreibung der Änderung",
    "Verbesserung 2: Beschreibung der Änderung"
  ],
  "voice_tips": [
    "Tipp 1 für Voice AI Optimierung",
    "Tipp 2 für bessere Spracherkennung"
  ],
  "personality_suggestions": {
    "tone": "freundlich/professionell/hilfsbereit",
    "style": "Beschreibung des Kommunikationsstils",
    "examples": [
      "Beispielphrase 1",
      "Beispielphrase 2"
    ]
  }
}

Zu optimierender Prompt: `

// Mock optimization function for demo purposes
const getMockOptimization = (prompt: string, context?: string) => {
  return {
    success: true,
    original_prompt: prompt,
    optimized_prompt: `Du bist ein professioneller Voice AI Assistant für ${context || 'Kundenservice'}. 

Deine Aufgaben:
- Beantworte Anfragen klar und strukturiert
- Verwende eine freundliche, professionelle Sprache
- Halte Antworten präzise und verständlich
- Stelle bei Unklarheiten gezielte Nachfragen
- Leite bei komplexen Anfragen an den passenden Ansprechpartner weiter

Kommunikationsstil:
- Spreche in kurzen, klaren Sätzen
- Verwende aktive Sprache
- Bestätige wichtige Informationen
- Bedanke dich für Geduld und Verständnis

${prompt}`,
    improvements: [
      "Strukturierung: Klare Aufgabendefinition hinzugefügt",
      "Sprache: Optimiert für natürliche Sprachinteraktion",
      "Klarheit: Spezifische Kommunikationsregeln definiert",
      "Effizienz: Kurze, verständliche Sätze für bessere Voice AI Performance"
    ],
    voice_tips: [
      "Verwenden Sie kurze Pausen zwischen wichtigen Informationen",
      "Strukturieren Sie Antworten mit 'Erstens', 'Zweitens' für bessere Verständlichkeit",
      "Wiederholen Sie wichtige Details zur Bestätigung",
      "Nutzen Sie eine ruhige, gleichmäßige Sprechgeschwindigkeit"
    ],
    personality_suggestions: {
      tone: "freundlich-professionell",
      style: "Hilfsbereit und lösungsorientiert, mit empathischer Kommunikation",
      examples: [
        "Gerne helfe ich Ihnen dabei weiter.",
        "Lassen Sie mich das für Sie überprüfen.",
        "Das ist eine sehr gute Frage. Dazu kann ich Ihnen folgendes sagen:",
        "Vielen Dank für Ihre Geduld. Ich habe die Information für Sie gefunden."
      ]
    },
    optimizedAt: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt ist erforderlich' },
        { status: 400 }
      )
    }

    // Check if we should use demo mode or real API
    const useDemo = !process.env.ANTHROPIC_API_KEY || process.env.NODE_ENV === 'development'
    
    if (useDemo) {
      // Return mock optimization for demo/development
      return NextResponse.json(getMockOptimization(prompt, context))
    }

    let fullPrompt = PROMPT_OPTIMIZATION_PROMPT + prompt

    if (context) {
      fullPrompt += `\n\nKontext/Anwendungsbereich: ${context}`
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 3000,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unerwarteter Antworttyp von Claude')
    }

    // Parse JSON response from Claude
    let optimizationData
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        optimizationData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Kein gültiges JSON in Claude Antwort gefunden')
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return NextResponse.json(
        { error: 'Fehler beim Parsen der Claude Antwort' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      original_prompt: prompt,
      optimized_prompt: optimizationData.optimized_prompt,
      improvements: optimizationData.improvements || [],
      voice_tips: optimizationData.voice_tips || [],
      personality_suggestions: optimizationData.personality_suggestions || {},
      optimizedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Claude API Error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Prompt-Optimierung' },
      { status: 500 }
    )
  }
}