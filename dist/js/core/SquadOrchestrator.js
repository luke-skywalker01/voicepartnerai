import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { LLMProvider } from './providers/LLMProvider';
import { PrismaClient } from '@prisma/client';
export class SquadOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.activeSquadSessions = new Map();
        this.contextStore = new Map();
        this.logger = new Logger('SquadOrchestrator');
        this.llmProvider = new LLMProvider();
        this.prisma = new PrismaClient();
    }
    async processMessage(squadId, userMessage, callSession) {
        try {
            this.logger.info('Processing squad message', {
                squadId,
                sessionId: callSession.id,
                messageLength: userMessage.length
            });
            // Get or create squad session
            let squadSession = this.activeSquadSessions.get(callSession.id);
            if (!squadSession) {
                squadSession = await this.initializeSquadSession(squadId, callSession);
                this.activeSquadSessions.set(callSession.id, squadSession);
            }
            // Update conversation context
            await this.updateConversationContext(squadSession, userMessage, 'user');
            // Determine which assistant should respond
            const targetAssistant = await this.determineTargetAssistant(squadSession, userMessage);
            if (!targetAssistant) {
                throw new Error('No suitable assistant found for the request');
            }
            // Check if we need to transfer between assistants
            if (targetAssistant.id !== squadSession.currentAssistantId) {
                await this.performAssistantTransfer(squadSession, targetAssistant);
            }
            // Generate response from the target assistant
            const response = await this.generateAssistantResponse(targetAssistant, squadSession, userMessage);
            // Update conversation context with assistant response
            await this.updateConversationContext(squadSession, response, 'assistant');
            this.logger.info('Squad message processed successfully', {
                squadId,
                sessionId: callSession.id,
                assistantId: targetAssistant.id,
                responseLength: response.length
            });
            return response;
        }
        catch (error) {
            this.logger.error('Failed to process squad message', {
                squadId,
                sessionId: callSession.id,
                error
            });
            throw error;
        }
    }
    async initializeSquadSession(squadId, callSession) {
        // Load squad configuration
        const squad = await this.prisma.squad.findUnique({
            where: { id: squadId },
            include: {
                assistants: {
                    include: {
                        assistant: true
                    },
                    orderBy: { priority: 'asc' }
                },
                routingRules: true
            }
        });
        if (!squad) {
            throw new Error(`Squad ${squadId} not found`);
        }
        // Determine initial assistant (highest priority)
        const initialAssistant = squad.assistants[0];
        if (!initialAssistant) {
            throw new Error(`Squad ${squadId} has no assistants configured`);
        }
        const squadSession = {
            id: `squad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            squadId,
            callSessionId: callSession.id,
            currentAssistantId: initialAssistant.assistantId,
            conversationHistory: [],
            transferHistory: [],
            context: new Map(),
            startTime: new Date(),
            squad
        };
        // Initialize conversation context
        this.contextStore.set(squadSession.id, {
            sessionId: squadSession.id,
            messages: [],
            variables: new Map(),
            assistantStates: new Map(),
            sharedKnowledge: new Map()
        });
        this.logger.info('Squad session initialized', {
            squadSessionId: squadSession.id,
            squadId,
            initialAssistantId: initialAssistant.assistantId
        });
        return squadSession;
    }
    async determineTargetAssistant(squadSession, userMessage) {
        const { squad } = squadSession;
        // Check routing rules first
        for (const rule of squad.routingRules) {
            const shouldRoute = await this.evaluateRoutingRule(rule, squadSession, userMessage);
            if (shouldRoute) {
                const targetAssistant = await this.prisma.voiceAssistant.findUnique({
                    where: { id: rule.targetAssistantId }
                });
                if (targetAssistant) {
                    this.logger.info('Routing rule matched', {
                        ruleId: rule.id,
                        targetAssistantId: rule.targetAssistantId,
                        squadSessionId: squadSession.id
                    });
                    return targetAssistant;
                }
            }
        }
        // If no routing rule matches, use current assistant
        const currentAssistant = await this.prisma.voiceAssistant.findUnique({
            where: { id: squadSession.currentAssistantId }
        });
        return currentAssistant;
    }
    async evaluateRoutingRule(rule, squadSession, userMessage) {
        const condition = rule.condition;
        try {
            switch (condition.type) {
                case 'ai':
                    return await this.evaluateAICondition(condition, squadSession, userMessage);
                case 'logical':
                    return await this.evaluateLogicalCondition(condition, squadSession);
                case 'combined':
                    return await this.evaluateCombinedCondition(condition, squadSession, userMessage);
                default:
                    return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to evaluate routing rule', {
                ruleId: rule.id,
                error
            });
            return false;
        }
    }
    async evaluateAICondition(condition, squadSession, userMessage) {
        // Use LLM to evaluate natural language conditions
        const evaluationPrompt = `
      Evaluate if the following user message matches this condition:
      Condition: ${condition.expression}
      User Message: ${userMessage}
      
      Respond with only "true" or "false".
    `;
        try {
            const response = await this.llmProvider.generateResponse({
                systemPrompt: 'You are a condition evaluator. Respond only with "true" or "false".',
                modelConfig: {
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0
                }
            }, {
                messages: [{ role: 'user', content: evaluationPrompt }],
                variables: new Map()
            });
            return response.toLowerCase().trim() === 'true';
        }
        catch (error) {
            this.logger.error('AI condition evaluation failed', { condition, error });
            return false;
        }
    }
    async evaluateLogicalCondition(condition, squadSession) {
        // Evaluate logical expressions against context variables
        try {
            const context = this.contextStore.get(squadSession.id);
            if (!context)
                return false;
            let expression = condition.expression;
            // Replace variables in the expression
            for (const [key, value] of context.variables) {
                expression = expression.replace(new RegExp(`{{${key}}}`, 'g'), JSON.stringify(value));
            }
            // Simple evaluation - in production, use a proper expression evaluator
            return Boolean(eval(expression));
        }
        catch (error) {
            this.logger.error('Logical condition evaluation failed', { condition, error });
            return false;
        }
    }
    async evaluateCombinedCondition(condition, squadSession, userMessage) {
        // Combine AI and logical evaluation
        const aiResult = await this.evaluateAICondition(condition, squadSession, userMessage);
        const logicalResult = await this.evaluateLogicalCondition(condition, squadSession);
        // Expression could specify how to combine results
        // For now, use AND logic
        return aiResult && logicalResult;
    }
    async performAssistantTransfer(squadSession, targetAssistant) {
        const previousAssistantId = squadSession.currentAssistantId;
        // Check if context preservation is enabled
        const transferSettings = squadSession.squad.transferSettings;
        if (transferSettings.enableContextPreservation) {
            await this.preserveConversationContext(squadSession, targetAssistant);
        }
        // Update current assistant
        squadSession.currentAssistantId = targetAssistant.id;
        // Record transfer
        squadSession.transferHistory.push({
            fromAssistantId: previousAssistantId,
            toAssistantId: targetAssistant.id,
            timestamp: new Date(),
            reason: 'routing_rule_matched',
            contextPreserved: transferSettings.enableContextPreservation
        });
        this.logger.info('Assistant transfer completed', {
            squadSessionId: squadSession.id,
            fromAssistantId: previousAssistantId,
            toAssistantId: targetAssistant.id,
            contextPreserved: transferSettings.enableContextPreservation
        });
        this.emit('assistant_transferred', {
            squadSessionId: squadSession.id,
            fromAssistantId: previousAssistantId,
            toAssistantId: targetAssistant.id
        });
    }
    async preserveConversationContext(squadSession, targetAssistant) {
        const context = this.contextStore.get(squadSession.id);
        if (!context)
            return;
        // Create context summary for the new assistant
        const contextSummary = await this.generateContextSummary(context);
        // Store assistant-specific state
        context.assistantStates.set(targetAssistant.id, {
            contextSummary,
            transferredAt: new Date(),
            previousMessages: context.messages.slice(-10) // Last 10 messages
        });
        this.logger.debug('Conversation context preserved', {
            squadSessionId: squadSession.id,
            targetAssistantId: targetAssistant.id,
            messageCount: context.messages.length
        });
    }
    async generateContextSummary(context) {
        if (context.messages.length === 0) {
            return 'No previous conversation context.';
        }
        // Generate a summary of the conversation so far
        const conversationText = context.messages
            .slice(-20) // Last 20 messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');
        const summaryPrompt = `
      Please provide a concise summary of this conversation that would help a new assistant understand the context:
      
      ${conversationText}
      
      Focus on:
      - What the user is trying to accomplish
      - Any important information gathered
      - Current state of the conversation
    `;
        try {
            const summary = await this.llmProvider.generateResponse({
                systemPrompt: 'You are a conversation summarizer. Provide clear, concise summaries.',
                modelConfig: {
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0.3
                }
            }, {
                messages: [{ role: 'user', content: summaryPrompt }],
                variables: new Map()
            });
            return summary;
        }
        catch (error) {
            this.logger.error('Failed to generate context summary', { error });
            return 'Previous conversation context available but summary generation failed.';
        }
    }
    async generateAssistantResponse(assistant, squadSession, userMessage) {
        const context = this.contextStore.get(squadSession.id);
        if (!context) {
            throw new Error('Conversation context not found');
        }
        // Build assistant context including squad context
        const assistantState = context.assistantStates.get(assistant.id);
        let systemPrompt = assistant.systemPrompt;
        // Add context summary if available
        if (assistantState?.contextSummary) {
            systemPrompt += `\n\nContext from previous conversation: ${assistantState.contextSummary}`;
        }
        // Add shared knowledge
        const sharedKnowledge = Array.from(context.sharedKnowledge.entries())
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        if (sharedKnowledge) {
            systemPrompt += `\n\nShared information: ${sharedKnowledge}`;
        }
        const response = await this.llmProvider.generateResponse({
            ...assistant,
            systemPrompt
        }, {
            messages: context.messages.slice(-10), // Last 10 messages for context
            variables: context.variables
        });
        return response;
    }
    async updateConversationContext(squadSession, message, role) {
        const context = this.contextStore.get(squadSession.id);
        if (!context)
            return;
        // Add message to history
        context.messages.push({
            role,
            content: message,
            timestamp: new Date(),
            assistantId: role === 'assistant' ? squadSession.currentAssistantId : undefined
        });
        // Update squad session conversation history
        squadSession.conversationHistory.push({
            role,
            content: message,
            timestamp: new Date(),
            assistantId: role === 'assistant' ? squadSession.currentAssistantId : undefined
        });
        // Extract and store variables/entities from the message
        if (role === 'user') {
            await this.extractAndStoreVariables(context, message);
        }
        // Maintain context window (keep last 50 messages)
        if (context.messages.length > 50) {
            context.messages = context.messages.slice(-50);
        }
    }
    async extractAndStoreVariables(context, userMessage) {
        // Simple entity extraction - in production, use NLP libraries
        // Extract common patterns like phone numbers, emails, names, etc.
        const patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(?:\+49|0)[1-9][0-9]{1,14}/g,
            name: /(?:ich heiße|mein name ist|ich bin)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
        };
        for (const [type, pattern] of Object.entries(patterns)) {
            const matches = userMessage.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const cleanMatch = type === 'name' ?
                        match.replace(/(?:ich heiße|mein name ist|ich bin)\s+/gi, '') :
                        match;
                    context.variables.set(type, cleanMatch);
                    context.sharedKnowledge.set(type, cleanMatch);
                }
            }
        }
    }
    async endSquadSession(sessionId) {
        const squadSession = this.activeSquadSessions.get(sessionId);
        if (squadSession) {
            // Save final conversation summary
            const context = this.contextStore.get(squadSession.id);
            if (context) {
                const finalSummary = await this.generateContextSummary(context);
                // Store in database for analytics
                // await this.saveSquadSessionSummary(squadSession, finalSummary);
            }
            // Cleanup
            this.activeSquadSessions.delete(sessionId);
            this.contextStore.delete(squadSession.id);
            this.logger.info('Squad session ended', {
                squadSessionId: squadSession.id,
                duration: Date.now() - squadSession.startTime.getTime()
            });
        }
    }
    getSquadSessionStatus(sessionId) {
        const squadSession = this.activeSquadSessions.get(sessionId);
        if (!squadSession)
            return null;
        const context = this.contextStore.get(squadSession.id);
        return {
            squadSessionId: squadSession.id,
            squadId: squadSession.squadId,
            callSessionId: squadSession.callSessionId,
            currentAssistantId: squadSession.currentAssistantId,
            transferCount: squadSession.transferHistory.length,
            messageCount: context?.messages.length || 0,
            startTime: squadSession.startTime,
            duration: Date.now() - squadSession.startTime.getTime()
        };
    }
}
//# sourceMappingURL=SquadOrchestrator.js.map