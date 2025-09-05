"""
PHASE 3: Unified Billing Engine - Der Kassierer
Faires, kostenbasiertes und automatisiertes Abrechnungssystem
"""

import json
import logging
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional
from decimal import Decimal, ROUND_HALF_UP

from core.interfaces import BillingEngine, UsageLogEntry

logger = logging.getLogger(__name__)

class ProductionBillingEngine(BillingEngine):
    """Produktionsreife Billing Engine mit präziser Kostenberechnung"""
    
    def __init__(self, database_path: str = "billing_system.db", platform_margin: float = 0.25):
        """
        Initialisiert Billing Engine
        
        Args:
            database_path: Pfad zur Billing-Database
            platform_margin: Plattform-Marge (z.B. 0.25 = 25% Aufschlag)
        """
        self.database_path = database_path
        self.platform_margin = platform_margin
        self._init_database()
        self._load_provider_costs()
    
    def _init_database(self):
        """Initialisiert Billing Database"""
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # User Balances Tabelle
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS user_balances (
                        user_id TEXT PRIMARY KEY,
                        balance DECIMAL(10,4) DEFAULT 0.0000,
                        currency TEXT DEFAULT 'USD',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Transactions Tabelle
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS transactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        transaction_type TEXT NOT NULL, -- 'debit', 'credit', 'refund'
                        amount DECIMAL(10,4) NOT NULL,
                        currency TEXT DEFAULT 'USD',
                        call_id TEXT,
                        description TEXT,
                        metadata TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES user_balances(user_id)
                    )
                ''')
                
                # Provider Costs Tabelle
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS provider_costs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        provider TEXT NOT NULL,
                        service_type TEXT NOT NULL, -- 'stt', 'llm', 'tts'
                        model TEXT,
                        unit_type TEXT NOT NULL, -- 'tokens', 'characters', 'seconds'
                        cost_per_unit DECIMAL(10,8) NOT NULL,
                        currency TEXT DEFAULT 'USD',
                        effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        active BOOLEAN DEFAULT 1,
                        UNIQUE(provider, service_type, model, unit_type, active)
                    )
                ''')
                
                # Call Invoices Tabelle
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS call_invoices (
                        call_id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        total_cost DECIMAL(10,4) NOT NULL,
                        platform_margin DECIMAL(10,4) NOT NULL,
                        final_amount DECIMAL(10,4) NOT NULL,
                        currency TEXT DEFAULT 'USD',
                        usage_breakdown TEXT, -- JSON
                        billed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES user_balances(user_id)
                    )
                ''')
                
                # Indizes
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_call_id ON transactions(call_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_provider_costs_lookup ON provider_costs(provider, service_type, model)')
                
                conn.commit()
                logger.info("Billing database initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize billing database: {e}")
            raise
    
    def _load_provider_costs(self):
        """Lädt aktuelle Provider-Kosten in die Database"""
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Prüfen ob Kosten bereits existieren
                cursor.execute('SELECT COUNT(*) FROM provider_costs WHERE active = 1')
                if cursor.fetchone()[0] > 0:
                    return  # Kosten bereits geladen
                
                # Standard-Kosten definieren (Stand August 2024)
                provider_costs = [
                    # OpenAI LLM Costs (per 1K tokens)
                    ('openai', 'llm', 'gpt-4o', 'tokens', 0.000005, 'USD'),  # $5 per 1M input tokens
                    ('openai', 'llm', 'gpt-4o-mini', 'tokens', 0.00000015, 'USD'),  # $0.15 per 1M tokens
                    ('openai', 'llm', 'gpt-3.5-turbo', 'tokens', 0.0000005, 'USD'),  # $0.50 per 1M tokens
                    
                    # ElevenLabs TTS Costs (per character)
                    ('elevenlabs', 'tts', 'eleven_multilingual_v2', 'characters', 0.00003, 'USD'),  # ~$30 per 1M chars
                    ('elevenlabs', 'tts', 'eleven_monolingual_v1', 'characters', 0.00002, 'USD'),  # ~$20 per 1M chars
                    
                    # Deepgram STT Costs (per second)
                    ('deepgram', 'stt', 'nova-2', 'seconds', 0.0000717, 'USD'),  # $0.0043 per minute
                    ('deepgram', 'stt', 'base', 'seconds', 0.000208, 'USD'),  # $0.0125 per minute
                    ('deepgram', 'stt', 'enhanced', 'seconds', 0.000333, 'USD'),  # $0.020 per minute
                ]
                
                for cost_data in provider_costs:
                    cursor.execute('''
                        INSERT OR IGNORE INTO provider_costs 
                        (provider, service_type, model, unit_type, cost_per_unit, currency)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', cost_data)
                
                conn.commit()
                logger.info("Provider costs loaded")
                
        except Exception as e:
            logger.error(f"Failed to load provider costs: {e}")
    
    async def calculate_call_cost(self, call_id: str) -> float:
        """
        Berechnet Gesamtkosten für einen Call basierend auf Usage-Logs
        
        Args:
            call_id: ID des Calls
            
        Returns:
            Gesamtkosten in USD
        """
        try:
            # Usage-Logs für Call laden (müsste von Usage Tracker kommen)
            usage_logs = await self._get_usage_logs_for_call(call_id)
            
            total_cost = Decimal('0.0000')
            cost_breakdown = {}
            
            for usage_log in usage_logs:
                # Kosten für diesen Usage-Log berechnen
                unit_cost = self._get_cost_per_unit(
                    usage_log.provider,
                    usage_log.service_type,
                    usage_log.metadata.get('model') if usage_log.metadata else None
                )
                
                if unit_cost is None:
                    logger.warning(f"No cost data for {usage_log.provider}.{usage_log.service_type}")
                    continue
                
                # Präzise Kostenberechnung
                operation_cost = Decimal(str(unit_cost)) * Decimal(str(usage_log.units_consumed))
                total_cost += operation_cost
                
                # Cost Breakdown für Transparenz
                key = f"{usage_log.provider}_{usage_log.service_type}"
                if key not in cost_breakdown:
                    cost_breakdown[key] = {
                        'operations': 0,
                        'units': 0,
                        'cost': Decimal('0.0000')
                    }
                
                cost_breakdown[key]['operations'] += 1
                cost_breakdown[key]['units'] += usage_log.units_consumed
                cost_breakdown[key]['cost'] += operation_cost
            
            # Auf 4 Dezimalstellen runden
            final_cost = total_cost.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            
            logger.info(f"Call {call_id} cost calculated: ${final_cost}")
            
            return float(final_cost)
            
        except Exception as e:
            logger.error(f"Failed to calculate cost for call {call_id}: {e}")
            return 0.0
    
    async def deduct_credits(self, user_id: str, amount: float, call_id: str = None, description: str = None) -> bool:
        """
        Bucht Credits vom User-Account ab
        
        Args:
            user_id: User ID
            amount: Abzubuchender Betrag
            call_id: Optional Call ID für Referenz
            description: Optional Beschreibung
            
        Returns:
            True wenn erfolgreich, False wenn nicht genügend Guthaben
        """
        try:
            amount_decimal = Decimal(str(amount)).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Current balance prüfen
                cursor.execute('SELECT balance FROM user_balances WHERE user_id = ?', (user_id,))
                result = cursor.fetchone()
                
                if not result:
                    # User Balance erstellen
                    cursor.execute('''
                        INSERT INTO user_balances (user_id, balance) VALUES (?, 0.0000)
                    ''', (user_id,))
                    current_balance = Decimal('0.0000')
                else:
                    current_balance = Decimal(str(result[0]))
                
                # Prüfen ob genügend Guthaben
                if current_balance < amount_decimal:
                    logger.warning(f"Insufficient balance for user {user_id}: ${current_balance} < ${amount_decimal}")
                    return False
                
                # Neue Balance berechnen
                new_balance = current_balance - amount_decimal
                
                # Balance aktualisieren
                cursor.execute('''
                    UPDATE user_balances 
                    SET balance = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = ?
                ''', (float(new_balance), user_id))
                
                # Transaction loggen
                cursor.execute('''
                    INSERT INTO transactions (user_id, transaction_type, amount, call_id, description)
                    VALUES (?, 'debit', ?, ?, ?)
                ''', (user_id, float(amount_decimal), call_id, description or f"Call charge: {call_id}"))
                
                conn.commit()
                
                logger.info(f"Deducted ${amount_decimal} from user {user_id}. New balance: ${new_balance}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to deduct credits for user {user_id}: {e}")
            return False
    
    async def get_user_balance(self, user_id: str) -> float:
        """
        Gibt aktuelles Guthaben zurück
        
        Args:
            user_id: User ID
            
        Returns:
            Aktuelles Guthaben in USD
        """
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('SELECT balance FROM user_balances WHERE user_id = ?', (user_id,))
                result = cursor.fetchone()
                
                if result:
                    return float(result[0])
                else:
                    # User Balance erstellen
                    cursor.execute('''
                        INSERT INTO user_balances (user_id, balance) VALUES (?, 0.0000)
                    ''', (user_id,))
                    conn.commit()
                    return 0.0
                    
        except Exception as e:
            logger.error(f"Failed to get balance for user {user_id}: {e}")
            return 0.0
    
    async def add_credits(self, user_id: str, amount: float, description: str = None) -> float:
        """
        Fügt Credits zum User-Account hinzu
        
        Args:
            user_id: User ID
            amount: Hinzuzufügender Betrag
            description: Optional Beschreibung
            
        Returns:
            Neue Balance
        """
        try:
            amount_decimal = Decimal(str(amount)).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Current balance holen oder erstellen
                cursor.execute('SELECT balance FROM user_balances WHERE user_id = ?', (user_id,))
                result = cursor.fetchone()
                
                if not result:
                    # User Balance erstellen
                    cursor.execute('''
                        INSERT INTO user_balances (user_id, balance) VALUES (?, ?)
                    ''', (user_id, float(amount_decimal)))
                    new_balance = amount_decimal
                else:
                    current_balance = Decimal(str(result[0]))
                    new_balance = current_balance + amount_decimal
                    
                    # Balance aktualisieren
                    cursor.execute('''
                        UPDATE user_balances 
                        SET balance = ?, updated_at = CURRENT_TIMESTAMP 
                        WHERE user_id = ?
                    ''', (float(new_balance), user_id))
                
                # Transaction loggen
                cursor.execute('''
                    INSERT INTO transactions (user_id, transaction_type, amount, description)
                    VALUES (?, 'credit', ?, ?)
                ''', (user_id, float(amount_decimal), description or "Credit added"))
                
                conn.commit()
                
                logger.info(f"Added ${amount_decimal} to user {user_id}. New balance: ${new_balance}")
                return float(new_balance)
                
        except Exception as e:
            logger.error(f"Failed to add credits for user {user_id}: {e}")
            return 0.0
    
    async def process_call_billing(self, call_id: str, user_id: str, usage_logs: List[UsageLogEntry]) -> Dict[str, Any]:
        """
        Vollständige Abrechnung eines Calls mit Plattform-Marge
        
        Args:
            call_id: Call ID
            user_id: User ID
            usage_logs: Liste aller Usage-Logs für den Call
            
        Returns:
            Billing-Details
        """
        try:
            # Grundkosten berechnen
            base_cost = Decimal('0.0000')
            usage_breakdown = []
            
            for usage_log in usage_logs:
                unit_cost = self._get_cost_per_unit(
                    usage_log.provider,
                    usage_log.service_type,
                    usage_log.metadata.get('model') if usage_log.metadata else None
                )
                
                if unit_cost:
                    operation_cost = Decimal(str(unit_cost)) * Decimal(str(usage_log.units_consumed))
                    base_cost += operation_cost
                    
                    usage_breakdown.append({
                        'provider': usage_log.provider,
                        'service_type': usage_log.service_type,
                        'units_consumed': usage_log.units_consumed,
                        'unit_type': usage_log.unit_type,
                        'unit_cost': float(unit_cost),
                        'total_cost': float(operation_cost),
                        'duration_ms': usage_log.duration_ms
                    })
            
            # Plattform-Marge hinzufügen
            platform_margin_amount = base_cost * Decimal(str(self.platform_margin))
            final_amount = base_cost + platform_margin_amount
            
            # Auf 4 Dezimalstellen runden
            base_cost = base_cost.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            platform_margin_amount = platform_margin_amount.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            final_amount = final_amount.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            
            # Credits abbuchen
            deduction_successful = await self.deduct_credits(
                user_id, 
                float(final_amount), 
                call_id, 
                f"Call {call_id} - Base: ${base_cost}, Margin: ${platform_margin_amount}"
            )
            
            if not deduction_successful:
                # Nicht genügend Guthaben - Call trotzdem verarbeiten aber als "unpaid" markieren
                logger.warning(f"Insufficient funds for call {call_id}. User {user_id} balance too low.")
            
            # Invoice erstellen
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT OR REPLACE INTO call_invoices 
                    (call_id, user_id, total_cost, platform_margin, final_amount, usage_breakdown)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    call_id,
                    user_id,
                    float(base_cost),
                    float(platform_margin_amount),
                    float(final_amount),
                    json.dumps(usage_breakdown)
                ))
                
                conn.commit()
            
            billing_result = {
                'call_id': call_id,
                'user_id': user_id,
                'base_cost': float(base_cost),
                'platform_margin': float(platform_margin_amount),
                'platform_margin_rate': self.platform_margin,
                'final_amount': float(final_amount),
                'currency': 'USD',
                'payment_successful': deduction_successful,
                'usage_breakdown': usage_breakdown,
                'billed_at': datetime.now().isoformat()
            }
            
            logger.info(f"Call {call_id} billed: ${final_amount} (Base: ${base_cost} + Margin: ${platform_margin_amount})")
            
            return billing_result
            
        except Exception as e:
            logger.error(f"Failed to process billing for call {call_id}: {e}")
            return {}
    
    def _get_cost_per_unit(self, provider: str, service_type: str, model: str = None) -> Optional[float]:
        """Gibt Kosten pro Einheit für einen Provider/Service zurück"""
        try:
            with sqlite3.connect(self.database_path) as conn:
                cursor = conn.cursor()
                
                # Zuerst mit spezifischem Modell suchen
                if model:
                    cursor.execute('''
                        SELECT cost_per_unit FROM provider_costs 
                        WHERE provider = ? AND service_type = ? AND model = ? AND active = 1
                        ORDER BY effective_from DESC LIMIT 1
                    ''', (provider.lower(), service_type.lower(), model))
                    
                    result = cursor.fetchone()
                    if result:
                        return float(result[0])
                
                # Fallback ohne spezifisches Modell
                cursor.execute('''
                    SELECT cost_per_unit FROM provider_costs 
                    WHERE provider = ? AND service_type = ? AND active = 1
                    ORDER BY effective_from DESC LIMIT 1
                ''', (provider.lower(), service_type.lower()))
                
                result = cursor.fetchone()
                if result:
                    return float(result[0])
                
                return None
                
        except Exception as e:
            logger.error(f"Failed to get cost for {provider}.{service_type}: {e}")
            return None
    
    async def _get_usage_logs_for_call(self, call_id: str) -> List[UsageLogEntry]:
        """Mock: In Realität würde das vom Usage Tracker kommen"""
        # TODO: Integration mit Usage Tracker
        return []
    
    async def get_user_transaction_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Gibt Transaction-Historie für einen User zurück"""
        try:
            with sqlite3.connect(self.database_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM transactions 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                ''', (user_id, limit))
                
                transactions = []
                for row in cursor.fetchall():
                    transactions.append({
                        'id': row['id'],
                        'transaction_type': row['transaction_type'],
                        'amount': float(row['amount']),
                        'currency': row['currency'],
                        'call_id': row['call_id'],
                        'description': row['description'],
                        'created_at': row['created_at'],
                        'metadata': json.loads(row['metadata']) if row['metadata'] else None
                    })
                
                return transactions
                
        except Exception as e:
            logger.error(f"Failed to get transaction history for user {user_id}: {e}")
            return []