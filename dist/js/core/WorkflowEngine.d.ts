import { EventEmitter } from 'events';
import { WorkflowNode, Workflow, CallSession } from '../types';
export declare class WorkflowEngine extends EventEmitter {
    private logger;
    private executionStack;
    private nodeExecutors;
    constructor();
    private initializeNodeExecutors;
    executeWorkflow(workflow: Workflow, context: CallSession, startNodeId?: string): Promise<WorkflowExecutionResult>;
    executeNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult>;
    private executeNodeChain;
    private findNextNode;
    private findNextNodeForCondition;
    private evaluateEdgeCondition;
    private evaluateConditionExpression;
    pauseExecution(executionId: string): Promise<void>;
    resumeExecution(executionId: string): Promise<void>;
    stopExecution(executionId: string): Promise<void>;
    getExecutionStatus(executionId: string): ExecutionStatus | null;
    private generateExecutionId;
}
interface ExecutionContext {
    executionId: string;
    workflowId: string;
    sessionId: string;
    variables: Map<string, any>;
    visitedNodes: Set<string>;
    nodeResults: Map<string, NodeExecutionResult>;
    callSession: CallSession;
    workflow: Workflow;
    isPaused?: boolean;
    startTime?: number;
}
interface NodeExecutionResult {
    type: 'continue' | 'end' | 'error' | 'transfer' | 'condition';
    nodeId: string;
    response?: string;
    variables?: Record<string, any>;
    metadata?: Record<string, any>;
    error?: Error;
}
interface WorkflowExecutionResult {
    success: boolean;
    executionId: string;
    result?: NodeExecutionResult;
    error?: Error;
    executionTime: number;
    visitedNodes?: string[];
    variables?: Record<string, any>;
}
interface ExecutionStatus {
    executionId: string;
    workflowId: string;
    sessionId: string;
    isPaused: boolean;
    visitedNodes: string[];
    variables: Record<string, any>;
    startTime: number;
}
export {};
