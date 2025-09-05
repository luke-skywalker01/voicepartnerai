import { EventEmitter } from 'events';
import { CallSession, PhoneNumber } from '../types';
export declare class CallManager extends EventEmitter {
    private twilioClient;
    private sipUAConfigs;
    private activeCalls;
    private logger;
    constructor();
    private initializeTwilio;
    private setupSIPInfrastructure;
    provisionPhoneNumber(country?: string, type?: 'local' | 'toll_free' | 'mobile'): Promise<PhoneNumber>;
    initiateOutboundCall(phoneNumber: string, session: CallSession, fromNumber?: string): Promise<void>;
    handleIncomingCall(phoneNumber: string, callSid: string, metadata?: any): Promise<CallSession>;
    createSIPCall(phoneNumber: string, session: CallSession, sipConfig: SIPCallConfig): Promise<void>;
    endCall(sessionId: string): Promise<void>;
    transferCall(sessionId: string, targetPhoneNumber: string, options?: CallTransferOptions): Promise<void>;
    getCallRecording(sessionId: string): Promise<string | null>;
    getActiveCallsCount(): Promise<number>;
    getCallDetails(sessionId: string): Promise<CallSession | null>;
    private cleanup;
    private generateSessionId;
    handleTwilioWebhook(event: string, data: any): Promise<void>;
    private handleCallProgress;
    private handleCallStatus;
    private handleRecordingStatus;
}
interface SIPCallConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    domain: string;
}
interface CallTransferOptions {
    message?: string;
    timeout?: number;
    fallback?: string;
}
export {};
