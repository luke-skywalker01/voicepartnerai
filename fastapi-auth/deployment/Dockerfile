# ============================================================================
# PHASE 6: Production Dockerfile für VoicePartnerAI
# Multi-stage build für optimale Performance und Sicherheit
# ============================================================================

# Build Stage
FROM python:3.11-slim as builder

# Build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============================================================================
# Production Stage
# ============================================================================
FROM python:3.11-slim as production

# Runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r voicepartner && useradd -r -g voicepartner voicepartner

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs && \
    chown -R voicepartner:voicepartner /app

# Switch to non-root user
USER voicepartner

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8005/health || exit 1

# Expose port
EXPOSE 8005

# Start command
CMD ["python", "-m", "uvicorn", "api.production_server:app", "--host", "0.0.0.0", "--port", "8005", "--workers", "4"]