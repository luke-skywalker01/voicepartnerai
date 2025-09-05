# Multi-Tenant Backend Architektur

## 🎯 PROBLEM: Workflow Isolation für mehrere Benutzer

**Aktueller Zustand:**
- Workflows werden nur lokal im Browser gespeichert
- Keine User-Isolation
- Kein persistentes Backend
- Workflows gehen beim Browser-Wechsel verloren

**Ziel:**
- Jeder User hat seine eigene isolierte Umgebung
- Workflows persistent in Datenbank
- Secure Multi-Tenancy
- Skalierbare Architektur

---

## 🏗️ BACKEND ARCHITEKTUR

### 1. DATENBANK SCHEMA

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Isolation
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

-- Workflows (Tenant-Isolated)
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Executions (Analytics)
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  execution_data JSONB,
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  error_message TEXT
);

-- API Keys (Tenant-Isolated)
CREATE TABLE provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  provider VARCHAR(100) NOT NULL,
  key_name VARCHAR(255) NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_type VARCHAR(50) DEFAULT 'api_key',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- RLS (Row Level Security) für Tenant-Isolation
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation_workflows ON workflows
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_executions ON workflow_executions
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_keys ON provider_keys
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 2. API ROUTES STRUKTUR

```typescript
// /api/workflows/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { tenant: true }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Set tenant context for RLS
  await db.$executeRaw`SET app.current_tenant_id = ${user.tenant_id}`

  const workflows = await db.workflow.findMany({
    where: { 
      tenant_id: user.tenant_id,
      user_id: user.id 
    },
    orderBy: { updated_at: 'desc' }
  })

  return NextResponse.json({ workflows })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, workflow_data } = await request.json()

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { tenant: true }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const workflow = await db.workflow.create({
    data: {
      tenant_id: user.tenant_id,
      user_id: user.id,
      name,
      description,
      workflow_data,
      status: 'draft'
    }
  })

  return NextResponse.json({ workflow })
}
```

### 3. AUTHENTICATION & AUTHORIZATION

```typescript
// lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: User) => Promise<NextResponse>
) {
  const token = await getToken({ req: request })
  
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserWithTenant(token.sub)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return handler(request, user)
}

async function getUserWithTenant(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    include: { 
      tenant: true,
      workflows: { 
        where: { is_active: true },
        orderBy: { updated_at: 'desc' }
      }
    }
  })
}
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Database Setup (Week 1)
- [ ] PostgreSQL Database Setup
- [ ] Prisma Schema Definition
- [ ] Row Level Security (RLS) Implementation
- [ ] Database Migrations

### Phase 2: Authentication (Week 2)
- [ ] NextAuth.js Integration
- [ ] User Registration/Login
- [ ] Tenant Creation & Assignment
- [ ] Session Management

### Phase 3: API Routes (Week 3)
- [ ] Workflow CRUD APIs
- [ ] Tenant-Isolated Queries
- [ ] Provider Keys Management
- [ ] File Upload (JSON Import/Export)

### Phase 4: Frontend Integration (Week 4)
- [ ] Authentication State Management
- [ ] API Client Integration
- [ ] Real-time Updates (WebSocket)
- [ ] Error Handling & Loading States

---

## 🔒 SECURITY MEASURES

### 1. TENANT ISOLATION
```sql
-- Every query automatically filtered by tenant_id
SET app.current_tenant_id = 'user-tenant-uuid'
```

### 2. API KEY ENCRYPTION
```typescript
import { encrypt, decrypt } from '@/lib/crypto'

const encryptedKey = encrypt(apiKey, process.env.ENCRYPTION_KEY)
const decryptedKey = decrypt(encryptedKey, process.env.ENCRYPTION_KEY)
```

### 3. RATE LIMITING
```typescript
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

const { success } = await ratelimit.limit(userId)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

---

## 📊 SCALING STRATEGY

### 1. DATABASE PARTITIONING
```sql
-- Partition workflows by tenant_id for better performance
CREATE TABLE workflows_partition_tenant_1 
PARTITION OF workflows 
FOR VALUES IN ('tenant-uuid-1');
```

### 2. REDIS CACHING
```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache user workflows
const cacheKey = `workflows:${userId}`
const cachedWorkflows = await redis.get(cacheKey)

if (cachedWorkflows) {
  return JSON.parse(cachedWorkflows)
}

const workflows = await db.workflow.findMany(...)
await redis.setex(cacheKey, 300, JSON.stringify(workflows))
```

### 3. MICROSERVICES ARCHITECTURE
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend App   │    │  Auth Service   │    │ Workflow Engine │
│                 │◄──►│                 │◄──►│                 │
│  Next.js        │    │  NextAuth.js    │    │  Node.js        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   + Redis       │
                    └─────────────────┘
```

---

## 💰 PRICING TIER IMPLEMENTATION

```typescript
// lib/subscription/limits.ts
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
}

export async function checkWorkflowLimit(userId: string) {
  const user = await getUserWithTenant(userId)
  const limits = TIER_LIMITS[user.subscription_tier]
  
  if (limits.workflows === -1) return true
  
  const workflowCount = await db.workflow.count({
    where: { 
      tenant_id: user.tenant_id,
      user_id: user.id,
      is_active: true 
    }
  })
  
  return workflowCount < limits.workflows
}
```

---

## 🔄 WORKFLOW EXECUTION ENGINE

```typescript
// lib/workflow/executor.ts
export class WorkflowExecutor {
  constructor(private tenantId: string, private userId: string) {}

  async execute(workflowId: string, inputData: any) {
    const execution = await db.workflow_execution.create({
      data: {
        tenant_id: this.tenantId,
        workflow_id: workflowId,
        user_id: this.userId,
        execution_data: inputData,
        status: 'running',
        started_at: new Date()
      }
    })

    try {
      const workflow = await this.getWorkflow(workflowId)
      const result = await this.processNodes(workflow.workflow_data)
      
      await db.workflow_execution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completed_at: new Date(),
          duration_ms: Date.now() - execution.started_at.getTime()
        }
      })

      return result
    } catch (error) {
      await db.workflow_execution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date()
        }
      })
      throw error
    }
  }

  private async getWorkflow(workflowId: string) {
    return await db.workflow.findFirst({
      where: {
        id: workflowId,
        tenant_id: this.tenantId,
        is_active: true
      }
    })
  }
}
```

---

## ✅ TESTING STRATEGY

```typescript
// __tests__/workflows.test.ts
describe('Workflow API - Multi-Tenant', () => {
  test('User can only access their own workflows', async () => {
    const user1 = await createTestUser('tenant1')
    const user2 = await createTestUser('tenant2')
    
    const workflow1 = await createWorkflow(user1.id, 'Workflow 1')
    const workflow2 = await createWorkflow(user2.id, 'Workflow 2')
    
    const response = await request(app)
      .get('/api/workflows')
      .set('Authorization', `Bearer ${user1.token}`)
    
    expect(response.body.workflows).toHaveLength(1)
    expect(response.body.workflows[0].id).toBe(workflow1.id)
  })
})
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Production Ready
- [ ] Environment Variables Setup
- [ ] Database Migrations
- [ ] SSL Certificates
- [ ] Monitoring & Logging
- [ ] Backup Strategy
- [ ] Load Balancing
- [ ] CDN Setup

### Security Audit
- [ ] SQL Injection Prevention
- [ ] XSS Protection
- [ ] CSRF Tokens
- [ ] Rate Limiting
- [ ] API Key Encryption
- [ ] Tenant Isolation Testing

---

*Diese Architektur ermöglicht es, dass jeder User seine eigene isolierte VoicePartnerAI-Umgebung erhält, während die Plattform für tausende von Benutzern skaliert.*