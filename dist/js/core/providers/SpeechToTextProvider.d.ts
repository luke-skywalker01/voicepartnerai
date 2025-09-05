import { TranscriptionConfiguration } from '../../types';
export declare class SpeechToTextProvider {
    private client;
    private logger;
    private lastLatency;
    private providerConfigs;
    constructor();
    private initializeProviders;
    transcribe(audioStream: NodeJS.ReadableStream, config?: TranscriptionConfiguration): Promise<string>;
    private transcribeGoogle;
    private transcribeDeepgram;
    private transcribeAssemblyAI;
    private transcribeOpenAI;
    private transcribeAzure;
    private pollAssemblyAITranscript;
    transcribeRealTime(audioStream: NodeJS.ReadableStream, onTranscript: (text: string, isFinal: boolean) => void, config?: TranscriptionConfiguration): Promise<void>;
    private transcribeRealTimeGoogle;
    private transcribeRealTimeDeepgram;
    private streamToBuffer;
    getLastLatency(): Promise<number>;
    testProvider(provider: string): Promise<{
        success: boolean;
        latency: number;
        error?: string;
    }>;
}
