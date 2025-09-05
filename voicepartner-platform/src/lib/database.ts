import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper function to set tenant context for RLS
export async function setTenantContext(tenantId: string) {
  await db.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
}

// Get user with tenant information
export async function getUserWithTenant(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    include: { 
      tenant: true,
      workflows: { 
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
      }
    }
  })
}

// Check subscription limits
export const TIER_LIMITS = {
  starter: {
    workflows: 5,
    executions_per_month: 1000,
    api_keys: 3
  },
  business: {
    workflows: 50,
    executions_per_month: 10000,
    api_keys: 10
  },
  enterprise: {
    workflows: -1, // unlimited
    executions_per_month: -1,
    api_keys: -1
  }
} as const

export async function checkWorkflowLimit(userId: string) {
  const user = await getUserWithTenant(userId)
  if (!user) return false
  
  const limits = TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS]
  if (!limits) return false
  
  if (limits.workflows === -1) return true
  
  const workflowCount = await db.workflow.count({
    where: { 
      tenantId: user.tenantId,
      userId: user.id,
      isActive: true 
    }
  })
  
  return workflowCount < limits.workflows
}

export async function checkApiKeyLimit(userId: string) {
  const user = await getUserWithTenant(userId)
  if (!user) return false
  
  const limits = TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS]
  if (!limits) return false
  
  if (limits.api_keys === -1) return true
  
  const keyCount = await db.providerKey.count({
    where: { 
      tenantId: user.tenantId,
      userId: user.id,
      isActive: true 
    }
  })
  
  return keyCount < limits.api_keys
}