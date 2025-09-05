# 🎙️ VoicePartnerAI - Production Platform

**Professional Voice AI Platform with Enterprise-Grade Architecture**

VoicePartnerAI ist eine produktionsreife Voice AI Plattform, die sich von einem einfachen Demo zu einem vollständigen, skalierbaren System mit professionellen Architekturmustern entwickelt hat.

## 🏗️ Architecture Overview

Unsere 6-Phasen-Architektur implementiert Enterprise Best Practices:

### Phase 1: Abstraction Layer (Adapter Pattern)
- **Zweck**: Entkopplung der Geschäftslogik von Third-Party Services
- **Pattern**: Adapter Pattern mit Interface Segregation
- **Komponenten**: 
  - `core/interfaces.py` - Standardisierte Interfaces
  - `adapters/` - Provider-spezifische Implementierungen
  - `core/provider_factory.py` - Factory Pattern für Provider-Instanziierung

### Phase 2: Service-Orchestration Engine
- **Zweck**: Robuste Call-Lifecycle-Verwaltung
- **Features**: Redis-basiertes Caching, Fallback-Provider, Real-time Processing
- **Komponenten**:
  - `core/call_orchestrator.py` - Zentrale Orchestrierung
  - `core/usage_tracker.py` - Granulares Usage-Tracking

### Phase 3: Unified Billing Engine  
- **Zweck**: Faire, kostenbasierte Abrechnung
- **Features**: Decimal-Präzision, Platform-Margin, Automated Credit-Deduction
- **Komponenten**:
  - `core/billing_engine.py` - Production Billing System

### Phase 4: Public API
- **Zweck**: Professional Developer-Facing API
- **Features**: OpenAPI Documentation, Authentication, Comprehensive Endpoints
- **Komponenten**:
  - `api/production_server.py` - FastAPI Production Server

### Phase 5: Security & Resilienz
- **Zweck**: Enterprise Security & High Availability
- **Features**: Circuit Breakers, Rate Limiting, Monitoring, Fallback Systems
- **Komponenten**:
  - `core/security_middleware.py` - Security Layer
  - `core/monitoring_system.py` - Comprehensive Monitoring
  - `core/fallback_system.py` - Circuit Breaker & Fallbacks

### Phase 6: Deployment & Operations
- **Zweck**: Production-Ready Infrastructure
- **Features**: Docker Compose, CI/CD, Monitoring Stack, SSL Termination
- **Komponenten**:
  - `deployment/` - Complete Infrastructure as Code

## ✨ Features

### Core Platform Features
- 🎙️ **Real-time Voice AI Calls** - Complete STT → LLM → TTS pipeline
- 🤖 **AI Assistant Management** - Custom voice assistants with configurations
- 💰 **Transparent Billing** - Real-time cost tracking and credit management
- 🔒 **Enterprise Security** - Rate limiting, input validation, API key management
- 📊 **Comprehensive Monitoring** - Health checks, metrics, alerting
- 🔄 **High Availability** - Circuit breakers, fallback providers, auto-recovery

### Production Features
- 🐳 **Docker Containerization** - Complete containerized deployment
- 🔧 **Infrastructure as Code** - Docker Compose with monitoring stack
- 📈 **Prometheus Monitoring** - Detailed metrics and alerting
- 📊 **Grafana Dashboards** - Visual performance monitoring
- 🗂️ **Centralized Logging** - ELK Stack for log aggregation
- 🚀 **Zero-Downtime Deployment** - Blue-green deployment strategy

## Installation

1. **Virtual Environment erstellen:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# oder
source venv/bin/activate  # Linux/Mac
```

2. **Dependencies installieren:**
```bash
pip install -r requirements.txt
```

3. **Anwendung starten:**
```bash
python main.py
```

Die API ist dann unter `http://localhost:8000` verfügbar.

## API Dokumentation

Automatische API-Dokumentation ist unter folgenden URLs verfügbar:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpunkte

### POST /users/
Registriert einen neuen User.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### POST /token
Login und Token-Erstellung.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### GET /users/me
Geschützter Endpunkt - zeigt Daten des eingeloggten Users.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

### POST /projects/
Geschützter Endpunkt - erstellt ein neues Projekt für den eingeloggten User.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "title": "Mein neues Projekt",
  "description": "Beschreibung des Projekts (optional)"
}
```

### GET /projects/
Geschützter Endpunkt - gibt alle Projekte des eingeloggten Users zurück.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

## Verwendung

1. **User registrieren:**
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}'
```

2. **Token erhalten:**
```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}'
```

3. **Geschützten Endpunkt aufrufen:**
```bash
curl -X GET "http://localhost:8000/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

4. **Projekt erstellen:**
```bash
curl -X POST "http://localhost:8000/projects/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title": "Mein Projekt", "description": "Projekt Beschreibung"}'
```

5. **Projekte abrufen:**
```bash
curl -X GET "http://localhost:8000/projects/" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Sicherheitshinweise für Produktion

- ⚠️ Ändern Sie den `SECRET_KEY` in `main.py`
- ⚠️ Verwenden Sie eine robuste Datenbank (PostgreSQL, MySQL)
- ⚠️ Implementieren Sie HTTPS
- ⚠️ Setzen Sie angemessene Token-Expire-Zeiten
- ⚠️ Implementieren Sie Rate Limiting
- ⚠️ Verwenden Sie Umgebungsvariablen für Konfiguration

## Docker Deployment

### Container bauen und starten:
```bash
# Image bauen
docker build -t fastapi-auth .

# Container starten
docker run -p 8000:8000 fastapi-auth
```

### Mit Docker Compose:
```bash
# Mit docker-compose starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Container stoppen
docker-compose down
```

Die API ist dann unter `http://localhost:8000` verfügbar.

## Dateistruktur

```
fastapi-auth/
├── main.py              # Hauptanwendung mit API-Endpunkten
├── database.py          # Datenbank-Konfiguration
├── models.py            # SQLAlchemy-Modelle
├── schemas.py           # Pydantic-Schemata
├── requirements.txt     # Python-Dependencies
├── Dockerfile           # Docker-Container-Definition
├── .dockerignore        # Docker-Build-Ausschlüsse
├── docker-compose.yml   # Docker Compose Konfiguration
├── README.md            # Diese Datei
└── auth_app.db          # SQLite-Datenbank (wird automatisch erstellt)
```