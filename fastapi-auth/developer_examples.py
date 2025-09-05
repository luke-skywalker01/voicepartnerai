"""
Code Examples for VoicePartnerAI Developer Integration
Provides ready-to-use code samples for common use cases
"""

# Python SDK Examples
PYTHON_EXAMPLES = {
    "quick_start": '''
# Install the SDK
# pip install voicepartnerai

from voicepartnerai import VoicePartnerAI

# Initialize client with API key
client = VoicePartnerAI(api_key="vp_live_your_api_key_here")

# Create a customer support assistant
assistant = client.assistants.create(
    name="Customer Support Bot",
    system_prompt="""You are a helpful customer support representative. 
    Be polite, professional, and resolve customer issues efficiently.""",
    voice_id="21m00Tcm4TlvDq8ikWAM",  # ElevenLabs voice
    language="en-US"
)

print(f"Created assistant: {assistant.id}")

# Start an outbound call
call = client.calls.create_outbound(
    phone_number="+15551234567",
    assistant_id=assistant.id,
    context_data={
        "customer_name": "John Smith",
        "issue": "billing_question",
        "account_id": "acc_12345"
    }
)

print(f"Call started: {call.call_id}")
''',

    "webhook_handler": '''
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)
WEBHOOK_SECRET = "your_webhook_secret"

@app.route('/webhooks/voicepartnerai', methods=['POST'])
def handle_webhook():
    # Verify webhook signature
    signature = request.headers.get('X-VoicePartnerAI-Signature')
    payload = request.get_data()
    
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(f"sha256={expected}", signature):
        return jsonify({"error": "Invalid signature"}), 401
    
    # Process webhook event
    event = request.json
    
    if event['event'] == 'call.completed':
        call_data = event['data']
        print(f"Call {call_data['call_id']} completed")
        print(f"Duration: {call_data['duration_seconds']}s")
        print(f"Outcome: {call_data.get('outcome', 'unknown')}")
        
        # Update your CRM with call results
        update_crm_with_call_result(call_data)
    
    elif event['event'] == 'call.failed':
        call_data = event['data']
        print(f"Call {call_data['call_id']} failed: {call_data['error']}")
        
        # Handle failed calls
        handle_failed_call(call_data)
    
    return jsonify({"status": "received"})

def update_crm_with_call_result(call_data):
    # Integrate with your CRM system
    pass

def handle_failed_call(call_data):
    # Handle failed calls (retry, notify, etc.)
    pass

if __name__ == '__main__':
    app.run(port=5000)
''',

    "bulk_outbound_calls": '''
import asyncio
from voicepartnerai import AsyncVoicePartnerAI

async def bulk_outbound_campaign():
    client = AsyncVoicePartnerAI(api_key="vp_live_your_api_key_here")
    
    # Load your contact list
    contacts = [
        {"phone": "+15551234567", "name": "John Smith", "lead_score": 85},
        {"phone": "+15551234568", "name": "Jane Doe", "lead_score": 92},
        # ... more contacts
    ]
    
    assistant_id = 456  # Your sales assistant ID
    
    # Create calls concurrently (with rate limiting)
    semaphore = asyncio.Semaphore(5)  # Max 5 concurrent calls
    
    async def make_call(contact):
        async with semaphore:
            try:
                call = await client.calls.create_outbound(
                    phone_number=contact["phone"],
                    assistant_id=assistant_id,
                    context_data={
                        "customer_name": contact["name"],
                        "lead_score": contact["lead_score"],
                        "campaign": "q1_2024_followup"
                    },
                    max_duration_minutes=8
                )
                print(f"Started call to {contact['name']}: {call.call_id}")
                return call
            except Exception as e:
                print(f"Failed to call {contact['name']}: {e}")
                return None
    
    # Execute all calls
    calls = await asyncio.gather(*[make_call(contact) for contact in contacts])
    
    successful_calls = [c for c in calls if c is not None]
    print(f"Successfully started {len(successful_calls)} calls")

# Run the campaign
asyncio.run(bulk_outbound_campaign())
''',

    "smart_routing": '''
from voicepartnerai import VoicePartnerAI

client = VoicePartnerAI(api_key="vp_live_your_api_key_here")

def route_call_to_best_assistant(caller_info):
    """Route calls to the most appropriate assistant based on context."""
    
    # Analyze caller information
    if caller_info.get("language") == "es":
        assistant_id = 789  # Spanish-speaking assistant
    elif caller_info.get("issue_type") == "technical":
        assistant_id = 456  # Technical support assistant  
    elif caller_info.get("customer_tier") == "enterprise":
        assistant_id = 123  # Enterprise support assistant
    else:
        assistant_id = 101  # General support assistant
    
    # Configure assistant with caller context
    context = {
        "customer_id": caller_info.get("customer_id"),
        "previous_issues": caller_info.get("issue_history", []),
        "account_type": caller_info.get("account_type"),
        "preferred_language": caller_info.get("language", "en"),
        "escalation_preference": caller_info.get("escalation_preference")
    }
    
    return assistant_id, context

# Example usage with incoming call webhook
def handle_incoming_call(call_data):
    # Look up caller information
    caller_info = lookup_caller_info(call_data["from_number"])
    
    # Route to appropriate assistant
    assistant_id, context = route_call_to_best_assistant(caller_info)
    
    # Update call with routing decision
    client.calls.update(
        call_id=call_data["call_id"],
        assistant_id=assistant_id,
        context_data=context
    )

def lookup_caller_info(phone_number):
    # Query your CRM/database for caller information
    return {
        "customer_id": "cust_123",
        "language": "en", 
        "issue_type": "billing",
        "customer_tier": "pro",
        "issue_history": ["billing_question", "feature_request"]
    }
''',

    "analytics_dashboard": '''
import pandas as pd
import matplotlib.pyplot as plt
from voicepartnerai import VoicePartnerAI

client = VoicePartnerAI(api_key="vp_live_your_api_key_here")

def generate_call_analytics_report(workspace_id, days=30):
    """Generate comprehensive analytics report for calls."""
    
    # Get call analytics data
    analytics = client.analytics.get_call_analytics(
        workspace_id=workspace_id,
        days=days
    )
    
    # Convert to pandas DataFrame for analysis
    calls_df = pd.DataFrame(analytics["calls"])
    
    # Basic statistics
    total_calls = len(calls_df)
    success_rate = len(calls_df[calls_df["status"] == "completed"]) / total_calls * 100
    avg_duration = calls_df["duration_seconds"].mean()
    total_cost = calls_df["cost_eur"].sum()
    
    print(f"Call Analytics Report ({days} days)")
    print("=" * 40)
    print(f"Total Calls: {total_calls}")
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"Average Duration: {avg_duration:.0f} seconds")
    print(f"Total Cost: €{total_cost:.2f}")
    
    # Calls by hour analysis
    calls_df["hour"] = pd.to_datetime(calls_df["start_time"]).dt.hour
    hourly_calls = calls_df.groupby("hour").size()
    
    # Plot hourly distribution
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    hourly_calls.plot(kind="bar")
    plt.title("Calls by Hour of Day")
    plt.xlabel("Hour")
    plt.ylabel("Number of Calls")
    
    # Success rate by assistant
    assistant_stats = calls_df.groupby("assistant_name").agg({
        "status": lambda x: (x == "completed").mean() * 100,
        "duration_seconds": "mean",
        "cost_eur": "sum"
    }).round(2)
    
    plt.subplot(1, 2, 2)
    assistant_stats["status"].plot(kind="bar")
    plt.title("Success Rate by Assistant")
    plt.xlabel("Assistant")
    plt.ylabel("Success Rate (%)")
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig(f"call_analytics_{days}d.png")
    plt.show()
    
    return {
        "summary": {
            "total_calls": total_calls,
            "success_rate": success_rate,
            "avg_duration": avg_duration,
            "total_cost": total_cost
        },
        "hourly_distribution": hourly_calls.to_dict(),
        "assistant_performance": assistant_stats.to_dict()
    }

# Generate report
report = generate_call_analytics_report(workspace_id=123, days=30)
'''
}

# JavaScript/Node.js Examples
JAVASCRIPT_EXAMPLES = {
    "quick_start": '''
// Install the SDK
// npm install voicepartnerai

const VoicePartnerAI = require('voicepartnerai');

// Initialize client
const client = new VoicePartnerAI({
    apiKey: 'vp_live_your_api_key_here'
});

async function createAssistantAndCall() {
    try {
        // Create assistant
        const assistant = await client.assistants.create({
            name: 'Sales Bot',
            systemPrompt: `You are a friendly sales representative. 
            Your goal is to qualify leads and schedule demos.`,
            voiceId: '21m00Tcm4TlvDq8ikWAM',
            language: 'en-US'
        });
        
        console.log(`Created assistant: ${assistant.id}`);
        
        // Start outbound call
        const call = await client.calls.createOutbound({
            phoneNumber: '+15551234567',
            assistantId: assistant.id,
            contextData: {
                leadSource: 'website_signup',
                interestedProduct: 'enterprise_plan',
                companySize: '50-200'
            },
            maxDurationMinutes: 10
        });
        
        console.log(`Call started: ${call.callId}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createAssistantAndCall();
''',

    "express_webhook": '''
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const WEBHOOK_SECRET = 'your_webhook_secret';

// Webhook signature verification middleware
function verifyWebhookSignature(req, res, next) {
    const signature = req.headers['x-voicepartnerai-signature'];
    const payload = JSON.stringify(req.body);
    
    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    if (`sha256=${expectedSignature}` !== signature) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
}

// Handle webhook events
app.post('/webhooks/voicepartnerai', verifyWebhookSignature, (req, res) => {
    const { event, data } = req.body;
    
    switch (event) {
        case 'call.completed':
            handleCallCompleted(data);
            break;
            
        case 'call.failed':
            handleCallFailed(data);
            break;
            
        case 'assistant.updated':
            handleAssistantUpdated(data);
            break;
            
        default:
            console.log(`Unknown event: ${event}`);
    }
    
    res.json({ status: 'received' });
});

function handleCallCompleted(callData) {
    console.log(`Call ${callData.callId} completed`);
    console.log(`Duration: ${callData.durationSeconds}s`);
    console.log(`Outcome: ${callData.outcome || 'unknown'}`);
    
    // Update your database/CRM
    updateCRMWithCallResult(callData);
}

function handleCallFailed(callData) {
    console.log(`Call ${callData.callId} failed: ${callData.error}`);
    
    // Handle retry logic or notifications
    scheduleCallRetry(callData);
}

function handleAssistantUpdated(assistantData) {
    console.log(`Assistant ${assistantData.assistantId} was updated`);
    
    // Refresh cached assistant data
    refreshAssistantCache(assistantData.assistantId);
}

async function updateCRMWithCallResult(callData) {
    // Integrate with your CRM system
    // Example: Update Salesforce, HubSpot, etc.
}

async function scheduleCallRetry(callData) {
    // Implement retry logic for failed calls
}

async function refreshAssistantCache(assistantId) {
    // Update cached assistant configuration
}

app.listen(3000, () => {
    console.log('Webhook server running on port 3000');
});
''',

    "real_time_dashboard": '''
// Real-time call monitoring dashboard using Socket.IO
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const VoicePartnerAI = require('voicepartnerai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const client = new VoicePartnerAI({
    apiKey: 'vp_live_your_api_key_here'
});

// Serve dashboard HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Dashboard connected');
    
    // Send initial call statistics
    sendCallStatistics(socket);
    
    // Set up periodic updates
    const interval = setInterval(() => {
        sendCallStatistics(socket);
    }, 5000); // Update every 5 seconds
    
    socket.on('disconnect', () => {
        clearInterval(interval);
        console.log('Dashboard disconnected');
    });
});

async function sendCallStatistics(socket) {
    try {
        // Get real-time call statistics
        const stats = await client.analytics.getRealTimeStats({
            workspaceId: 123
        });
        
        socket.emit('call_stats', {
            activeCalls: stats.activeCalls,
            callsToday: stats.callsToday,
            avgDuration: stats.avgDuration,
            successRate: stats.successRate,
            totalCost: stats.totalCost,
            topAssistants: stats.topAssistants
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Handle incoming webhooks and broadcast to dashboard
app.post('/webhooks/voicepartnerai', express.json(), (req, res) => {
    const { event, data } = req.body;
    
    // Broadcast real-time events to dashboard
    io.emit('call_event', { event, data });
    
    res.json({ status: 'received' });
});

server.listen(3000, () => {
    console.log('Real-time dashboard running on port 3000');
});
'''
}

# PHP Examples  
PHP_EXAMPLES = {
    "quick_start": '''
<?php
// Install via Composer: composer require voicepartnerai/php-sdk

require_once 'vendor/autoload.php';

use VoicePartnerAI\\Client;

// Initialize client
$client = new Client([
    'api_key' => 'vp_live_your_api_key_here'
]);

try {
    // Create assistant
    $assistant = $client->assistants->create([
        'name' => 'Customer Service Bot',
        'system_prompt' => 'You are a professional customer service representative.',
        'voice_id' => '21m00Tcm4TlvDq8ikWAM',
        'language' => 'en-US'
    ]);
    
    echo "Created assistant: " . $assistant->id . "\\n";
    
    // Start outbound call
    $call = $client->calls->createOutbound([
        'phone_number' => '+15551234567',
        'assistant_id' => $assistant->id,
        'context_data' => [
            'customer_name' => 'John Smith',
            'issue_type' => 'billing'
        ]
    ]);
    
    echo "Call started: " . $call->call_id . "\\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
?>
''',

    "laravel_integration": '''
<?php
// Laravel Service Provider for VoicePartnerAI

namespace App\\Providers;

use Illuminate\\Support\\ServiceProvider;
use VoicePartnerAI\\Client;

class VoicePartnerAIServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(Client::class, function ($app) {
            return new Client([
                'api_key' => config('services.voicepartnerai.api_key')
            ]);
        });
    }
}

// Laravel Controller
namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use VoicePartnerAI\\Client;
use App\\Models\\Customer;

class CallController extends Controller
{
    private $voicePartnerAI;
    
    public function __construct(Client $voicePartnerAI)
    {
        $this->voicePartnerAI = $voicePartnerAI;
    }
    
    public function startCustomerCall(Request $request)
    {
        $customer = Customer::findOrFail($request->customer_id);
        
        try {
            $call = $this->voicePartnerAI->calls->createOutbound([
                'phone_number' => $customer->phone,
                'assistant_id' => config('voicepartnerai.support_assistant_id'),
                'context_data' => [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'account_type' => $customer->account_type,
                    'previous_issues' => $customer->supportTickets()
                        ->latest()
                        ->limit(5)
                        ->pluck('subject')
                        ->toArray()
                ]
            ]);
            
            // Log call in database
            $customer->callLogs()->create([
                'call_id' => $call->call_id,
                'status' => 'initiated',
                'initiated_by' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'call_id' => $call->call_id,
                'message' => 'Call initiated successfully'
            ]);
            
        } catch (\\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function handleWebhook(Request $request)
    {
        // Verify webhook signature
        $signature = $request->header('X-VoicePartnerAI-Signature');
        $payload = $request->getContent();
        
        $expectedSignature = 'sha256=' . hash_hmac(
            'sha256',
            $payload,
            config('services.voicepartnerai.webhook_secret')
        );
        
        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }
        
        $event = $request->json();
        
        switch ($event['event']) {
            case 'call.completed':
                $this->handleCallCompleted($event['data']);
                break;
                
            case 'call.failed':
                $this->handleCallFailed($event['data']);
                break;
        }
        
        return response()->json(['status' => 'received']);
    }
    
    private function handleCallCompleted($callData)
    {
        // Update call log in database
        \\DB::table('call_logs')
            ->where('call_id', $callData['call_id'])
            ->update([
                'status' => 'completed',
                'duration_seconds' => $callData['duration_seconds'],
                'outcome' => $callData['outcome'] ?? null,
                'completed_at' => now()
            ]);
        
        // Send notification to customer
        $customer = Customer::whereHas('callLogs', function ($query) use ($callData) {
            $query->where('call_id', $callData['call_id']);
        })->first();
        
        if ($customer) {
            $customer->notify(new CallCompletedNotification($callData));
        }
    }
    
    private function handleCallFailed($callData)
    {
        // Update call log and schedule retry if appropriate
        \\DB::table('call_logs')
            ->where('call_id', $callData['call_id'])
            ->update([
                'status' => 'failed',
                'error_message' => $callData['error'],
                'failed_at' => now()
            ]);
        
        // Schedule retry for certain types of failures
        if (in_array($callData['error_code'], ['busy', 'no_answer'])) {
            // Schedule retry in 1 hour
            \\App\\Jobs\\RetryFailedCall::dispatch($callData['call_id'])
                ->delay(now()->addHour());
        }
    }
}
?>
'''
}

# cURL Examples for testing
CURL_EXAMPLES = {
    "authentication": '''
# Test API key authentication
curl -X GET "https://api.voicepartnerai.com/api/v1/assistants?workspace_id=123" \\
  -H "X-API-Key: vp_live_your_api_key_here" \\
  -H "Content-Type: application/json"
''',

    "create_assistant": '''
# Create a new assistant
curl -X POST "https://api.voicepartnerai.com/api/v1/assistants?workspace_id=123" \\
  -H "X-API-Key: vp_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Customer Support Bot",
    "description": "AI assistant for customer support",
    "system_prompt": "You are a helpful customer support representative.",
    "llm_model": "gpt-4",
    "temperature": 0.7,
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "language": "en-US",
    "first_message": "Hello! How can I help you today?"
  }'
''',

    "start_outbound_call": '''
# Start an outbound call
curl -X POST "https://api.voicepartnerai.com/api/v1/calls/outbound?workspace_id=123" \\
  -H "X-API-Key: vp_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+15551234567",
    "assistant_id": 456,
    "context_data": {
      "customer_name": "John Smith",
      "campaign": "follow_up_2024"
    },
    "max_duration_minutes": 10,
    "callback_url": "https://your-app.com/webhooks/call-complete"
  }'
''',

    "get_call_analytics": '''
# Get call analytics
curl -X GET "https://api.voicepartnerai.com/api/v1/analytics/calls?workspace_id=123&days=30" \\
  -H "X-API-Key: vp_live_your_api_key_here" \\
  -H "Content-Type: application/json"
'''
}

def generate_example_file(language: str, use_case: str) -> str:
    """Generate a specific example file for download."""
    
    examples_map = {
        "python": PYTHON_EXAMPLES,
        "javascript": JAVASCRIPT_EXAMPLES, 
        "php": PHP_EXAMPLES,
        "curl": CURL_EXAMPLES
    }
    
    if language not in examples_map:
        return "# Language not supported"
    
    if use_case not in examples_map[language]:
        return "# Use case not found"
    
    return examples_map[language][use_case]

if __name__ == "__main__":
    # Generate example files for distribution
    import os
    
    os.makedirs("examples", exist_ok=True)
    
    for lang, examples in [
        ("python", PYTHON_EXAMPLES),
        ("javascript", JAVASCRIPT_EXAMPLES),
        ("php", PHP_EXAMPLES),
        ("curl", CURL_EXAMPLES)
    ]:
        lang_dir = f"examples/{lang}"
        os.makedirs(lang_dir, exist_ok=True)
        
        for use_case, code in examples.items():
            extension = {
                "python": "py",
                "javascript": "js", 
                "php": "php",
                "curl": "sh"
            }[lang]
            
            with open(f"{lang_dir}/{use_case}.{extension}", "w") as f:
                f.write(code)
    
    print("Example files generated in ./examples/ directory")