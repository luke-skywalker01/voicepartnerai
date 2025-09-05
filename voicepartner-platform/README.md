# VoicePartnerAI Platform

Eine vollständige Voice AI Plattform für den deutschen Markt - die deutsche Alternative zu Vapi/Foino.

## 🎯 Features

### ✅ Bereits implementiert:
- **Moderne Next.js 14 Web-App** mit TypeScript und Tailwind CSS
- **Anthropic-inspiriertes Design** mit warmem, professionellem Styling
- **Vollständiges Dashboard** für Voice AI Bot Management
- **Benutzerauthentifizierung** mit JWT und bcrypt
- **n8n Integration** für Workflow-Automatisierung
- **Pipecat Integration** für Voice AI Funktionalität
- **Real-time Voice Testing Interface**
- **Bot-Verwaltung** mit Status-Tracking und Metriken
- **REST API Endpunkte** für alle Core-Funktionen

### 🚧 In Entwicklung:
- Pricing & Billing System mit Stripe
- Real-time Analytics Dashboard
- Advanced Bot Configuration
- Team Management Features

## 🏗️ Architektur

### Frontend (Next.js 14)
```
src/
├── app/                    # App Router Pages
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard Pages
│   ├── login/             # Authentication
│   └── voice-test/        # Voice Testing Interface
├── components/            # React Components
│   ├── dashboard/         # Dashboard Components
│   ├── landing/          # Landing Page Components
│   └── ui/               # Reusable UI Components
└── lib/                  # Utilities & Integrations
    ├── auth/             # Authentication Logic
    ├── n8n/              # n8n Workflow Manager
    └── voice/            # Pipecat Voice Client
```

### Backend Integrations
- **n8n**: Workflow-Automatisierung für komplexe Bot-Logik
- **Pipecat**: Voice AI Pipeline mit STT, LLM, und TTS
- **Daily.co**: WebRTC für Audio/Video Übertragung

## 🚀 Quick Start

### Voraussetzungen
- Node.js 18+
- npm oder yarn
- n8n Instance (lokal oder gehostet)
- API Keys für Voice Services

### Installation

1. **Repository klonen:**
```bash
git clone <repository-url>
cd voicepartner-platform
```

2. **Dependencies installieren:**
```bash
npm install
```

3. **Environment Variables konfigurieren:**
```bash
cp .env.example .env.local
```

Fügen Sie Ihre API Keys hinzu:
```env
# Authentication
JWT_SECRET=your-jwt-secret-key

# Voice AI Services
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_DEEPGRAM_API_KEY=your-deepgram-key
NEXT_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-key
NEXT_PUBLIC_DAILY_API_KEY=your-daily-key

# n8n Integration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key

# WebSocket Server
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

4. **Development Server starten:**
```bash
npm run dev
```

5. **n8n starten (separates Terminal):**
```bash
cd ../n8n/n8n
npm run dev
```

6. **Pipecat Server starten (separates Terminal):**
```bash
cd ../pipecat/pipecat
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python examples/websocket/server.py
```

## 📁 Projektstruktur

### Core Components

#### 1. **Dashboard** (`/dashboard`)
- Bot-Übersicht mit Live-Metriken
- Status-Management (Aktiv/Pausiert/Entwurf)
- Real-time Statistiken
- Team-Management

#### 2. **Voice Testing Interface** (`/voice-test`)
- Real-time Voice Chat mit Bots
- Live Transcript-Anzeige
- Audio-Steuerung (Mikro/Lautsprecher)
- Conversation History

#### 3. **n8n Workflow Manager**
- Automatische Workflow-Erstellung für neue Bots
- Integration mit Booking-Systemen
- Intent-basiertes Routing
- Database-Synchronisation

#### 4. **Pipecat Voice Client**
- WebSocket-basierte Kommunikation
- Multi-Provider STT/TTS Support
- Real-time Status Updates
- Session Management

## 🛠️ API Dokumentation

### Authentication
```typescript
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/logout
```

### Bot Management
```typescript
GET    /api/bots              # Liste aller Bots
POST   /api/bots              # Neuen Bot erstellen
GET    /api/bots/:id          # Bot Details
PUT    /api/bots/:id          # Bot aktualisieren
DELETE /api/bots/:id          # Bot löschen
POST   /api/bots/:id/toggle   # Bot aktivieren/deaktivieren
```

### Analytics
```typescript
GET /api/analytics/overview    # Dashboard Metriken
GET /api/analytics/bot/:id     # Bot-spezifische Analytics
GET /api/conversations         # Conversation History
```

## 🎨 Design System

Basierend auf Anthropics Design-Philosophie:
- **Warme Farben**: Creme/Beige Hintergründe
- **Orange Akzente**: Für Call-to-Actions
- **Klare Typografie**: Sans-serif mit guter Lesbarkeit
- **Organic Shapes**: Subtile Illustrationen
- **Responsive Design**: Mobile-first Approach

## 🔧 Konfiguration

### Bot-Einstellungen
```typescript
interface BotSettings {
  language: 'de' | 'en'
  model: 'gpt-4o' | 'gpt-3.5-turbo' | 'claude-3'
  voice: 'neural-female-de' | 'neural-male-de'
  prompt: string
  n8nWorkflowId: string
  pipecatConfig: {
    transport: 'daily' | 'webrtc' | 'websocket'
    stt: 'deepgram' | 'whisper' | 'speechmatics'
    tts: 'elevenlabs' | 'azure' | 'openai'
  }
}
```

### n8n Workflow Templates
Vorgefertigte Workflows für:
- **Terminbuchung**: Automatische Kalendersynchronisation
- **Kundenservice**: FAQ und Weiterleitung
- **Lead Qualification**: Kundendaten sammeln
- **E-Commerce**: Produktberatung und Bestellungen

## 🧪 Testing

### Voice Bot Testing
1. Öffnen Sie `/voice-test`
2. Klicken Sie auf "Verbinden"
3. Nutzen Sie die Schnell-Tests oder sprechen Sie direkt

### Demo-Zugang
```
E-Mail: demo@voicepartnerai.com
Passwort: password
```

## 🚀 Deployment

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Docker Deployment
```bash
docker build -t voicepartner-ai .
docker run -p 3000:3000 voicepartner-ai
```

## 🤝 Contributing

1. Fork das Repository
2. Erstellen Sie einen Feature Branch
3. Commiten Sie Ihre Änderungen
4. Pushen Sie zum Branch
5. Öffnen Sie eine Pull Request

## 📄 Lizenz

MIT License - siehe [LICENSE.md](LICENSE.md)

## 🆘 Support

- **Dokumentation**: `/docs`
- **Issues**: GitHub Issues
- **Discord**: [VoicePartnerAI Community]
- **E-Mail**: support@voicepartnerai.com

---

**VoicePartnerAI** - Die Zukunft der deutschen Sprachautomatisierung 🇩🇪🤖