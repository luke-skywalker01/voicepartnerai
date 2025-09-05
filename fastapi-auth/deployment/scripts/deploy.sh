#!/bin/bash

# ============================================================================
# PHASE 6: Production Deployment Script
# Automated deployment with zero-downtime and rollback capability
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="/tmp/voicepartner-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

# Error handling
cleanup() {
    log_error "Deployment failed! Check logs at $LOG_FILE"
    exit 1
}

trap cleanup ERR

# Help function
show_help() {
    cat << EOF
VoicePartnerAI Production Deployment Script

Usage: $0 [OPTIONS] COMMAND

COMMANDS:
    deploy              Deploy the application
    rollback [TAG]      Rollback to previous version or specific tag
    status              Check deployment status
    logs               Show application logs
    backup             Create backup before deployment
    restore [BACKUP]   Restore from backup

OPTIONS:
    -h, --help         Show this help message
    -e, --env FILE     Environment file (default: .env)
    -v, --verbose      Verbose output
    --dry-run          Show what would be done without executing
    --skip-backup      Skip backup creation
    --force            Force deployment even if checks fail

EXAMPLES:
    $0 deploy                    # Deploy with default settings
    $0 deploy --dry-run          # See what would be deployed
    $0 rollback v1.2.0          # Rollback to specific version
    $0 backup                    # Create manual backup
EOF
}

# Default values
ENV_FILE=".env"
VERBOSE=false
DRY_RUN=false
SKIP_BACKUP=false
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        deploy|rollback|status|logs|backup|restore)
            COMMAND="$1"
            shift
            break
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
validate_environment() {
    log "Validating deployment environment..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running or not accessible"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        log_error "Environment file $ENV_FILE not found"
        exit 1
    fi
    
    # Check required environment variables
    source "$PROJECT_ROOT/$ENV_FILE"
    local required_vars=(
        "OPENAI_API_KEY"
        "ELEVENLABS_API_KEY" 
        "DEEPGRAM_API_KEY"
        "SECRET_KEY"
        "JWT_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment validation passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check disk space
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        exit 1
    fi
    
    # Check if previous deployment is healthy
    if docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" ps | grep -q "Up"; then
        log "Checking current deployment health..."
        if ! curl -f http://localhost:8005/health >/dev/null 2>&1; then
            if [[ "$FORCE" != "true" ]]; then
                log_error "Current deployment is unhealthy. Use --force to deploy anyway"
                exit 1
            else
                log_warning "Current deployment is unhealthy, but --force is set"
            fi
        fi
    fi
    
    log_success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log "Skipping backup creation"
        return
    fi
    
    log "Creating backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="voicepartner_backup_$timestamp"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup databases
    if [[ -d "$PROJECT_ROOT/data" ]]; then
        cp -r "$PROJECT_ROOT/data" "$backup_path/"
        log_success "Database backup created"
    fi
    
    # Backup configuration
    cp "$PROJECT_ROOT/$ENV_FILE" "$backup_path/"
    
    # Create backup manifest
    cat > "$backup_path/manifest.json" << EOF
{
    "timestamp": "$timestamp",
    "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "backup_type": "pre_deployment"
}
EOF
    
    # Compress backup
    tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
    rm -rf "$backup_path"
    
    log_success "Backup created: $backup_path.tar.gz"
    echo "$backup_path.tar.gz" > "$PROJECT_ROOT/.last_backup"
}

# Deploy application
deploy_application() {
    log "Starting deployment..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN - Would execute the following:"
        log "1. Pull latest images"
        log "2. Build application image"
        log "3. Update services with zero downtime"
        log "4. Run health checks"
        return
    fi
    
    # Pull latest base images
    log "Pulling latest base images..."
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" pull
    
    # Build application
    log "Building application image..."
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" build voicepartner-api
    
    # Deploy with zero downtime
    log "Deploying services..."
    
    # Start new instances
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" up -d --no-deps --scale voicepartner-api=2 voicepartner-api
    
    # Wait for new instances to be healthy
    log "Waiting for new instances to be healthy..."
    local retries=0
    local max_retries=30
    
    while [[ $retries -lt $max_retries ]]; do
        if curl -f http://localhost:8005/health >/dev/null 2>&1; then
            log_success "New instances are healthy"
            break
        fi
        
        sleep 10
        retries=$((retries + 1))
        log "Health check attempt $retries/$max_retries..."
    done
    
    if [[ $retries -eq $max_retries ]]; then
        log_error "New instances failed health checks"
        exit 1
    fi
    
    # Scale down old instances
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" up -d --no-deps --scale voicepartner-api=1 voicepartner-api
    
    # Update other services
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" up -d --remove-orphans
    
    log_success "Deployment completed successfully"
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Health check
    local retries=0
    local max_retries=10
    
    while [[ $retries -lt $max_retries ]]; do
        if curl -f http://localhost:8005/health >/dev/null 2>&1; then
            log_success "Application is healthy"
            break
        fi
        
        sleep 5
        retries=$((retries + 1))
        log "Health check attempt $retries/$max_retries..."
    done
    
    if [[ $retries -eq $max_retries ]]; then
        log_error "Application failed health checks"
        exit 1
    fi
    
    # Test critical endpoints
    log "Testing critical endpoints..."
    
    local endpoints=(
        "/health"
        "/docs"
        "/api/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "http://localhost:8005$endpoint" >/dev/null 2>&1; then
            log_success "✓ $endpoint"
        else
            log_error "✗ $endpoint"
            exit 1
        fi
    done
    
    log_success "Post-deployment verification passed"
}

# Rollback function
rollback_deployment() {
    local version="${1:-}"
    
    log "Starting rollback..."
    
    if [[ -z "$version" ]]; then
        # Rollback to last backup
        if [[ -f "$PROJECT_ROOT/.last_backup" ]]; then
            local backup_file=$(cat "$PROJECT_ROOT/.last_backup")
            log "Rolling back to last backup: $backup_file"
            restore_from_backup "$backup_file"
        else
            log_error "No backup information found for rollback"
            exit 1
        fi
    else
        log "Rolling back to version: $version"
        # This would typically involve checking out a specific git tag
        # and rebuilding/redeploying
        git checkout "$version"
        deploy_application
    fi
    
    log_success "Rollback completed"
}

# Restore from backup
restore_from_backup() {
    local backup_file="$1"
    
    log "Restoring from backup: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Stop services
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" down
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Restore data
    if [[ -d "$temp_dir"/*/data ]]; then
        rm -rf "$PROJECT_ROOT/data"
        cp -r "$temp_dir"/*/data "$PROJECT_ROOT/"
        log_success "Data restored"
    fi
    
    # Restore configuration
    if [[ -f "$temp_dir"/*/.env ]]; then
        cp "$temp_dir"/*/.env "$PROJECT_ROOT/"
        log_success "Configuration restored"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    # Restart services
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" up -d
    
    log_success "Restore completed"
}

# Show status
show_status() {
    log "VoicePartnerAI Deployment Status"
    echo "=================================="
    
    # Service status
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" ps
    
    echo ""
    echo "Health Status:"
    if curl -f http://localhost:8005/health 2>/dev/null; then
        log_success "Application is healthy"
    else
        log_error "Application is unhealthy"
    fi
    
    echo ""
    echo "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Show logs
show_logs() {
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" logs -f voicepartner-api
}

# Main execution
main() {
    log "VoicePartnerAI Production Deployment"
    log "====================================="
    
    case "${COMMAND:-}" in
        deploy)
            validate_environment
            pre_deployment_checks
            create_backup
            deploy_application
            post_deployment_verification
            log_success "Deployment completed successfully!"
            ;;
        rollback)
            rollback_deployment "${1:-}"
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        backup)
            create_backup
            ;;
        restore)
            restore_from_backup "${1:-}"
            ;;
        *)
            log_error "No command specified"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"