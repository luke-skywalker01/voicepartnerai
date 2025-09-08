# VoicePartnerAI Platform

Enterprise Voice AI Platform for the German Market - Professional VAPI alternative.

## 🏗️ Project Structure (Senior Developer Ready)

```
voicepartnerai/
├── frontend/                 # Frontend Application
│   ├── pages/               # Main HTML pages
│   │   └── index.html       # Dashboard (MAIN ENTRY POINT)
│   ├── components/          # JavaScript modules
│   │   └── dashboard.js     # Dashboard logic (TypeScript-like)
│   ├── assets/              # Images, icons
│   └── styles/              # CSS stylesheets
├── backend/                 # Backend Services
│   └── api/                # FastAPI endpoints
│       ├── main.py         # Main API server
│       ├── auth.py         # Authentication
│       ├── database.py     # Database layer
│       └── requirements.txt # Python dependencies
├── docs/                   # Documentation
│   └── README.md           # Detailed project docs
├── scripts/                # Development tools
│   └── dev-server.py       # Development server
├── tests/                  # Test files
├── package.json           # Frontend dependencies
└── tsconfig.json          # TypeScript configuration
```

## 🚀 Quick Start (5 minutes setup)

### 1. Frontend Development Server
```bash
# Start development server
python scripts/dev-server.py

# Visit: http://localhost:8080/pages/
```

### 2. Backend API (Optional)
```bash
cd backend/api
pip install -r requirements.txt
python main.py
```

## 📊 Features (Production Ready)

- ✅ **Phone Numbers**: German/Austrian/Swiss numbers
- ✅ **Call Logs**: Complete call history & analytics
- ✅ **Web Calls**: Browser voice widgets
- ✅ **Analytics**: KPIs and performance metrics
- ✅ **Billing**: Enterprise subscription management
- ✅ **API Keys**: Secure key management
- ✅ **Settings**: Account configuration

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS + TypeScript JSDoc (no framework dependencies)
- **Backend**: FastAPI + SQLite (Python)
- **Styling**: Custom CSS (VAPI-inspired)
- **Icons**: Font Awesome 6.4.0

## 👨‍💻 For Senior Developers

### Key Files
- **Main App**: `frontend/pages/index.html`
- **Dashboard Logic**: `frontend/components/dashboard.js`
- **API Server**: `backend/api/main.py`

### Development Workflow
1. Frontend: Edit `frontend/` files
2. Backend: Edit `backend/api/` files
3. Test: Run `python scripts/dev-server.py`

### Clean Architecture
- Separation of concerns maintained
- No unnecessary dependencies
- TypeScript-like type safety with JSDoc
- Professional folder structure

## 🌐 Live Demo

**Repository**: https://github.com/luke-skywalker01/voicepartnerai
**Status**: Production ready for senior developer handoff

---

**Next Steps**: Run `python scripts/dev-server.py` and visit http://localhost:8080/pages/