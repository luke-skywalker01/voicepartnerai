import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { Logger } from '../../utils/Logger';
const router = Router();
const prisma = new PrismaClient();
const logger = new Logger('AssistantsAPI');
// Validation schemas
const createAssistantSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    systemPrompt: z.string().min(1),
    firstMessage: z.string().optional(),
    voiceConfig: z.object({
        provider: z.enum(['elevenlabs', 'openai', 'azure', 'google', 'murf']),
        voiceId: z.string(),
        language: z.string().default('de-DE'),
        speed: z.number().min(0.25).max(4).optional(),
        pitch: z.number().min(-20).max(20).optional()
    }),
    modelConfig: z.object({
        provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'custom']),
        model: z.string(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(1).max(4096).optional()
    }),
    transcriptionConfig: z.object({
        provider: z.enum(['deepgram', 'assemblyai', 'openai', 'google', 'azure']),
        model: z.string(),
        language: z.string().default('de-DE')
    }),
    analyticsConfig: z.object({
        enableCallRecording: z.boolean().default(true),
        enableSentimentAnalysis: z.boolean().default(true),
        retentionDays: z.number().min(1).max(365).default(30)
    }),
    complianceSettings: z.object({
        dataRetentionDays: z.number().min(1).max(2555).default(365),
        enablePIIRedaction: z.boolean().default(true),
        region: z.enum(['EU', 'US', 'APAC']).default('EU')
    })
});
const updateAssistantSchema = createAssistantSchema.partial();
// GET /api/assistants - List all assistants
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, isActive } = req.query;
        const userId = req.user.id;
        const whereClause = { userId };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }
        const [assistants, total] = await Promise.all([
            prisma.voiceAssistant.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    voiceConfig: true,
                    modelConfig: true,
                    _count: {
                        select: {
                            callSessions: true,
                            tools: true
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            }),
            prisma.voiceAssistant.count({ where: whereClause })
        ]);
        const response = {
            success: true,
            data: assistants,
            metadata: {
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to fetch assistants', { userId: req.user?.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ASSISTANTS_FAILED',
                message: 'Failed to fetch assistants',
                timestamp: new Date()
            }
        });
    }
});
// POST /api/assistants - Create new assistant
router.post('/', auth, validateRequest(createAssistantSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const assistantData = req.body;
        const assistant = await prisma.voiceAssistant.create({
            data: {
                ...assistantData,
                userId,
                voiceConfig: assistantData.voiceConfig,
                modelConfig: assistantData.modelConfig,
                transcriptionConfig: assistantData.transcriptionConfig,
                analyticsConfig: assistantData.analyticsConfig,
                complianceSettings: assistantData.complianceSettings
            },
            include: {
                tools: true,
                workflows: {
                    include: {
                        workflow: {
                            select: { id: true, name: true, version: true }
                        }
                    }
                }
            }
        });
        logger.info('Assistant created', { assistantId: assistant.id, userId });
        const response = {
            success: true,
            data: assistant
        };
        res.status(201).json(response);
    }
    catch (error) {
        logger.error('Failed to create assistant', { userId: req.user?.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_ASSISTANT_FAILED',
                message: 'Failed to create assistant',
                timestamp: new Date()
            }
        });
    }
});
// GET /api/assistants/:id - Get specific assistant
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const assistant = await prisma.voiceAssistant.findFirst({
            where: { id, userId },
            include: {
                tools: true,
                workflows: {
                    include: {
                        workflow: {
                            select: { id: true, name: true, version: true, description: true }
                        }
                    }
                },
                callSessions: {
                    select: {
                        id: true,
                        status: true,
                        startTime: true,
                        duration: true
                    },
                    orderBy: { startTime: 'desc' },
                    take: 10
                }
            }
        });
        if (!assistant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ASSISTANT_NOT_FOUND',
                    message: 'Assistant not found',
                    timestamp: new Date()
                }
            });
        }
        const response = {
            success: true,
            data: assistant
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to fetch assistant', { assistantId: req.params.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ASSISTANT_FAILED',
                message: 'Failed to fetch assistant',
                timestamp: new Date()
            }
        });
    }
});
// PUT /api/assistants/:id - Update assistant
router.put('/:id', auth, validateRequest(updateAssistantSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;
        // Check if assistant exists and belongs to user
        const existingAssistant = await prisma.voiceAssistant.findFirst({
            where: { id, userId }
        });
        if (!existingAssistant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ASSISTANT_NOT_FOUND',
                    message: 'Assistant not found',
                    timestamp: new Date()
                }
            });
        }
        const assistant = await prisma.voiceAssistant.update({
            where: { id },
            data: updateData,
            include: {
                tools: true,
                workflows: {
                    include: {
                        workflow: {
                            select: { id: true, name: true, version: true }
                        }
                    }
                }
            }
        });
        logger.info('Assistant updated', { assistantId: id, userId });
        const response = {
            success: true,
            data: assistant
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to update assistant', { assistantId: req.params.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_ASSISTANT_FAILED',
                message: 'Failed to update assistant',
                timestamp: new Date()
            }
        });
    }
});
// DELETE /api/assistants/:id - Delete assistant
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if assistant exists and belongs to user
        const existingAssistant = await prisma.voiceAssistant.findFirst({
            where: { id, userId }
        });
        if (!existingAssistant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ASSISTANT_NOT_FOUND',
                    message: 'Assistant not found',
                    timestamp: new Date()
                }
            });
        }
        // Check for active call sessions
        const activeSessions = await prisma.callSession.count({
            where: {
                assistantId: id,
                status: { in: ['RINGING', 'IN_PROGRESS'] }
            }
        });
        if (activeSessions > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'ASSISTANT_IN_USE',
                    message: 'Cannot delete assistant with active call sessions',
                    timestamp: new Date()
                }
            });
        }
        await prisma.voiceAssistant.delete({
            where: { id }
        });
        logger.info('Assistant deleted', { assistantId: id, userId });
        const response = {
            success: true,
            data: null
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to delete assistant', { assistantId: req.params.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_ASSISTANT_FAILED',
                message: 'Failed to delete assistant',
                timestamp: new Date()
            }
        });
    }
});
// POST /api/assistants/:id/test - Test assistant
router.post('/:id/test', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { message, phoneNumber } = req.body;
        const userId = req.user.id;
        const assistant = await prisma.voiceAssistant.findFirst({
            where: { id, userId }
        });
        if (!assistant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ASSISTANT_NOT_FOUND',
                    message: 'Assistant not found',
                    timestamp: new Date()
                }
            });
        }
        // Create test call session
        const testSession = await prisma.callSession.create({
            data: {
                phoneNumber: phoneNumber || '+49123456789',
                direction: 'OUTBOUND',
                status: 'IN_PROGRESS',
                userId,
                assistantId: id,
                metadata: {
                    isTest: true,
                    testMessage: message
                }
            }
        });
        // Simulate processing (in real implementation, this would trigger the voice processing pipeline)
        const mockResponse = `Hello! I'm ${assistant.name}. I received your message: "${message}". This is a test response.`;
        // Add transcript entries
        await prisma.transcriptEntry.createMany({
            data: [
                {
                    sessionId: testSession.id,
                    speaker: 'USER',
                    text: message,
                    confidence: 0.95
                },
                {
                    sessionId: testSession.id,
                    speaker: 'ASSISTANT',
                    text: mockResponse,
                    confidence: 0.98
                }
            ]
        });
        // Update session as completed
        await prisma.callSession.update({
            where: { id: testSession.id },
            data: {
                status: 'COMPLETED',
                endTime: new Date(),
                duration: 5000 // 5 seconds
            }
        });
        logger.info('Assistant test completed', { assistantId: id, sessionId: testSession.id });
        const response = {
            success: true,
            data: {
                sessionId: testSession.id,
                response: mockResponse,
                duration: 5000,
                confidence: 0.98
            }
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Assistant test failed', { assistantId: req.params.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'ASSISTANT_TEST_FAILED',
                message: 'Failed to test assistant',
                timestamp: new Date()
            }
        });
    }
});
// POST /api/assistants/:id/duplicate - Duplicate assistant
router.post('/:id/duplicate', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user.id;
        const originalAssistant = await prisma.voiceAssistant.findFirst({
            where: { id, userId },
            include: { tools: true }
        });
        if (!originalAssistant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ASSISTANT_NOT_FOUND',
                    message: 'Assistant not found',
                    timestamp: new Date()
                }
            });
        }
        const duplicatedAssistant = await prisma.voiceAssistant.create({
            data: {
                name: name || `${originalAssistant.name} (Copy)`,
                description: originalAssistant.description,
                systemPrompt: originalAssistant.systemPrompt,
                firstMessage: originalAssistant.firstMessage,
                voiceConfig: originalAssistant.voiceConfig,
                modelConfig: originalAssistant.modelConfig,
                transcriptionConfig: originalAssistant.transcriptionConfig,
                analyticsConfig: originalAssistant.analyticsConfig,
                complianceSettings: originalAssistant.complianceSettings,
                userId,
                tools: {
                    create: originalAssistant.tools.map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        type: tool.type,
                        configuration: tool.configuration,
                        isAsync: tool.isAsync,
                        timeout: tool.timeout
                    }))
                }
            },
            include: {
                tools: true
            }
        });
        logger.info('Assistant duplicated', {
            originalId: id,
            duplicatedId: duplicatedAssistant.id,
            userId
        });
        const response = {
            success: true,
            data: duplicatedAssistant
        };
        res.status(201).json(response);
    }
    catch (error) {
        logger.error('Failed to duplicate assistant', { assistantId: req.params.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'DUPLICATE_ASSISTANT_FAILED',
                message: 'Failed to duplicate assistant',
                timestamp: new Date()
            }
        });
    }
});
// GET /api/assistants/:id/analytics - Get assistant analytics
router.get('/:id/analytics', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { from, to } = req.query;
        const userId = req.user.id;
        const assistant = await prisma.voiceAssistant.findFirst({
            where: { id, userId }
        });
        if (!assistant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ASSISTANT_NOT_FOUND',
                    message: 'Assistant not found',
                    timestamp: new Date()
                }
            });
        }
        const dateFilter = {};
        if (from)
            dateFilter.gte = new Date(from);
        if (to)
            dateFilter.lte = new Date(to);
        const [totalCalls, completedCalls, averageDuration, recentSessions] = await Promise.all([
            prisma.callSession.count({
                where: {
                    assistantId: id,
                    ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
                }
            }),
            prisma.callSession.count({
                where: {
                    assistantId: id,
                    status: 'COMPLETED',
                    ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
                }
            }),
            prisma.callSession.aggregate({
                where: {
                    assistantId: id,
                    status: 'COMPLETED',
                    duration: { not: null },
                    ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
                },
                _avg: {
                    duration: true
                }
            }),
            prisma.callSession.findMany({
                where: {
                    assistantId: id,
                    ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
                },
                select: {
                    id: true,
                    status: true,
                    startTime: true,
                    duration: true,
                    direction: true
                },
                orderBy: { startTime: 'desc' },
                take: 50
            })
        ]);
        const analytics = {
            totalCalls,
            completedCalls,
            successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
            averageDuration: averageDuration._avg.duration || 0,
            recentSessions
        };
        const response = {
            success: true,
            data: analytics
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to fetch assistant analytics', { assistantId: req.params.id, error });
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ANALYTICS_FAILED',
                message: 'Failed to fetch assistant analytics',
                timestamp: new Date()
            }
        });
    }
});
export default router;
//# sourceMappingURL=assistants.js.map