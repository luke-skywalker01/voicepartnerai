import axios from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
export class VoicePartnerAI extends EventEmitter {
    constructor(apiKey, options = {}) {
        super();
        this.wsConnections = new Map();
        this.apiKey = apiKey;
        this.baseUrl = options.baseUrl || 'https://api.voicepartnerai.de/v1';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'VoicePartnerAI-TypeScript-SDK/1.0.0'
            },
            timeout: options.timeout || 30000
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use((config) => {
            this.emit('request', { method: config.method, url: config.url });
            return config;
        }, (error) => {
            this.emit('error', error);
            return Promise.reject(error);
        });
        // Response interceptor
        this.client.interceptors.response.use((response) => {
            this.emit('response', { status: response.status, url: response.config.url });
            return response;
        }, (error) => {
            this.emit('error', error);
            return Promise.reject(new VoicePartnerAIError(error));
        });
    }
    // Assistants API
    get assistants() {
        return {
            list: async (params) => {
                const response = await this.client.get('/assistants', { params });
                return response.data;
            },
            create: async (data) => {
                const response = await this.client.post('/assistants', data);
                return response.data.data;
            },
            get: async (id) => {
                const response = await this.client.get(`/assistants/${id}`);
                return response.data.data;
            },
            update: async (id, data) => {
                const response = await this.client.put(`/assistants/${id}`, data);
                return response.data.data;
            },
            delete: async (id) => {
                await this.client.delete(`/assistants/${id}`);
            },
            test: async (id, message, phoneNumber) => {
                const response = await this.client.post(`/assistants/${id}/test`, {
                    message,
                    phoneNumber
                });
                return response.data.data;
            },
            duplicate: async (id, name) => {
                const response = await this.client.post(`/assistants/${id}/duplicate`, { name });
                return response.data.data;
            },
            analytics: async (id, params) => {
                const response = await this.client.get(`/assistants/${id}/analytics`, { params });
                return response.data.data;
            }
        };
    }
    // Workflows API
    get workflows() {
        return {
            list: async (params) => {
                const response = await this.client.get('/workflows', { params });
                return response.data;
            },
            create: async (data) => {
                const response = await this.client.post('/workflows', data);
                return response.data.data;
            },
            get: async (id) => {
                const response = await this.client.get(`/workflows/${id}`);
                return response.data.data;
            },
            update: async (id, data) => {
                const response = await this.client.put(`/workflows/${id}`, data);
                return response.data.data;
            },
            delete: async (id) => {
                await this.client.delete(`/workflows/${id}`);
            },
            publish: async (id) => {
                const response = await this.client.post(`/workflows/${id}/publish`);
                return response.data.data;
            },
            execute: async (id, context) => {
                const response = await this.client.post(`/workflows/${id}/execute`, context);
                return response.data.data;
            }
        };
    }
    // Squads API
    get squads() {
        return {
            list: async (params) => {
                const response = await this.client.get('/squads', { params });
                return response.data;
            },
            create: async (data) => {
                const response = await this.client.post('/squads', data);
                return response.data.data;
            },
            get: async (id) => {
                const response = await this.client.get(`/squads/${id}`);
                return response.data.data;
            },
            update: async (id, data) => {
                const response = await this.client.put(`/squads/${id}`, data);
                return response.data.data;
            },
            delete: async (id) => {
                await this.client.delete(`/squads/${id}`);
            }
        };
    }
    // Calls API
    get calls() {
        return {
            list: async (params) => {
                const response = await this.client.get('/calls', { params });
                return response.data;
            },
            create: async (data) => {
                const response = await this.client.post('/calls', data);
                return response.data.data;
            },
            get: async (id) => {
                const response = await this.client.get(`/calls/${id}`);
                return response.data.data;
            },
            end: async (id) => {
                await this.client.post(`/calls/${id}/end`);
            },
            transfer: async (id, phoneNumber) => {
                await this.client.post(`/calls/${id}/transfer`, { phoneNumber });
            },
            transcript: async (id) => {
                const response = await this.client.get(`/calls/${id}/transcript`);
                return response.data.data;
            },
            recording: async (id) => {
                const response = await this.client.get(`/calls/${id}/recording`);
                return response.data.data;
            }
        };
    }
    // Phone Numbers API
    get phoneNumbers() {
        return {
            list: async () => {
                const response = await this.client.get('/phone-numbers');
                return response.data.data;
            },
            provision: async (data) => {
                const response = await this.client.post('/phone-numbers', data);
                return response.data.data;
            },
            get: async (id) => {
                const response = await this.client.get(`/phone-numbers/${id}`);
                return response.data.data;
            },
            update: async (id, data) => {
                const response = await this.client.put(`/phone-numbers/${id}`, data);
                return response.data.data;
            },
            release: async (id) => {
                await this.client.delete(`/phone-numbers/${id}`);
            }
        };
    }
    // Testing API
    get testing() {
        return {
            suites: {
                list: async () => {
                    const response = await this.client.get('/test-suites');
                    return response.data.data;
                },
                create: async (data) => {
                    const response = await this.client.post('/test-suites', data);
                    return response.data.data;
                },
                get: async (id) => {
                    const response = await this.client.get(`/test-suites/${id}`);
                    return response.data.data;
                },
                run: async (id) => {
                    const response = await this.client.post(`/test-suites/${id}/run`);
                    return response.data.data;
                },
                results: async (id) => {
                    const response = await this.client.get(`/test-suites/${id}/results`);
                    return response.data.data;
                }
            },
            runTest: async (testData) => {
                const response = await this.client.post('/test/run', testData);
                return response.data.data;
            }
        };
    }
    // Analytics API
    get analytics() {
        return {
            dashboard: async (timeRange) => {
                const response = await this.client.get('/analytics/dashboard', {
                    params: { timeRange }
                });
                return response.data.data;
            },
            calls: async (params) => {
                const response = await this.client.get('/analytics/calls', { params });
                return response.data.data;
            },
            performance: async (params) => {
                const response = await this.client.get('/analytics/performance', { params });
                return response.data.data;
            },
            export: async (params) => {
                const response = await this.client.get('/analytics/export', {
                    params,
                    responseType: 'blob'
                });
                return response.data;
            }
        };
    }
    // Integrations API
    get integrations() {
        return {
            list: async () => {
                const response = await this.client.get('/integrations');
                return response.data.data;
            },
            create: async (data) => {
                const response = await this.client.post('/integrations', data);
                return response.data.data;
            },
            get: async (id) => {
                const response = await this.client.get(`/integrations/${id}`);
                return response.data.data;
            },
            update: async (id, data) => {
                const response = await this.client.put(`/integrations/${id}`, data);
                return response.data.data;
            },
            delete: async (id) => {
                await this.client.delete(`/integrations/${id}`);
            },
            test: async (id) => {
                const response = await this.client.post(`/integrations/${id}/test`);
                return response.data.data;
            }
        };
    }
    // Real-time Voice API
    voice(sessionId) {
        return {
            connect: (options) => {
                const wsUrl = `${this.baseUrl.replace('http', 'ws')}/voice/${sessionId || 'new'}`;
                const ws = new WebSocket(wsUrl, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                });
                if (sessionId) {
                    this.wsConnections.set(sessionId, ws);
                }
                return new VoiceConnection(ws, this);
            },
            disconnect: (sessionId) => {
                const ws = this.wsConnections.get(sessionId);
                if (ws) {
                    ws.close();
                    this.wsConnections.delete(sessionId);
                }
            }
        };
    }
    // Utility methods
    async ping() {
        const startTime = Date.now();
        try {
            await this.client.get('/ping');
            return {
                success: true,
                latency: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime
            };
        }
    }
    async getAccount() {
        const response = await this.client.get('/account');
        return response.data.data;
    }
    async getUsage(params) {
        const response = await this.client.get('/usage', { params });
        return response.data.data;
    }
}
// Voice Connection Class
export class VoiceConnection extends EventEmitter {
    constructor(ws, client) {
        super();
        this.ws = ws;
        this.client = client;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.ws.on('open', () => {
            this.emit('connected');
        });
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            }
            catch (error) {
                this.emit('error', error);
            }
        });
        this.ws.on('close', () => {
            this.emit('disconnected');
        });
        this.ws.on('error', (error) => {
            this.emit('error', error);
        });
    }
    handleMessage(message) {
        switch (message.type) {
            case 'audio':
                this.emit('audio', message.data);
                break;
            case 'transcript':
                this.emit('transcript', message.data);
                break;
            case 'status':
                this.emit('status', message.data);
                break;
            case 'error':
                this.emit('error', new Error(message.error));
                break;
            default:
                this.emit('message', message);
        }
    }
    sendAudio(audioData) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(audioData);
        }
    }
    sendMessage(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    close() {
        this.ws.close();
    }
}
// Error Class
export class VoicePartnerAIError extends Error {
    constructor(error) {
        super(error.response?.data?.error?.message || error.message || 'Unknown error');
        this.name = 'VoicePartnerAIError';
        this.statusCode = error.response?.status;
        this.response = error.response?.data;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, VoicePartnerAIError);
        }
    }
}
// Export default
export default VoicePartnerAI;
//# sourceMappingURL=VoicePartnerAI.js.map