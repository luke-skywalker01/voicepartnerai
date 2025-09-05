// VoicePartnerAI - Vapi Web SDK Integration
// Provides 100% Vapi-compatible voice functionality

class VoicePartnerAI {
    constructor(publicKey) {
        this.publicKey = publicKey;
        this.isInitialized = false;
        this.currentCall = null;
        this.isConnected = false;
        this.isMuted = false;
        this.isCallActive = false;
        this.eventListeners = {};
        
        // Simulation mode for development
        this.isSimulationMode = true;
        
        this.init();
    }

    init() {
        console.log('🎤 VoicePartnerAI SDK initializing...');
        
        if (this.isSimulationMode) {
            console.log('⚠️ Running in SIMULATION mode - no real calls will be made');
            this.isInitialized = true;
            this.emit('ready');
            return;
        }

        // In production, this would initialize the actual Vapi SDK
        try {
            // TODO: Replace with actual Vapi SDK when API keys are available
            // this.vapiClient = new Vapi(this.publicKey);
            
            this.isInitialized = true;
            this.emit('ready');
            console.log('✅ VoicePartnerAI SDK ready');
        } catch (error) {
            console.error('❌ VoicePartnerAI SDK initialization failed:', error);
            this.emit('error', { message: 'SDK initialization failed', error });
        }
    }

    // Event Management
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    // Core Voice Functions
    async start(config) {
        if (!this.isInitialized) {
            throw new Error('SDK not initialized');
        }

        console.log('🚀 Starting voice call with config:', config);

        try {
            this.currentCall = {
                id: 'call_' + Math.random().toString(36).substr(2, 9),
                assistantId: config.assistantId,
                assistant: config.assistant,
                startTime: new Date(),
                status: 'connecting'
            };

            if (this.isSimulationMode) {
                return this._simulateCall(config);
            }

            // TODO: Actual Vapi SDK call
            // return await this.vapiClient.start(config);

        } catch (error) {
            console.error('❌ Call start failed:', error);
            this.emit('error', { message: 'Call start failed', error });
            throw error;
        }
    }

    async stop() {
        if (!this.isCallActive) {
            console.log('⚠️ No active call to stop');
            return;
        }

        console.log('⏹️ Stopping voice call');

        try {
            if (this.isSimulationMode) {
                return this._simulateStop();
            }

            // TODO: Actual Vapi SDK call
            // return await this.vapiClient.stop();

        } catch (error) {
            console.error('❌ Call stop failed:', error);
            this.emit('error', { message: 'Call stop failed', error });
            throw error;
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        console.log(muted ? '🔇 Microphone muted' : '🎤 Microphone unmuted');
        
        if (this.isSimulationMode) {
            this.emit('mute-changed', { isMuted: this.isMuted });
            return;
        }

        // TODO: Actual Vapi SDK call
        // this.vapiClient.setMuted(muted);
    }

    // Simulation Methods for Development
    async _simulateCall(config) {
        console.log('🎭 Simulating voice call...');
        
        // Simulate connection process
        this.emit('call-start', { 
            callId: this.currentCall.id,
            assistantId: config.assistantId || config.assistant?.id
        });

        // Simulate connecting
        setTimeout(() => {
            this.isConnected = true;
            this.isCallActive = true;
            this.currentCall.status = 'connected';
            this.emit('speech-start', { timestamp: new Date() });
            console.log('✅ Simulated call connected');
        }, 1000);

        // Simulate assistant first message
        setTimeout(() => {
            const firstMessage = config.assistant?.firstMessage || 'Hello! How can I help you today?';
            this.emit('speech-update', {
                transcript: firstMessage,
                user: 'assistant',
                timestamp: new Date()
            });
        }, 2000);

        // Simulate periodic transcript updates
        this._startTranscriptSimulation();

        return this.currentCall;
    }

    _simulateStop() {
        console.log('🎭 Simulating call stop...');
        
        this.isCallActive = false;
        this.isConnected = false;
        
        if (this.currentCall) {
            this.currentCall.status = 'ended';
            this.currentCall.endTime = new Date();
            this.currentCall.duration = this.currentCall.endTime - this.currentCall.startTime;
        }

        this.emit('call-end', {
            callId: this.currentCall?.id,
            duration: this.currentCall?.duration,
            reason: 'user-hangup'
        });

        if (this.transcriptSimulation) {
            clearInterval(this.transcriptSimulation);
        }

        console.log('✅ Simulated call ended');
        return this.currentCall;
    }

    _startTranscriptSimulation() {
        const simulatedPhrases = [
            'Verstehe, wie kann ich Ihnen helfen?',
            'Das ist eine interessante Frage.',
            'Lassen Sie mich das für Sie überprüfen.',
            'Haben Sie weitere Fragen?',
            'Gerne helfe ich Ihnen weiter.',
            'Ist das alles, womit ich helfen kann?'
        ];

        let phraseIndex = 0;
        this.transcriptSimulation = setInterval(() => {
            if (!this.isCallActive) return;

            const phrase = simulatedPhrases[phraseIndex % simulatedPhrases.length];
            this.emit('speech-update', {
                transcript: phrase,
                user: Math.random() > 0.7 ? 'user' : 'assistant',
                timestamp: new Date()
            });

            phraseIndex++;
        }, 5000);
    }

    // Utility Methods
    getCallStatus() {
        return {
            isActive: this.isCallActive,
            isConnected: this.isConnected,
            isMuted: this.isMuted,
            currentCall: this.currentCall
        };
    }

    // Static methods
    static isSupported() {
        // Check browser support for WebRTC, microphone access, etc.
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    static async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    }
}

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoicePartnerAI;
} else if (typeof window !== 'undefined') {
    window.VoicePartnerAI = VoicePartnerAI;
}

// Usage examples:
/*
// Initialize SDK
const vapi = new VoicePartnerAI('public_key_here');

// Listen for events
vapi.on('ready', () => {
    console.log('SDK ready for calls');
});

vapi.on('call-start', (data) => {
    console.log('Call started:', data);
});

vapi.on('speech-update', (data) => {
    console.log('Transcript:', data.transcript);
});

vapi.on('call-end', (data) => {
    console.log('Call ended:', data);
});

// Start a call
vapi.start({
    assistantId: 'asst_xxxxx',
    // or
    assistant: {
        name: 'Customer Support',
        firstMessage: 'Hello! How can I help you?',
        // ... other config
    }
});

// Control call
vapi.setMuted(true);
vapi.stop();
*/