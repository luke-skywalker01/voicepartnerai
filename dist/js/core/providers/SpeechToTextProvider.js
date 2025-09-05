import speech from '@google-cloud/speech';
import { Logger } from '../../utils/Logger';
export class SpeechToTextProvider {
    constructor() {
        this.lastLatency = 0;
        this.providerConfigs = new Map();
        this.logger = new Logger('SpeechToTextProvider');
        this.initializeProviders();
    }
    initializeProviders() {
        // Google Cloud Speech-to-Text
        this.client = new speech.SpeechClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });
        // Configure providers
        this.providerConfigs.set('google', {
            sampleRateHertz: 16000,
            languageCode: 'de-DE',
            encoding: 'LINEAR16',
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: true,
            useEnhanced: true,
            model: 'phone_call'
        });
        this.providerConfigs.set('deepgram', {
            apiKey: process.env.DEEPGRAM_API_KEY,
            model: 'nova-2',
            language: 'de',
            smartFormat: true,
            punctuate: true,
            diarize: true
        });
        this.providerConfigs.set('assemblyai', {
            apiKey: process.env.ASSEMBLYAI_API_KEY,
            languageCode: 'de',
            punctuate: true,
            formatText: true,
            dualChannel: false
        });
        this.logger.info('Speech-to-Text providers initialized');
    }
    async transcribe(audioStream, config) {
        const startTime = Date.now();
        const provider = config?.provider || 'google';
        try {
            let transcription;
            switch (provider) {
                case 'google':
                    transcription = await this.transcribeGoogle(audioStream, config);
                    break;
                case 'deepgram':
                    transcription = await this.transcribeDeepgram(audioStream, config);
                    break;
                case 'assemblyai':
                    transcription = await this.transcribeAssemblyAI(audioStream, config);
                    break;
                case 'openai':
                    transcription = await this.transcribeOpenAI(audioStream, config);
                    break;
                case 'azure':
                    transcription = await this.transcribeAzure(audioStream, config);
                    break;
                default:
                    throw new Error(`Unsupported STT provider: ${provider}`);
            }
            this.lastLatency = Date.now() - startTime;
            this.logger.debug('Transcription completed', {
                provider,
                latency: this.lastLatency,
                textLength: transcription.length
            });
            return transcription;
        }
        catch (error) {
            this.logger.error('Transcription failed', { provider, error });
            throw error;
        }
    }
    async transcribeGoogle(audioStream, config) {
        const audioBuffer = await this.streamToBuffer(audioStream);
        const request = {
            audio: { content: audioBuffer.toString('base64') },
            config: {
                ...this.providerConfigs.get('google'),
                languageCode: config?.language || 'de-DE',
                alternativeLanguageCodes: ['en-US', 'en-GB'],
                profanityFilter: config?.profanityFilter ?? false,
                enableAutomaticPunctuation: config?.punctuate ?? true,
                enableSpeakerDiarization: config?.diarization ?? false,
                speechContexts: config?.keywords ? [{
                        phrases: config.keywords,
                        boost: 10.0
                    }] : undefined
            }
        };
        const [response] = await this.client.recognize(request);
        const transcription = response.results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .filter(Boolean)
            .join(' ') || '';
        return transcription;
    }
    async transcribeDeepgram(audioStream, config) {
        const audioBuffer = await this.streamToBuffer(audioStream);
        const deepgramConfig = this.providerConfigs.get('deepgram');
        const response = await fetch('https://api.deepgram.com/v1/listen', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${deepgramConfig.apiKey}`,
                'Content-Type': 'audio/wav'
            },
            body: audioBuffer
        });
        if (!response.ok) {
            throw new Error(`Deepgram API error: ${response.statusText}`);
        }
        const result = await response.json();
        return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    }
    async transcribeAssemblyAI(audioStream, config) {
        const audioBuffer = await this.streamToBuffer(audioStream);
        const assemblyConfig = this.providerConfigs.get('assemblyai');
        // Upload audio file
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': assemblyConfig.apiKey,
                'Content-Type': 'application/octet-stream'
            },
            body: audioBuffer
        });
        const { upload_url } = await uploadResponse.json();
        // Request transcription
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': assemblyConfig.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: upload_url,
                language_code: config?.language || 'de',
                punctuate: config?.punctuate ?? true,
                format_text: config?.smartFormat ?? true
            })
        });
        const transcript = await transcriptResponse.json();
        // Poll for completion
        return await this.pollAssemblyAITranscript(transcript.id, assemblyConfig.apiKey);
    }
    async transcribeOpenAI(audioStream, config) {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const audioBuffer = await this.streamToBuffer(audioStream);
        // Convert buffer to file-like object
        const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: config?.model || 'whisper-1',
            language: config?.language || 'de',
            response_format: 'text',
            temperature: 0.2
        });
        return transcription;
    }
    async transcribeAzure(audioStream, config) {
        // Azure Speech SDK implementation
        const sdk = require('microsoft-cognitiveservices-speech-sdk');
        const audioBuffer = await this.streamToBuffer(audioStream);
        const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
        const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION);
        speechConfig.speechRecognitionLanguage = config?.language || 'de-DE';
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        return new Promise((resolve, reject) => {
            recognizer.recognizeOnceAsync((result) => {
                recognizer.close();
                if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                    resolve(result.text);
                }
                else {
                    reject(new Error(`Recognition failed: ${result.errorDetails}`));
                }
            });
        });
    }
    async pollAssemblyAITranscript(id, apiKey) {
        const maxAttempts = 30;
        const pollInterval = 1000;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': apiKey }
            });
            const transcript = await response.json();
            if (transcript.status === 'completed') {
                return transcript.text || '';
            }
            else if (transcript.status === 'error') {
                throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
            }
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        throw new Error('AssemblyAI transcription timeout');
    }
    async transcribeRealTime(audioStream, onTranscript, config) {
        const provider = config?.provider || 'google';
        switch (provider) {
            case 'google':
                return this.transcribeRealTimeGoogle(audioStream, onTranscript, config);
            case 'deepgram':
                return this.transcribeRealTimeDeepgram(audioStream, onTranscript, config);
            default:
                throw new Error(`Real-time transcription not supported for provider: ${provider}`);
        }
    }
    async transcribeRealTimeGoogle(audioStream, onTranscript, config) {
        const request = {
            config: {
                ...this.providerConfigs.get('google'),
                languageCode: config?.language || 'de-DE'
            },
            interimResults: true,
            enableVoiceActivityDetection: true,
            voiceActivityTimeout: {
                speechStartTimeout: { seconds: 2 },
                speechEndTimeout: { seconds: 2 }
            }
        };
        const recognizeStream = this.client.streamingRecognize(request);
        recognizeStream.on('data', (response) => {
            const result = response.results[0];
            if (result) {
                onTranscript(result.alternatives[0].transcript, result.isFinal);
            }
        });
        recognizeStream.on('error', (error) => {
            this.logger.error('Real-time transcription error', error);
        });
        audioStream.pipe(recognizeStream);
    }
    async transcribeRealTimeDeepgram(audioStream, onTranscript, config) {
        const WebSocket = require('ws');
        const deepgramConfig = this.providerConfigs.get('deepgram');
        const ws = new WebSocket('wss://api.deepgram.com/v1/listen', {
            headers: { 'Authorization': `Token ${deepgramConfig.apiKey}` }
        });
        ws.on('open', () => {
            this.logger.info('Deepgram real-time connection established');
        });
        ws.on('message', (data) => {
            const response = JSON.parse(data);
            if (response.channel?.alternatives?.[0]?.transcript) {
                onTranscript(response.channel.alternatives[0].transcript, response.is_final || false);
            }
        });
        audioStream.on('data', (chunk) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(chunk);
            }
        });
        audioStream.on('end', () => {
            ws.close();
        });
    }
    async streamToBuffer(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    async getLastLatency() {
        return this.lastLatency;
    }
    async testProvider(provider) {
        const startTime = Date.now();
        try {
            // Create test audio stream (1 second of silence)
            const testBuffer = Buffer.alloc(16000 * 2); // 1 second at 16kHz, 16-bit
            const { Readable } = require('stream');
            const testStream = new Readable();
            testStream.push(testBuffer);
            testStream.push(null);
            await this.transcribe(testStream, { provider: provider });
            return {
                success: true,
                latency: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                latency: Date.now() - startTime,
                error: error.message
            };
        }
    }
}
//# sourceMappingURL=SpeechToTextProvider.js.map