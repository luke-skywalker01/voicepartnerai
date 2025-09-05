"""
PHASE 2: Usage Tracker - Granulares Tracking aller Service-Operationen
Loggt jeden einzelnen API-Call für präzise Abrechnung
"""

import json
import logging
import sqlite3
from datetime import datetime
from typing import List, Dict, Any
from contextlib import asynccontextmanager

from core.interfaces import UsageTracker, UsageLogEntry

logger = logging.getLogger(__name__)

class SQLiteUsageTracker(UsageTracker):
    """SQLite-basierter Usage Tracker für Development/Small Scale"""
    
    def __init__(self, database_path: str = "usage_tracking.db"):
        self.database_path = database_path
        self._init_database()
    
    def _init_database(self):
        """Initialisiert Usage-Tracking Database"""
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Usage Logs Tabelle
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS usage_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        provider TEXT NOT NULL,
                        service_type TEXT NOT NULL,
                        operation TEXT NOT NULL,
                        units_consumed INTEGER NOT NULL,
                        unit_type TEXT NOT NULL,
                        cost_estimate REAL NOT NULL,
                        duration_ms INTEGER NOT NULL,
                        user_id TEXT NOT NULL,
                        call_id TEXT,
                        timestamp TEXT NOT NULL,
                        metadata TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Indizes für bessere Performance
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id 
                    ON usage_logs(user_id)
                ''')
                
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_usage_logs_call_id 
                    ON usage_logs(call_id)
                ''')
                
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp 
                    ON usage_logs(timestamp)
                ''')
                
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_usage_logs_provider_service 
                    ON usage_logs(provider, service_type)
                ''')
                
                conn.commit()
                logger.info("Usage tracking database initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize usage tracking database: {e}")
            raise
    
    async def log_usage(self, entry: UsageLogEntry) -> None:
        """
        Loggt eine Usage-Operation in die Database
        
        Args:
            entry: UsageLogEntry mit allen relevanten Daten
        """
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Metadata als JSON serialisieren
                metadata_json = json.dumps(entry.metadata) if entry.metadata else None
                
                cursor.execute('''
                    INSERT INTO usage_logs (
                        provider, service_type, operation, units_consumed, unit_type,
                        cost_estimate, duration_ms, user_id, call_id, timestamp, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    entry.provider,
                    entry.service_type,
                    entry.operation,
                    entry.units_consumed,
                    entry.unit_type,
                    entry.cost_estimate,
                    entry.duration_ms,
                    entry.user_id,
                    entry.call_id,
                    entry.timestamp or datetime.now().isoformat(),
                    metadata_json
                ))
                
                conn.commit()
                
                logger.debug(f"Usage logged: {entry.provider}.{entry.service_type} - "
                           f"{entry.units_consumed} {entry.unit_type} - ${entry.cost_estimate:.4f}")
                
        except Exception as e:
            logger.error(f"Failed to log usage: {e}")
            raise
    
    async def get_usage_for_call(self, call_id: str) -> List[UsageLogEntry]:
        """
        Gibt alle Usage-Logs für einen Call zurück
        
        Args:
            call_id: ID des Calls
            
        Returns:
            Liste von UsageLogEntry Objekten
        """
        try:
            with sqlite3.connect(self.database_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM usage_logs 
                    WHERE call_id = ? 
                    ORDER BY timestamp ASC
                ''', (call_id,))
                
                rows = cursor.fetchall()
                
                usage_entries = []
                for row in rows:
                    metadata = json.loads(row['metadata']) if row['metadata'] else None
                    
                    entry = UsageLogEntry(
                        provider=row['provider'],
                        service_type=row['service_type'],
                        operation=row['operation'],
                        units_consumed=row['units_consumed'],
                        unit_type=row['unit_type'],
                        cost_estimate=row['cost_estimate'],
                        duration_ms=row['duration_ms'],
                        user_id=row['user_id'],
                        call_id=row['call_id'],
                        timestamp=row['timestamp'],
                        metadata=metadata
                    )
                    usage_entries.append(entry)
                
                return usage_entries
                
        except Exception as e:
            logger.error(f"Failed to get usage for call {call_id}: {e}")
            return []
    
    async def get_usage_for_user(self, user_id: str, time_range: Dict[str, str]) -> List[UsageLogEntry]:
        """
        Gibt Usage-Logs für einen User in einem Zeitraum zurück
        
        Args:
            user_id: User ID
            time_range: Dict mit 'start' und 'end' Timestamps
            
        Returns:
            Liste von UsageLogEntry Objekten
        """
        try:
            with sqlite3.connect(self.database_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM usage_logs 
                    WHERE user_id = ? 
                    AND timestamp >= ? 
                    AND timestamp <= ?
                    ORDER BY timestamp DESC
                ''', (user_id, time_range['start'], time_range['end']))
                
                rows = cursor.fetchall()
                
                usage_entries = []
                for row in rows:
                    metadata = json.loads(row['metadata']) if row['metadata'] else None
                    
                    entry = UsageLogEntry(
                        provider=row['provider'],
                        service_type=row['service_type'],
                        operation=row['operation'],
                        units_consumed=row['units_consumed'],
                        unit_type=row['unit_type'],
                        cost_estimate=row['cost_estimate'],
                        duration_ms=row['duration_ms'],
                        user_id=row['user_id'],
                        call_id=row['call_id'],
                        timestamp=row['timestamp'],
                        metadata=metadata
                    )
                    usage_entries.append(entry)
                
                return usage_entries
                
        except Exception as e:
            logger.error(f"Failed to get usage for user {user_id}: {e}")
            return []
    
    async def get_usage_summary(self, user_id: str, time_range: Dict[str, str]) -> Dict[str, Any]:
        """
        Gibt Usage-Zusammenfassung für einen User zurück
        
        Args:
            user_id: User ID
            time_range: Dict mit 'start' und 'end' Timestamps
            
        Returns:
            Dict mit Zusammenfassung der Usage-Daten
        """
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Gesamtkosten
                cursor.execute('''
                    SELECT SUM(cost_estimate) as total_cost
                    FROM usage_logs 
                    WHERE user_id = ? 
                    AND timestamp >= ? 
                    AND timestamp <= ?
                ''', (user_id, time_range['start'], time_range['end']))
                
                total_cost = cursor.fetchone()[0] or 0.0
                
                # Usage nach Service-Type
                cursor.execute('''
                    SELECT service_type, 
                           COUNT(*) as operation_count,
                           SUM(units_consumed) as total_units,
                           SUM(cost_estimate) as total_cost,
                           AVG(duration_ms) as avg_duration_ms
                    FROM usage_logs 
                    WHERE user_id = ? 
                    AND timestamp >= ? 
                    AND timestamp <= ?
                    GROUP BY service_type
                ''', (user_id, time_range['start'], time_range['end']))
                
                service_breakdown = {}
                for row in cursor.fetchall():
                    service_breakdown[row[0]] = {
                        "operation_count": row[1],
                        "total_units": row[2],
                        "total_cost": row[3],
                        "avg_duration_ms": row[4]
                    }
                
                # Usage nach Provider
                cursor.execute('''
                    SELECT provider, 
                           COUNT(*) as operation_count,
                           SUM(cost_estimate) as total_cost
                    FROM usage_logs 
                    WHERE user_id = ? 
                    AND timestamp >= ? 
                    AND timestamp <= ?
                    GROUP BY provider
                ''', (user_id, time_range['start'], time_range['end']))
                
                provider_breakdown = {}
                for row in cursor.fetchall():
                    provider_breakdown[row[0]] = {
                        "operation_count": row[1],
                        "total_cost": row[2]
                    }
                
                # Call-Statistiken
                cursor.execute('''
                    SELECT COUNT(DISTINCT call_id) as unique_calls
                    FROM usage_logs 
                    WHERE user_id = ? 
                    AND timestamp >= ? 
                    AND timestamp <= ?
                    AND call_id IS NOT NULL
                ''', (user_id, time_range['start'], time_range['end']))
                
                unique_calls = cursor.fetchone()[0] or 0
                
                return {
                    "user_id": user_id,
                    "time_range": time_range,
                    "total_cost": total_cost,
                    "unique_calls": unique_calls,
                    "service_breakdown": service_breakdown,
                    "provider_breakdown": provider_breakdown,
                    "generated_at": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get usage summary for user {user_id}: {e}")
            return {}
    
    async def get_system_usage_stats(self, time_range: Dict[str, str]) -> Dict[str, Any]:
        """
        Gibt System-weite Usage-Statistiken zurück
        
        Args:
            time_range: Dict mit 'start' und 'end' Timestamps
            
        Returns:
            Dict mit System-Statistiken
        """
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Gesamtstatistiken
                cursor.execute('''
                    SELECT COUNT(*) as total_operations,
                           COUNT(DISTINCT user_id) as unique_users,
                           COUNT(DISTINCT call_id) as unique_calls,
                           SUM(cost_estimate) as total_cost,
                           AVG(duration_ms) as avg_duration_ms
                    FROM usage_logs 
                    WHERE timestamp >= ? 
                    AND timestamp <= ?
                ''', (time_range['start'], time_range['end']))
                
                stats = cursor.fetchone()
                
                # Top Provider
                cursor.execute('''
                    SELECT provider, COUNT(*) as usage_count
                    FROM usage_logs 
                    WHERE timestamp >= ? 
                    AND timestamp <= ?
                    GROUP BY provider
                    ORDER BY usage_count DESC
                    LIMIT 10
                ''', (time_range['start'], time_range['end']))
                
                top_providers = [{"provider": row[0], "usage_count": row[1]} for row in cursor.fetchall()]
                
                # Kostenreichste Services
                cursor.execute('''
                    SELECT service_type, SUM(cost_estimate) as total_cost
                    FROM usage_logs 
                    WHERE timestamp >= ? 
                    AND timestamp <= ?
                    GROUP BY service_type
                    ORDER BY total_cost DESC
                ''', (time_range['start'], time_range['end']))
                
                service_costs = [{"service_type": row[0], "total_cost": row[1]} for row in cursor.fetchall()]
                
                return {
                    "time_range": time_range,
                    "total_operations": stats[0] or 0,
                    "unique_users": stats[1] or 0,
                    "unique_calls": stats[2] or 0,
                    "total_cost": stats[3] or 0.0,
                    "avg_duration_ms": stats[4] or 0.0,
                    "top_providers": top_providers,
                    "service_costs": service_costs,
                    "generated_at": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get system usage stats: {e}")
            return {}
    
    async def cleanup_old_logs(self, days_to_keep: int = 90) -> int:
        """
        Bereinigt alte Usage-Logs
        
        Args:
            days_to_keep: Anzahl Tage die behalten werden sollen
            
        Returns:
            Anzahl gelöschter Einträge
        """
        try:
            cutoff_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            cutoff_date = cutoff_date.replace(day=cutoff_date.day - days_to_keep)
            cutoff_timestamp = cutoff_date.isoformat()
            
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    DELETE FROM usage_logs 
                    WHERE timestamp < ?
                ''', (cutoff_timestamp,))
                
                deleted_count = cursor.rowcount
                conn.commit()
                
                logger.info(f"Cleaned up {deleted_count} old usage log entries")
                return deleted_count
                
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {e}")
            return 0