"""
PHASE 5: Monitoring & Alerting System - Das Nervensystem
Umfassendes Monitoring, Alerting und Health Checks
"""

import time
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import redis.asyncio as redis
from core.interfaces import UsageTracker, BillingEngine

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    """Alert Severity Levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class Alert:
    """Alert Data Structure"""
    id: str
    severity: AlertSeverity
    title: str
    description: str
    component: str
    metric_name: str
    current_value: float
    threshold_value: float
    timestamp: str
    resolved: bool = False
    resolved_at: Optional[str] = None

@dataclass
class HealthCheckResult:
    """Health Check Result Structure"""
    component: str
    status: str  # healthy, degraded, critical
    response_time_ms: float
    details: Dict[str, Any]
    timestamp: str

class MonitoringSystem:
    """Production Monitoring & Alerting System"""
    
    def __init__(self, 
                 redis_client: redis.Redis,
                 usage_tracker: UsageTracker,
                 billing_engine: BillingEngine,
                 config: Dict[str, Any] = None):
        self.redis = redis_client
        self.usage_tracker = usage_tracker
        self.billing_engine = billing_engine
        self.config = config or {}
        
        # Monitoring Configuration
        self.check_interval = self.config.get("check_interval", 60)  # 60 Sekunden
        self.alert_cooldown = self.config.get("alert_cooldown", 300)  # 5 Minuten
        
        # Email Configuration für Alerts
        self.email_config = self.config.get("email", {})
        
        # Metric Thresholds
        self.thresholds = {
            "response_time_ms": {"critical": 5000, "high": 2000, "medium": 1000},
            "error_rate_percent": {"critical": 10, "high": 5, "medium": 2},
            "memory_usage_percent": {"critical": 90, "high": 80, "medium": 70},
            "cpu_usage_percent": {"critical": 90, "high": 80, "medium": 70},
            "disk_usage_percent": {"critical": 95, "high": 85, "medium": 75},
            "redis_memory_mb": {"critical": 1000, "high": 800, "medium": 600},
            "active_calls": {"critical": 100, "high": 80, "medium": 60},
            "failed_calls_percent": {"critical": 15, "high": 10, "medium": 5}
        }
        
        # Health Check Components
        self.health_check_components = [
            "redis",
            "database",
            "providers",
            "api",
            "billing_system",
            "usage_tracker"
        ]
        
        # Active Alerts Cache
        self._active_alerts: Dict[str, Alert] = {}
        
        # Monitoring läuft
        self._monitoring_task: Optional[asyncio.Task] = None
        self._running = False
    
    async def start_monitoring(self):
        """Startet kontinuierliches Monitoring"""
        if self._running:
            return
        
        self._running = True
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("Monitoring system started")
    
    async def stop_monitoring(self):
        """Stoppt Monitoring"""
        self._running = False
        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
        logger.info("Monitoring system stopped")
    
    async def _monitoring_loop(self):
        """Haupt-Monitoring Loop"""
        while self._running:
            try:
                # System Health Checks
                await self._run_health_checks()
                
                # Performance Metrics sammeln
                await self._collect_performance_metrics()
                
                # Business Metrics sammeln
                await self._collect_business_metrics()
                
                # Alert Checks
                await self._check_alerts()
                
                # Cleanup alte Daten
                await self._cleanup_old_data()
                
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(30)  # Kurze Pause bei Fehlern
    
    async def _run_health_checks(self):
        """Führt Health Checks für alle Komponenten durch"""
        try:
            health_results = []
            
            # Redis Health Check
            redis_health = await self._check_redis_health()
            health_results.append(redis_health)
            
            # Database Health Check
            db_health = await self._check_database_health()
            health_results.append(db_health)
            
            # Provider Health Check
            provider_health = await self._check_providers_health()
            health_results.append(provider_health)
            
            # API Health Check
            api_health = await self._check_api_health()
            health_results.append(api_health)
            
            # Health Results in Redis speichern
            timestamp = datetime.now().isoformat()
            for result in health_results:
                await self.redis.setex(
                    f"health_check:{result.component}",
                    300,  # 5 Minuten TTL
                    json.dumps(asdict(result))
                )
            
            # System-wide Health Status
            overall_status = self._calculate_overall_health(health_results)
            await self.redis.setex("health_check:overall", 300, overall_status)
            
        except Exception as e:
            logger.error(f"Health check error: {e}")
    
    async def _check_redis_health(self) -> HealthCheckResult:
        """Redis Health Check"""
        start_time = time.time()
        try:
            # Ping Test
            await self.redis.ping()
            
            # Memory Usage
            info = await self.redis.info("memory")
            memory_used_mb = info.get("used_memory", 0) / (1024 * 1024)
            
            response_time = (time.time() - start_time) * 1000
            
            status = "healthy"
            if memory_used_mb > self.thresholds["redis_memory_mb"]["critical"]:
                status = "critical"
            elif memory_used_mb > self.thresholds["redis_memory_mb"]["high"]:
                status = "degraded"
            
            return HealthCheckResult(
                component="redis",
                status=status,
                response_time_ms=response_time,
                details={
                    "memory_used_mb": memory_used_mb,
                    "connected_clients": info.get("connected_clients", 0),
                    "version": info.get("redis_version", "unknown")
                },
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            return HealthCheckResult(
                component="redis",
                status="critical",
                response_time_ms=(time.time() - start_time) * 1000,
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
    
    async def _check_database_health(self) -> HealthCheckResult:
        """Database Health Check"""
        start_time = time.time()
        try:
            # Test Billing Engine Database
            balance = await self.billing_engine.get_user_balance("health_check_user")
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                component="database",
                status="healthy",
                response_time_ms=response_time,
                details={
                    "billing_db_accessible": True,
                    "test_query_successful": True
                },
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            return HealthCheckResult(
                component="database",
                status="critical",
                response_time_ms=(time.time() - start_time) * 1000,
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
    
    async def _check_providers_health(self) -> HealthCheckResult:
        """Provider Health Check"""
        start_time = time.time()
        try:
            # Mock Provider Health Check
            # In Realität würde das die Provider Factory verwenden
            
            provider_status = {
                "openai": "healthy",
                "elevenlabs": "healthy", 
                "deepgram": "healthy"
            }
            
            response_time = (time.time() - start_time) * 1000
            overall_status = "healthy" if all(s == "healthy" for s in provider_status.values()) else "degraded"
            
            return HealthCheckResult(
                component="providers",
                status=overall_status,
                response_time_ms=response_time,
                details={"provider_status": provider_status},
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            return HealthCheckResult(
                component="providers",
                status="critical",
                response_time_ms=(time.time() - start_time) * 1000,
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
    
    async def _check_api_health(self) -> HealthCheckResult:
        """API Health Check"""
        start_time = time.time()
        try:
            # API Response Time aus letzten Requests
            recent_responses = await self.redis.lrange("api_response_times", 0, 10)
            avg_response_time = 0
            
            if recent_responses:
                response_times = [float(rt) for rt in recent_responses]
                avg_response_time = sum(response_times) / len(response_times)
            
            status = "healthy"
            if avg_response_time > self.thresholds["response_time_ms"]["critical"]:
                status = "critical"
            elif avg_response_time > self.thresholds["response_time_ms"]["high"]:
                status = "degraded"
            
            return HealthCheckResult(
                component="api",
                status=status,
                response_time_ms=(time.time() - start_time) * 1000,
                details={
                    "avg_response_time_ms": avg_response_time,
                    "endpoint_count": await self.redis.get("active_endpoints") or 0
                },
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            return HealthCheckResult(
                component="api",
                status="critical",
                response_time_ms=(time.time() - start_time) * 1000,
                details={"error": str(e)},
                timestamp=datetime.now().isoformat()
            )
    
    async def _collect_performance_metrics(self):
        """Sammelt Performance Metriken"""
        try:
            timestamp = datetime.now().isoformat()
            
            # Request Rate
            total_requests = await self.redis.hget("monitoring:today", "total_requests") or 0
            await self.redis.lpush("metrics:request_rate", f"{timestamp}:{total_requests}")
            await self.redis.ltrim("metrics:request_rate", 0, 100)
            
            # Error Rate
            total_errors = 0
            for status in [400, 401, 403, 404, 500, 502, 503]:
                errors = await self.redis.hget("monitoring:today", f"status_{status}") or 0
                total_errors += int(errors)
            
            error_rate = (total_errors / max(int(total_requests), 1)) * 100
            await self.redis.lpush("metrics:error_rate", f"{timestamp}:{error_rate}")
            await self.redis.ltrim("metrics:error_rate", 0, 100)
            
            # Active Calls
            active_calls = len(await self.redis.keys("call_context:*"))
            await self.redis.lpush("metrics:active_calls", f"{timestamp}:{active_calls}")
            await self.redis.ltrim("metrics:active_calls", 0, 100)
            
        except Exception as e:
            logger.error(f"Performance metrics collection error: {e}")
    
    async def _collect_business_metrics(self):
        """Sammelt Business Metriken"""
        try:
            timestamp = datetime.now().isoformat()
            
            # Revenue Metrics (über Billing Engine)
            # TODO: Implementierung wenn Billing Engine erweitert ist
            
            # User Activity
            unique_users = await self.redis.scard("active_users:today") or 0
            await self.redis.lpush("metrics:active_users", f"{timestamp}:{unique_users}")
            await self.redis.ltrim("metrics:active_users", 0, 100)
            
        except Exception as e:
            logger.error(f"Business metrics collection error: {e}")
    
    async def _check_alerts(self):
        """Prüft alle Metriken gegen Thresholds und erstellt Alerts"""
        try:
            # Response Time Alert
            await self._check_metric_alert(
                "api_response_time",
                "metrics:response_time",
                "API Response Time",
                "ms"
            )
            
            # Error Rate Alert
            await self._check_metric_alert(
                "error_rate",
                "metrics:error_rate", 
                "Error Rate",
                "%"
            )
            
            # Active Calls Alert
            await self._check_metric_alert(
                "active_calls",
                "metrics:active_calls",
                "Active Calls",
                "calls"
            )
            
        except Exception as e:
            logger.error(f"Alert checking error: {e}")
    
    async def _check_metric_alert(self, metric_name: str, redis_key: str, display_name: str, unit: str):
        """Prüft einzelne Metrik gegen Thresholds"""
        try:
            # Letzte Werte holen
            recent_values = await self.redis.lrange(redis_key, 0, 5)
            if not recent_values:
                return
            
            # Durchschnitt der letzten 5 Werte
            values = []
            for value_str in recent_values:
                try:
                    _, value = value_str.split(":")
                    values.append(float(value))
                except:
                    continue
            
            if not values:
                return
            
            current_value = sum(values) / len(values)
            
            # Threshold Checks
            for severity_name, threshold in self.thresholds.get(metric_name, {}).items():
                if current_value >= threshold:
                    await self._create_alert(
                        metric_name,
                        AlertSeverity(severity_name),
                        f"{display_name} High",
                        f"{display_name} is {current_value:.2f} {unit}, exceeding {severity_name} threshold of {threshold} {unit}",
                        "monitoring",
                        metric_name,
                        current_value,
                        threshold
                    )
                    break  # Nur höchste Severity
            
        except Exception as e:
            logger.error(f"Metric alert check error for {metric_name}: {e}")
    
    async def _create_alert(self, alert_id: str, severity: AlertSeverity, title: str, 
                          description: str, component: str, metric_name: str,
                          current_value: float, threshold_value: float):
        """Erstellt oder Aktualisiert einen Alert"""
        try:
            # Prüfen ob Alert bereits aktiv
            if alert_id in self._active_alerts:
                # Alert bereits aktiv, nur Wert aktualisieren
                self._active_alerts[alert_id].current_value = current_value
                return
            
            # Cooldown prüfen
            cooldown_key = f"alert_cooldown:{alert_id}"
            if await self.redis.exists(cooldown_key):
                return
            
            # Neuen Alert erstellen
            alert = Alert(
                id=alert_id,
                severity=severity,
                title=title,
                description=description,
                component=component,
                metric_name=metric_name,
                current_value=current_value,
                threshold_value=threshold_value,
                timestamp=datetime.now().isoformat()
            )
            
            # Alert speichern
            self._active_alerts[alert_id] = alert
            await self.redis.setex(f"alert:{alert_id}", 3600, json.dumps(asdict(alert)))
            
            # Alert versenden
            await self._send_alert(alert)
            
            # Cooldown setzen
            await self.redis.setex(cooldown_key, self.alert_cooldown, "1")
            
            logger.warning(f"Alert created: {title} - {description}")
            
        except Exception as e:
            logger.error(f"Alert creation error: {e}")
    
    async def _send_alert(self, alert: Alert):
        """Versendet Alert via konfigurierte Kanäle"""
        try:
            # Email Alert
            if self.email_config.get("enabled", False):
                await self._send_email_alert(alert)
            
            # Webhook Alert
            webhook_url = self.config.get("webhook_url")
            if webhook_url:
                await self._send_webhook_alert(alert, webhook_url)
            
            # Log Alert
            logger.critical(f"ALERT [{alert.severity.value.upper()}] {alert.title}: {alert.description}")
            
        except Exception as e:
            logger.error(f"Alert sending error: {e}")
    
    async def _send_email_alert(self, alert: Alert):
        """Sendet Email Alert"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config.get("from_email")
            msg['To'] = ", ".join(self.email_config.get("to_emails", []))
            msg['Subject'] = f"[VoicePartnerAI] {alert.severity.value.upper()}: {alert.title}"
            
            body = f"""
Alert Details:
- Severity: {alert.severity.value.upper()}
- Component: {alert.component}
- Metric: {alert.metric_name}
- Current Value: {alert.current_value}
- Threshold: {alert.threshold_value}
- Time: {alert.timestamp}

Description:
{alert.description}

Please investigate immediately.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Email versenden (Implementierung je nach Provider)
            # Hier würde der tatsächliche Email-Versand stattfinden
            
        except Exception as e:
            logger.error(f"Email alert error: {e}")
    
    async def _send_webhook_alert(self, alert: Alert, webhook_url: str):
        """Sendet Webhook Alert"""
        try:
            # Webhook Implementierung
            # Hier würde HTTP POST an Webhook URL gemacht werden
            pass
            
        except Exception as e:
            logger.error(f"Webhook alert error: {e}")
    
    def _calculate_overall_health(self, health_results: List[HealthCheckResult]) -> str:
        """Berechnet Overall Health Status"""
        if not health_results:
            return "unknown"
        
        statuses = [result.status for result in health_results]
        
        if "critical" in statuses:
            return "critical"
        elif "degraded" in statuses:
            return "degraded"
        else:
            return "healthy"
    
    async def _cleanup_old_data(self):
        """Bereinigt alte Monitoring-Daten"""
        try:
            # Alte Metriken löschen (älter als 24 Stunden)
            cutoff_time = datetime.now() - timedelta(hours=24)
            cutoff_timestamp = cutoff_time.isoformat()
            
            # Cleanup verschiedener Metric Keys
            metric_keys = [
                "metrics:request_rate",
                "metrics:error_rate", 
                "metrics:active_calls",
                "metrics:response_time"
            ]
            
            for key in metric_keys:
                try:
                    # Alle Entries älter als cutoff entfernen
                    all_entries = await self.redis.lrange(key, 0, -1)
                    for entry in all_entries:
                        try:
                            timestamp_str = entry.split(":")[0]
                            if timestamp_str < cutoff_timestamp:
                                await self.redis.lrem(key, 1, entry)
                        except:
                            continue
                except Exception as e:
                    logger.error(f"Cleanup error for key {key}: {e}")
            
        except Exception as e:
            logger.error(f"Data cleanup error: {e}")
    
    async def get_system_metrics(self, time_range: str = "1h") -> Dict[str, Any]:
        """Gibt System-Metriken für Dashboard zurück"""
        try:
            # Health Status
            overall_health = await self.redis.get("health_check:overall") or "unknown"
            
            # Recent Alerts
            alert_keys = await self.redis.keys("alert:*")
            active_alerts = []
            for key in alert_keys[:10]:  # Letzte 10 Alerts
                alert_data = await self.redis.get(key)
                if alert_data:
                    active_alerts.append(json.loads(alert_data))
            
            # Performance Metrics
            response_times = await self.redis.lrange("metrics:response_time", 0, 50)
            error_rates = await self.redis.lrange("metrics:error_rate", 0, 50)
            
            return {
                "overall_health": overall_health,
                "active_alerts": active_alerts,
                "response_times": response_times,
                "error_rates": error_rates,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Get system metrics error: {e}")
            return {}