# VoicePartnerAI Platform

Enterprise Voice AI Platform for the German Market - A modern alternative to Vapi with TypeScript-like JavaScript architecture.

## 🏗️ Project Structure

```
voicepartnerai/
├── frontend/                 # Frontend application
│   ├── pages/               # HTML pages
│   │   └── index.html       # Main dashboard
│   ├── components/          # JavaScript components
│   │   └── dashboard.js     # Main dashboard logic
│   ├── assets/              # Images, icons, etc.
│   └── styles/              # CSS stylesheets
├── backend/                 # Backend API services
│   ├── api/                # API endpoints
│   │   ├── main.py         # Main FastAPI application
│   │   ├── auth.py         # Authentication logic
│   │   ├── database.py     # Database connections
│   │   └── api_key_manager.py # API key management
│   ├── core/               # Core business logic
│   └── utils/              # Utility functions
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   ├── setup/              # Setup guides
│   └── architecture/       # Architecture docs
├── scripts/                # Build and deployment scripts
├── tests/                  # Test files
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 🚀 Quick Start

### Frontend Development
```bash
# Serve frontend
cd frontend
python -m http.server 8080
# Visit http://localhost:8080/pages/
```

### Backend Development
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run API server
cd api
python main.py
```

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript with TypeScript-like JSDoc annotations
- **Backend**: FastAPI (Python) with SQLite database
- **UI**: Custom CSS with VAPI-inspired design
- **Icons**: Font Awesome 6.4.0

## 📊 Features

- 🤖 **Assistant Management**: Create and manage AI voice assistants
- 📞 **Phone Numbers**: German/Austrian/Swiss phone number management
- 📋 **Call Logs**: Detailed call history and analytics
- 🌐 **Web Calls**: Browser-based voice AI widgets
- 📊 **Analytics**: Performance metrics and KPIs
- 💳 **Billing**: Enterprise subscription management
- 🔑 **API Keys**: Development and production key management
- ⚙️ **Settings**: Account and security configuration

## 👨‍💻 For Senior Developers

### Key Components
- **Main Application**: `frontend/pages/index.html`
- **Dashboard Logic**: `frontend/components/dashboard.js`
- **API Server**: `backend/api/main.py`
- **Database**: `backend/api/database.py`

### Development Workflow
1. Frontend changes: Edit files in `frontend/`
2. Backend changes: Edit files in `backend/api/`
3. Testing: Use `tests/` directory
4. Documentation: Update `docs/`

## 📝 Next Steps

1. Set up development environment
2. Review and test all functionality
3. Add comprehensive tests
4. Deploy to production environment

## 🔗 Repository

GitHub: https://github.com/luke-skywalker01/voicepartnerai