/**
 * Global Application State Management
 * VoicePartnerAI Frontend - Centralized State Store
 */

class AppStore {
    constructor() {
        this.state = {
            // User & Authentication
            user: null,
            isAuthenticated: false,
            authToken: localStorage.getItem('voicepartnerai_token'),

            // Assistants
            assistants: [],
            activeAssistant: null,
            assistantTemplates: [],

            // UI State
            isLoading: false,
            error: null,
            isOnline: navigator.onLine,
            theme: localStorage.getItem('preferred-theme') || 'light',

            // Analytics
            analytics: null,

            // Call Logs
            callLogs: [],

            // Notifications
            notifications: []
        };

        this.listeners = [];
        this.setupEventListeners();
    }

    /**
     * Update state and notify listeners
     * @param {Partial<AppState>} newState
     */
    setState(newState) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...newState };

        // Persist certain state to localStorage
        this.persistState();

        // Notify all listeners
        this.notifyListeners(prevState);
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) this.listeners.splice(index, 1);
        };
    }

    /**
     * Notify all listeners of state changes
     * @param {AppState} prevState
     */
    notifyListeners(prevState) {
        this.listeners.forEach(listener => {
            try {
                listener(this.state, prevState);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    /**
     * Setup browser event listeners
     */
    setupEventListeners() {
        // Online/Offline detection
        window.addEventListener('online', () => {
            this.setState({ isOnline: true });
            this.addNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.setState({ isOnline: false });
            this.addNotification('No internet connection', 'warning');
        });

        // Visibility change (for pausing/resuming operations)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // App became visible, refresh data if needed
                this.refreshDataIfStale();
            }
        });
    }

    /**
     * Persist important state to localStorage
     */
    persistState() {
        // Persist auth token
        if (this.state.authToken) {
            localStorage.setItem('voicepartnerai_token', this.state.authToken);
        } else {
            localStorage.removeItem('voicepartnerai_token');
        }

        // Persist theme
        localStorage.setItem('preferred-theme', this.state.theme);

        // Cache assistants for offline use
        if (this.state.assistants.length > 0) {
            localStorage.setItem('voicepartnerai_assistants_cache', JSON.stringify({
                data: this.state.assistants,
                timestamp: Date.now()
            }));
        }
    }

    /**
     * Load cached data on initialization
     */
    loadCachedData() {
        try {
            // Load cached assistants
            const assistantsCache = localStorage.getItem('voicepartnerai_assistants_cache');
            if (assistantsCache) {
                const cached = JSON.parse(assistantsCache);
                const isStale = Date.now() - cached.timestamp > 5 * 60 * 1000; // 5 minutes

                if (!isStale) {
                    this.setState({ assistants: cached.data });
                }
            }
        } catch (error) {
            console.warn('Failed to load cached data:', error);
        }
    }

    /**
     * Refresh data if cache is stale
     */
    refreshDataIfStale() {
        const assistantsCache = localStorage.getItem('voicepartnerai_assistants_cache');
        if (assistantsCache) {
            const cached = JSON.parse(assistantsCache);
            const isStale = Date.now() - cached.timestamp > 5 * 60 * 1000;

            if (isStale && window.enhancedAPIClient) {
                window.enhancedAPIClient.assistants.getAll().catch(console.error);
            }
        }
    }

    /**
     * Add notification
     * @param {string} message
     * @param {string} type
     * @param {number} duration
     */
    addNotification(message, type = 'info', duration = 5000) {
        const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message,
            type,
            timestamp: Date.now()
        };

        this.setState({
            notifications: [...this.state.notifications, notification]
        });

        // Auto-remove notification
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }

        return notification.id;
    }

    /**
     * Remove notification by ID
     * @param {string} notificationId
     */
    removeNotification(notificationId) {
        this.setState({
            notifications: this.state.notifications.filter(n => n.id !== notificationId)
        });
    }

    /**
     * Clear all notifications
     */
    clearNotifications() {
        this.setState({ notifications: [] });
    }

    /**
     * Set loading state with optional message
     * @param {boolean} isLoading
     * @param {string} message
     */
    setLoading(isLoading, message = '') {
        this.setState({
            isLoading,
            loadingMessage: message
        });
    }

    /**
     * Set error state
     * @param {string|Error} error
     */
    setError(error) {
        const errorMessage = error instanceof Error ? error.message : error;
        this.setState({
            error: errorMessage,
            isLoading: false
        });

        if (errorMessage) {
            this.addNotification(errorMessage, 'error');
        }
    }

    /**
     * Clear error state
     */
    clearError() {
        this.setState({ error: null });
    }

    /**
     * Set theme
     * @param {string} theme
     */
    setTheme(theme) {
        this.setState({ theme });
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Login user
     * @param {Object} user
     * @param {string} token
     */
    login(user, token) {
        this.setState({
            user,
            authToken: token,
            isAuthenticated: true
        });
    }

    /**
     * Logout user
     */
    logout() {
        this.setState({
            user: null,
            authToken: null,
            isAuthenticated: false,
            assistants: [],
            activeAssistant: null,
            callLogs: [],
            analytics: null
        });

        // Clear all localStorage
        localStorage.removeItem('voicepartnerai_token');
        localStorage.removeItem('voicepartnerai_assistants_cache');
        localStorage.removeItem('voicepartnerai_session');
        sessionStorage.clear();
    }

    /**
     * Get current state (readonly)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Debug: Log current state
     */
    debug() {
        console.group('🏪 AppStore State');
        console.table({
            'Authenticated': this.state.isAuthenticated,
            'User': this.state.user?.name || 'None',
            'Assistants': this.state.assistants.length,
            'Online': this.state.isOnline,
            'Loading': this.state.isLoading,
            'Error': this.state.error || 'None',
            'Theme': this.state.theme,
            'Notifications': this.state.notifications.length
        });
        console.groupEnd();
    }
}

// Create global store instance
const appStore = new AppStore();

// Initialize cached data
appStore.loadCachedData();

// Export for global use
if (typeof window !== 'undefined') {
    window.appStore = appStore;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appStore;
}