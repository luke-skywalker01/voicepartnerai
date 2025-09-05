// Vapi-Style Assistant Templates
const VAPI_ASSISTANT_TEMPLATES = {
  blank: {
    id: 'blank',
    name: 'Blank Template',
    description: 'Start from scratch with a completely customizable assistant',
    category: 'general',
    icon: 'fas fa-plus-circle',
    data: {
      name: '',
      description: '',
      systemPrompt: 'You are a helpful AI assistant. Be concise, friendly, and professional.',
      firstMessage: 'Hello! How can I help you today?',
      voice: {
        provider: 'openai',
        voiceId: 'nova',
        language: 'de-DE',
        speed: 1.0
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000
      },
      transcriber: {
        provider: 'deepgram',
        language: 'de-DE',
        smartFormat: true
      }
    }
  },
  
  customer_support: {
    id: 'customer_support',
    name: 'Customer Support Specialist',
    description: 'Balanced empathy and technical expertise for customer service',
    category: 'support',
    icon: 'fas fa-headset',
    data: {
      name: 'Kundenservice Assistant',
      description: 'Professioneller Kundenservice-Spezialist für Support-Anfragen',
      systemPrompt: `Du bist Alex, ein Kundenservice-Spezialist für unser Unternehmen. Du hilfst Kunden dabei, Probleme mit unseren Produkten zu lösen, beantwortest Fragen zu unseren Services und sorgst für eine zufriedenstellende Support-Erfahrung.

Deine Persönlichkeit:
- Freundlich, geduldig und empathisch
- Professionell aber nicht steif
- Proaktiv bei der Problemlösung
- Klar und verständlich in der Kommunikation

Wichtige Richtlinien:
1. Höre aktiv zu und stelle klärende Fragen
2. Erkläre technische Lösungen in einfachen Worten
3. Entschuldige dich für Unannehmlichkeiten ohne Schuldzuweisungen
4. Leite bei komplexen Problemen an Spezialisten weiter
5. Frage immer nach, ob der Kunde weitere Hilfe benötigt`,
      firstMessage: 'Hallo! Hier ist Alex vom Kundenservice. Wie kann ich Ihnen heute helfen?',
      voice: {
        provider: 'elevenlabs',
        voiceId: 'german_professional',
        language: 'de-DE',
        speed: 0.9
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.4,
        maxTokens: 3000
      },
      transcriber: {
        provider: 'deepgram',
        language: 'de-DE',
        smartFormat: true,
        keywords: ['Problem', 'Fehler', 'Hilfe', 'Support', 'Reklamation']
      },
      silenceTimeoutSeconds: 45,
      maxDurationSeconds: 1200
    }
  },
  
  appointment_setter: {
    id: 'appointment_setter',
    name: 'Appointment Setter',
    description: 'Efficient appointment booking for dental practices and service businesses',
    category: 'sales',
    icon: 'fas fa-calendar-check',
    data: {
      name: 'Terminbuchungs-Assistant',
      description: 'Spezialisiert auf effiziente Terminvereinbarungen',
      systemPrompt: `Du bist ein professioneller Terminkoordinator für unser Unternehmen. Deine Hauptaufgabe ist es, Termine zu vereinbaren, zu verschieben und zu verwalten.

Deine Fähigkeiten:
- Verfügbarkeiten prüfen und Termine vorschlagen
- Kundendaten erfassen (Name, Kontakt, Terminwunsch)
- Terminbestätigungen und Erinnerungen senden
- Flexibel bei Terminänderungen

Terminbuchungs-Prozess:
1. Begrüßung und Grund des Termins erfragen
2. Verfügbare Zeiten anbieten (werktags 9-17 Uhr)
3. Kundendaten erfassen (Name, Telefon, E-Mail)
4. Termin bestätigen und Details wiederholen
5. Erinnerung ankündigen

Wichtig:
- Sei freundlich aber effizient
- Stelle max. 3 Terminoptionen vor
- Erfasse alle notwendigen Kontaktdaten
- Bestätige alle Termine deutlich`,
      firstMessage: 'Guten Tag! Ich helfe Ihnen gerne bei der Terminvereinbarung. Für welchen Service möchten Sie einen Termin buchen?',
      voice: {
        provider: 'google',
        voiceId: 'de-DE-Neural2-B',
        language: 'de-DE',
        speed: 1.0
      },
      model: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        maxTokens: 2000
      },
      transcriber: {
        provider: 'google',
        language: 'de-DE',
        keywords: ['Termin', 'buchung', 'Datum', 'Uhrzeit', 'verfügbar']
      },
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600
    }
  },
  
  inbound_qa: {
    id: 'inbound_qa',
    name: 'Inbound Q&A Assistant',
    description: 'Information specialist for product inquiries and general questions',
    category: 'general',
    icon: 'fas fa-question-circle',
    data: {
      name: 'Informations-Assistant',
      description: 'Beantwortet Fragen zu Produkten und Services',
      systemPrompt: `Du bist ein Informationsexperte für unser Unternehmen. Du beantwortest Fragen zu unseren Produkten, Services, Preisen und allgemeinen Unternehmensinformationen.

Dein Wissen umfasst:
- Produktspezifikationen und Features
- Preise und Verfügbarkeit  
- Öffnungszeiten und Standorte
- Kontaktinformationen
- Häufig gestellte Fragen (FAQ)

Kommunikationsstil:
- Informativ und präzise
- Geduldig bei wiederholten Fragen
- Strukturiert in der Antwort
- Bei Unsicherheit: an Kollegen weiterleiten

Vorgehen:
1. Frage verstehen und kategorisieren
2. Relevante Informationen bereitstellen
3. Nachfragen bei Unklarheiten
4. Zusätzliche Hilfe anbieten
5. Zufriedenheit des Kunden sicherstellen`,
      firstMessage: 'Willkommen! Ich beantworte gerne Ihre Fragen zu unseren Produkten und Services. Womit kann ich Ihnen helfen?',
      voice: {
        provider: 'azure',
        voiceId: 'de-DE-KatjaNeural',
        language: 'de-DE',
        speed: 1.0
      },
      model: {
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        temperature: 0.5,
        maxTokens: 3500
      },
      transcriber: {
        provider: 'assembly',
        language: 'de-DE',
        smartFormat: true
      },
      silenceTimeoutSeconds: 35,
      maxDurationSeconds: 900
    }
  }
};

// Template Categories
const TEMPLATE_CATEGORIES = {
  general: {
    name: 'Allgemein',
    icon: 'fas fa-star',
    color: '#3b82f6'
  },
  support: {
    name: 'Kundenservice',
    icon: 'fas fa-headset',
    color: '#10b981'
  },
  sales: {
    name: 'Vertrieb',
    icon: 'fas fa-chart-line',
    color: '#f59e0b'
  },
  healthcare: {
    name: 'Gesundheitswesen',
    icon: 'fas fa-medical',
    color: '#ef4444'
  }
};

// Voice Provider Options
const VOICE_PROVIDERS = {
  elevenlabs: {
    name: 'ElevenLabs',
    voices: {
      'german_voice': 'Deutscher Sprecher (männlich)',
      'german_female': 'Deutsche Sprecherin (weiblich)',
      'professional_male': 'Professionell (männlich)',
      'professional_female': 'Professionell (weiblich)'
    }
  },
  openai: {
    name: 'OpenAI',
    voices: {
      'nova': 'Nova (weiblich, englisch)',
      'alloy': 'Alloy (neutral)',
      'echo': 'Echo (männlich)',
      'fable': 'Fable (britisch, männlich)',
      'onyx': 'Onyx (männlich)',
      'shimmer': 'Shimmer (weiblich)'
    }
  },
  google: {
    name: 'Google Cloud',
    voices: {
      'de-DE-Neural2-A': 'Neural2-A (weiblich)',
      'de-DE-Neural2-B': 'Neural2-B (männlich)',
      'de-DE-Neural2-C': 'Neural2-C (weiblich)',
      'de-DE-Neural2-D': 'Neural2-D (männlich)'
    }
  },
  azure: {
    name: 'Azure Cognitive Services',
    voices: {
      'de-DE-KatjaNeural': 'Katja Neural (weiblich)',
      'de-DE-ConradNeural': 'Conrad Neural (männlich)',
      'de-DE-AmalaNeural': 'Amala Neural (weiblich)',
      'de-DE-BerndNeural': 'Bernd Neural (männlich)'
    }
  }
};

// Model Provider Options
const MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: {
      'gpt-4o': 'GPT-4o (Neuestes Modell)',
      'gpt-4o-mini': 'GPT-4o Mini (Schneller)',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo (Kostengünstig)'
    }
  },
  anthropic: {
    name: 'Anthropic',
    models: {
      'claude-3.5-sonnet': 'Claude 3.5 Sonnet (Empfohlen)',
      'claude-3-haiku': 'Claude 3 Haiku (Schnell)',
      'claude-3-opus': 'Claude 3 Opus (Leistungsstark)'
    }
  },
  google: {
    name: 'Google',
    models: {
      'gemini-pro': 'Gemini Pro',
      'gemini-pro-vision': 'Gemini Pro Vision'
    }
  }
};

// Transcriber Provider Options
const TRANSCRIBER_PROVIDERS = {
  deepgram: {
    name: 'Deepgram',
    languages: ['de-DE', 'en-US', 'en-GB', 'fr-FR', 'es-ES']
  },
  google: {
    name: 'Google Cloud Speech',
    languages: ['de-DE', 'en-US', 'en-GB', 'fr-FR', 'es-ES']
  },
  openai: {
    name: 'OpenAI Whisper',
    languages: ['de-DE', 'en-US', 'en-GB', 'fr-FR', 'es-ES']
  },
  azure: {
    name: 'Azure Speech Services',
    languages: ['de-DE', 'en-US', 'en-GB', 'fr-FR', 'es-ES']
  },
  assembly: {
    name: 'AssemblyAI',
    languages: ['de-DE', 'en-US', 'en-GB', 'fr-FR', 'es-ES']
  }
};

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VAPI_ASSISTANT_TEMPLATES,
    TEMPLATE_CATEGORIES,
    VOICE_PROVIDERS,
    MODEL_PROVIDERS,
    TRANSCRIBER_PROVIDERS
  };
}