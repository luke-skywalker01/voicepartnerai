import { EventEmitter } from 'events';
import { Twilio } from 'twilio';
import * as SIP from 'sip.js';
import { Logger } from '../utils/Logger';
import { CallSession, PhoneNumber } from '../types';

export class CallManager extends EventEmitter {
  private twilioClient: Twilio;
  private sipUAConfigs: Map<string, SIP.UserAgent> = new Map();
  private activeCalls: Map<string, CallSession> = new Map();
  private logger: Logger;
  
  constructor() {
    super();
    this.logger = new Logger('CallManager');
    this.initializeTwilio();
    this.setupSIPInfrastructure();
  }

  private initializeTwilio(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not provided, phone features will be limited');
      return;
    }
    
    this.twilioClient = new Twilio(accountSid, authToken);
    this.logger.info('Twilio client initialized');
  }

  private setupSIPInfrastructure(): void {
    // SIP server configuration for direct SIP integration
    const sipConfig = {
      host: process.env.SIP_HOST || 'localhost',
      port: parseInt(process.env.SIP_PORT || '5060'),
      username: process.env.SIP_USERNAME || 'voicepartnerai',
      password: process.env.SIP_PASSWORD || '',
      realm: process.env.SIP_REALM || 'voicepartnerai.de'
    };

    this.logger.info('SIP infrastructure configured', { host: sipConfig.host, port: sipConfig.port });
  }

  async provisionPhoneNumber(
    country: string = 'DE',
    type: 'local' | 'toll_free' | 'mobile' = 'local'
  ): Promise<PhoneNumber> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      // Search for available numbers
      const availableNumbers = await this.twilioClient.availablePhoneNumbers(country)
        .local.list({
          limit: 1,
          voiceEnabled: true
        });

      if (availableNumbers.length === 0) {
        throw new Error(`No available ${type} phone numbers in ${country}`);
      }

      // Purchase the number
      const purchasedNumber = await this.twilioClient.incomingPhoneNumbers
        .create({
          phoneNumber: availableNumbers[0].phoneNumber,
          voiceUrl: `${process.env.PUBLIC_URL}/api/voice/webhook`,
          voiceMethod: 'POST',
          statusCallback: `${process.env.PUBLIC_URL}/api/voice/status`,
          statusCallbackMethod: 'POST'
        });

      const phoneNumber: PhoneNumber = {
        id: purchasedNumber.sid,
        number: purchasedNumber.phoneNumber,
        country,
        type,
        provider: 'twilio',
        status: 'active',
        capabilities: {
          voice: true,
          sms: purchasedNumber.capabilities.sms || false,
          mms: purchasedNumber.capabilities.mms || false
        },
        createdAt: new Date()
      };

      this.logger.info('Phone number provisioned', { 
        number: phoneNumber.number, 
        country, 
        type 
      });

      return phoneNumber;
    } catch (error) {
      this.logger.error('Failed to provision phone number', { country, type, error });
      throw error;
    }
  }

  async initiateOutboundCall(
    phoneNumber: string,
    session: CallSession,
    fromNumber?: string
  ): Promise<void> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const call = await this.twilioClient.calls.create({
        to: phoneNumber,
        from: fromNumber || process.env.TWILIO_PHONE_NUMBER!,
        url: `${process.env.PUBLIC_URL}/api/voice/outbound/${session.id}`,
        method: 'POST',
        statusCallback: `${process.env.PUBLIC_URL}/api/voice/status/${session.id}`,
        statusCallbackMethod: 'POST',
        record: true,
        recordingChannels: 'dual',
        recordingStatusCallback: `${process.env.PUBLIC_URL}/api/voice/recording/${session.id}`
      });

      session.metadata.twilioCallSid = call.sid;
      this.activeCalls.set(session.id, session);

      this.logger.info('Outbound call initiated', {
        sessionId: session.id,
        phoneNumber,
        twilioSid: call.sid
      });

      this.emit('call_initiated', session);
    } catch (error) {
      this.logger.error('Failed to initiate outbound call', {
        sessionId: session.id,
        phoneNumber,
        error
      });
      throw error;
    }
  }

  async handleIncomingCall(
    phoneNumber: string,
    callSid: string,
    metadata: any = {}
  ): Promise<CallSession> {
    const sessionId = this.generateSessionId();
    
    const session: CallSession = {
      id: sessionId,
      phoneNumber,
      direction: 'inbound',
      status: 'ringing',
      startTime: new Date(),
      transcript: [],
      metadata: {
        ...metadata,
        twilioCallSid: callSid
      },
      analytics: {
        totalDuration: 0,
        talkTime: 0,
        silenceTime: 0,
        interruptionCount: 0,
        sentimentScore: 0,
        keywordsDetected: [],
        successMetrics: {}
      },
      userId: metadata.userId || 'system'
    };

    this.activeCalls.set(sessionId, session);

    this.logger.info('Incoming call received', {
      sessionId,
      phoneNumber,
      callSid
    });

    this.emit('incoming_call', phoneNumber, {
      ...metadata,
      sessionId,
      callSid
    });

    return session;
  }

  async createSIPCall(
    phoneNumber: string,
    session: CallSession,
    sipConfig: SIPCallConfig
  ): Promise<void> {
    try {
      const userAgentOptions: SIP.UserAgentOptions = {
        uri: SIP.UserAgent.makeURI(`sip:${sipConfig.username}@${sipConfig.domain}`)!,
        transportOptions: {
          server: `wss://${sipConfig.host}:${sipConfig.port}/ws`
        },
        authorizationUsername: sipConfig.username,
        authorizationPassword: sipConfig.password,
        displayName: 'VoicePartnerAI'
      };

      const userAgent = new SIP.UserAgent(userAgentOptions);
      this.sipUAConfigs.set(session.id, userAgent);

      const target = SIP.UserAgent.makeURI(`sip:${phoneNumber}@${sipConfig.domain}`)!;
      const inviter = new SIP.Inviter(userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false
          }
        }
      });

      // Set up event handlers
      inviter.stateChange.addListener((state: SIP.SessionState) => {
        this.logger.info('SIP call state changed', { sessionId: session.id, state });
        
        switch (state) {
          case SIP.SessionState.Establishing:
            session.status = 'ringing';
            break;
          case SIP.SessionState.Established:
            session.status = 'in_progress';
            this.emit('call_answered', session);
            break;
          case SIP.SessionState.Terminated:
            session.status = 'completed';
            session.endTime = new Date();
            this.emit('call_ended', session.id);
            this.cleanup(session.id);
            break;
        }
      });

      // Start the call
      await userAgent.start();
      await inviter.invite();

      session.metadata.sipInviter = inviter;
      this.activeCalls.set(session.id, session);

      this.logger.info('SIP call initiated', {
        sessionId: session.id,
        phoneNumber,
        domain: sipConfig.domain
      });

    } catch (error) {
      this.logger.error('Failed to create SIP call', {
        sessionId: session.id,
        phoneNumber,
        error
      });
      throw error;
    }
  }

  async endCall(sessionId: string): Promise<void> {
    const session = this.activeCalls.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // End Twilio call
      if (session.metadata.twilioCallSid && this.twilioClient) {
        await this.twilioClient.calls(session.metadata.twilioCallSid)
          .update({ status: 'completed' });
      }

      // End SIP call
      if (session.metadata.sipInviter) {
        const inviter = session.metadata.sipInviter as SIP.Inviter;
        await inviter.bye();
      }

      // Update session
      session.status = 'completed';
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();

      this.logger.info('Call ended', {
        sessionId,
        duration: session.duration
      });

      this.emit('call_ended', sessionId);
      this.cleanup(sessionId);
    } catch (error) {
      this.logger.error('Failed to end call', { sessionId, error });
      throw error;
    }
  }

  async transferCall(
    sessionId: string,
    targetPhoneNumber: string,
    options: CallTransferOptions = {}
  ): Promise<void> {
    const session = this.activeCalls.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      if (session.metadata.twilioCallSid && this.twilioClient) {
        // Twilio transfer
        await this.twilioClient.calls(session.metadata.twilioCallSid)
          .update({
            method: 'POST',
            url: `${process.env.PUBLIC_URL}/api/voice/transfer`,
            twiml: `<Response><Dial>${targetPhoneNumber}</Dial></Response>`
          });
      } else if (session.metadata.sipInviter) {
        // SIP transfer (REFER method)
        const inviter = session.metadata.sipInviter as SIP.Inviter;
        const referTo = `sip:${targetPhoneNumber}@${process.env.SIP_DOMAIN}`;
        
        // Note: SIP transfer implementation would depend on the specific SIP server
        this.logger.info('SIP transfer initiated', {
          sessionId,
          targetPhoneNumber,
          referTo
        });
      }

      this.logger.info('Call transferred', {
        sessionId,
        targetPhoneNumber,
        options
      });

      this.emit('call_transferred', {
        sessionId,
        targetPhoneNumber,
        originalSession: session
      });
    } catch (error) {
      this.logger.error('Failed to transfer call', {
        sessionId,
        targetPhoneNumber,
        error
      });
      throw error;
    }
  }

  async getCallRecording(sessionId: string): Promise<string | null> {
    const session = this.activeCalls.get(sessionId);
    if (!session?.metadata.twilioCallSid || !this.twilioClient) {
      return null;
    }

    try {
      const recordings = await this.twilioClient
        .recordings
        .list({ callSid: session.metadata.twilioCallSid });

      if (recordings.length > 0) {
        const recordingUrl = `https://api.twilio.com${recordings[0].uri.replace('.json', '.mp3')}`;
        return recordingUrl;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get call recording', { sessionId, error });
      return null;
    }
  }

  async getActiveCallsCount(): Promise<number> {
    return this.activeCalls.size;
  }

  async getCallDetails(sessionId: string): Promise<CallSession | null> {
    return this.activeCalls.get(sessionId) || null;
  }

  private cleanup(sessionId: string): void {
    // Clean up SIP user agent
    const userAgent = this.sipUAConfigs.get(sessionId);
    if (userAgent) {
      userAgent.stop();
      this.sipUAConfigs.delete(sessionId);
    }

    // Remove from active calls
    this.activeCalls.delete(sessionId);
  }

  private generateSessionId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Webhook handlers for Twilio
  async handleTwilioWebhook(
    event: string,
    data: any
  ): Promise<void> {
    switch (event) {
      case 'call-progress':
        await this.handleCallProgress(data);
        break;
      case 'call-status':
        await this.handleCallStatus(data);
        break;
      case 'recording-status':
        await this.handleRecordingStatus(data);
        break;
      default:
        this.logger.warn('Unknown Twilio webhook event', { event, data });
    }
  }

  private async handleCallProgress(data: any): Promise<void> {
    // Handle call progress events
    this.logger.info('Call progress event', data);
  }

  private async handleCallStatus(data: any): Promise<void> {
    const callSid = data.CallSid;
    const status = data.CallStatus;

    // Find session by Twilio call SID
    const session = Array.from(this.activeCalls.values())
      .find(s => s.metadata.twilioCallSid === callSid);

    if (session) {
      switch (status) {
        case 'answered':
          session.status = 'in_progress';
          this.emit('call_answered', session);
          break;
        case 'completed':
        case 'busy':
        case 'failed':
        case 'no-answer':
          session.status = status === 'completed' ? 'completed' : 'failed';
          session.endTime = new Date();
          session.duration = session.endTime.getTime() - session.startTime.getTime();
          this.emit('call_ended', session.id);
          this.cleanup(session.id);
          break;
      }
    }

    this.logger.info('Call status updated', { callSid, status });
  }

  private async handleRecordingStatus(data: any): Promise<void> {
    const recordingSid = data.RecordingSid;
    const status = data.RecordingStatus;
    
    this.logger.info('Recording status updated', { recordingSid, status });
    
    if (status === 'completed') {
      this.emit('recording_available', {
        recordingSid,
        recordingUrl: data.RecordingUrl
      });
    }
  }
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