import { EventEmitter } from 'events';
import { CallSession } from '../types';
export declare class SquadOrchestrator extends EventEmitter {
    private logger;
    private llmProvider;
    private prisma;
    private activeSquadSessions;
    private contextStore;
    constructor();
    processMessage(squadId: string, userMessage: string, callSession: CallSession): Promise<string>;
    private initializeSquadSession;
    private determineTargetAssistant;
    private evaluateRoutingRule;
    private evaluateAICondition;
    private evaluateLogicalCondition;
    private evaluateCombinedCondition;
    private performAssistantTransfer;
    private preserveConversationContext;
    private generateContextSummary;
    private generateAssistantResponse;
    private updateConversationContext;
    private extractAndStoreVariables;
    endSquadSession(sessionId: string): Promise<void>;
    getSquadSessionStatus(sessionId: string): SquadSessionStatus | null;
}
interface SquadSessionStatus {
    squadSessionId: string;
    squadId: string;
    callSessionId: string;
    currentAssistantId: string;
    transferCount: number;
    messageCount: number;
    startTime: Date;
    duration: number;
}
export {};
