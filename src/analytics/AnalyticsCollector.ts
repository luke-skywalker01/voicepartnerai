import { EventEmitter } from 'events';
import { CallSession, CallAnalytics, TranscriptEntry } from '../types';
import { Logger } from '../utils/Logger';
import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';

export class AnalyticsCollector extends EventEmitter {
  private logger: Logger;
  private prisma: PrismaClient;
  private redisClient: RedisClientType;
  private analyticsBuffer: Map<string, Partial<CallAnalytics>> = new Map();
  private metricsQueue: MetricsEvent[] = [];
  private processInterval: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = new Logger('AnalyticsCollector');
    this.prisma = new PrismaClient();
    
    this.initializeRedis();
    this.startProcessingLoop();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error', { error });
      });

      await this.redisClient.connect();
      this.logger.info('Analytics Redis client connected');
    } catch (error) {
      this.logger.error('Failed to initialize Redis', { error });
    }
  }

  private startProcessingLoop(): void {
    // Process analytics every 5 seconds
    this.processInterval = setInterval(async () => {
      await this.processMetricsQueue();
      await this.flushAnalyticsBuffer();
    }, 5000);
  }

  async processCallAnalytics(callSession: CallSession): Promise<void> {
    try {
      this.logger.info('Processing call analytics', {
        sessionId: callSession.id,
        duration: callSession.duration
      });

      // Calculate comprehensive analytics
      const analytics = await this.calculateCallAnalytics(callSession);
      
      // Store in buffer for batch processing
      this.analyticsBuffer.set(callSession.id, analytics);

      // Emit real-time analytics event
      this.emit('analytics_processed', {
        sessionId: callSession.id,
        analytics
      });

      // Update real-time metrics in Redis
      await this.updateRealTimeMetrics(callSession, analytics);

    } catch (error) {
      this.logger.error('Failed to process call analytics', {
        sessionId: callSession.id,
        error
      });
    }
  }

  private async calculateCallAnalytics(callSession: CallSession): Promise<CallAnalytics> {
    const transcript = await this.getCallTranscript(callSession.id);
    
    // Basic metrics
    const totalDuration = callSession.duration || 0;
    const talkTime = await this.calculateTalkTime(transcript);
    const silenceTime = totalDuration - talkTime;
    
    // Advanced metrics
    const interruptionCount = this.calculateInterruptions(transcript);
    const sentimentScore = await this.calculateSentimentScore(transcript);
    const keywordsDetected = await this.extractKeywords(transcript);
    const successMetrics = await this.calculateSuccessMetrics(callSession, transcript);

    // Conversation quality metrics
    const conversationQuality = await this.assessConversationQuality(transcript);
    const responseLatencies = this.calculateResponseLatencies(transcript);
    const topicProgression = await this.analyzeTopicProgression(transcript);

    const analytics: CallAnalytics = {
      totalDuration,
      talkTime,
      silenceTime,
      interruptionCount,
      sentimentScore,
      keywordsDetected,
      successMetrics: {
        ...successMetrics,
        conversationQuality,
        averageResponseLatency: responseLatencies.average,
        topicCoverage: topicProgression.coverage,
        goalAchieved: successMetrics.goalAchieved || false,
        userSatisfactionScore: conversationQuality.userSatisfaction,
        assistantPerformance: conversationQuality.assistantPerformance
      }
    };

    return analytics;
  }

  private async getCallTranscript(sessionId: string): Promise<TranscriptEntry[]> {
    try {
      const transcript = await this.prisma.transcriptEntry.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
      });
      return transcript;
    } catch (error) {
      this.logger.error('Failed to get call transcript', { sessionId, error });
      return [];
    }
  }

  private async calculateTalkTime(transcript: TranscriptEntry[]): Promise<number> {
    if (transcript.length < 2) return 0;

    let talkTime = 0;
    const avgWordsPerMinute = 150; // German average
    
    for (const entry of transcript) {
      const wordCount = entry.text.split(/\s+/).length;
      const estimatedDuration = (wordCount / avgWordsPerMinute) * 60 * 1000; // ms
      talkTime += estimatedDuration;
    }
    
    return Math.round(talkTime);
  }

  private calculateInterruptions(transcript: TranscriptEntry[]): number {
    let interruptions = 0;
    
    for (let i = 1; i < transcript.length; i++) {
      const current = transcript[i];
      const previous = transcript[i - 1];
      
      // Check if speaker changed quickly (potential interruption)
      if (current.speaker !== previous.speaker) {
        const timeDiff = new Date(current.timestamp).getTime() - 
                        new Date(previous.timestamp).getTime();
        
        // If speaker change happened within 2 seconds, consider it an interruption
        if (timeDiff < 2000) {
          interruptions++;
        }
      }
    }
    
    return interruptions;
  }

  private async calculateSentimentScore(transcript: TranscriptEntry[]): Promise<number> {
    if (transcript.length === 0) return 0.5; // Neutral

    // Simple German sentiment analysis
    const sentimentKeywords = {
      positive: {
        words: ['danke', 'super', 'toll', 'gut', 'perfekt', 'prima', 'freue', 'gerne', 'zufrieden'],
        weight: 1
      },
      negative: {
        words: ['schlecht', 'ärger', 'problem', 'fehler', 'unzufrieden', 'nicht', 'falsch', 'schwierig'],
        weight: -1
      },
      very_positive: {
        words: ['ausgezeichnet', 'fantastisch', 'begeistert', 'hervorragend'],
        weight: 2
      },
      very_negative: {
        words: ['furchtbar', 'schrecklich', 'katastrophe', 'unmöglich'],
        weight: -2
      }
    };

    let totalScore = 0;
    let totalMessages = 0;

    for (const entry of transcript) {
      if (entry.speaker === 'user') { // Focus on user sentiment
        const text = entry.text.toLowerCase();
        let messageScore = 0;
        
        for (const [category, { words, weight }] of Object.entries(sentimentKeywords)) {
          for (const word of words) {
            const matches = (text.match(new RegExp(word, 'g')) || []).length;
            messageScore += matches * weight;
          }
        }
        
        totalScore += messageScore;
        totalMessages++;
      }
    }

    if (totalMessages === 0) return 0.5;
    
    // Normalize score to 0-1 range
    const avgScore = totalScore / totalMessages;
    return Math.max(0, Math.min(1, 0.5 + (avgScore * 0.1)));
  }

  private async extractKeywords(transcript: TranscriptEntry[]): Promise<string[]> {
    const fullText = transcript
      .map(entry => entry.text.toLowerCase())
      .join(' ');

    // German stopwords
    const stopwords = new Set([
      'der', 'die', 'das', 'und', 'ist', 'ich', 'sie', 'es', 'ein', 'eine',
      'mit', 'für', 'auf', 'von', 'zu', 'im', 'am', 'um', 'an', 'oder',
      'aber', 'wenn', 'dann', 'wie', 'was', 'wo', 'wer', 'wann', 'warum',
      'haben', 'sein', 'werden', 'können', 'müssen', 'sollen', 'wollen',
      'dass', 'nicht', 'nur', 'noch', 'auch', 'schon', 'mehr', 'sehr'
    ]);

    // Extract words and count frequencies
    const words = fullText
      .replace(/[^\w\säöü]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word));

    const wordCount = new Map<string, number>();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }

    // Return top 10 keywords
    return Array.from(wordCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async calculateSuccessMetrics(
    callSession: CallSession,
    transcript: TranscriptEntry[]
  ): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    // Call completion rate
    metrics.callCompleted = callSession.status === 'completed';
    
    // Information gathering success
    const extractedInfo = await this.extractInformation(transcript);
    metrics.informationGathered = Object.keys(extractedInfo).length;
    metrics.extractedInformation = extractedInfo;

    // User engagement
    const userMessages = transcript.filter(t => t.speaker === 'user').length;
    const assistantMessages = transcript.filter(t => t.speaker === 'assistant').length;
    metrics.userEngagement = userMessages > 0 ? userMessages / (userMessages + assistantMessages) : 0;

    // Goal achievement (based on call metadata)
    if (callSession.metadata.goalType) {
      metrics.goalAchieved = await this.assessGoalAchievement(
        callSession.metadata.goalType,
        transcript
      );
    }

    // Average response quality
    const assistantResponses = transcript.filter(t => t.speaker === 'assistant');
    metrics.averageConfidence = assistantResponses.length > 0 ?
      assistantResponses.reduce((sum, t) => sum + (t.confidence || 0), 0) / assistantResponses.length :
      0;

    return metrics;
  }

  private async extractInformation(transcript: TranscriptEntry[]): Promise<Record<string, any>> {
    const extracted: Record<string, any> = {};
    const fullText = transcript
      .filter(t => t.speaker === 'user')
      .map(t => t.text)
      .join(' ');

    // Information extraction patterns
    const patterns = {
      name: /(?:ich heiße|mein name ist|ich bin)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(?:\+49|0)[1-9][0-9]{1,14}/g,
      address: /(?:wohne|lebe|adresse)\s+.*?(?:[0-9]{5}|berlin|münchen|hamburg|köln)/gi,
      company: /(?:arbeite bei|firma|unternehmen)\s+([A-Z][A-Za-z\s]+)/gi,
      birthdate: /(?:geboren|geburtstag).*?([0-9]{1,2}\.?[0-9]{1,2}\.?[0-9]{2,4})/gi
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        extracted[key] = matches[0];
      }
    }

    return extracted;
  }

  private async assessGoalAchievement(goalType: string, transcript: TranscriptEntry[]): Promise<boolean> {
    const lastUserMessages = transcript
      .filter(t => t.speaker === 'user')
      .slice(-3)
      .map(t => t.text.toLowerCase());

    const successIndicators: Record<string, string[]> = {
      'appointment_booking': ['termin', 'datum', 'uhrzeit', 'bestätigt', 'gebucht'],
      'information_gathering': ['verstanden', 'notiert', 'angaben', 'daten'],
      'problem_solving': ['gelöst', 'funktioniert', 'danke', 'hilfe'],
      'lead_qualification': ['interessiert', 'angebot', 'kontakt', 'beratung']
    };

    const indicators = successIndicators[goalType] || [];
    const fullText = lastUserMessages.join(' ');

    return indicators.some(indicator => fullText.includes(indicator));
  }

  private async assessConversationQuality(transcript: TranscriptEntry[]): Promise<ConversationQuality> {
    const assistantMessages = transcript.filter(t => t.speaker === 'assistant');
    const userMessages = transcript.filter(t => t.speaker === 'user');

    // Assistant performance metrics
    const avgConfidence = assistantMessages.length > 0 ?
      assistantMessages.reduce((sum, t) => sum + (t.confidence || 0), 0) / assistantMessages.length :
      0;

    const avgResponseLength = assistantMessages.length > 0 ?
      assistantMessages.reduce((sum, t) => sum + t.text.length, 0) / assistantMessages.length :
      0;

    // User satisfaction indicators
    const positiveUserWords = userMessages
      .map(t => t.text.toLowerCase())
      .join(' ')
      .match(/danke|super|gut|toll|perfekt|ja|gerne/g);

    const userSatisfaction = positiveUserWords ? 
      Math.min(1, positiveUserWords.length / userMessages.length) : 0.5;

    // Overall quality score
    const qualityScore = (avgConfidence * 0.4) + (userSatisfaction * 0.4) + 
      (Math.min(avgResponseLength / 200, 1) * 0.2);

    return {
      overallScore: qualityScore,
      assistantPerformance: avgConfidence,
      userSatisfaction,
      responseAppropriateLength: avgResponseLength,
      conversationFlow: this.assessConversationFlow(transcript)
    };
  }

  private assessConversationFlow(transcript: TranscriptEntry[]): number {
    if (transcript.length < 4) return 0.5; // Not enough data

    let flowScore = 0;
    let transitions = 0;

    for (let i = 1; i < transcript.length; i++) {
      const current = transcript[i];
      const previous = transcript[i - 1];

      // Check for natural conversation flow
      if (current.speaker !== previous.speaker) {
        const timeDiff = new Date(current.timestamp).getTime() - 
                        new Date(previous.timestamp).getTime();

        // Good flow: 1-5 second response times
        if (timeDiff >= 1000 && timeDiff <= 5000) {
          flowScore += 1;
        } else if (timeDiff < 1000 || timeDiff > 10000) {
          flowScore += 0.5; // Penalize very quick or very slow responses
        }
        transitions++;
      }
    }

    return transitions > 0 ? flowScore / transitions : 0.5;
  }

  private calculateResponseLatencies(transcript: TranscriptEntry[]): ResponseLatencies {
    const latencies: number[] = [];
    
    for (let i = 1; i < transcript.length; i++) {
      const current = transcript[i];
      const previous = transcript[i - 1];
      
      if (current.speaker === 'assistant' && previous.speaker === 'user') {
        const latency = new Date(current.timestamp).getTime() - 
                       new Date(previous.timestamp).getTime();
        latencies.push(latency);
      }
    }

    if (latencies.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

    return {
      average: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      count: latencies.length
    };
  }

  private async analyzeTopicProgression(transcript: TranscriptEntry[]): Promise<TopicProgression> {
    // Simple topic analysis based on keyword changes
    const topics = new Set<string>();
    const progression: { topic: string; timestamp: Date }[] = [];

    const topicKeywords = {
      greeting: ['hallo', 'guten tag', 'hi', 'servus'],
      personal_info: ['name', 'adresse', 'telefon', 'email'],
      business: ['firma', 'unternehmen', 'job', 'arbeit'],
      appointment: ['termin', 'datum', 'zeit', 'kalender'],
      problem: ['problem', 'fehler', 'hilfe', 'schwierigkeit'],
      closing: ['danke', 'tschüss', 'auf wiedersehen', 'ende']
    };

    for (const entry of transcript) {
      const text = entry.text.toLowerCase();
      
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          if (!topics.has(topic)) {
            topics.add(topic);
            progression.push({ topic, timestamp: entry.timestamp });
          }
        }
      }
    }

    return {
      coverage: topics.size / Object.keys(topicKeywords).length,
      topics: Array.from(topics),
      progression
    };
  }

  private async updateRealTimeMetrics(
    callSession: CallSession,
    analytics: CallAnalytics
  ): Promise<void> {
    if (!this.redisClient) return;

    try {
      const timestamp = new Date().toISOString().slice(0, 13); // Hour precision
      const metricsKey = `metrics:${timestamp}`;

      // Update hourly metrics
      const multi = this.redisClient.multi();
      
      multi.hIncrBy(metricsKey, 'total_calls', 1);
      multi.hIncrBy(metricsKey, 'completed_calls', callSession.status === 'completed' ? 1 : 0);
      multi.hIncrByFloat(metricsKey, 'total_duration', analytics.totalDuration);
      multi.hIncrByFloat(metricsKey, 'sentiment_sum', analytics.sentimentScore);
      multi.expire(metricsKey, 86400 * 7); // Keep for 7 days
      
      await multi.exec();

      // Update system-wide metrics
      await this.updateSystemMetrics(analytics);

    } catch (error) {
      this.logger.error('Failed to update real-time metrics', { error });
    }
  }

  private async updateSystemMetrics(analytics: CallAnalytics): Promise<void> {
    try {
      const now = new Date();
      const metrics = {
        timestamp: now,
        averageLatency: 0, // Would be calculated from voice processing latency
        totalCalls: 1,
        activeCalls: await this.getActiveCallsCount(),
        errorRate: 0, // Would be calculated based on failed calls
        systemLoad: await this.getSystemLoad()
      };

      await this.prisma.systemMetrics.create({ data: metrics });
    } catch (error) {
      this.logger.error('Failed to update system metrics', { error });
    }
  }

  private async getActiveCallsCount(): Promise<number> {
    try {
      return await this.prisma.callSession.count({
        where: {
          status: { in: ['ringing', 'in_progress'] }
        }
      });
    } catch {
      return 0;
    }
  }

  private async getSystemLoad(): Promise<any> {
    const os = require('os');
    
    return {
      cpuUsage: os.loadavg(),
      memoryUsage: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      uptime: os.uptime()
    };
  }

  private async processMetricsQueue(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    const batchSize = 100;
    const batch = this.metricsQueue.splice(0, batchSize);

    for (const event of batch) {
      try {
        await this.processMetricsEvent(event);
      } catch (error) {
        this.logger.error('Failed to process metrics event', { event, error });
      }
    }
  }

  private async processMetricsEvent(event: MetricsEvent): Promise<void> {
    // Process different types of analytics events
    switch (event.type) {
      case 'call_started':
        await this.handleCallStartedMetrics(event);
        break;
      case 'call_completed':
        await this.handleCallCompletedMetrics(event);
        break;
      case 'assistant_response':
        await this.handleAssistantResponseMetrics(event);
        break;
      default:
        this.logger.warn('Unknown metrics event type', { type: event.type });
    }
  }

  private async handleCallStartedMetrics(event: MetricsEvent): Promise<void> {
    // Track call initiation metrics
    if (this.redisClient) {
      await this.redisClient.incr('calls:started:total');
      await this.redisClient.incr(`calls:started:${new Date().toISOString().slice(0, 10)}`);
    }
  }

  private async handleCallCompletedMetrics(event: MetricsEvent): Promise<void> {
    // Track call completion metrics
    if (this.redisClient) {
      await this.redisClient.incr('calls:completed:total');
      await this.redisClient.incr(`calls:completed:${new Date().toISOString().slice(0, 10)}`);
    }
  }

  private async handleAssistantResponseMetrics(event: MetricsEvent): Promise<void> {
    // Track assistant performance metrics
    if (event.data?.latency && this.redisClient) {
      await this.redisClient.lPush('response_latencies', event.data.latency.toString());
      await this.redisClient.lTrim('response_latencies', 0, 999); // Keep last 1000
    }
  }

  private async flushAnalyticsBuffer(): Promise<void> {
    if (this.analyticsBuffer.size === 0) return;

    const entries = Array.from(this.analyticsBuffer.entries());
    this.analyticsBuffer.clear();

    for (const [sessionId, analytics] of entries) {
      try {
        await this.prisma.callAnalytics.create({
          data: {
            sessionId,
            ...analytics
          }
        });
      } catch (error) {
        this.logger.error('Failed to save call analytics', { sessionId, error });
      }
    }

    this.logger.debug('Flushed analytics buffer', { count: entries.length });
  }

  async getAnalyticsDashboard(timeRange: string = '24h'): Promise<AnalyticsDashboard> {
    const endTime = new Date();
    const startTime = this.getStartTimeForRange(timeRange, endTime);

    const [
      totalCalls,
      completedCalls,
      averageDuration,
      averageSentiment,
      topKeywords,
      systemMetrics
    ] = await Promise.all([
      this.getTotalCalls(startTime, endTime),
      this.getCompletedCalls(startTime, endTime),
      this.getAverageDuration(startTime, endTime),
      this.getAverageSentiment(startTime, endTime),
      this.getTopKeywords(startTime, endTime),
      this.getLatestSystemMetrics()
    ]);

    return {
      timeRange,
      totalCalls,
      completedCalls,
      successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
      averageDuration,
      averageSentiment,
      topKeywords,
      systemHealth: {
        averageLatency: systemMetrics?.averageLatency || 0,
        activeCalls: systemMetrics?.activeCalls || 0,
        errorRate: systemMetrics?.errorRate || 0,
        systemLoad: systemMetrics?.systemLoad || {}
      }
    };
  }

  private getStartTimeForRange(range: string, endTime: Date): Date {
    const start = new Date(endTime);
    
    switch (range) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      default:
        start.setDate(start.getDate() - 1);
    }
    
    return start;
  }

  private async getTotalCalls(startTime: Date, endTime: Date): Promise<number> {
    return await this.prisma.callSession.count({
      where: {
        startTime: { gte: startTime, lte: endTime }
      }
    });
  }

  private async getCompletedCalls(startTime: Date, endTime: Date): Promise<number> {
    return await this.prisma.callSession.count({
      where: {
        startTime: { gte: startTime, lte: endTime },
        status: 'completed'
      }
    });
  }

  private async getAverageDuration(startTime: Date, endTime: Date): Promise<number> {
    const result = await this.prisma.callSession.aggregate({
      where: {
        startTime: { gte: startTime, lte: endTime },
        status: 'completed',
        duration: { not: null }
      },
      _avg: { duration: true }
    });

    return result._avg.duration || 0;
  }

  private async getAverageSentiment(startTime: Date, endTime: Date): Promise<number> {
    const result = await this.prisma.callAnalytics.aggregate({
      where: {
        createdAt: { gte: startTime, lte: endTime }
      },
      _avg: { sentimentScore: true }
    });

    return result._avg.sentimentScore || 0.5;
  }

  private async getTopKeywords(startTime: Date, endTime: Date): Promise<string[]> {
    const analytics = await this.prisma.callAnalytics.findMany({
      where: {
        createdAt: { gte: startTime, lte: endTime }
      },
      select: { keywordsDetected: true }
    });

    const keywordCounts = new Map<string, number>();
    
    for (const analytic of analytics) {
      for (const keyword of analytic.keywordsDetected) {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      }
    }

    return Array.from(keywordCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  private async getLatestSystemMetrics(): Promise<any> {
    return await this.prisma.systemMetrics.findFirst({
      orderBy: { timestamp: 'desc' }
    });
  }

  addMetricsEvent(event: MetricsEvent): void {
    this.metricsQueue.push({
      ...event,
      timestamp: new Date()
    });
  }

  async destroy(): Promise<void> {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
    
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    
    await this.prisma.$disconnect();
  }
}

// Types
interface ConversationQuality {
  overallScore: number;
  assistantPerformance: number;
  userSatisfaction: number;
  responseAppropriateLength: number;
  conversationFlow: number;
}

interface ResponseLatencies {
  average: number;
  min: number;
  max: number;
  count: number;
}

interface TopicProgression {
  coverage: number;
  topics: string[];
  progression: { topic: string; timestamp: Date }[];
}

interface MetricsEvent {
  type: string;
  sessionId?: string;
  data?: Record<string, any>;
  timestamp?: Date;
}

interface AnalyticsDashboard {
  timeRange: string;
  totalCalls: number;
  completedCalls: number;
  successRate: number;
  averageDuration: number;
  averageSentiment: number;
  topKeywords: string[];
  systemHealth: {
    averageLatency: number;
    activeCalls: number;
    errorRate: number;
    systemLoad: any;
  };
}