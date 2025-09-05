"""
VoicePartnerAI Python SDK
Enterprise Voice AI Platform for the German Market
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any, AsyncGenerator, Union
from dataclasses import dataclass, asdict
from datetime import datetime
import httpx
import websockets
from websockets.exceptions import ConnectionClosed
import logging

logger = logging.getLogger(__name__)


class VoicePartnerAIError(Exception):
    """Base exception for VoicePartnerAI API errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, response: Optional[Dict] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


@dataclass
class VoiceConfig:
    provider: str
    voice_id: str
    language: str = "de-DE"
    speed: Optional[float] = None
    pitch: Optional[float] = None


@dataclass
class ModelConfig:
    provider: str
    model: str
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


@dataclass
class TranscriptionConfig:
    provider: str
    model: str
    language: str = "de-DE"


@dataclass
class Assistant:
    id: str
    name: str
    system_prompt: str
    voice_config: VoiceConfig
    model_config: ModelConfig
    transcription_config: TranscriptionConfig
    description: Optional[str] = None
    first_message: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class WorkflowNode:
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]


@dataclass
class WorkflowEdge:
    id: str
    source: str
    target: str
    condition: Optional[Dict[str, Any]] = None


@dataclass
class Workflow:
    id: str
    name: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    version: str = "1.0.0"
    description: Optional[str] = None
    variables: Optional[List[Dict[str, Any]]] = None
    is_published: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class CallSession:
    id: str
    phone_number: str
    direction: str
    status: str
    start_time: datetime
    assistant_id: Optional[str] = None
    workflow_id: Optional[str] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class TestResult:
    id: str
    test_id: str
    status: str
    score: float
    details: List[Dict[str, Any]]
    execution_time: int
    timestamp: datetime


class AssistantsResource:
    """Assistant management resource."""
    
    def __init__(self, client: 'VoicePartnerAI'):
        self._client = client
    
    async def list(self, page: int = 1, limit: int = 20, search: Optional[str] = None, 
                   is_active: Optional[bool] = None) -> Dict[str, Any]:
        """List assistants with pagination."""
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if is_active is not None:
            params["is_active"] = str(is_active).lower()
        
        return await self._client._request("GET", "/assistants", params=params)
    
    async def create(self, name: str, system_prompt: str, voice_config: VoiceConfig,
                    model_config: ModelConfig, transcription_config: TranscriptionConfig,
                    description: Optional[str] = None, first_message: Optional[str] = None,
                    **kwargs) -> Assistant:
        """Create a new assistant."""
        data = {
            "name": name,
            "system_prompt": system_prompt,
            "voice_config": asdict(voice_config),
            "model_config": asdict(model_config),
            "transcription_config": asdict(transcription_config)
        }
        
        if description:
            data["description"] = description
        if first_message:
            data["first_message"] = first_message
        
        data.update(kwargs)
        
        response = await self._client._request("POST", "/assistants", json=data)
        return Assistant(**response["data"])
    
    async def get(self, assistant_id: str) -> Assistant:
        """Get assistant by ID."""
        response = await self._client._request("GET", f"/assistants/{assistant_id}")
        return Assistant(**response["data"])
    
    async def update(self, assistant_id: str, **updates) -> Assistant:
        """Update assistant."""
        response = await self._client._request("PUT", f"/assistants/{assistant_id}", json=updates)
        return Assistant(**response["data"])
    
    async def delete(self, assistant_id: str) -> None:
        """Delete assistant."""
        await self._client._request("DELETE", f"/assistants/{assistant_id}")
    
    async def test(self, assistant_id: str, message: str, 
                  phone_number: Optional[str] = None) -> TestResult:
        """Test assistant with a message."""
        data = {"message": message}
        if phone_number:
            data["phone_number"] = phone_number
        
        response = await self._client._request("POST", f"/assistants/{assistant_id}/test", json=data)
        return TestResult(**response["data"])
    
    async def duplicate(self, assistant_id: str, name: Optional[str] = None) -> Assistant:
        """Duplicate an assistant."""
        data = {}
        if name:
            data["name"] = name
        
        response = await self._client._request("POST", f"/assistants/{assistant_id}/duplicate", json=data)
        return Assistant(**response["data"])
    
    async def analytics(self, assistant_id: str, from_date: Optional[str] = None, 
                       to_date: Optional[str] = None) -> Dict[str, Any]:
        """Get assistant analytics."""
        params = {}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        
        response = await self._client._request("GET", f"/assistants/{assistant_id}/analytics", params=params)
        return response["data"]


class WorkflowsResource:
    """Workflow management resource."""
    
    def __init__(self, client: 'VoicePartnerAI'):
        self._client = client
    
    async def list(self, page: int = 1, limit: int = 20, search: Optional[str] = None,
                   is_published: Optional[bool] = None) -> Dict[str, Any]:
        """List workflows with pagination."""
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if is_published is not None:
            params["is_published"] = str(is_published).lower()
        
        return await self._client._request("GET", "/workflows", params=params)
    
    async def create(self, name: str, nodes: List[WorkflowNode], edges: List[WorkflowEdge],
                    description: Optional[str] = None, variables: Optional[List[Dict]] = None) -> Workflow:
        """Create a new workflow."""
        data = {
            "name": name,
            "nodes": [asdict(node) for node in nodes],
            "edges": [asdict(edge) for edge in edges]
        }
        
        if description:
            data["description"] = description
        if variables:
            data["variables"] = variables
        
        response = await self._client._request("POST", "/workflows", json=data)
        return Workflow(**response["data"])
    
    async def get(self, workflow_id: str) -> Workflow:
        """Get workflow by ID."""
        response = await self._client._request("GET", f"/workflows/{workflow_id}")
        return Workflow(**response["data"])
    
    async def update(self, workflow_id: str, **updates) -> Workflow:
        """Update workflow."""
        response = await self._client._request("PUT", f"/workflows/{workflow_id}", json=updates)
        return Workflow(**response["data"])
    
    async def delete(self, workflow_id: str) -> None:
        """Delete workflow."""
        await self._client._request("DELETE", f"/workflows/{workflow_id}")
    
    async def publish(self, workflow_id: str) -> Workflow:
        """Publish workflow."""
        response = await self._client._request("POST", f"/workflows/{workflow_id}/publish")
        return Workflow(**response["data"])
    
    async def execute(self, workflow_id: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute workflow."""
        data = {"context": context or {}}
        response = await self._client._request("POST", f"/workflows/{workflow_id}/execute", json=data)
        return response["data"]


class CallsResource:
    """Call management resource."""
    
    def __init__(self, client: 'VoicePartnerAI'):
        self._client = client
    
    async def list(self, page: int = 1, limit: int = 20, status: Optional[str] = None,
                   direction: Optional[str] = None, from_date: Optional[str] = None,
                   to_date: Optional[str] = None) -> Dict[str, Any]:
        """List calls with pagination and filters."""
        params = {"page": page, "limit": limit}
        if status:
            params["status"] = status
        if direction:
            params["direction"] = direction
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        
        return await self._client._request("GET", "/calls", params=params)
    
    async def create(self, phone_number: str, assistant_id: Optional[str] = None,
                    workflow_id: Optional[str] = None, metadata: Optional[Dict] = None) -> CallSession:
        """Create a new call."""
        data = {"phone_number": phone_number}
        if assistant_id:
            data["assistant_id"] = assistant_id
        if workflow_id:
            data["workflow_id"] = workflow_id
        if metadata:
            data["metadata"] = metadata
        
        response = await self._client._request("POST", "/calls", json=data)
        return CallSession(**response["data"])
    
    async def get(self, call_id: str) -> CallSession:
        """Get call by ID."""
        response = await self._client._request("GET", f"/calls/{call_id}")
        return CallSession(**response["data"])
    
    async def end(self, call_id: str) -> None:
        """End call."""
        await self._client._request("POST", f"/calls/{call_id}/end")
    
    async def transfer(self, call_id: str, phone_number: str) -> None:
        """Transfer call."""
        data = {"phone_number": phone_number}
        await self._client._request("POST", f"/calls/{call_id}/transfer", json=data)
    
    async def transcript(self, call_id: str) -> List[Dict[str, Any]]:
        """Get call transcript."""
        response = await self._client._request("GET", f"/calls/{call_id}/transcript")
        return response["data"]
    
    async def recording(self, call_id: str) -> Optional[str]:
        """Get call recording URL."""
        response = await self._client._request("GET", f"/calls/{call_id}/recording")
        return response["data"]


class TestingResource:
    """Voice testing resource."""
    
    def __init__(self, client: 'VoicePartnerAI'):
        self._client = client
    
    async def run_test(self, test_data: Dict[str, Any]) -> TestResult:
        """Run a single voice test."""
        response = await self._client._request("POST", "/test/run", json=test_data)
        return TestResult(**response["data"])
    
    async def create_suite(self, name: str, description: Optional[str] = None,
                          tests: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Create test suite."""
        data = {"name": name}
        if description:
            data["description"] = description
        if tests:
            data["tests"] = tests
        
        response = await self._client._request("POST", "/test-suites", json=data)
        return response["data"]
    
    async def run_suite(self, suite_id: str) -> Dict[str, Any]:
        """Run test suite."""
        response = await self._client._request("POST", f"/test-suites/{suite_id}/run")
        return response["data"]
    
    async def get_suite_results(self, suite_id: str) -> List[TestResult]:
        """Get test suite results."""
        response = await self._client._request("GET", f"/test-suites/{suite_id}/results")
        return [TestResult(**result) for result in response["data"]]


class AnalyticsResource:
    """Analytics resource."""
    
    def __init__(self, client: 'VoicePartnerAI'):
        self._client = client
    
    async def dashboard(self, time_range: str = "24h") -> Dict[str, Any]:
        """Get analytics dashboard."""
        params = {"time_range": time_range}
        response = await self._client._request("GET", "/analytics/dashboard", params=params)
        return response["data"]
    
    async def calls(self, from_date: Optional[str] = None, to_date: Optional[str] = None,
                   assistant_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get call analytics."""
        params = {}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        if assistant_id:
            params["assistant_id"] = assistant_id
        
        response = await self._client._request("GET", "/analytics/calls", params=params)
        return response["data"]
    
    async def performance(self, from_date: Optional[str] = None, to_date: Optional[str] = None,
                         metric: Optional[str] = None) -> Dict[str, Any]:
        """Get performance metrics."""
        params = {}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        if metric:
            params["metric"] = metric
        
        response = await self._client._request("GET", "/analytics/performance", params=params)
        return response["data"]
    
    async def export(self, format: str, from_date: Optional[str] = None, to_date: Optional[str] = None,
                    include_transcripts: bool = False) -> bytes:
        """Export analytics data."""
        params = {"format": format}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        if include_transcripts:
            params["include_transcripts"] = "true"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._client.base_url}/analytics/export",
                params=params,
                headers=self._client._auth_headers
            )
            response.raise_for_status()
            return response.content


class VoiceConnection:
    """Real-time voice connection."""
    
    def __init__(self, websocket_url: str, api_key: str):
        self.websocket_url = websocket_url
        self.api_key = api_key
        self.websocket = None
        self._listeners = {}
    
    async def connect(self) -> None:
        """Connect to voice websocket."""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        self.websocket = await websockets.connect(self.websocket_url, extra_headers=headers)
    
    async def disconnect(self) -> None:
        """Disconnect from voice websocket."""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
    
    async def send_audio(self, audio_data: bytes) -> None:
        """Send audio data."""
        if self.websocket:
            await self.websocket.send(audio_data)
    
    async def send_message(self, message: Dict[str, Any]) -> None:
        """Send JSON message."""
        if self.websocket:
            await self.websocket.send(json.dumps(message))
    
    async def listen(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Listen for messages from the voice connection."""
        if not self.websocket:
            raise VoicePartnerAIError("Not connected to voice websocket")
        
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    yield data
                except json.JSONDecodeError:
                    # Binary audio data
                    yield {"type": "audio", "data": message}
        except ConnectionClosed:
            pass
    
    def on(self, event: str, callback):
        """Add event listener."""
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)
    
    def emit(self, event: str, data: Any):
        """Emit event to listeners."""
        if event in self._listeners:
            for callback in self._listeners[event]:
                callback(data)


class VoicePartnerAI:
    """
    VoicePartnerAI Python SDK
    
    Enterprise Voice AI Platform for the German Market - Vapi Alternative
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.voicepartnerai.de/v1",
                 timeout: float = 30.0):
        """
        Initialize VoicePartnerAI client.
        
        Args:
            api_key: API key for authentication
            base_url: Base URL for API endpoints
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        
        self._auth_headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "VoicePartnerAI-Python-SDK/1.0.0"
        }
        
        # Initialize resource endpoints
        self.assistants = AssistantsResource(self)
        self.workflows = WorkflowsResource(self)
        self.calls = CallsResource(self)
        self.testing = TestingResource(self)
        self.analytics = AnalyticsResource(self)
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to API."""
        url = f"{self.base_url}{endpoint}"
        
        # Set up request parameters
        request_kwargs = {
            "timeout": self.timeout,
            "headers": self._auth_headers,
            **kwargs
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(method, url, **request_kwargs)
                response.raise_for_status()
                
                # Handle different content types
                if response.headers.get("content-type", "").startswith("application/json"):
                    return response.json()
                else:
                    return {"data": response.content}
                    
            except httpx.HTTPStatusError as e:
                error_data = None
                try:
                    error_data = e.response.json()
                except:
                    pass
                
                raise VoicePartnerAIError(
                    message=error_data.get("error", {}).get("message", str(e)) if error_data else str(e),
                    status_code=e.response.status_code,
                    response=error_data
                )
            except httpx.RequestError as e:
                raise VoicePartnerAIError(f"Request failed: {str(e)}")
    
    def voice(self, session_id: Optional[str] = None) -> VoiceConnection:
        """Create voice connection."""
        ws_url = self.base_url.replace("http", "ws")
        session_path = session_id or "new"
        websocket_url = f"{ws_url}/voice/{session_path}"
        
        return VoiceConnection(websocket_url, self.api_key)
    
    async def ping(self) -> Dict[str, Any]:
        """Ping API to check connectivity."""
        start_time = time.time()
        try:
            await self._request("GET", "/ping")
            return {
                "success": True,
                "latency": (time.time() - start_time) * 1000  # ms
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "latency": (time.time() - start_time) * 1000  # ms
            }
    
    async def get_account(self) -> Dict[str, Any]:
        """Get account information."""
        response = await self._request("GET", "/account")
        return response["data"]
    
    async def get_usage(self, from_date: Optional[str] = None, 
                       to_date: Optional[str] = None) -> Dict[str, Any]:
        """Get usage statistics."""
        params = {}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        
        response = await self._request("GET", "/usage", params=params)
        return response["data"]


# Async context manager support
class AsyncVoicePartnerAI(VoicePartnerAI):
    """Async context manager version of VoicePartnerAI."""
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Cleanup if needed
        pass


# Convenience functions for quick usage
async def create_assistant(api_key: str, name: str, system_prompt: str, 
                          voice_provider: str = "elevenlabs", voice_id: str = "german_voice",
                          model_provider: str = "openai", model: str = "gpt-3.5-turbo",
                          **kwargs) -> Assistant:
    """Quick assistant creation."""
    async with AsyncVoicePartnerAI(api_key) as client:
        voice_config = VoiceConfig(provider=voice_provider, voice_id=voice_id)
        model_config = ModelConfig(provider=model_provider, model=model)
        transcription_config = TranscriptionConfig(provider="deepgram", model="nova-2")
        
        return await client.assistants.create(
            name=name,
            system_prompt=system_prompt,
            voice_config=voice_config,
            model_config=model_config,
            transcription_config=transcription_config,
            **kwargs
        )


async def make_call(api_key: str, phone_number: str, assistant_id: str, **kwargs) -> CallSession:
    """Quick call creation."""
    async with AsyncVoicePartnerAI(api_key) as client:
        return await client.calls.create(
            phone_number=phone_number,
            assistant_id=assistant_id,
            **kwargs
        )


# Export main classes
__all__ = [
    "VoicePartnerAI",
    "AsyncVoicePartnerAI", 
    "VoicePartnerAIError",
    "VoiceConnection",
    "Assistant",
    "Workflow", 
    "CallSession",
    "TestResult",
    "VoiceConfig",
    "ModelConfig",
    "TranscriptionConfig",
    "create_assistant",
    "make_call"
]