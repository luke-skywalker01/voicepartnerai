'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Rocket, 
  Globe, 
  Phone, 
  Code, 
  Copy, 
  Download,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Play,
  Settings,
  Zap,
  Server,
  Key
} from 'lucide-react'

export default function DeploymentPage() {
  const [activeAgent, setActiveAgent] = useState('1')
  const [deploymentType, setDeploymentType] = useState('phone')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')

  const agents = [
    { id: '1', name: 'Kundenservice Bot', status: 'active' },
    { id: '2', name: 'Terminbuchung Assistant', status: 'active' },
    { id: '3', name: 'Sales Qualifier', status: 'paused' }
  ]

  const deploymentTypes = [
    {
      id: 'phone',
      name: 'Telefon Integration',
      description: 'Verbinden Sie Ihren Agent mit einer Telefonnummer',
      icon: Phone,
      features: ['Eingehende Anrufe', 'Ausgehende Anrufe', 'Voicemail', 'Weiterleitung']
    },
    {
      id: 'web',
      name: 'Web Widget',
      description: 'Betten Sie den Agent in Ihre Website ein',
      icon: Globe,
      features: ['Click-to-Call', 'Chat Integration', 'Responsive Design', 'Branding']
    },
    {
      id: 'api',
      name: 'API Integration',
      description: 'Verwenden Sie die REST API für eigene Apps',
      icon: Code,
      features: ['RESTful API', 'Webhooks', 'Real-time Events', 'SDKs']
    }
  ]

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeploymentStatus('deploying')

    // Simulate deployment process
    setTimeout(() => {
      setDeploymentStatus('success')
      setIsDeploying(false)
    }, 3000)
  }

  const generateApiKey = () => {
    return `vp_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('In Zwischenablage kopiert!')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agent Deployment</h1>
              <p className="text-muted-foreground">
                Veröffentlichen Sie Ihre Voice Agents für Produktionsnutzung
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Konfiguration
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Selection & Deployment Type */}
          <div className="lg:col-span-1 space-y-6">
            {/* Agent Selection */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Agent auswählen</h3>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <label key={agent.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="agent"
                      value={agent.id}
                      checked={activeAgent === agent.id}
                      onChange={(e) => setActiveAgent(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{agent.name}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agent.status === 'active' ? 'Bereit' : 'Nicht bereit'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Deployment Type */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Deployment Typ</h3>
              <div className="space-y-3">
                {deploymentTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      deploymentType === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setDeploymentType(type.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <type.icon className={`h-5 w-5 mt-0.5 ${
                        deploymentType === type.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{type.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deploy Button */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Deployment</h3>
              
              {deploymentStatus === 'idle' && (
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-md flex items-center justify-center transition-colors"
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  {isDeploying ? 'Wird deployed...' : 'Agent deployen'}
                </button>
              )}

              {deploymentStatus === 'deploying' && (
                <div className="text-center py-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Deployment läuft...</p>
                </div>
              )}

              {deploymentStatus === 'success' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600">Erfolgreich deployed!</p>
                  <button
                    onClick={() => setDeploymentStatus('idle')}
                    className="mt-2 text-primary hover:text-primary/80 text-sm"
                  >
                    Neues Deployment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Configuration & Integration Code */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                {deploymentTypes.find(t => t.id === deploymentType)?.name} Konfiguration
              </h3>

              {deploymentType === 'phone' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Telefonnummer</label>
                      <select className="w-full px-3 py-2 border border-input bg-background rounded-md">
                        <option>+49 30 12345678 (verfügbar)</option>
                        <option>+49 89 98765432 (verfügbar)</option>
                        <option disabled>Neue Nummer kaufen...</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Provider</label>
                      <select className="w-full px-3 py-2 border border-input bg-background rounded-md">
                        <option>Twilio</option>
                        <option>Vonage</option>
                        <option>Custom SIP</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Fallback Nummer</label>
                    <input
                      type="tel"
                      placeholder="+49 30 87654321"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    />
                  </div>
                </div>
              )}

              {deploymentType === 'web' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Widget Position</label>
                      <select className="w-full px-3 py-2 border border-input bg-background rounded-md">
                        <option>Unten rechts</option>
                        <option>Unten links</option>
                        <option>Oben rechts</option>
                        <option>Zentral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Farbe</label>
                      <input
                        type="color"
                        defaultValue="#6366f1"
                        className="w-full h-10 border border-input bg-background rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Begrüßungstext</label>
                    <input
                      type="text"
                      placeholder="Hallo! Wie kann ich Ihnen helfen?"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    />
                  </div>
                </div>
              )}

              {deploymentType === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">API Endpoint</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value="https://api.voicepartnerai.com/v1"
                        readOnly
                        className="flex-1 px-3 py-2 border border-input bg-muted rounded-md"
                      />
                      <button
                        onClick={() => copyToClipboard('https://api.voicepartnerai.com/v1')}
                        className="px-3 py-2 border border-border rounded-md hover:bg-muted"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                    <div className="flex space-x-2">
                      <input
                        type="password"
                        value={generateApiKey()}
                        readOnly
                        className="flex-1 px-3 py-2 border border-input bg-muted rounded-md"
                      />
                      <button
                        onClick={() => copyToClipboard(generateApiKey())}
                        className="px-3 py-2 border border-border rounded-md hover:bg-muted"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Integration Code */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Integration Code</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(document.querySelector('pre')?.textContent || '')}
                    className="px-3 py-2 border border-border rounded-md hover:bg-muted flex items-center text-sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Kopieren
                  </button>
                  <button className="px-3 py-2 border border-border rounded-md hover:bg-muted flex items-center text-sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>

              {deploymentType === 'phone' && (
                <pre className="bg-muted/50 p-4 rounded-md text-sm overflow-x-auto">
{`// Twilio Webhook Configuration
const express = require('express');
const app = express();

app.post('/voice-webhook', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Forward to VoicePartnerAI
  twiml.connect().stream({
    url: 'wss://api.voicepartnerai.com/stream',
    params: {
      assistantId: '${activeAgent}',
      apiKey: 'your-api-key-here'
    }
  });
  
  res.type('text/xml');
  res.send(twiml.toString());
});`}
                </pre>
              )}

              {deploymentType === 'web' && (
                <pre className="bg-muted/50 p-4 rounded-md text-sm overflow-x-auto">
{`<!-- HTML Widget Code -->
<script src="https://cdn.voicepartnerai.com/widget.js"></script>
<script>
  VoicePartnerAI.init({
    assistantId: '${activeAgent}',
    apiKey: 'your-api-key-here',
    position: 'bottom-right',
    color: '#6366f1',
    greeting: 'Hallo! Wie kann ich Ihnen helfen?'
  });
</script>`}
                </pre>
              )}

              {deploymentType === 'api' && (
                <pre className="bg-muted/50 p-4 rounded-md text-sm overflow-x-auto">
{`// JavaScript SDK Usage
const VoicePartnerAI = require('@voicepartnerai/sdk');

const client = new VoicePartnerAI({
  apiKey: '${generateApiKey()}'
});

// Start a call
const call = await client.calls.create({
  assistantId: '${activeAgent}',
  phoneNumber: '+49123456789',
  customer: {
    number: '+49987654321',
    name: 'Max Mustermann'
  }
});

console.log('Call started:', call.id);`}
                </pre>
              )}
            </div>

            {/* Live Status */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Live Status & Monitoring</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Server className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">System Status</p>
                  <p className="text-xs text-green-600">Operational</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">Response Time</p>
                  <p className="text-xs text-blue-600">245ms avg</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Play className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-800">Active Calls</p>
                  <p className="text-xs text-purple-600">12 concurrent</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/dashboard?tab=monitoring"
                  className="inline-flex items-center text-primary hover:text-primary/80 text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Detailliertes Monitoring anzeigen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}