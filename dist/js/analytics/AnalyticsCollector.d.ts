import { EventEmitter } from 'events';
import { CallSession } from '../types';
export declare class AnalyticsCollector extends EventEmitter {
    private logger;
    private prisma;
    private redisClient;
    private analyticsBuffer;
    private metricsQueue;
    private processInterval;
    constructor();
    private initializeRedis;
    private startProcessingLoop;
    processCallAnalytics(callSession: CallSession): Promise<void>;
    private calculateCallAnalytics;
    private getCallTranscript;
    private calculateTalkTime;
    private calculateInterruptions;
    private calculateSentimentScore;
    private extractKeywords;
    private calculateSuccessMetrics;
    private extractInformation;
    private assessGoalAchievement;
    private assessConversationQuality;
    private assessConversationFlow;
    private calculateResponseLatencies;
    private analyzeTopicProgression;
    private updateRealTimeMetrics;
    private updateSystemMetrics;
    private getActiveCallsCount;
    private getSystemLoad;
    private processMetricsQueue;
    private processMetricsEvent;
    private handleCallStartedMetrics;
    private handleCallCompletedMetrics;
    private handleAssistantResponseMetrics;
    private flushAnalyticsBuffer;
    getAnalyticsDashboard(timeRange?: string): Promise<AnalyticsDashboard>;
    private getStartTimeForRange;
    private getTotalCalls;
    private getCompletedCalls;
    private getAverageDuration;
    private getAverageSentiment;
    private getTopKeywords;
    private getLatestSystemMetrics;
    addMetricsEvent(event: MetricsEvent): void;
    destroy(): Promise<void>;
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
export {};
