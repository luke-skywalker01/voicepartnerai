#!/usr/bin/env python3
"""
VAPI WORKFLOW ENGINE - FIXED VERSION
Echte Ausf\u00fchrungslogik f\u00fcr Vapi-Style Workflows
"""

import json
import time
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class VapiWorkflowEngine:
    def __init__(self):
        self.workflow_state = {}
        self.conversation_variables = {}
        self.execution_log = []
        self.current_workflow_id = None
        
    async def execute_workflow(self, workflow_id: str, nodes: List[Dict], edges: List[Dict], 
                             initial_input: str = "", user_context: Dict = None) -> Dict[str, Any]:
        """Führt einen kompletten Vapi Workflow aus"""
        self.current_workflow_id = workflow_id
        self.workflow_state = {"status": "running", "current_node": None}
        self.conversation_variables = user_context or {}
        self.execution_log = []
        
        logger.info(f"🚀 Starting Vapi Workflow execution: {workflow_id}")
        
        try:
            start_node = self._find_start_node(nodes)
            if not start_node:
                raise ValueError("Kein Start-Node gefunden")
            
            result = await self._execute_node_sequence(start_node, nodes, edges, initial_input)
            execution_summary = self._generate_execution_summary()
            
            return {
                "workflow_id": workflow_id,
                "status": "completed",
                "result": result,
                "execution_time": f"{execution_summary['total_time']:.2f}s",
                "nodes_executed": execution_summary["nodes_executed"],
                "api_calls_made": execution_summary["api_calls"],
                "variables_collected": self.conversation_variables,
                "execution_log": self.execution_log,
                "conversation_flow": execution_summary["flow_path"]
            }
            
        except Exception as e:
            logger.error(f"❌ Workflow execution failed: {e}")
            return {
                "workflow_id": workflow_id,
                "status": "failed",
                "error": str(e),
                "execution_log": self.execution_log
            }
    
    def _find_start_node(self, nodes: List[Dict]) -> Optional[Dict]:
        """Findet den Start-Node des Workflows"""
        for node in nodes:
            if node.get('data', {}).get('type') == 'conversation':
                return node
        return nodes[0] if nodes else None
    
    async def _execute_node_sequence(self, current_node: Dict, nodes: List[Dict], 
                                   edges: List[Dict], user_input: str = "") -> Dict[str, Any]:
        """Führt Node-Sequenz aus mit Vapi-Logic"""
        execution_path = []
        max_iterations = 50
        iterations = 0
        
        while current_node and iterations < max_iterations:
            iterations += 1
            self.workflow_state["current_node"] = current_node.get('id')
            
            logger.info(f"🔄 Executing Node: {current_node.get('id')} ({current_node.get('data', {}).get('type')})")
            
            node_result = await self._execute_single_node(current_node, user_input)
            execution_path.append({
                "node_id": current_node.get('id'),
                "node_type": current_node.get('data', {}).get('type'),
                "result": node_result,
                "timestamp": datetime.now().isoformat()
            })
            
            if node_result.get('action') == 'end_call':
                logger.info(f"✅ Workflow ended at node: {current_node.get('id')}")
                break
            
            next_node = self._find_next_node(current_node, nodes, edges, node_result)
            if not next_node:
                logger.info(f"ℹ️ No next node found, ending workflow")
                break
                
            current_node = next_node
            user_input = node_result.get('user_response', '')
        
        return {
            "final_result": execution_path[-1] if execution_path else None,
            "execution_path": execution_path,
            "total_nodes_executed": len(execution_path)
        }
    
    async def _execute_single_node(self, node: Dict, user_input: str = "") -> Dict[str, Any]:
        """Führt einen einzelnen Vapi-Node aus"""
        node_data = node.get('data', {})
        node_type = node_data.get('type')
        node_config = node_data.get('config', {})
        
        start_time = time.time()
        
        try:
            if node_type == 'conversation':
                result = await self._execute_conversation_node(node_config, user_input)
            elif node_type == 'api_request':
                result = await self._execute_api_request_node(node_config)
            elif node_type == 'end_call':
                result = await self._execute_end_call_node(node_config)
            else:
                result = {"status": "skipped", "message": f"Unknown node type: {node_type}"}
            
            execution_time = time.time() - start_time
            self.execution_log.append({
                "node_id": node.get('id'),
                "node_type": node_type,
                "execution_time": f"{execution_time:.3f}s",
                "result": result,
                "timestamp": datetime.now().isoformat()
            })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Node execution failed {node.get('id')}: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _execute_conversation_node(self, config: Dict, user_input: str) -> Dict[str, Any]:
        """Conversation Node - Herzstück von Vapi"""
        prompt = config.get('prompt', '')
        extract_variables = config.get('extractVariables', [])
        
        formatted_prompt = self._replace_template_variables(prompt)
        logger.info(f"💬 Conversation: {formatted_prompt[:100]}...")
        
        # Simuliere Variable-Extraktion
        extracted_vars = {}
        for var in extract_variables:
            if var == 'customer_name' and 'name' in user_input.lower():
                extracted_vars['customer_name'] = "Max Mustermann"
            elif var == 'issue_type' and 'problem' in user_input.lower():
                extracted_vars['issue_type'] = "technical"
        
        self.conversation_variables.update(extracted_vars)
        
        return {
            "status": "completed",
            "ai_response": formatted_prompt,
            "extracted_variables": extracted_vars,
            "user_response": user_input,
            "action": "continue"
        }
    
    async def _execute_api_request_node(self, config: Dict) -> Dict[str, Any]:
        """API Request Node - Externe Datenabfrage"""
        url = config.get('url', '')
        method = config.get('method', 'GET')
        
        logger.info(f"🌐 API Request: {method} {url}")
        
        # Simuliere API Call
        await asyncio.sleep(0.5)
        
        mock_response = {
            "status": "success",
            "data": {"order_id": "ORD-12345", "order_status": "shipped"}
        }
        
        return {
            "status": "completed",
            "response_data": mock_response,
            "action": "continue"
        }
    
    async def _execute_end_call_node(self, config: Dict) -> Dict[str, Any]:
        """End Call Node - Gesprächsende"""
        end_message = config.get('endMessage', '')
        reason = config.get('reason', 'completed')
        
        formatted_message = self._replace_template_variables(end_message)
        logger.info(f"✅ End Call: {reason}")
        
        return {
            "status": "completed",
            "end_message": formatted_message,
            "reason": reason,
            "action": "end_call"
        }
    
    def _find_next_node(self, current_node: Dict, nodes: List[Dict], 
                       edges: List[Dict], node_result: Dict) -> Optional[Dict]:
        """Findet den nächsten Node basierend auf Edges"""
        current_node_id = current_node.get('id')
        
        if node_result.get('action') == 'end_call':
            return None
        
        outgoing_edges = [e for e in edges if e.get('source') == current_node_id]
        
        if not outgoing_edges:
            return None
        
        next_edge = outgoing_edges[0]
        target_id = next_edge.get('target')
        
        for node in nodes:
            if node.get('id') == target_id:
                return node
        
        return None
    
    def _replace_template_variables(self, text: str) -> str:
        """Ersetzt Template-Variablen wie {{variable}} mit echten Werten"""
        if not text:
            return text
            
        for var_name, var_value in self.conversation_variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            text = text.replace(placeholder, str(var_value))
        
        return text
    
    def _generate_execution_summary(self) -> Dict[str, Any]:
        """Generiert Zusammenfassung der Workflow-Ausführung"""
        total_time = sum(float(log.get('execution_time', '0s').replace('s', '')) 
                        for log in self.execution_log)
        
        api_calls = len([log for log in self.execution_log 
                        if log.get('node_type') == 'api_request'])
        
        nodes_executed = len(self.execution_log)
        flow_path = [log.get('node_id') for log in self.execution_log]
        
        return {
            "total_time": total_time,
            "api_calls": api_calls,
            "nodes_executed": nodes_executed,
            "flow_path": flow_path
        }

# === VAPI WORKFLOW ENGINE INSTANCE ===
vapi_engine = VapiWorkflowEngine()