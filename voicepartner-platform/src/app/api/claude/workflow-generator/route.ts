import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const WORKFLOW_GENERATION_PROMPT = `
Du bist ein Experte für Voice AI Workflow-Design. Basierend auf der Benutzeranfrage, erstelle einen detaillierten Workflow für einen Voice AI Assistenten.

Wichtige Aspekte:
- Natürlicher Gesprächsfluss
- Fehlerbehandlung und Fallbacks
- Klare Benutzerführung
- Effiziente Datensammlung
- Professionelle Kommunikation

Antworte im folgenden JSON-Format:

{
  "workflow": {
    "name": "Workflow Name",
    "description": "Kurze Beschreibung",
    "nodes": [
      {
        "id": "start",
        "type": "welcome",
        "title": "Begrüßung",
        "content": "Begrüßungstext",
        "nextNode": "main_menu"
      },
      {
        "id": "main_menu",
        "type": "menu",
        "title": "Hauptmenü",
        "content": "Optionen präsentieren",
        "options": [
          {
            "text": "Option 1",
            "action": "goto_node_1"
          }
        ],
        "fallback": "Fallback-Text bei Nichtverstehen"
      }
    ],
    "variables": [
      {
        "name": "customer_name",
        "type": "string",
        "description": "Name des Kunden"
      }
    ]
  },
  "tips": [
    "Tipp 1 für bessere Nutzung",
    "Tipp 2 für Optimierung"
  ]
}

Benutzeranfrage: `

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt ist erforderlich' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API Schlüssel nicht konfiguriert' },
        { status: 500 }
      )
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: WORKFLOW_GENERATION_PROMPT + prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unerwarteter Antworttyp von Claude')
    }

    // Parse JSON response from Claude
    let workflowData
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        workflowData = JSON.parse(jsonMatch[0])
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
      workflow: workflowData.workflow,
      tips: workflowData.tips || [],
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Claude API Error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Workflow-Generierung' },
      { status: 500 }
    )
  }
}