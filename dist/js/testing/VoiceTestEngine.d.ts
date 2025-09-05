import { EventEmitter } from 'events';
import { VoiceTest, TestResult } from '../types';
import { VoiceAIPlatform } from '../core/VoiceAIPlatform';
export declare class VoiceTestEngine extends EventEmitter {
    private logger;
    private voiceAI;
    private prisma;
    private sttProvider;
    private ttsProvider;
    private runningTests;
    private simulatedAgents;
    constructor(voiceAIPlatform: VoiceAIPlatform);
    private initializeSimulatedAgents;
    runTestSuite(testSuiteId: string): Promise<TestSuiteResult>;
    runSingleTest(test: VoiceTest): Promise<TestResult>;
    private createSimulatedCallSession;
    private executeTestScript;
    private executeTestStep;
    private executeSimulatedSpeech;
    private executeWait;
    private executeExpectation;
    private executeVerification;
    private validateResponse;
    private performVerification;
    private verifyConversationFlow;
    private verifyInformationExtraction;
    private verifyResponseQuality;
    private verifyErrorHandling;
    private evaluateTestOutcomes;
    private extractActualValue;
    private calculateOutcomeScore;
    private calculateStringSimilarity;
    private analyzeSentiment;
    private bufferToStream;
    private delay;
    stopTest(executionId: string): Promise<void>;
    getRunningTests(): TestExecution[];
}
interface TestExecution {
    id: string;
    testId: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'passed' | 'failed' | 'cancelled';
    stepResults: any[];
    variables: Map<string, any>;
}
interface TestSuiteResult {
    testSuiteId: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageScore: number;
    executionTime: number;
    results: TestResult[];
    timestamp: Date;
}
export {};
