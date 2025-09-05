import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { PrismaClient } from '@prisma/client';
import { SpeechToTextProvider } from '../core/providers/SpeechToTextProvider';
import { TextToSpeechProvider } from '../core/providers/TextToSpeechProvider';
export class VoiceTestEngine extends EventEmitter {
    constructor(voiceAIPlatform) {
        super();
        this.runningTests = new Map();
        this.simulatedAgents = new Map();
        this.logger = new Logger('VoiceTestEngine');
        this.voiceAI = voiceAIPlatform;
        this.prisma = new PrismaClient();
        this.sttProvider = new SpeechToTextProvider();
        this.ttsProvider = new TextToSpeechProvider();
        this.initializeSimulatedAgents();
    }
    initializeSimulatedAgents() {
        // Create different types of simulated users for testing
        this.simulatedAgents.set('friendly_customer', new SimulatedAgent({
            name: 'Friendly Customer',
            personality: 'polite, cooperative, clear speech',
            voiceProfile: {
                provider: 'elevenlabs',
                voiceId: 'friendly_voice',
                speed: 1.0,
                pitch: 0
            },
            behaviorPatterns: ['responds_positively', 'provides_clear_answers', 'follows_instructions']
        }));
        this.simulatedAgents.set('confused_customer', new SimulatedAgent({
            name: 'Confused Customer',
            personality: 'uncertain, asks many questions, needs clarification',
            voiceProfile: {
                provider: 'elevenlabs',
                voiceId: 'confused_voice',
                speed: 0.8,
                pitch: -2
            },
            behaviorPatterns: ['asks_clarifying_questions', 'repeats_information', 'shows_uncertainty']
        }));
        this.simulatedAgents.set('impatient_customer', new SimulatedAgent({
            name: 'Impatient Customer',
            personality: 'rushes conversation, interrupts, wants quick results',
            voiceProfile: {
                provider: 'elevenlabs',
                voiceId: 'impatient_voice',
                speed: 1.3,
                pitch: 5
            },
            behaviorPatterns: ['interrupts_frequently', 'speaks_quickly', 'shows_impatience']
        }));
        this.simulatedAgents.set('technical_customer', new SimulatedAgent({
            name: 'Technical Customer',
            personality: 'knowledgeable, uses technical terms, detail-oriented',
            voiceProfile: {
                provider: 'elevenlabs',
                voiceId: 'technical_voice',
                speed: 1.1,
                pitch: 0
            },
            behaviorPatterns: ['uses_technical_language', 'asks_detailed_questions', 'validates_information']
        }));
    }
    async runTestSuite(testSuiteId) {
        try {
            const testSuite = await this.prisma.voiceTestSuite.findUnique({
                where: { id: testSuiteId },
                include: {
                    results: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                }
            });
            if (!testSuite) {
                throw new Error(`Test suite ${testSuiteId} not found`);
            }
            this.logger.info('Starting test suite execution', {
                testSuiteId,
                testCount: testSuite.tests.length
            });
            const suiteStartTime = Date.now();
            const testResults = [];
            // Run all tests in the suite
            for (const test of testSuite.tests) {
                try {
                    const result = await this.runSingleTest(test);
                    testResults.push(result);
                    // Save result to database
                    await this.prisma.testResult.create({
                        data: {
                            testId: test.id,
                            testSuiteId,
                            status: result.status,
                            score: result.score,
                            details: result.details,
                            executionTime: result.executionTime,
                            timestamp: result.timestamp
                        }
                    });
                    this.emit('test_completed', result);
                }
                catch (error) {
                    this.logger.error('Test failed', { testId: test.id, error });
                    const failedResult = {
                        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        testId: test.id,
                        status: 'failed',
                        score: 0,
                        details: [{
                                stepId: 'error',
                                status: 'failed',
                                error: error.message,
                                expectedValue: 'successful_execution',
                                actualValue: 'error'
                            }],
                        executionTime: 0,
                        timestamp: new Date()
                    };
                    testResults.push(failedResult);
                }
            }
            const suiteExecutionTime = Date.now() - suiteStartTime;
            const averageScore = testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length;
            const passedTests = testResults.filter(r => r.status === 'passed').length;
            const suiteResult = {
                testSuiteId,
                totalTests: testResults.length,
                passedTests,
                failedTests: testResults.length - passedTests,
                averageScore,
                executionTime: suiteExecutionTime,
                results: testResults,
                timestamp: new Date()
            };
            this.logger.info('Test suite completed', {
                testSuiteId,
                totalTests: suiteResult.totalTests,
                passedTests: suiteResult.passedTests,
                averageScore: suiteResult.averageScore
            });
            this.emit('test_suite_completed', suiteResult);
            return suiteResult;
        }
        catch (error) {
            this.logger.error('Test suite execution failed', { testSuiteId, error });
            throw error;
        }
    }
    async runSingleTest(test) {
        const testStartTime = Date.now();
        const executionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.logger.info('Starting test execution', {
                testId: test.id,
                testName: test.name,
                executionId
            });
            // Create test execution context
            const execution = {
                id: executionId,
                testId: test.id,
                startTime: new Date(),
                status: 'running',
                stepResults: [],
                variables: new Map(Object.entries(test.script.variables || {}))
            };
            this.runningTests.set(executionId, execution);
            // Get target assistant or workflow
            const targetAssistant = test.targetAssistantId ?
                await this.prisma.voiceAssistant.findUnique({ where: { id: test.targetAssistantId } }) :
                null;
            const targetWorkflow = test.targetWorkflowId ?
                await this.prisma.workflow.findUnique({ where: { id: test.targetWorkflowId } }) :
                null;
            if (!targetAssistant && !targetWorkflow) {
                throw new Error('Test must specify either target assistant or workflow');
            }
            // Create simulated call session
            const callSession = await this.createSimulatedCallSession(targetAssistant?.id, targetWorkflow?.id, execution);
            // Execute test script
            const stepResults = await this.executeTestScript(test.script, callSession, execution);
            // Evaluate test outcomes
            const score = await this.evaluateTestOutcomes(test.expectedOutcomes, stepResults);
            const executionTime = Date.now() - testStartTime;
            const status = score >= 0.7 ? 'passed' : 'failed'; // 70% threshold
            const result = {
                id: `result_${executionId}`,
                testId: test.id,
                status,
                score,
                details: stepResults,
                executionTime,
                timestamp: new Date()
            };
            execution.status = status;
            execution.endTime = new Date();
            this.logger.info('Test execution completed', {
                testId: test.id,
                executionId,
                status,
                score,
                executionTime
            });
            return result;
        }
        catch (error) {
            this.logger.error('Test execution failed', {
                testId: test.id,
                executionId,
                error
            });
            return {
                id: `result_${executionId}`,
                testId: test.id,
                status: 'failed',
                score: 0,
                details: [{
                        stepId: 'error',
                        status: 'failed',
                        error: error.message,
                        expectedValue: 'successful_execution',
                        actualValue: 'error'
                    }],
                executionTime: Date.now() - testStartTime,
                timestamp: new Date()
            };
        }
        finally {
            this.runningTests.delete(executionId);
        }
    }
    async createSimulatedCallSession(assistantId, workflowId, execution) {
        const sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            id: sessionId,
            assistantId,
            workflowId,
            phoneNumber: '+49123456789', // Test number
            direction: 'inbound',
            status: 'in_progress',
            startTime: new Date(),
            transcript: [],
            metadata: {
                isTest: true,
                executionId: execution?.id,
                simulatedAgent: 'friendly_customer'
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
            userId: 'test_user'
        };
    }
    async executeTestScript(script, callSession, execution) {
        const stepResults = [];
        for (const step of script.steps) {
            try {
                this.logger.debug('Executing test step', {
                    stepId: step.id,
                    action: step.action,
                    executionId: execution.id
                });
                const stepResult = await this.executeTestStep(step, callSession, execution);
                stepResults.push(stepResult);
                // Stop execution if critical step fails
                if (stepResult.status === 'failed' && step.validation?.critical) {
                    break;
                }
                // Add delay between steps if specified
                if (step.timeout) {
                    await this.delay(step.timeout);
                }
            }
            catch (error) {
                this.logger.error('Test step failed', {
                    stepId: step.id,
                    executionId: execution.id,
                    error
                });
                stepResults.push({
                    stepId: step.id,
                    status: 'failed',
                    error: error.message,
                    expectedValue: step.content,
                    actualValue: 'error'
                });
            }
        }
        return stepResults;
    }
    async executeTestStep(step, callSession, execution) {
        switch (step.action) {
            case 'speak':
                return await this.executeSimulatedSpeech(step, callSession, execution);
            case 'wait':
                return await this.executeWait(step);
            case 'expect':
                return await this.executeExpectation(step, callSession);
            case 'verify':
                return await this.executeVerification(step, callSession, execution);
            default:
                throw new Error(`Unknown test step action: ${step.action}`);
        }
    }
    async executeSimulatedSpeech(step, callSession, execution) {
        // Get simulated agent
        const agentType = callSession.metadata.simulatedAgent || 'friendly_customer';
        const agent = this.simulatedAgents.get(agentType);
        if (!agent) {
            throw new Error(`Simulated agent ${agentType} not found`);
        }
        // Replace variables in speech content
        let speechContent = step.content;
        for (const [key, value] of execution.variables) {
            speechContent = speechContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        // Generate synthetic speech audio
        const audioBuffer = await this.ttsProvider.synthesize(speechContent, agent.voiceProfile);
        // Convert to stream and process through voice AI
        const audioStream = this.bufferToStream(audioBuffer);
        const result = await this.voiceAI.processVoiceCall(audioStream, callSession);
        // Record the interaction
        callSession.transcript.push({
            id: `transcript_${Date.now()}`,
            timestamp: new Date(),
            speaker: 'user',
            text: speechContent,
            confidence: 0.95,
            sentiment: 'neutral'
        });
        if (result.success && result.response) {
            callSession.transcript.push({
                id: `transcript_${Date.now() + 1}`,
                timestamp: new Date(),
                speaker: 'assistant',
                text: result.response,
                confidence: 0.98,
                sentiment: 'neutral'
            });
        }
        return {
            stepId: step.id,
            status: result.success ? 'passed' : 'failed',
            actualValue: result.response || 'no_response',
            expectedValue: step.content,
            metadata: {
                latency: result.latency,
                confidence: result.success ? 0.95 : 0,
                audioProcessed: true
            }
        };
    }
    async executeWait(step) {
        const waitTime = parseInt(step.content) || 1000;
        await this.delay(waitTime);
        return {
            stepId: step.id,
            status: 'passed',
            actualValue: `waited_${waitTime}ms`,
            expectedValue: step.content
        };
    }
    async executeExpectation(step, callSession) {
        // Check if the expected response was received in the last assistant message
        const lastAssistantMessage = callSession.transcript
            .filter((t) => t.speaker === 'assistant')
            .pop();
        if (!lastAssistantMessage) {
            return {
                stepId: step.id,
                status: 'failed',
                actualValue: 'no_assistant_response',
                expectedValue: step.content,
                error: 'No assistant response found'
            };
        }
        // Validate response based on step validation rules
        const isValid = step.validation ?
            await this.validateResponse(lastAssistantMessage.text, step) :
            lastAssistantMessage.text.toLowerCase().includes(step.content.toLowerCase());
        return {
            stepId: step.id,
            status: isValid ? 'passed' : 'failed',
            actualValue: lastAssistantMessage.text,
            expectedValue: step.content,
            metadata: {
                confidence: lastAssistantMessage.confidence,
                responseTime: new Date().getTime() - new Date(lastAssistantMessage.timestamp).getTime()
            }
        };
    }
    async executeVerification(step, callSession, execution) {
        // Verify specific aspects of the conversation
        const verificationResult = await this.performVerification(step, callSession, execution);
        return {
            stepId: step.id,
            status: verificationResult.passed ? 'passed' : 'failed',
            actualValue: verificationResult.actualValue,
            expectedValue: step.content,
            metadata: verificationResult.metadata
        };
    }
    async validateResponse(response, step) {
        if (!step.validation)
            return true;
        const { type, value, tolerance } = step.validation;
        switch (type) {
            case 'contains':
                return response.toLowerCase().includes(String(value).toLowerCase());
            case 'matches':
                const regex = new RegExp(String(value), 'i');
                return regex.test(response);
            case 'not_contains':
                return !response.toLowerCase().includes(String(value).toLowerCase());
            case 'sentiment':
                // Simple sentiment analysis
                const sentiment = await this.analyzeSentiment(response);
                return sentiment === value;
            case 'duration':
                // Check response length (word count as proxy for duration)
                const wordCount = response.split(' ').length;
                const expectedDuration = Number(value);
                const toleranceValue = tolerance || 0.2;
                return Math.abs(wordCount - expectedDuration) <= (expectedDuration * toleranceValue);
            default:
                return true;
        }
    }
    async performVerification(step, callSession, execution) {
        // Extract verification type from step content
        const verificationConfig = JSON.parse(step.content);
        switch (verificationConfig.type) {
            case 'conversation_flow':
                return await this.verifyConversationFlow(verificationConfig, callSession);
            case 'information_extraction':
                return await this.verifyInformationExtraction(verificationConfig, callSession);
            case 'response_quality':
                return await this.verifyResponseQuality(verificationConfig, callSession);
            case 'error_handling':
                return await this.verifyErrorHandling(verificationConfig, callSession);
            default:
                return {
                    passed: false,
                    actualValue: 'unknown_verification_type',
                    metadata: { error: `Unknown verification type: ${verificationConfig.type}` }
                };
        }
    }
    async verifyConversationFlow(config, callSession) {
        const transcript = callSession.transcript;
        const expectedFlow = config.expectedSteps;
        let flowScore = 0;
        for (let i = 0; i < expectedFlow.length; i++) {
            const expectedStep = expectedFlow[i];
            const actualMessage = transcript.find((t) => t.speaker === expectedStep.speaker &&
                t.text.toLowerCase().includes(expectedStep.keywords.toLowerCase()));
            if (actualMessage)
                flowScore++;
        }
        const flowAccuracy = flowScore / expectedFlow.length;
        return {
            passed: flowAccuracy >= (config.threshold || 0.8),
            actualValue: `flow_accuracy_${flowAccuracy.toFixed(2)}`,
            metadata: {
                expectedSteps: expectedFlow.length,
                matchedSteps: flowScore,
                accuracy: flowAccuracy
            }
        };
    }
    async verifyInformationExtraction(config, callSession) {
        const transcript = callSession.transcript;
        const extractedInfo = {};
        // Simple information extraction patterns
        const patterns = {
            name: /(?:ich heiße|mein name ist|ich bin)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(?:\+49|0)[1-9][0-9]{1,14}/g
        };
        const fullTranscript = transcript
            .filter((t) => t.speaker === 'user')
            .map((t) => t.text)
            .join(' ');
        for (const [field, pattern] of Object.entries(patterns)) {
            const matches = fullTranscript.match(pattern);
            if (matches) {
                extractedInfo[field] = matches[0];
            }
        }
        const expectedFields = config.expectedFields || [];
        const extractedFields = Object.keys(extractedInfo);
        const extractionScore = expectedFields.filter((field) => extractedFields.includes(field)).length / expectedFields.length;
        return {
            passed: extractionScore >= (config.threshold || 0.8),
            actualValue: JSON.stringify(extractedInfo),
            metadata: {
                expectedFields,
                extractedFields,
                extractionScore
            }
        };
    }
    async verifyResponseQuality(config, callSession) {
        const assistantMessages = callSession.transcript
            .filter((t) => t.speaker === 'assistant')
            .map((t) => t.text);
        if (assistantMessages.length === 0) {
            return {
                passed: false,
                actualValue: 'no_assistant_responses',
                metadata: { error: 'No assistant responses found' }
            };
        }
        // Quality metrics
        const avgResponseLength = assistantMessages
            .reduce((sum, msg) => sum + msg.length, 0) / assistantMessages.length;
        const avgConfidence = callSession.transcript
            .filter((t) => t.speaker === 'assistant')
            .reduce((sum, t) => sum + (t.confidence || 0), 0) / assistantMessages.length;
        const qualityScore = (avgConfidence * 0.6) +
            (Math.min(avgResponseLength / 100, 1) * 0.4); // Normalize response length
        return {
            passed: qualityScore >= (config.threshold || 0.7),
            actualValue: `quality_score_${qualityScore.toFixed(2)}`,
            metadata: {
                avgResponseLength,
                avgConfidence,
                qualityScore,
                responseCount: assistantMessages.length
            }
        };
    }
    async verifyErrorHandling(config, callSession) {
        // Check if the assistant handled errors gracefully
        const transcript = callSession.transcript;
        const errorKeywords = ['entschuldigung', 'verstehe nicht', 'wiederholen', 'fehler', 'problem'];
        const errorHandlingResponses = transcript
            .filter((t) => t.speaker === 'assistant')
            .filter((t) => errorKeywords.some(keyword => t.text.toLowerCase().includes(keyword)));
        const hasErrorHandling = errorHandlingResponses.length > 0;
        const errorHandlingQuality = errorHandlingResponses.length > 0 ?
            errorHandlingResponses.reduce((sum, response) => sum + (response.confidence || 0), 0) / errorHandlingResponses.length : 0;
        return {
            passed: hasErrorHandling && errorHandlingQuality >= (config.threshold || 0.7),
            actualValue: `error_handling_${hasErrorHandling ? 'present' : 'absent'}`,
            metadata: {
                errorHandlingResponses: errorHandlingResponses.length,
                errorHandlingQuality,
                hasErrorHandling
            }
        };
    }
    async evaluateTestOutcomes(expectedOutcomes, stepResults) {
        if (expectedOutcomes.length === 0) {
            // Default evaluation based on step success rate
            const passedSteps = stepResults.filter(r => r.status === 'passed').length;
            return passedSteps / stepResults.length;
        }
        let totalScore = 0;
        let totalWeight = 0;
        for (const outcome of expectedOutcomes) {
            const weight = outcome.critical ? 2 : 1;
            const actualValue = this.extractActualValue(outcome.metric, stepResults);
            const score = this.calculateOutcomeScore(outcome, actualValue);
            totalScore += score * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    extractActualValue(metric, stepResults) {
        // Extract the actual value for a specific metric from step results
        const relevantStep = stepResults.find(r => r.metadata && Object.keys(r.metadata).includes(metric));
        return relevantStep ? relevantStep.metadata[metric] : null;
    }
    calculateOutcomeScore(outcome, actualValue) {
        if (actualValue === null)
            return 0;
        const expected = outcome.expectedValue;
        const tolerance = outcome.tolerance || 0.1;
        if (typeof expected === 'number' && typeof actualValue === 'number') {
            const diff = Math.abs(expected - actualValue);
            const maxDiff = expected * tolerance;
            return Math.max(0, 1 - (diff / maxDiff));
        }
        else if (typeof expected === 'boolean') {
            return actualValue === expected ? 1 : 0;
        }
        else {
            // String comparison
            const similarity = this.calculateStringSimilarity(String(expected), String(actualValue));
            return similarity >= (1 - tolerance) ? 1 : similarity;
        }
    }
    calculateStringSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
        for (let i = 0; i <= len1; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= len2; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + substitutionCost);
            }
        }
        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : 1 - (matrix[len2][len1] / maxLen);
    }
    async analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['gut', 'super', 'toll', 'danke', 'perfekt', 'ja', 'gerne'];
        const negativeWords = ['schlecht', 'nein', 'problem', 'fehler', 'ärger', 'nicht'];
        const words = text.toLowerCase().split(/\s+/);
        const positiveScore = words.filter(w => positiveWords.includes(w)).length;
        const negativeScore = words.filter(w => negativeWords.includes(w)).length;
        if (positiveScore > negativeScore)
            return 'positive';
        if (negativeScore > positiveScore)
            return 'negative';
        return 'neutral';
    }
    bufferToStream(buffer) {
        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async stopTest(executionId) {
        const execution = this.runningTests.get(executionId);
        if (execution) {
            execution.status = 'cancelled';
            execution.endTime = new Date();
            this.runningTests.delete(executionId);
            this.logger.info('Test execution stopped', { executionId });
        }
    }
    getRunningTests() {
        return Array.from(this.runningTests.values());
    }
}
// Simulated Agent for testing
class SimulatedAgent {
    constructor(config) {
        this.name = config.name;
        this.personality = config.personality;
        this.voiceProfile = config.voiceProfile;
        this.behaviorPatterns = config.behaviorPatterns;
    }
}
//# sourceMappingURL=VoiceTestEngine.js.map