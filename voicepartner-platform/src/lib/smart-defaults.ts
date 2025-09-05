// Smart Defaults System - Intelligente Voreinstellungen basierend auf Nutzerpräferenzen

export interface SmartDefaults {
  voice: {
    provider: string
    voiceId: string
    language: string
  }
  model: {
    provider: string
    model: string
    temperature: number
  }
  conversation: {
    maxDuration: number
    timeout: number
    language: string
  }
  integrations: string[]
}

// Deutsche Markt-optimierte Defaults
export const GERMAN_DEFAULTS: SmartDefaults = {
  voice: {
    provider: 'ElevenLabs',
    voiceId: 'Rachel', // Professionelle deutsche Stimme
    language: 'de-DE'
  },
  model: {
    provider: 'OpenAI',
    model: 'gpt-4o',
    temperature: 0.7 // Optimal für deutsche Höflichkeit
  },
  conversation: {
    maxDuration: 600, // 10 Minuten
    timeout: 30, // 30 Sekunden Stille
    language: 'de-DE'
  },
  integrations: [] // Keine Integrationen standardmäßig
}

// Branche-spezifische Defaults
export const INDUSTRY_DEFAULTS: Record<string, Partial<SmartDefaults>> = {
  'healthcare': {
    voice: {
      provider: 'ElevenLabs',
      voiceId: 'Sarah', // Ruhige, vertrauensvolle Stimme
      language: 'de-DE'
    },
    model: {
      provider: 'OpenAI',
      model: 'gpt-4o',
      temperature: 0.5 // Konservativer für medizinische Genauigkeit
    },
    conversation: {
      maxDuration: 900, // 15 Minuten für Termine
      timeout: 45,
      language: 'de-DE'
    },
    integrations: ['calendar', 'patient-management', 'email']
  },
  'ecommerce': {
    voice: {
      provider: 'ElevenLabs',
      voiceId: 'Emma', // Jüngere, energischere Stimme
      language: 'de-DE'
    },
    model: {
      provider: 'OpenAI',
      model: 'gpt-4o',
      temperature: 0.8 // Etwas kreativer für Verkaufsgespräche
    },
    conversation: {
      maxDuration: 300, // 5 Minuten für schnelle Anfragen
      timeout: 30,
      language: 'de-DE'
    },
    integrations: ['shopify', 'woocommerce', 'stripe']
  },
  'finance': {
    voice: {
      provider: 'ElevenLabs',
      voiceId: 'Daniel', // Männliche, vertrauensvolle Stimme
      language: 'de-DE'
    },
    model: {
      provider: 'OpenAI',
      model: 'gpt-4o',
      temperature: 0.3 // Sehr konservativ für Finanzberatung
    },
    conversation: {
      maxDuration: 1200, // 20 Minuten für komplexe Beratung
      timeout: 60,
      language: 'de-DE'
    },
    integrations: ['banking-api', 'payment-gateway']
  }
}

// Use Case spezifische Templates
export const USE_CASE_TEMPLATES = {
  'customer-service': {
    systemPrompt: `Du bist ein professioneller Kundenservice-Mitarbeiter für ein deutsches Unternehmen.

VERHALTEN:
- Sei höflich, geduldig und lösungsorientiert
- Verwende die Sie-Form (formal)
- Höre aktiv zu und frage nach Details
- Biete konkrete Lösungen an
- Leite bei komplexen Problemen an Menschen weiter

STIL:
- Professionell aber freundlich
- Klar und verständlich
- Empathisch bei Problemen
- Proaktiv in Lösungsvorschlägen`,
    
    firstMessage: 'Guten Tag! Ich bin Ihr digitaler Kundenservice-Assistent. Wie kann ich Ihnen heute helfen?',
    endMessage: 'Vielen Dank für Ihre Anfrage. Haben Sie noch weitere Fragen? Ansonsten wünsche ich Ihnen einen schönen Tag!',
    industry: 'general'
  },
  
  'appointment-booking': {
    systemPrompt: `Du bist ein Terminbuchungs-Assistent für eine deutsche Praxis/Dienstleistung.

AUFGABEN:
- Verfügbare Termine prüfen und vorschlagen
- Kundendaten aufnehmen (Name, Kontakt, Grund)
- Termine bestätigen und Erinnerungen senden
- Stornierungen und Umbuchungen bearbeiten

VERHALTEN:
- Effizient aber freundlich
- Frage nach allen nötigen Details
- Bestätige alle Termine zweifach
- Informiere über Stornierungsrichtlinien`,
    
    firstMessage: 'Hallo! Ich helfe Ihnen gerne bei der Terminbuchung. Für welchen Service möchten Sie einen Termin vereinbaren?',
    endMessage: 'Ihr Termin ist bestätigt. Sie erhalten eine Bestätigungs-E-Mail und eine Erinnerung 24 Stunden vorher.',
    industry: 'healthcare'
  },
  
  'sales-assistant': {
    systemPrompt: `Du bist ein Verkaufsberater für deutsche Kunden.

VERKAUFSSTRATEGIE:
- Verstehe Kundenbedürfnisse durch gezielte Fragen
- Empfehle passende Produkte/Services
- Erkläre Vorteile und Wert deutlich
- Gehe auf Einwände ein
- Leite zu Kaufabschluss über

STIL:
- Beratend, nicht aufdringlich
- Zeige echtes Interesse am Kunden
- Verwende soziale Beweise
- Schaffe Vertrauen durch Expertise`,
    
    firstMessage: 'Hallo! Schön, dass Sie sich für unsere Produkte interessieren. Erzählen Sie mir gerne, wonach Sie suchen, dann kann ich Sie optimal beraten.',
    endMessage: 'Vielen Dank für das Gespräch! Haben Sie noch Fragen oder möchten Sie direkt bestellen?',
    industry: 'ecommerce'
  }
}

// Intelligente Default-Auswahl basierend auf Input
export function getSmartDefaults(userInput: string, industry?: string): SmartDefaults {
  let defaults = { ...GERMAN_DEFAULTS }
  
  // Industry-spezifische Anpassungen
  if (industry && INDUSTRY_DEFAULTS[industry]) {
    defaults = mergeDefaults(defaults, INDUSTRY_DEFAULTS[industry])
  }
  
  // Keyword-basierte Anpassungen
  const input = userInput.toLowerCase()
  
  if (input.includes('medizin') || input.includes('arzt') || input.includes('praxis')) {
    defaults = mergeDefaults(defaults, INDUSTRY_DEFAULTS.healthcare)
  } else if (input.includes('shop') || input.includes('verkauf') || input.includes('produkt')) {
    defaults = mergeDefaults(defaults, INDUSTRY_DEFAULTS.ecommerce)
  } else if (input.includes('bank') || input.includes('finanz') || input.includes('kredit')) {
    defaults = mergeDefaults(defaults, INDUSTRY_DEFAULTS.finance)
  }
  
  // Komplexität-basierte Anpassungen
  if (input.length > 200 || input.includes('komplex') || input.includes('beratung')) {
    defaults.conversation.maxDuration = 1200 // Längere Gespräche
    defaults.model.temperature = 0.6 // Etwas konservativer
  }
  
  return defaults
}

// Helper function to merge defaults
function mergeDefaults(base: SmartDefaults, override: Partial<SmartDefaults>): SmartDefaults {
  return {
    voice: { ...base.voice, ...override.voice },
    model: { ...base.model, ...override.model },
    conversation: { ...base.conversation, ...override.conversation },
    integrations: override.integrations || base.integrations
  }
}

// Prompt-Optimierung basierend auf deutschen Gepflogenheiten
export function optimizePromptForGerman(basePrompt: string, useCase: string): string {
  const germanOptimizations = [
    '\nWICHTIG: Verwende immer die Sie-Form (formal) es sei denn explizit anders gewünscht.',
    '\nSei direkt aber höflich - deutsche Kunden schätzen Effizienz.',
    '\nGib konkrete, praktische Antworten statt vager Aussagen.',
    '\nRespektiere Datenschutz (DSGVO) und frage nur nach nötigen Informationen.',
    '\nBei Unsicherheit, leite an menschliche Kollegen weiter.'
  ]
  
  return basePrompt + '\n' + germanOptimizations.join('\n')
}