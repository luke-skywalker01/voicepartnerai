# 🚀 VoicePartnerAI Deployment Guide

## Multi-Tenant Backend Deployment

### 📋 Prerequisites

1. **PostgreSQL Database** (v13+)
2. **Node.js** (v18+)
3. **Redis** (Optional, for production caching)

### 🔧 Environment Setup

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Configure database connection:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/voicepartner_db"
```

3. **Set JWT secret:**
```env
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters"
```

4. **Configure API keys:**
```env
ANTHROPIC_API_KEY="sk-ant-api03-..."
OPENAI_API_KEY="sk-proj-..."
ELEVENLABS_API_KEY="sk_..."
```

5. **Set encryption key for provider keys:**
```env
ENCRYPTION_KEY="your-32-character-encryption-key-here"
```

### 📊 Database Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Generate Prisma client:**
```bash
npm run db:generate
```

3. **Push database schema:**
```bash
npm run db:push
```

4. **Optional: Run migrations (production):**
```bash
npm run db:migrate
```

### 🔐 Row Level Security (RLS) Setup

After pushing the schema, run these SQL commands directly on your PostgreSQL database:

```sql
-- Enable RLS on tables
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_workflows ON workflows
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_executions ON workflow_executions
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_keys ON provider_keys
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 🏃‍♂️ Running the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push**

**Database Options for Vercel:**
- **Supabase** (Recommended)
- **PlanetScale**
- **Neon**

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build
RUN npm run db:generate

EXPOSE 3000
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/voicepartner
      - JWT_SECRET=your-secret-key
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=voicepartner
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Option 3: VPS/Dedicated Server

1. **Setup PostgreSQL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb voicepartner_db
```

2. **Install Node.js 18:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Setup application:**
```bash
git clone <your-repo>
cd voicepartner-platform
npm install
npm run build
npm run db:generate
npm run db:push
```

4. **Setup PM2 for process management:**
```bash
npm install -g pm2
pm2 start npm --name "voicepartner" -- start
pm2 startup
pm2 save
```

---

## 🔒 Security Checklist

### ✅ Pre-Production Security

- [ ] **JWT Secret** is cryptographically secure (32+ characters)
- [ ] **Database credentials** are not default
- [ ] **Encryption key** for provider keys is set
- [ ] **Row Level Security** policies are enabled
- [ ] **SSL/TLS** is configured for database connections
- [ ] **Environment variables** are not committed to version control
- [ ] **API rate limiting** is configured
- [ ] **CORS** is properly configured

### 🛡️ Production Security

- [ ] **Firewall** rules limit database access
- [ ] **Database backups** are automated
- [ ] **SSL certificates** are valid and auto-renewing
- [ ] **Monitoring** and alerting is set up
- [ ] **Log rotation** is configured
- [ ] **DDoS protection** is enabled
- [ ] **Regular security updates** are applied

---

## 📈 Scaling Considerations

### Performance Optimization

1. **Database Indexing:**
```sql
-- Add indexes for tenant-based queries
CREATE INDEX idx_workflows_tenant_user ON workflows(tenant_id, user_id);
CREATE INDEX idx_executions_tenant_workflow ON workflow_executions(tenant_id, workflow_id);
CREATE INDEX idx_provider_keys_tenant_user ON provider_keys(tenant_id, user_id);
```

2. **Redis Caching:**
```env
REDIS_URL="redis://localhost:6379"
```

3. **Database Connection Pooling:**
Configure Prisma connection pool in production:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/voicepartner?connection_limit=20&pool_timeout=20"
```

### Horizontal Scaling

1. **Load Balancer** (nginx/HAProxy)
2. **Multiple app instances** 
3. **Database read replicas**
4. **CDN** for static assets

---

## 🔧 Monitoring & Maintenance

### Health Checks

Create `/api/health` endpoint:
```typescript
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'healthy', timestamp: new Date() })
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 500 })
  }
}
```

### Monitoring Tools

- **Uptime monitoring:** UptimeRobot, Pingdom
- **Performance:** Vercel Analytics, New Relic
- **Error tracking:** Sentry
- **Database monitoring:** PgHero, DataDog

### Backup Strategy

1. **Automated daily backups**
2. **Cross-region backup storage**
3. **Backup restoration testing**
4. **Point-in-time recovery capability**

---

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check database URL format
echo $DATABASE_URL

# Test connection
npm run db:generate
```

**2. RLS Policies Not Working**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('workflows', 'workflow_executions', 'provider_keys');

-- List policies
\dp workflows
```

**3. Prisma Generation Errors**
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
npm run db:generate
```

**4. Memory Issues in Production**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs` or Vercel function logs
2. Verify environment variables are set correctly
3. Test database connectivity
4. Check RLS policies are properly configured

**Production deployment is now ready with full multi-tenant isolation! 🎉**