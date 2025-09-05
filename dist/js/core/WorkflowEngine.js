import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import axios from 'axios';
export class WorkflowEngine extends EventEmitter {
    constructor() {
        super();
        this.executionStack = new Map();
        this.nodeExecutors = new Map();
        this.logger = new Logger('WorkflowEngine');
        this.initializeNodeExecutors();
    }
    initializeNodeExecutors() {
        this.nodeExecutors.set('start', new StartNodeExecutor());
        this.nodeExecutors.set('conversation', new ConversationNodeExecutor());
        this.nodeExecutors.set('api_request', new APIRequestNodeExecutor());
        this.nodeExecutors.set('transfer_call', new TransferCallNodeExecutor());
        this.nodeExecutors.set('end_call', new EndCallNodeExecutor());
        this.nodeExecutors.set('tool', new ToolNodeExecutor());
        this.nodeExecutors.set('condition', new ConditionNodeExecutor());
    }
    async executeWorkflow(workflow, context, startNodeId) {
        const executionId = this.generateExecutionId();
        const startTime = Date.now();
        try {
            this.logger.info('Workflow execution started', {
                workflowId: workflow.id,
                executionId,
                sessionId: context.id
            });
            const executionContext = {
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
        }
        catch (error) {
            this.logger.error('Workflow execution failed', {
                workflowId: workflow.id,
                executionId,
                error
            });
            this.emit('workflow_error', workflow.id, error);
            return {
                success: false,
                executionId,
                error: error,
                executionTime: Date.now() - startTime
            };
        }
        finally {
            this.executionStack.delete(executionId);
        }
    }
    async executeNode(node, context) {
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
        }
        catch (error) {
            this.logger.error('Node execution failed', {
                nodeId: node.id,
                nodeType: node.type,
                error
            });
            return {
                type: 'error',
                error: error,
                nodeId: node.id
            };
        }
    }
    async executeNodeChain(currentNode, context) {
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
                const conditionNextNode = await this.findNextNodeForCondition(currentNode, result, context);
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
    async findNextNode(currentNode, result, context) {
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
    async findNextNodeForCondition(currentNode, result, context) {
        const edges = context.workflow.edges.filter(e => e.source === currentNode.id);
        // For condition nodes, find the edge that matches the condition result
        for (const edge of edges) {
            if (edge.condition) {
                if (edge.condition.type === 'conditional' && edge.condition.expression) {
                    // Evaluate the edge condition against the node result
                    if (await this.evaluateConditionExpression(edge.condition.expression, result, context)) {
                        const nextNode = context.workflow.nodes.find(n => n.id === edge.target);
                        if (nextNode) {
                            return nextNode;
                        }
                    }
                }
            }
            else {
                // Default edge (no condition)
                const nextNode = context.workflow.nodes.find(n => n.id === edge.target);
                if (nextNode) {
                    return nextNode;
                }
            }
        }
        return null;
    }
    async evaluateEdgeCondition(edge, nodeResult, context) {
        if (!edge.condition || edge.condition.type === 'always') {
            return true;
        }
        if (edge.condition.type === 'conditional' && edge.condition.expression) {
            return this.evaluateConditionExpression(edge.condition.expression, nodeResult, context);
        }
        return false;
    }
    async evaluateConditionExpression(expression, nodeResult, context) {
        try {
            // Simple expression evaluation
            // In a production system, you'd want a more robust expression evaluator
            // Replace variables in the expression
            let evaluatedExpression = expression;
            // Replace context variables
            for (const [key, value] of context.variables) {
                evaluatedExpression = evaluatedExpression.replace(new RegExp(`{{${key}}}`, 'g'), JSON.stringify(value));
            }
            // Replace node result variables
            if (nodeResult.variables) {
                for (const [key, value] of Object.entries(nodeResult.variables)) {
                    evaluatedExpression = evaluatedExpression.replace(new RegExp(`{{${key}}}`, 'g'), JSON.stringify(value));
                }
            }
            // Simple boolean expression evaluation
            // Note: In production, use a proper expression parser like math.js or similar
            const result = eval(evaluatedExpression);
            return Boolean(result);
        }
        catch (error) {
            this.logger.error('Failed to evaluate condition expression', {
                expression,
                error
            });
            return false;
        }
    }
    async pauseExecution(executionId) {
        const context = this.executionStack.get(executionId);
        if (context) {
            context.isPaused = true;
            this.logger.info('Workflow execution paused', { executionId });
        }
    }
    async resumeExecution(executionId) {
        const context = this.executionStack.get(executionId);
        if (context) {
            context.isPaused = false;
            this.logger.info('Workflow execution resumed', { executionId });
        }
    }
    async stopExecution(executionId) {
        this.executionStack.delete(executionId);
        this.logger.info('Workflow execution stopped', { executionId });
    }
    getExecutionStatus(executionId) {
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
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
// Node Executors
class NodeExecutor {
}
class StartNodeExecutor extends NodeExecutor {
    async execute(node, context) {
        return {
            type: 'continue',
            nodeId: node.id,
            response: node.data.firstMessage || 'Starting conversation...',
            variables: context.workflow.variables.reduce((acc, variable) => {
                acc[variable.name] = variable.defaultValue;
                return acc;
            }, {})
        };
    }
}
class ConversationNodeExecutor extends NodeExecutor {
    async execute(node, context) {
        // In a real implementation, this would trigger the LLM processing
        const response = await this.generateConversationResponse(node, context);
        // Extract variables if configured
        const variables = {};
        if (node.data.variables) {
            for (const varExtraction of node.data.variables) {
                const extractedValue = await this.extractVariable(varExtraction, response, context);
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
    async generateConversationResponse(node, context) {
        // This would integrate with the LLM provider
        // For now, return the configured prompt or first message
        return node.data.firstMessage || node.data.prompt || 'Hello, how can I help you?';
    }
    async extractVariable(extraction, response, context) {
        // Simple variable extraction based on prompt
        // In production, this would use NLP techniques or regex patterns
        return null;
    }
}
class APIRequestNodeExecutor extends NodeExecutor {
    async execute(node, context) {
        const config = node.data.apiConfig;
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
            const variables = {};
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
        }
        catch (error) {
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
                error: error
            };
        }
    }
    replaceVariables(input, context) {
        if (typeof input === 'string') {
            let result = input;
            for (const [key, value] of context.variables) {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
            return result;
        }
        else if (typeof input === 'object' && input !== null) {
            const result = {};
            for (const [key, value] of Object.entries(input)) {
                result[key] = this.replaceVariables(value, context);
            }
            return result;
        }
        return input;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}
class TransferCallNodeExecutor extends NodeExecutor {
    async execute(node, context) {
        const config = node.data.transferConfig;
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
    async execute(node, context) {
        return {
            type: 'end',
            nodeId: node.id,
            response: node.data.firstMessage || 'Thank you for calling. Goodbye!'
        };
    }
}
class ToolNodeExecutor extends NodeExecutor {
    async execute(node, context) {
        const config = node.data.toolConfig;
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
        }
        catch (error) {
            return {
                type: 'error',
                nodeId: node.id,
                error: error
            };
        }
    }
    async executeTool(config, context) {
        // Tool execution would be implemented here
        return {
            variables: {},
            metadata: {}
        };
    }
}
class ConditionNodeExecutor extends NodeExecutor {
    async execute(node, context) {
        const conditions = node.data.conditions;
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
    async evaluateCondition(condition, context) {
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
        }
        catch (error) {
            return false;
        }
    }
    evaluateLogicalCondition(expression, context) {
        // Simple logical condition evaluation
        // In production, use a proper expression evaluator
        try {
            let evaluatedExpression = expression;
            for (const [key, value] of context.variables) {
                evaluatedExpression = evaluatedExpression.replace(new RegExp(`{{${key}}}`, 'g'), JSON.stringify(value));
            }
            return Boolean(eval(evaluatedExpression));
        }
        catch {
            return false;
        }
    }
    evaluateCombinedCondition(expression, context) {
        // Combined condition evaluation (logical + AI)
        return this.evaluateLogicalCondition(expression, context);
    }
}
//# sourceMappingURL=WorkflowEngine.js.map