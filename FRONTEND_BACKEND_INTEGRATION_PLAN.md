# 🔗 Frontend-Backend Integration Plan

## 📋 Aktueller Zustand & Verbesserungen

Der API Client in `app/configuration/api.js` ist bereits gut strukturiert. Folgende Verbesserungen werden implementiert:

## 🎯 Integration Roadmap

### Phase 1: Enhanced API Client (Week 1-2)
1. **State Management Integration**
2. **Error Handling & UX Improvements**
3. **WebSocket Support Vorbereitung**
4. **Authentication Flow**

### Phase 2: Real-time Features (Week 3-4)
1. **WebSocket Client Implementation**
2. **Live Data Updates**
3. **Offline Support**
4. **Performance Optimizations**

## 🏗️ Enhanced API Client Architecture

### 1. State Management Integration

```javascript
// app/src/store/AppStore.js
class AppStore {
    constructor() {
        this.state = {
            user: null,
            assistants: [],
            activeAssistant: null,
            isLoading: false,
            error: null,
            isOnline: navigator.onLine
        };
        this.listeners = [];
        this.setupOnlineDetection();
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) this.listeners.splice(index, 1);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setupOnlineDetection() {
        window.addEventListener('online', () => this.setState({ isOnline: true }));
        window.addEventListener('offline', () => this.setState({ isOnline: false }));
    }
}

const appStore = new AppStore();
```

### 2. Enhanced API Client mit State Integration

```javascript
// app/configuration/enhanced-api-client.js
class EnhancedAPIClient extends APIClient {
    constructor(store) {
        super();
        this.store = store;
        this.authToken = localStorage.getItem('voicepartnerai_token');
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request Interceptor für Auth
        this.originalRequest = this.request;
        this.request = async (endpoint, options = {}) => {
            // Loading State setzen
            this.store.setState({ isLoading: true, error: null });

            // Auth Header hinzufügen
            if (this.authToken) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${this.authToken}`
                };
            }

            try {
                const result = await this.originalRequest(endpoint, options);
                this.store.setState({ isLoading: false });
                return result;
            } catch (error) {
                this.handleAPIError(error);
                throw error;
            }
        };
    }

    handleAPIError(error) {
        this.store.setState({ isLoading: false });

        // Auth Errors
        if (error.message.includes('401')) {
            this.logout();
            this.store.setState({ error: 'Session expired. Please login again.' });
            return;
        }

        // Network Errors
        if (!this.store.state.isOnline) {
            this.store.setState({ error: 'No internet connection. Changes will sync when online.' });
            return;
        }

        // Generic Error
        this.store.setState({ error: error.message || 'Something went wrong. Please try again.' });
    }

    async login(credentials) {
        try {
            const response = await this.post('/api/auth/login', credentials);
            this.authToken = response.token;
            localStorage.setItem('voicepartnerai_token', this.authToken);

            const userProfile = await this.get('/api/auth/profile');
            this.store.setState({ user: userProfile });

            return response;
        } catch (error) {
            throw new Error('Login failed. Please check your credentials.');
        }
    }

    logout() {
        this.authToken = null;
        localStorage.removeItem('voicepartnerai_token');
        this.store.setState({ user: null, assistants: [] });
    }
}
```

### 3. Enhanced Assistant API mit Optimistic Updates

```javascript
// app/src/api/enhanced-assistant-api.js
class EnhancedAssistantAPI {
    constructor(apiClient, store) {
        this.api = apiClient;
        this.store = store;
    }

    async getAll() {
        try {
            const assistants = await this.api.get('/api/assistants');
            this.store.setState({ assistants });
            return assistants;
        } catch (error) {
            // Fallback zu cached data wenn offline
            if (!this.store.state.isOnline) {
                const cached = this.getCachedAssistants();
                if (cached.length > 0) {
                    this.store.setState({ assistants: cached });
                    return cached;
                }
            }
            throw error;
        }
    }

    async create(assistantData) {
        // Optimistic Update
        const tempId = `temp_${Date.now()}`;
        const optimisticAssistant = {
            id: tempId,
            ...assistantData,
            isCreating: true
        };

        const currentAssistants = this.store.state.assistants;
        this.store.setState({
            assistants: [...currentAssistants, optimisticAssistant]
        });

        try {
            const newAssistant = await this.api.post('/api/assistants', assistantData);

            // Replace optimistic update mit echten Daten
            const updatedAssistants = currentAssistants.map(a =>
                a.id === tempId ? newAssistant : a
            );
            this.store.setState({ assistants: updatedAssistants });

            return newAssistant;
        } catch (error) {
            // Revert optimistic update bei Fehler
            this.store.setState({ assistants: currentAssistants });
            throw error;
        }
    }

    async update(id, assistantData) {
        // Optimistic Update
        const currentAssistants = this.store.state.assistants;
        const optimisticAssistants = currentAssistants.map(assistant =>
            assistant.id === id
                ? { ...assistant, ...assistantData, isUpdating: true }
                : assistant
        );
        this.store.setState({ assistants: optimisticAssistants });

        try {
            const updatedAssistant = await this.api.put(`/api/assistants/${id}`, assistantData);

            const finalAssistants = currentAssistants.map(assistant =>
                assistant.id === id ? updatedAssistant : assistant
            );
            this.store.setState({ assistants: finalAssistants });

            return updatedAssistant;
        } catch (error) {
            // Revert bei Fehler
            this.store.setState({ assistants: currentAssistants });
            throw error;
        }
    }

    async delete(id) {
        // Optimistic Update
        const currentAssistants = this.store.state.assistants;
        const optimisticAssistants = currentAssistants.filter(a => a.id !== id);
        this.store.setState({ assistants: optimisticAssistants });

        try {
            await this.api.delete(`/api/assistants/${id}`);
            return true;
        } catch (error) {
            // Revert bei Fehler
            this.store.setState({ assistants: currentAssistants });
            throw error;
        }
    }

    getCachedAssistants() {
        const cached = localStorage.getItem('voicepartnerai_assistants');
        return cached ? JSON.parse(cached) : [];
    }

    cacheAssistants(assistants) {
        localStorage.setItem('voicepartnerai_assistants', JSON.stringify(assistants));
    }
}
```

## 🌐 WebSocket Integration

### WebSocket Client für Real-time Updates

```javascript
// app/src/websocket/websocket-client.js
class VoicePartnerAIWebSocket {
    constructor(store, authToken) {
        this.store = store;
        this.authToken = authToken;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
    }

    connect() {
        const wsUrl = `${API_CONFIG.WS_URL || 'ws://localhost:8001'}/ws?token=${this.authToken}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.stopHeartbeat();
            this.handleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'assistant_created':
                this.handleAssistantCreated(data.payload);
                break;
            case 'assistant_updated':
                this.handleAssistantUpdated(data.payload);
                break;
            case 'call_status_update':
                this.handleCallStatusUpdate(data.payload);
                break;
            case 'analytics_update':
                this.handleAnalyticsUpdate(data.payload);
                break;
        }
    }

    handleAssistantCreated(assistant) {
        const currentAssistants = this.store.state.assistants;
        this.store.setState({
            assistants: [...currentAssistants, assistant]
        });
    }

    handleAssistantUpdated(assistant) {
        const currentAssistants = this.store.state.assistants;
        const updatedAssistants = currentAssistants.map(a =>
            a.id === assistant.id ? assistant : a
        );
        this.store.setState({ assistants: updatedAssistants });
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
        }
    }
}
```

## 🎨 UI Components mit State Integration

### Enhanced Dashboard Component

```javascript
// app/src/components/enhanced-dashboard.js
class EnhancedDashboard {
    constructor() {
        this.store = appStore;
        this.assistantAPI = new EnhancedAssistantAPI(enhancedAPIClient, this.store);
        this.ws = null;
        this.unsubscribe = null;

        this.init();
    }

    init() {
        this.unsubscribe = this.store.subscribe(this.handleStateChange.bind(this));
        this.loadInitialData();
        this.setupWebSocket();
    }

    async loadInitialData() {
        try {
            await this.assistantAPI.getAll();
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    setupWebSocket() {
        if (this.store.state.user && enhancedAPIClient.authToken) {
            this.ws = new VoicePartnerAIWebSocket(this.store, enhancedAPIClient.authToken);
            this.ws.connect();
        }
    }

    handleStateChange(state) {
        this.updateUI(state);
    }

    updateUI(state) {
        // Loading States
        this.toggleLoadingSpinner(state.isLoading);

        // Error Handling
        this.displayError(state.error);

        // Assistant List Update
        this.renderAssistantList(state.assistants);

        // Online/Offline Status
        this.updateConnectionStatus(state.isOnline);
    }

    toggleLoadingSpinner(isLoading) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = isLoading ? 'block' : 'none';
        }
    }

    displayError(error) {
        const errorContainer = document.getElementById('error-message');
        if (errorContainer) {
            if (error) {
                errorContainer.textContent = error;
                errorContainer.style.display = 'block';
                setTimeout(() => {
                    errorContainer.style.display = 'none';
                }, 5000);
            } else {
                errorContainer.style.display = 'none';
            }
        }
    }

    updateConnectionStatus(isOnline) {
        const statusIndicator = document.getElementById('connection-status');
        if (statusIndicator) {
            statusIndicator.className = isOnline ? 'status-online' : 'status-offline';
            statusIndicator.textContent = isOnline ? 'Online' : 'Offline';
        }
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.ws) {
            this.ws.disconnect();
        }
    }
}
```

## 🔧 Error Handling & UX Improvements

### Global Error Handler

```javascript
// app/src/error/global-error-handler.js
class GlobalErrorHandler {
    constructor(store) {
        this.store = store;
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Unhandled Promise Rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
            event.preventDefault();
        });

        // JavaScript Errors
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
        });
    }

    handleError(error) {
        console.error('Global error:', error);

        let userMessage = 'Something went wrong. Please try again.';

        if (error.message) {
            if (error.message.includes('Network')) {
                userMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('401')) {
                userMessage = 'Session expired. Please login again.';
            } else if (error.message.includes('403')) {
                userMessage = 'Access denied. Please check your permissions.';
            }
        }

        this.store.setState({ error: userMessage });
    }
}
```

## 📱 Offline Support & Caching

### Service Worker für Offline Functionality

```javascript
// app/public/sw.js
const CACHE_NAME = 'voicepartnerai-v1';
const STATIC_CACHE = [
    '/',
    '/pages/index.html',
    '/pages/assistant-editor.html',
    '/configuration/api.js',
    '/src/components/dashboard.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        // API Requests: Network first, cache fallback
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Static Files: Cache first, network fallback
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});
```

## 🚀 Implementation Timeline

### Week 1: Core Infrastructure
- Enhanced API Client mit State Management
- Global Error Handler
- Basic Offline Support

### Week 2: UI Integration
- Dashboard Component Updates
- Loading States & Error Display
- Optimistic Updates

### Week 3: Real-time Features
- WebSocket Client Implementation
- Live Data Updates
- Connection Status Monitoring

### Week 4: Optimization & Testing
- Performance Optimizations
- Comprehensive Testing
- Documentation Updates

## 📊 Success Metrics

- **API Response Time**: < 200ms average
- **Error Rate**: < 1% of requests
- **Offline Functionality**: 100% app usability offline
- **Real-time Updates**: < 100ms latency
- **User Experience**: Seamless loading states, clear error messages

Diese Integration gewährleistet eine robuste, performante und benutzerfreundliche Frontend-Backend Kommunikation.