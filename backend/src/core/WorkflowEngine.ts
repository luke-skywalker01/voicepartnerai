import { EventEmitter } from 'events';
import { WorkflowNode, WorkflowEdge, Workflow, CallSession, NodeCondition, APIRequestConfig, TransferConfig, ToolConfig } from '../types';
import { Logger } from '../utils/Logger';
import axios from 'axios';

export class WorkflowEngine extends EventEmitter {
  private logger: Logger;
  private executionStack: Map<string, ExecutionContext> = new Map();
  private nodeExecutors: Map<string, NodeExecutor> = new Map();

  constructor() {
    super();
    this.logger = new Logger('WorkflowEngine');
    this.initializeNodeExecutors();
  }

  private initializeNodeExecutors(): void {
    this.nodeExecutors.set('start', new StartNodeExecutor());
    this.nodeExecutors.set('conversation', new ConversationNodeExecutor());
    this.nodeExecutors.set('api_request', new APIRequestNodeExecutor());
    this.nodeExecutors.set('transfer_call', new TransferCallNodeExecutor());
    this.nodeExecutors.set('end_call', new EndCallNodeExecutor());
    this.nodeExecutors.set('tool', new ToolNodeExecutor());
    this.nodeExecutors.set('condition', new ConditionNodeExecutor());
  }

  async executeWorkflow(
    workflow: Workflow,
    context: CallSession,
    startNodeId?: string
  ): Promise<WorkflowExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    try {
      this.logger.info('Workflow execution started', {
        workflowId: workflow.id,
        executionId,
        sessionId: context.id
      });

      const executionContext: ExecutionContext = {
        executionId,
        workflowId: workflow.id,
        sessionId: context.id,
        variables: new Map(),
        visitedNodes: new Set(),
        nodeResults: new Map(),
        callSession: context,
        workflow
      };

      this.executionStack.set(executionId, executionContext);

      // Find start node
      const startNode = startNodeId 
        ? workflow.nodes.find(n => n.id === startNodeId)
        : workflow.nodes.find(n => n.type === 'start');

      if (!startNode) {
        throw new Error('Start node not found in workflow');
      }

      // Execute workflow from start node
      const result = await this.executeNodeChain(startNode, executionContext);

      const executionTime = Date.now() - startTime;

      this.logger.info('Workflow execution completed', {
        workflowId: workflow.id,
        executionId,
        executionTime,
        result: result.type
      });

      this.emit('workflow_completed', workflow.id, result);

      return {
        success: true,
        executionId,
        result,
        executionTime,
        visitedNodes: Array.from(executionContext.visitedNodes),
        variables: Object.fromEntries(executionContext.variables)
      };

    } catch (error) {
      this.logger.error('Workflow execution failed', {
        workflowId: workflow.id,
        executionId,
        error
      });

      this.emit('workflow_error', workflow.id, error);

      return {
        success: false,
        executionId,
        error: error as Error,
        executionTime: Date.now() - startTime
      };
    } finally {
      this.executionStack.delete(executionId);
    }
  }

  async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    try {
      // Prevent infinite loops
      if (context.visitedNodes.has(node.id)) {
        this.logger.warn('Node already visited, preventing loop', {
          nodeId: node.id,
          executionId: context.executionId
        });
        return {
          type: 'error',
          error: new Error('Workflow loop detected'),
          nodeId: node.id
        };
      }

      context.visitedNodes.add(node.id);

      this.logger.debug('Executing node', {
        nodeId: node.id,
        nodeType: node.type,
        executionId: context.executionId
      });

      const executor = this.nodeExecutors.get(node.type);
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.type}`);
      }

      const result = await executor.execute(node, context);
      context.nodeResults.set(node.id, result);

      // Update variables if node produced any
      if (result.variables) {
        for (const [key, value] of Object.entries(result.variables)) {
          context.variables.set(key, value);
        }
      }

      this.logger.debug('Node execution completed', {
        nodeId: node.id,
        resultType: result.type,
        executionId: context.executionId
      });

      return result;

    } catch (error) {
      this.logger.error('Node execution failed', {
        nodeId: node.id,
        nodeType: node.type,
        error
      });

      return {
        type: 'error',
        error: error as Error,
        nodeId: node.id
      };
    }
  }

  private async executeNodeChain(
    currentNode: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const result = await this.executeNode(currentNode, context);

    // Handle different result types
    switch (result.type) {
      case 'continue':
        // Find next node based on edges
        const nextNode = await this.findNextNode(currentNode, result, context);
        if (nextNode) {
          return this.executeNodeChain(nextNode, context);
        }
        return result;

      case 'end':
        return result;

      case 'transfer':
        // Transfer call and end workflow
        return result;

      case 'error':
        // Handle error based on workflow settings
        if (context.workflow.settings.errorHandling === 'continue') {
          const nextNode = await this.findNextNode(currentNode, result, context);
          if (nextNode) {
            return this.executeNodeChain(nextNode, context);
          }
        }
        return result;

      case 'condition':
        // Condition nodes have special handling
        const conditionNextNode = await this.findNextNodeForCondition(
          currentNode,
          result,
          context
        );
        if (conditionNextNode) {
          return this.executeNodeChain(conditionNextNode, context);
        }
        return result;

      default:
        this.logger.warn('Unknown node result type', {
          type: result.type,
          nodeId: currentNode.id
        });
        return result;
    }
  }

  private async findNextNode(
    currentNode: WorkflowNode,
    result: NodeExecutionResult,
    context: ExecutionContext
  ): Promise<WorkflowNode | null> {
    const edges = context.workflow.edges.filter(e => e.source === currentNode.id);
    
    for (const edge of edges) {
      if (await this.evaluateEdgeCondition(edge, result, context)) {
        const nextNode = context.workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          return nextNode;
        }
      }
    }

    return null;
  }

  private async findNextNodeForCondition(
    currentNode: WorkflowNode,
    result: NodeExecutionResult,
    context: ExecutionContext
  ): Promise<WorkflowNode | null> {
    const edges = context.workflow.edges.filter(e => e.source === currentNode.id);
    
    // For condition nodes, find the edge that matches the condition result
    for (const edge of edges) {
      if (edge.condition) {
        if (edge.condition.type === 'conditional' && edge.condition.expression) {
          // Evaluate the edge condition against the node result
          if (await this.evaluateConditionExpression(
            edge.condition.expression,
            result,
            context
          )) {
            const nextNode = context.workflow.nodes.find(n => n.id === edge.target);
            if (nextNode) {
              return nextNode;
            }
          }
        }
      } else {
        // Default edge (no condition)
        const nextNode = context.workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          return nextNode;
        }
      }
    }

    return null;
  }

  private async evaluateEdgeCondition(
    edge: WorkflowEdge,
    nodeResult: NodeExecutionResult,
    context: ExecutionContext
  ): Promise<boolean> {
    if (!edge.condition || edge.condition.type === 'always') {
      return true;
    }

    if (edge.condition.type === 'conditional' && edge.condition.expression) {
      return this.evaluateConditionExpression(
        edge.condition.expression,
        nodeResult,
        context
      );
    }

    return false;
  }

  private async evaluateConditionExpression(
    expression: string,
    nodeResult: NodeExecutionResult,
    context: ExecutionContext
  ): Promise<boolean> {
    try {
      // Simple expression evaluation
      // In a production system, you'd want a more robust expression evaluator
      
      // Replace variables in the expression
      let evaluatedExpression = expression;
      
      // Replace context variables
      for (const [key, value] of context.variables) {
        evaluatedExpression = evaluatedExpression.replace(
          new RegExp(`{{${key}}}`, 'g'),
          JSON.stringify(value)
        );
      }

      // Replace node result variables
      if (nodeResult.variables) {
        for (const [key, value] of Object.entries(nodeResult.variables)) {
          evaluatedExpression = evaluatedExpression.replace(
            new RegExp(`{{${key}}}`, 'g'),
            JSON.stringify(value)
          );
        }
      }

      // Simple boolean expression evaluation
      // Note: In production, use a proper expression parser like math.js or similar
      const result = eval(evaluatedExpression);
      return Boolean(result);

    } catch (error) {
      this.logger.error('Failed to evaluate condition expression', {
        expression,
        error
      });
      return false;
    }
  }

  async pauseExecution(executionId: string): Promise<void> {
    const context = this.executionStack.get(executionId);
    if (context) {
      context.isPaused = true;
      this.logger.info('Workflow execution paused', { executionId });
    }
  }

  async resumeExecution(executionId: string): Promise<void> {
    const context = this.executionStack.get(executionId);
    if (context) {
      context.isPaused = false;
      this.logger.info('Workflow execution resumed', { executionId });
    }
  }

  async stopExecution(executionId: string): Promise<void> {
    this.executionStack.delete(executionId);
    this.logger.info('Workflow execution stopped', { executionId });
  }

  getExecutionStatus(executionId: string): ExecutionStatus | null {
    const context = this.executionStack.get(executionId);
    if (!context) {
      return null;
    }

    return {
      executionId,
      workflowId: context.workflowId,
      sessionId: context.sessionId,
      isPaused: context.isPaused || false,
      visitedNodes: Array.from(context.visitedNodes),
      variables: Object.fromEntries(context.variables),
      startTime: context.startTime || Date.now()
    };
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Node Executors
abstract class NodeExecutor {
  abstract execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult>;
}

class StartNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      type: 'continue',
      nodeId: node.id,
      response: node.data.firstMessage || 'Starting conversation...',
      variables: context.workflow.variables.reduce((acc, variable) => {
        acc[variable.name] = variable.defaultValue;
        return acc;
      }, {} as Record<string, any>)
    };
  }
}

class ConversationNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    // In a real implementation, this would trigger the LLM processing
    const response = await this.generateConversationResponse(node, context);
    
    // Extract variables if configured
    const variables: Record<string, any> = {};
    if (node.data.variables) {
      for (const varExtraction of node.data.variables) {
        const extractedValue = await this.extractVariable(
          varExtraction,
          response,
          context
        );
        if (extractedValue !== null) {
          variables[varExtraction.name] = extractedValue;
        }
      }
    }

    return {
      type: 'continue',
      nodeId: node.id,
      response,
      variables
    };
  }

  private async generateConversationResponse(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string> {
    // This would integrate with the LLM provider
    // For now, return the configured prompt or first message
    return node.data.firstMessage || node.data.prompt || 'Hello, how can I help you?';
  }

  private async extractVariable(
    extraction: any,
    response: string,
    context: ExecutionContext
  ): Promise<any> {
    // Simple variable extraction based on prompt
    // In production, this would use NLP techniques or regex patterns
    return null;
  }
}

class APIRequestNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.apiConfig as APIRequestConfig;
    if (!config) {
      throw new Error('API configuration not found for API request node');
    }

    try {
      // Replace variables in URL and body
      const url = this.replaceVariables(config.url, context);
      const body = config.body ? this.replaceVariables(config.body, context) : undefined;

      const response = await axios({
        method: config.method,
        url,
        headers: config.headers,
        data: body,
        timeout: 10000
      });

      // Map response data if configured
      const variables: Record<string, any> = {};
      if (config.responseMapping) {
        for (const [key, path] of Object.entries(config.responseMapping)) {
          variables[key] = this.getNestedValue(response.data, path);
        }
      }

      return {
        type: 'continue',
        nodeId: node.id,
        response: `API request completed successfully`,
        variables,
        metadata: {
          apiResponse: response.data,
          status: response.status
        }
      };

    } catch (error) {
      if (config.errorHandling === 'ignore') {
        return {
          type: 'continue',
          nodeId: node.id,
          response: 'API request failed but continuing...'
        };
      }

      return {
        type: 'error',
        nodeId: node.id,
        error: error as Error
      };
    }
  }

  private replaceVariables(input: any, context: ExecutionContext): any {
    if (typeof input === 'string') {
      let result = input;
      for (const [key, value] of context.variables) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
      return result;
    } else if (typeof input === 'object' && input !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(input)) {
        result[key] = this.replaceVariables(value, context);
      }
      return result;
    }
    return input;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

class TransferCallNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.transferConfig as TransferConfig;
    if (!config) {
      throw new Error('Transfer configuration not found for transfer node');
    }

    return {
      type: 'transfer',
      nodeId: node.id,
      response: config.message || 'Transferring your call...',
      metadata: {
        transferTo: config.phoneNumber,
        timeout: config.timeout,
        fallback: config.fallback
      }
    };
  }
}

class EndCallNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      type: 'end',
      nodeId: node.id,
      response: node.data.firstMessage || 'Thank you for calling. Goodbye!'
    };
  }
}

class ToolNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.toolConfig as ToolConfig;
    if (!config) {
      throw new Error('Tool configuration not found for tool node');
    }

    try {
      // Execute the configured tool
      // This would integrate with the tool execution system
      const result = await this.executeTool(config, context);

      return {
        type: 'continue',
        nodeId: node.id,
        response: `Tool ${config.toolId} executed successfully`,
        variables: result.variables,
        metadata: result.metadata
      };

    } catch (error) {
      return {
        type: 'error',
        nodeId: node.id,
        error: error as Error
      };
    }
  }

  private async executeTool(config: ToolConfig, context: ExecutionContext): Promise<any> {
    // Tool execution would be implemented here
    return {
      variables: {},
      metadata: {}
    };
  }
}

class ConditionNodeExecutor extends NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const conditions = node.data.conditions as NodeCondition[];
    if (!conditions || conditions.length === 0) {
      throw new Error('No conditions found for condition node');
    }

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      if (result) {
        return {
          type: 'condition',
          nodeId: node.id,
          response: `Condition ${condition.description || 'met'}`,
          metadata: {
            conditionMet: true,
            conditionType: condition.type
          }
        };
      }
    }

    return {
      type: 'condition',
      nodeId: node.id,
      response: 'No conditions met',
      metadata: {
        conditionMet: false
      }
    };
  }

  private async evaluateCondition(
    condition: NodeCondition,
    context: ExecutionContext
  ): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'ai':
          // AI-based condition evaluation would integrate with LLM
          return false;
        case 'logical':
          // Logical condition evaluation
          return this.evaluateLogicalCondition(condition.expression, context);
        case 'combined':
          // Combined condition evaluation
          return this.evaluateCombinedCondition(condition.expression, context);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private evaluateLogicalCondition(expression: string, context: ExecutionContext): boolean {
    // Simple logical condition evaluation
    // In production, use a proper expression evaluator
    try {
      let evaluatedExpression = expression;
      
      for (const [key, value] of context.variables) {
        evaluatedExpression = evaluatedExpression.replace(
          new RegExp(`{{${key}}}`, 'g'),
          JSON.stringify(value)
        );
      }

      return Boolean(eval(evaluatedExpression));
    } catch {
      return false;
    }
  }

  private evaluateCombinedCondition(expression: string, context: ExecutionContext): boolean {
    // Combined condition evaluation (logical + AI)
    return this.evaluateLogicalCondition(expression, context);
  }
}

// Types
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