/**
 * Enhanced API Client for VoicePartnerAI
 * Integrates with AppStore for state management and improved UX
 */

// Import base API client
if (typeof window !== 'undefined' && window.VoicePartnerAI?.API) {
    var { APIClient, API_ENDPOINTS } = window.VoicePartnerAI.API;
}

class EnhancedAPIClient extends APIClient {
    constructor(store) {
        super();
        this.store = store;
        this.authToken = store.getState().authToken;
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.setupInterceptors();
    }

    /**
     * Setup request/response interceptors
     */
    setupInterceptors() {
        // Override base request method
        this.originalRequest = this.request.bind(this);
        this.request = this.interceptedRequest.bind(this);
    }

    /**
     * Intercepted request with enhanced error handling and state management
     */
    async interceptedRequest(endpoint, options = {}) {
        // Set loading state
        this.store.setLoading(true);

        // Add auth header if available
        if (this.authToken) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${this.authToken}`
            };
        }

        // Add request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        options.headers = {
            ...options.headers,
            'X-Request-ID': requestId
        };

        try {
            const result = await this.originalRequest(endpoint, options);
            this.store.setLoading(false);
            this.store.clearError();
            return result;
        } catch (error) {
            this.handleAPIError(error, endpoint, options);
            throw error;
        }
    }

    /**
     * Enhanced error handling with user-friendly messages
     */
    handleAPIError(error, endpoint, options) {
        this.store.setLoading(false);

        console.error(`API Error [${endpoint}]:`, error);

        // Auth Errors
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            this.logout();
            this.store.setError('Session expired. Please login again.');
            window.location.href = '/pages/login.html';
            return;
        }

        // Forbidden
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
            this.store.setError('Access denied. Please check your permissions.');
            return;
        }

        // Not Found
        if (error.message.includes('404') || error.message.includes('Not Found')) {
            this.store.setError('Requested resource not found.');
            return;
        }

        // Server Errors
        if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
            this.store.setError('Server error. Please try again later.');
            return;
        }

        // Network/Timeout Errors
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            if (!this.store.getState().isOnline) {
                this.store.setError('No internet connection. Changes will sync when online.');
                this.queueRequest(endpoint, options);
            } else {
                this.store.setError('Request timeout. Please try again.');
            }
            return;
        }

        // Connection Errors
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
            this.store.setError('Connection error. Please check your internet connection.');
            this.queueRequest(endpoint, options);
            return;
        }

        // Generic Error
        this.store.setError(error.message || 'Something went wrong. Please try again.');
    }

    /**
     * Queue requests for retry when back online
     */
    queueRequest(endpoint, options) {
        this.requestQueue.push({ endpoint, options, timestamp: Date.now() });
        this.processQueueWhenOnline();
    }

    /**
     * Process queued requests when back online
     */
    async processQueueWhenOnline() {
        if (this.isProcessingQueue || !this.store.getState().isOnline) return;

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0 && this.store.getState().isOnline) {
            const { endpoint, options } = this.requestQueue.shift();

            try {
                await this.originalRequest(endpoint, options);
                this.store.addNotification('Synced offline changes', 'success');
            } catch (error) {
                console.error('Failed to process queued request:', error);
                // Re-queue if still relevant (less than 5 minutes old)
                if (Date.now() - options.timestamp < 5 * 60 * 1000) {
                    this.requestQueue.push({ endpoint, options });
                }
                break;
            }
        }

        this.isProcessingQueue = false;
    }

    /**
     * Login and store auth token
     */
    async login(credentials) {
        try {
            const response = await this.post('/api/auth/login', credentials);
            this.authToken = response.token;
            this.store.login(response.user, response.token);
            return response;
        } catch (error) {
            throw new Error('Login failed. Please check your credentials.');
        }
    }

    /**
     * Logout and clear auth
     */
    logout() {
        this.authToken = null;
        this.store.logout();
    }

    /**
     * Update auth token
     */
    setAuthToken(token) {
        this.authToken = token;
    }
}

/**
 * Enhanced Assistant API with optimistic updates
 */
class EnhancedAssistantAPI {
    constructor(apiClient, store) {
        this.api = apiClient;
        this.store = store;
    }

    /**
     * Get all assistants with caching
     */
    async getAll() {
        try {
            const assistants = await this.api.get(API_ENDPOINTS.ASSISTANTS);
            this.store.setState({ assistants });
            return assistants;
        } catch (error) {
            // Fallback to cached data when offline
            if (!this.store.getState().isOnline) {
                const cached = this.getCachedAssistants();
                if (cached.length > 0) {
                    this.store.setState({ assistants: cached });
                    this.store.addNotification('Showing cached data (offline)', 'info');
                    return cached;
                }
            }
            throw error;
        }
    }

    /**
     * Get assistant by ID
     */
    async getById(id) {
        try {
            const assistant = await this.api.get(API_ENDPOINTS.ASSISTANT_BY_ID(id));
            this.store.setState({ activeAssistant: assistant });
            return assistant;
        } catch (error) {
            // Try to find in current state
            const existing = this.store.getState().assistants.find(a => a.id === id);
            if (existing) {
                this.store.setState({ activeAssistant: existing });
                return existing;
            }
            throw error;
        }
    }

    /**
     * Create assistant with optimistic update
     */
    async create(assistantData) {
        // Generate temporary ID for optimistic update
        const tempId = `temp_${Date.now()}`;
        const optimisticAssistant = {
            id: tempId,
            ...assistantData,
            status: 'creating',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Optimistic update
        const currentAssistants = this.store.getState().assistants;
        this.store.setState({
            assistants: [...currentAssistants, optimisticAssistant]
        });

        try {
            const newAssistant = await this.api.post(API_ENDPOINTS.ASSISTANTS, assistantData);

            // Replace optimistic update with real data
            const updatedAssistants = this.store.getState().assistants.map(a =>
                a.id === tempId ? newAssistant : a
            );
            this.store.setState({ assistants: updatedAssistants });

            this.store.addNotification(`Assistant "${newAssistant.name}" created successfully`, 'success');
            return newAssistant;
        } catch (error) {
            // Revert optimistic update on error
            this.store.setState({ assistants: currentAssistants });
            throw error;
        }
    }

    /**
     * Update assistant with optimistic update
     */
    async update(id, assistantData) {
        const currentAssistants = this.store.getState().assistants;

        // Optimistic update
        const optimisticAssistants = currentAssistants.map(assistant =>
            assistant.id === id
                ? {
                    ...assistant,
                    ...assistantData,
                    status: 'updating',
                    updated_at: new Date().toISOString()
                }
                : assistant
        );
        this.store.setState({ assistants: optimisticAssistants });

        try {
            const updatedAssistant = await this.api.put(API_ENDPOINTS.ASSISTANT_BY_ID(id), assistantData);

            // Update with real data
            const finalAssistants = currentAssistants.map(assistant =>
                assistant.id === id ? updatedAssistant : assistant
            );
            this.store.setState({ assistants: finalAssistants });

            this.store.addNotification(`Assistant "${updatedAssistant.name}" updated successfully`, 'success');
            return updatedAssistant;
        } catch (error) {
            // Revert on error
            this.store.setState({ assistants: currentAssistants });
            throw error;
        }
    }

    /**
     * Delete assistant with optimistic update
     */
    async delete(id) {
        const currentAssistants = this.store.getState().assistants;
        const assistantToDelete = currentAssistants.find(a => a.id === id);

        if (!assistantToDelete) {
            throw new Error('Assistant not found');
        }

        // Optimistic update
        const optimisticAssistants = currentAssistants.filter(a => a.id !== id);
        this.store.setState({ assistants: optimisticAssistants });

        try {
            await this.api.delete(API_ENDPOINTS.ASSISTANT_BY_ID(id));
            this.store.addNotification(`Assistant "${assistantToDelete.name}" deleted successfully`, 'success');
            return true;
        } catch (error) {
            // Revert on error
            this.store.setState({ assistants: currentAssistants });
            throw error;
        }
    }

    /**
     * Test assistant
     */
    async test(id) {
        try {
            const result = await this.api.post(API_ENDPOINTS.TEST_ASSISTANT(id));
            this.store.addNotification('Assistant test completed successfully', 'success');
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get cached assistants
     */
    getCachedAssistants() {
        try {
            const cached = localStorage.getItem('voicepartnerai_assistants_cache');
            return cached ? JSON.parse(cached).data : [];
        } catch {
            return [];
        }
    }
}

/**
 * Enhanced Analytics API
 */
class EnhancedAnalyticsAPI {
    constructor(apiClient, store) {
        this.api = apiClient;
        this.store = store;
    }

    /**
     * Get analytics overview with caching
     */
    async getOverview() {
        try {
            const analytics = await this.api.get(API_ENDPOINTS.ANALYTICS_OVERVIEW);
            this.store.setState({ analytics });
            return analytics;
        } catch (error) {
            throw error;
        }
    }
}

// Initialize enhanced API client
if (typeof window !== 'undefined' && window.appStore) {
    const enhancedAPIClient = new EnhancedAPIClient(window.appStore);

    // Initialize enhanced API modules
    enhancedAPIClient.assistants = new EnhancedAssistantAPI(enhancedAPIClient, window.appStore);
    enhancedAPIClient.analytics = new EnhancedAnalyticsAPI(enhancedAPIClient, window.appStore);

    // Make globally available
    window.enhancedAPIClient = enhancedAPIClient;

    // Setup online event listener to process queue
    window.addEventListener('online', () => {
        enhancedAPIClient.processQueueWhenOnline();
    });

    console.log('✅ Enhanced API Client initialized');
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedAPIClient, EnhancedAssistantAPI, EnhancedAnalyticsAPI };
}