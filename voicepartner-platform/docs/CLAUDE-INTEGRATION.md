# Claude SDK Integration - VoicePartnerAI

Diese Dokumentation beschreibt die vollständige Integration des Anthropic Claude SDK in die VoicePartnerAI Plattform für automatische Workflow-Generierung und Prompt-Optimierung.

## Überblick

Die Claude SDK Integration bietet zwei Hauptfunktionen:

1. **AI Workflow Generator**: Automatische Erstellung von Voice AI Workflows basierend auf natürlicher Sprache
2. **Prompt Optimizer**: Intelligente Optimierung von Voice AI Prompts für bessere Performance

## Setup und Konfiguration

### 1. API Schlüssel

Fügen Sie Ihren Anthropic API Schlüssel zur `.env.local` Datei hinzu:

```bash
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

### 2. NPM Packages

Die benötigten Packages sind bereits installiert:

```bash
npm install @anthropic-ai/sdk
```

## API Endpunkte

### Workflow Generator API

**Endpunkt**: `/api/claude/workflow-generator`
**Methode**: POST

**Request Body**:
```json
{
  "prompt": "Beschreibung des gewünschten Workflows in natürlicher Sprache"
}
```

**Response**:
```json
{
  "success": true,
  "workflow": {
    "name": "Workflow Name",
    "description": "Beschreibung",
    "nodes": [...],
    "variables": [...]
  },
  "tips": ["Tipp 1", "Tipp 2"],
  "generatedAt": "2024-12-19T10:30:00Z"
}
```

### Prompt Optimizer API

**Endpunkt**: `/api/claude/prompt-optimizer`
**Methode**: POST

**Request Body**:
```json
{
  "prompt": "Zu optimierender Prompt",
  "context": "Optionaler Kontext/Anwendungsbereich"
}
```

**Response**:
```json
{
  "success": true,
  "original_prompt": "Original Prompt",
  "optimized_prompt": "Optimierter Prompt",
  "improvements": ["Verbesserung 1", "Verbesserung 2"],
  "voice_tips": ["Voice AI Tipp 1", "Voice AI Tipp 2"],
  "personality_suggestions": {
    "tone": "freundlich",
    "style": "Kommunikationsstil",
    "examples": ["Beispiel 1", "Beispiel 2"]
  },
  "optimizedAt": "2024-12-19T10:30:00Z"
}
```

## React Components

### AIWorkflowGenerator

Hauptkomponente für die Workflow-Generierung mit benutzerfreundlicher UI.

**Verwendung**:
```tsx
import AIWorkflowGenerator from '@/components/workflow/AIWorkflowGenerator'

function MyPage() {
  const handleWorkflowGenerated = (workflow) => {
    console.log('Generierter Workflow:', workflow)
  }

  return (
    <AIWorkflowGenerator 
      onWorkflowGenerated={handleWorkflowGenerated}
    />
  )
}
```

**Props**:
- `onWorkflowGenerated?: (workflow: any) => void` - Callback wenn Workflow generiert wurde
- `className?: string` - CSS Klassen

### PromptOptimizer

Komponente für intelligente Prompt-Optimierung.

**Verwendung**:
```tsx
import PromptOptimizer from '@/components/agents/PromptOptimizer'

function MyPage() {
  const handleOptimizedPrompt = (optimizedPrompt) => {
    console.log('Optimierter Prompt:', optimizedPrompt)
  }

  return (
    <PromptOptimizer 
      initialPrompt="Anfangsprompt"
      context="Kontext der Anwendung"
      onOptimizedPrompt={handleOptimizedPrompt}
    />
  )
}
```

**Props**:
- `initialPrompt?: string` - Anfänglicher Prompt
- `context?: string` - Kontext/Anwendungsbereich
- `onOptimizedPrompt?: (optimizedPrompt: string) => void` - Callback für optimierten Prompt
- `className?: string` - CSS Klassen

## Hook für API Aufrufe

### useClaude

Custom Hook für einfache Claude API Aufrufe.

**Verwendung**:
```tsx
import { useClaude } from '@/hooks/useClaude'

function MyComponent() {
  const { generateWorkflow, optimizePrompt, isGeneratingWorkflow, isOptimizingPrompt } = useClaude()

  const handleGenerate = async () => {
    const result = await generateWorkflow("Mein Workflow Beschreibung")
    if (result.success) {
      console.log('Workflow:', result.workflow)
    }
  }

  const handleOptimize = async () => {
    const result = await optimizePrompt("Mein Prompt", "Kontext")
    if (result.success) {
      console.log('Optimiert:', result.optimized_prompt)
    }
  }

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGeneratingWorkflow}>
        {isGeneratingWorkflow ? 'Generiere...' : 'Workflow generieren'}
      </button>
      <button onClick={handleOptimize} disabled={isOptimizingPrompt}>
        {isOptimizingPrompt ? 'Optimiere...' : 'Prompt optimieren'}
      </button>
    </div>
  )
}
```

## Integration in bestehende Seiten

### Assistant Creation (KI-gestützt)

Die Seite `/dashboard/assistants/new-ai` kombiniert beide Claude Features:

1. **Prompt-Optimierung**: Optimiert den Basis-Prompt des Assistants
2. **Workflow-Generierung**: Erstellt automatisch einen passenden Workflow
3. **Integration**: Speichert beide Ergebnisse in einem neuen Assistant

### Workflow Generator Tool

Die dedizierte Seite `/dashboard/tools/workflow-generator` bietet:

- Standalone Workflow-Generierung
- Export-Funktionen (JSON)
- Historie der generierten Workflows
- Tipps und Best Practices

## Prompt Engineering für Claude

### Workflow Generation Prompt

Das System verwendet einen speziell entwickelten Prompt für optimale Workflow-Generierung:

```
Du bist ein Experte für Voice AI Workflow-Design. Basierend auf der Benutzeranfrage, erstelle einen detaillierten Workflow für einen Voice AI Assistenten.

Wichtige Aspekte:
- Natürlicher Gesprächsfluss
- Fehlerbehandlung und Fallbacks
- Klare Benutzerführung
- Effiziente Datensammlung
- Professionelle Kommunikation
```

### Prompt Optimization Prompt

Für die Prompt-Optimierung wird folgender Ansatz verwendet:

```
Du bist ein Experte für Voice AI Prompt Engineering. Optimiere den gegebenen Prompt für maximale Effektivität in Voice AI Anwendungen.

Fokus auf:
- Klare, natürliche Sprache
- Spezifische Anweisungen
- Konsistente Persönlichkeit
- Fehlerbehandlung
- Benutzerfreundlichkeit
```

## Fehlerbehandlung

### API Fehler

Alle API Endpunkte implementieren umfassende Fehlerbehandlung:

```json
{
  "success": false,
  "error": "Beschreibung des Fehlers"
}
```

### Frontend Fehlerbehandlung

Die React Komponenten zeigen benutzerfreundliche Fehlermeldungen und Loading-States.

### Typische Fehler

1. **API Key fehlt**: `Claude API Schlüssel nicht konfiguriert`
2. **Leerer Prompt**: `Prompt ist erforderlich`
3. **JSON Parse Fehler**: `Fehler beim Parsen der Claude Antwort`
4. **Rate Limiting**: Claude API Rate Limits beachten

## Best Practices

### 1. Prompt Qualität

- **Spezifisch sein**: Je detaillierter die Beschreibung, desto besser das Ergebnis
- **Kontext geben**: Branche, Zielgruppe und Anwendungsfall erwähnen
- **Beispiele verwenden**: Konkrete Szenarien beschreiben

### 2. Performance

- **Caching**: Häufig verwendete Prompts können gecacht werden
- **Batch Processing**: Mehrere Optimierungen zusammenfassen
- **Timeout Handling**: Lange Claude API Aufrufe abbrechen

### 3. Benutzerexperience

- **Loading States**: Benutzer über Verarbeitungsstand informieren
- **Progress Indication**: Bei mehrstufigen Prozessen
- **Error Recovery**: Möglichkeit zum Wiederholen bei Fehlern

## Erweiterungsmöglichkeiten

### 1. Template System

Implementierung von vorgefertigten Workflow-Templates:

```tsx
const templates = [
  {
    name: "E-Commerce Support",
    prompt: "...",
    category: "customer-service"
  }
]
```

### 2. Workflow Validation

Automatische Validierung generierter Workflows:

```tsx
const validateWorkflow = (workflow) => {
  // Überprüfe auf vollständige Node-Struktur
  // Validiere Datentypen
  // Prüfe auf logische Konsistenz
}
```

### 3. A/B Testing

Vergleich verschiedener Prompt-Optimierungen:

```tsx
const compareOptimizations = (original, optimizedA, optimizedB) => {
  // Performance-Metriken vergleichen
}
```

## Monitoring und Analytics

### 1. Usage Tracking

Verfolgung der Claude API Nutzung:

```tsx
const trackClaudeUsage = (endpoint, tokens, success) => {
  // Analytics Event senden
}
```

### 2. Quality Metrics

Bewertung der generierten Inhalte:

- Workflow-Komplexität
- Prompt-Verbesserungsrate
- Benutzer-Feedback

### 3. Cost Monitoring

Überwachung der API Kosten:

```tsx
const calculateCosts = (inputTokens, outputTokens) => {
  // Claude Pricing berechnen
}
```

## Sicherheit und Compliance

### 1. API Key Schutz

- Environment Variables verwenden
- Keine Client-seitige Exposition
- Regelmäßige Rotation

### 2. Datenverarbeitung

- Keine Speicherung von Prompts ohne Zustimmung
- DSGVO-konforme Verarbeitung
- Transparente Datennutzung

### 3. Content Filtering

- Überprüfung generierter Inhalte
- Verhinderung schädlicher Outputs
- Qualitätssicherung

## Deployment Notes

### Environment Variables

Produktionsumgebung benötigt:

```bash
ANTHROPIC_API_KEY=sk-ant-production-key
NODE_ENV=production
```

### Rate Limits

Claude API Rate Limits beachten:

- Requests per minute
- Token limits
- Concurrent requests

### Monitoring Setup

Überwachung in Produktion:

- API Response Times
- Error Rates
- Token Usage
- User Satisfaction

---

## Support und Troubleshooting

Bei Problemen mit der Claude Integration:

1. **API Key prüfen**: Ist der Schlüssel korrekt gesetzt?
2. **Rate Limits**: Werden die Limits eingehalten?
3. **Network Issues**: Ist die Verbindung zu Anthropic verfügbar?
4. **Prompt Quality**: Ist der Input für Claude verständlich?

Für weitere Unterstützung siehe die [Anthropic Dokumentation](https://docs.anthropic.com/) oder öffnen Sie ein Issue im Repository.