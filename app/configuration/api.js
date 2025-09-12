/**
 * API Configuration for VoicePartnerAI Frontend
 * Handles all API endpoints and configuration
 */

// API Base Configuration
const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://api.voicepartnerai.com' 
        : 'http://localhost:8000',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
};

// API Endpoints
const API_ENDPOINTS = {
    // Health & Status
    HEALTH: '/health',
    STATUS: '/',
    
    // Authentication
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    
    // Assistants
    ASSISTANTS: '/api/assistants',
    ASSISTANT_BY_ID: (id) => `/api/assistants/${id}`,
    TEST_ASSISTANT: (id) => `/api/assistants/${id}/test`,
    
    // Calls & Voice
    CALLS: '/api/calls',
    CALL_BY_ID: (id) => `/api/calls/${id}`,
    
    // Analytics
    ANALYTICS_OVERVIEW: '/api/analytics/overview',
    ANALYTICS_CALLS: '/api/analytics/calls',
    ANALYTICS_ASSISTANTS: '/api/analytics/assistants',
    
    // Development
    DEV_RESET: '/api/dev/reset',
};

// HTTP Client Configuration
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
        this.retryDelay = API_CONFIG.RETRY_DELAY;
    }

    /**
     * Make HTTP Request with retry logic
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        const config = {
            headers: { ...defaultHeaders, ...options.headers },
            timeout: this.timeout,
            ...options,
        };

        let lastError = null;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }

                return await response.text();

            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryAttempts) {
                    console.warn(`API request failed (attempt ${attempt}), retrying in ${this.retryDelay}ms...`);
                    await this.sleep(this.retryDelay);
                } else {
                    console.error(`API request failed after ${this.retryAttempts} attempts:`, error);
                }
            }
        }

        throw lastError;
    }

    /**
     * GET Request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST Request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT Request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE Request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create API client instance
const apiClient = new APIClient();

// Assistant API Methods
const AssistantAPI = {
    /**
     * Get all assistants
     */
    async getAll() {
        return apiClient.get(API_ENDPOINTS.ASSISTANTS);
    },

    /**
     * Get assistant by ID
     */
    async getById(id) {
        return apiClient.get(API_ENDPOINTS.ASSISTANT_BY_ID(id));
    },

    /**
     * Create new assistant
     */
    async create(assistantData) {
        return apiClient.post(API_ENDPOINTS.ASSISTANTS, assistantData);
    },

    /**
     * Update assistant
     */
    async update(id, assistantData) {
        return apiClient.put(API_ENDPOINTS.ASSISTANT_BY_ID(id), assistantData);
    },

    /**
     * Delete assistant
     */
    async delete(id) {
        return apiClient.delete(API_ENDPOINTS.ASSISTANT_BY_ID(id));
    },

    /**
     * Test assistant
     */
    async test(id) {
        return apiClient.post(API_ENDPOINTS.TEST_ASSISTANT(id));
    },
};

// Analytics API Methods
const AnalyticsAPI = {
    /**
     * Get analytics overview
     */
    async getOverview() {
        return apiClient.get(API_ENDPOINTS.ANALYTICS_OVERVIEW);
    },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        API_CONFIG,
        API_ENDPOINTS,
        APIClient,
        AssistantAPI,
        AnalyticsAPI,
    };
} else {
    // Browser environment
    window.VoicePartnerAI = window.VoicePartnerAI || {};
    window.VoicePartnerAI.API = {
        API_CONFIG,
        API_ENDPOINTS,
        APIClient,
        AssistantAPI,
        AnalyticsAPI,
    };
}