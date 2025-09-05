# VoicePartnerAI - Production Deployment Guide

## 🚀 Production Deployment Checklist

This guide provides step-by-step instructions for deploying VoicePartnerAI to production.

---

## 📋 Pre-Deployment Requirements

### 1. **Infrastructure Requirements**
- **Server**: Minimum 2 CPU cores, 4GB RAM, 20GB storage
- **Database**: PostgreSQL 13+ (recommended) or SQLite for small deployments
- **Cache**: Redis 6+ for rate limiting and session management
- **Load Balancer**: Nginx or similar for SSL termination
- **Domain**: SSL certificate for HTTPS (Let's Encrypt recommended)

### 2. **External Service Accounts**
- **Twilio**: Account SID, Auth Token for telephony
- **OpenAI**: API key for AI language models
- **ElevenLabs**: API key for voice synthesis
- **SendGrid**: API key for email services
- **AWS SES**: Alternative email service (optional)
- **Stripe**: API keys for billing (optional)

---

## 🔧 Environment Configuration

### 1. **Required Environment Variables**

Create a `.env` file with the following variables:

```bash
# Application Settings
SECRET_KEY=your_super_secure_secret_key_here_at_least_32_chars
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/voicepartnerai
# For SQLite (development only):
# DATABASE_URL=sqlite:///./voicepartnerai.db

# Redis Configuration (for rate limiting and caching)
REDIS_URL=redis://localhost:6379/0
# If Redis is unavailable, the system will fall back to memory storage

# External Service API Keys
OPENAI_API_KEY=your_openai_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Email Service Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# CORS and Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Monitoring and Logging
SENTRY_DSN=your_sentry_dsn_for_error_tracking  # Optional
```

### 2. **Database Setup**

#### PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE voicepartnerai;
CREATE USER voiceai WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE voicepartnerai TO voiceai;
\q

# Update connection string
DATABASE_URL=postgresql://voiceai:secure_password@localhost:5432/voicepartnerai
```

#### Database Migration
```bash
# Install dependencies
pip install -r requirements.txt

# Create database tables
python -c "
from database import engine, Base
from models import *  # Import all models
Base.metadata.create_all(bind=engine)
print('Database tables created successfully!')
"
```

### 3. **Redis Setup**
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf

# Update these settings:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

## 🐳 Docker Deployment

### 1. **Docker Compose Setup**

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://voiceai:${DB_PASSWORD}@db:5432/voicepartnerai
      - REDIS_URL=redis://redis:6379/0
    env_file:
      - .env
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=voicepartnerai
      - POSTGRES_USER=voiceai
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U voiceai -d voicepartnerai"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. **Dockerfile Optimization**

Create an optimized `Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main_with_error_handling:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 3. **Deploy with Docker Compose**
```bash
# Set database password
export DB_PASSWORD=your_secure_db_password

# Deploy the application
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

---

## 🔒 Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Proxy configuration
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth endpoints with stricter rate limiting
        location /auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health checks (no rate limiting)
        location /health {
            proxy_pass http://app;
            access_log off;
        }
    }
}
```

---

## ☸️ Kubernetes Deployment

### 1. **Kubernetes Manifests**

Create `k8s/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: voicepartnerai
```

Create `k8s/configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: voicepartnerai
data:
  ENVIRONMENT: "production"
  DEBUG: "false"
  LOG_LEVEL: "info"
  REDIS_URL: "redis://redis-service:6379/0"
  DATABASE_URL: "postgresql://voiceai:${DB_PASSWORD}@postgres-service:5432/voicepartnerai"
```

Create `k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voicepartnerai-app
  namespace: voicepartnerai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: voicepartnerai-app
  template:
    metadata:
      labels:
        app: voicepartnerai-app
    spec:
      containers:
      - name: app
        image: voicepartnerai:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 2. **Deploy to Kubernetes**
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n voicepartnerai

# Check logs
kubectl logs -f deployment/voicepartnerai-app -n voicepartnerai
```

---

## 📊 Monitoring and Logging

### 1. **Application Monitoring**

Add monitoring configuration to your environment:
```bash
# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
PROMETHEUS_ENDPOINT=/metrics

# Logging
LOG_FORMAT=json
LOG_FILE=/app/logs/application.log
MAX_LOG_SIZE=100MB
LOG_RETENTION_DAYS=30
```

### 2. **Health Check Endpoints**
- `GET /health/live` - Liveness probe (returns 200 if app is running)
- `GET /health/ready` - Readiness probe (returns 200 if app can serve traffic)
- `GET /health/metrics` - Prometheus metrics endpoint

### 3. **Prometheus Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'voicepartnerai'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/health/metrics'
    scrape_interval: 30s
```

---

## 🔐 Security Checklist

### 1. **SSL/TLS Configuration**
- ✅ Use Let's Encrypt or purchased SSL certificate
- ✅ Force HTTPS redirects
- ✅ Configure proper SSL ciphers
- ✅ Enable HSTS headers

### 2. **Security Headers**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security header

### 3. **Rate Limiting**
- ✅ Configure API rate limits
- ✅ Implement authentication rate limiting
- ✅ Set up IP-based restrictions if needed

### 4. **Secrets Management**
- ✅ Use environment variables for secrets
- ✅ Never commit secrets to version control
- ✅ Rotate API keys regularly
- ✅ Use Kubernetes secrets in K8s deployments

---

## 🚀 Deployment Commands

### Quick Start (Docker)
```bash
# 1. Clone repository
git clone <repository-url>
cd voicepartnerai

# 2. Create environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Check status
docker-compose -f docker-compose.prod.yml ps
```

### Manual Deployment
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set environment variables
export SECRET_KEY="your-secret-key"
export DATABASE_URL="your-database-url"
# ... other variables

# 3. Initialize database
python -c "from database import engine, Base; from models import *; Base.metadata.create_all(bind=engine)"

# 4. Start application
uvicorn main_with_error_handling:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🔍 Post-Deployment Verification

### 1. **Health Checks**
```bash
# Test health endpoints
curl https://yourdomain.com/health/live
curl https://yourdomain.com/health/ready

# Test API endpoints
curl https://yourdomain.com/
curl https://yourdomain.com/docs
```

### 2. **Functionality Tests**
```bash
# Test user registration
curl -X POST https://yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass","first_name":"Test","last_name":"User"}'

# Test authentication
curl -X POST https://yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"testpass"}'
```

### 3. **Performance Testing**
```bash
# Use Apache Bench for basic load testing
ab -n 1000 -c 10 https://yourdomain.com/health/live

# Use curl for response time testing
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/
```

---

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall/security group settings

2. **Redis Connection Failed**
   - System falls back to memory storage
   - Check REDIS_URL configuration
   - Verify Redis server is accessible

3. **External API Errors**
   - Verify API keys are correct
   - Check internet connectivity
   - Review API usage limits

4. **High Memory Usage**
   - Increase container memory limits
   - Review log retention settings
   - Check for memory leaks in logs

### Debugging Commands
```bash
# Check application logs
docker-compose logs -f app

# Check system resources
docker stats

# Enter container for debugging
docker-compose exec app /bin/bash

# Check database connections
docker-compose exec db psql -U voiceai -d voicepartnerai -c "SELECT 1;"
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- Use multiple application instances behind load balancer
- Ensure database can handle increased connections
- Scale Redis for session management

### Performance Optimization
- Enable database connection pooling
- Use CDN for static assets
- Implement caching strategies
- Optimize database queries

### Resource Planning
- Monitor CPU, memory, and disk usage
- Plan for peak usage periods
- Set up auto-scaling policies
- Regular performance testing

---

*Last Updated: July 31, 2025*  
*This guide ensures a secure, scalable, and production-ready deployment of VoicePartnerAI.*