'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Download,
  Upload,
  Undo,
  Redo,
  Settings,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  Eye,
  PanelLeftClose,
  PanelRightClose
} from 'lucide-react'
// Temporarily commented out to isolate webpack error
// import { useWorkflowStore } from '@/lib/workflow/store'

// Lazy load heavy components - temporarily using simple canvas
const WorkflowCanvas = dynamic(() => import('@/components/workflow/SimpleWorkflowCanvas').then(mod => ({ default: mod.SimpleWorkflowCanvas })), {
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg flex items-center justify-center">Loading Canvas...</div>,
  ssr: false
})

// Temporarily commented out to isolate webpack error
// const NodePalette = dynamic(() => import('@/components/workflow/NodePalette').then(mod => ({ default: mod.NodePalette })), {
//   loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg"></div>,
//   ssr: false
// })

// const PropertiesPanel = dynamic(() => import('@/components/workflow/PropertiesPanel').then(mod => ({ default: mod.PropertiesPanel })), {
//   loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg"></div>,
//   ssr: false
// })
const VoiceAILogo = () => (
  <div className="flex items-center space-x-2">
    <div className="relative">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white rounded-full"></div>
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
    </div>
    <span className="text-xl font-semibold text-foreground tracking-tight">
      VoicePartnerAI
    </span>
  </div>
)

export default function WorkflowBuilderPage() {
  // Mock values to replace useWorkflowStore temporarily
  const [workflowName, setWorkflowName] = useState('Demo Workflow')
  const isDirty = false
  const nodes: any[] = []
  const edges: any[] = []
  const selectedNode = null
  const exportWorkflow = () => ({ name: workflowName, nodes: [], edges: [] })
  const importWorkflow = (workflow: any) => console.log('Import:', workflow)
  const resetWorkflow = () => console.log('Reset')
  const addNode = (type: string, position: any) => console.log('Add node:', type, position)

  // State for UI
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true) // Start collapsed
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [jsonCode, setJsonCode] = useState('')
  const [jsonError, setJsonError] = useState('')

  // Initialize with better positioned nodes
  useEffect(() => {
    if (nodes.length === 0) {
      // Add two conversation nodes with proper spacing
      addNode('conversation', { x: 300, y: 200 })
      // Only add one node initially to avoid overlap
    }
  }, [])

  const saveWorkflow = async () => {
    const workflow = exportWorkflow() as any
    console.log('Saving workflow:', workflow)
    
    try {
      // Try to save to backend API
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: workflowName,
          description: '',
          nodes: workflow.nodes,
          connections: workflow.edges
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert('Workflow erfolgreich gespeichert!')
          return
        }
      }

      // Fallback to localStorage if backend fails
      const userId = localStorage.getItem('userId') || 'user_' + Date.now()
      localStorage.setItem('userId', userId)
      
      const userWorkflows = JSON.parse(localStorage.getItem(`workflows_${userId}`) || '[]')
      const existingIndex = userWorkflows.findIndex((w: any) => w.id === workflow.id)
      
      if (existingIndex >= 0) {
        userWorkflows[existingIndex] = workflow
      } else {
        userWorkflows.push(workflow)
      }
      
      localStorage.setItem(`workflows_${userId}`, JSON.stringify(userWorkflows))
      alert('Workflow erfolgreich gespeichert!')
    } catch (error) {
      console.error('Save error:', error)
      alert('Fehler beim Speichern des Workflows')
    }
  }

  const toggleJsonEditor = () => {
    if (!showJsonEditor) {
      // Show current workflow as JSON
      const workflow = exportWorkflow()
      setJsonCode(JSON.stringify(workflow, null, 2))
      setJsonError('')
    }
    setShowJsonEditor(!showJsonEditor)
  }

  const validateJson = (code: string) => {
    try {
      const parsed = JSON.parse(code)
      setJsonError('')
      return parsed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ungültiger JSON'
      setJsonError(errorMessage)
      return null
    }
  }

  const applyJsonCode = () => {
    try {
      const workflow = validateJson(jsonCode)
      if (!workflow) {
        return // Error already set by validateJson
      }

      // Validate workflow structure
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        setJsonError('Workflow muss ein "nodes" Array enthalten')
        return
      }

      if (!workflow.edges || !Array.isArray(workflow.edges)) {
        setJsonError('Workflow muss ein "edges" Array enthalten')
        return
      }

      // Import the workflow
      importWorkflow(workflow)
      setShowJsonEditor(false)
      setJsonError('')
      alert('JSON erfolgreich importiert!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Importieren'
      setJsonError(errorMessage)
    }
  }

  // Real-time JSON validation while typing
  const handleJsonChange = (value: string) => {
    setJsonCode(value)
    // Debounced validation
    setTimeout(() => validateJson(value), 500)
  }

  const insertExampleJson = () => {
    const exampleWorkflow = {
      "name": "Beispiel Workflow",
      "nodes": [
        {
          "id": "node_1",
          "type": "workflowNode",
          "position": { "x": 100, "y": 100 },
          "data": {
            "title": "Conversation Node",
            "type": "conversation",
            "config": {
              "firstMessage": "Hallo! Wie kann ich Ihnen helfen?",
              "prompt": "Du bist ein hilfsreicher Assistent.",
              "model": "gpt-4o",
              "voice": {
                "provider": "elevenlabs",
                "voiceId": "german-female-1"
              }
            }
          }
        },
        {
          "id": "node_2",
          "type": "workflowNode", 
          "position": { "x": 400, "y": 100 },
          "data": {
            "title": "End Call",
            "type": "end_call",
            "config": {
              "message": "Auf Wiederhören!"
            }
          }
        }
      ],
      "edges": [
        {
          "id": "edge_1",
          "source": "node_1",
          "target": "node_2",
          "type": "smoothstep"
        }
      ],
      "version": "1.0"
    }
    
    setJsonCode(JSON.stringify(exampleWorkflow, null, 2))
    setJsonError('')
  }

  const testWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Workflow ist leer. Füge zuerst Nodes hinzu.')
      return
    }
    
    alert(`Workflow Test wird gestartet...\n\nWorkflow: ${workflowName}\nNodes: ${nodes.length}\nVerbindungen: ${edges.length}\n\nDies würde eine echte Sprachsimulation starten.`)
  }

  const exportToFile = () => {
    const workflow = exportWorkflow()
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFromFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const workflow = JSON.parse(e.target?.result as string)
            importWorkflow(workflow)
            alert('Workflow erfolgreich importiert!')
          } catch (error) {
            alert('Fehler beim Importieren: Ungültige JSON-Datei')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo & Back */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="flex items-center space-x-3">
              <VoiceAILogo />
            </Link>
          </div>

          {/* Workflow Name */}
          <div className="flex-1 max-w-md mx-8">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 text-center"
              placeholder="Workflow Name"
            />
            <p className="text-xs text-muted-foreground text-center">
              {nodes.length} Nodes • {edges.length} Verbindungen
              {isDirty && <span className="text-orange-500 ml-2">• Nicht gespeichert</span>}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleJsonEditor}
              className={`border border-border px-3 py-2 rounded-md hover:bg-muted flex items-center text-sm transition-colors ${
                showJsonEditor ? 'bg-accent text-accent-foreground' : 'text-foreground'
              }`}
            >
              <Code className="h-4 w-4 mr-2" />
              JSON
            </button>
            <button
              onClick={importFromFile}
              className="border border-border text-foreground px-3 py-2 rounded-md hover:bg-muted flex items-center text-sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button
              onClick={exportToFile}
              className="border border-border text-foreground px-3 py-2 rounded-md hover:bg-muted flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={saveWorkflow}
              className={`px-4 py-2 rounded-md flex items-center text-sm transition-colors ${
                isDirty
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'border border-border text-foreground hover:bg-muted'
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {isDirty ? 'Speichern' : 'Gespeichert'}
            </button>
            <button
              onClick={testWorkflow}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center text-sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Testen
            </button>
          </div>
        </div>
      </header>

      {/* Workflow Builder */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Panel - Collapsible Node Palette */}
        <div className={`transition-all duration-300 border-r border-border bg-card/50 backdrop-blur-sm ${
          leftPanelCollapsed ? 'w-12' : 'w-80'
        }`}>
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              {!leftPanelCollapsed && (
                <div>
                  <h3 className="text-lg font-semibold">Komponenten</h3>
                  <p className="text-xs text-muted-foreground">Drag & Drop</p>
                </div>
              )}
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                {leftPanelCollapsed ? 
                  <ChevronRight className="h-4 w-4" /> : 
                  <ChevronLeft className="h-4 w-4" />
                }
              </button>
            </div>
            
            {/* Panel Content */}
            {!leftPanelCollapsed && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-center text-gray-500">
                  <p>Node Palette vorübergehend deaktiviert</p>
                  <p className="text-sm">Wird nach Fehlerbehebung wieder aktiviert</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas */}
          <div className="flex-1 bg-gradient-to-br from-background to-muted/20 relative">
            {showJsonEditor ? (
              /* JSON Editor Overlay */
              <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm">
                <div className="h-full flex flex-col p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">JSON Editor</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={insertExampleJson}
                        className="border border-border px-3 py-2 rounded-md hover:bg-muted text-sm text-blue-600 hover:text-blue-700"
                        title="Beispiel-Workflow einfügen"
                      >
                        Beispiel
                      </button>
                      <button
                        onClick={applyJsonCode}
                        disabled={!!jsonError || !jsonCode.trim()}
                        className={`px-4 py-2 rounded-md text-sm transition-colors ${
                          jsonError || !jsonCode.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        Anwenden
                      </button>
                      <button
                        onClick={() => setShowJsonEditor(false)}
                        className="border border-border px-4 py-2 rounded-md hover:bg-muted text-sm"
                      >
                        Schließen
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      value={jsonCode}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      className={`w-full h-full font-mono text-sm p-4 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        jsonError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-border'
                      }`}
                      placeholder="Workflow JSON hier einfügen..."
                    />
                    {jsonError && (
                      <div className="absolute top-2 right-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded px-3 py-1">
                        <p className="text-xs text-red-700 dark:text-red-400 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {jsonError}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <p className="text-xs text-muted-foreground">
                        Bearbeiten Sie den JSON Code direkt oder fügen Sie einen neuen Workflow ein.
                      </p>
                      <button
                        onClick={() => {setJsonCode(''); setJsonError('')}}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Leeren
                      </button>
                    </div>
                    {!jsonError && jsonCode && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Gültiger JSON
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <WorkflowCanvas className="w-full h-full" />
                
                {/* Help Overlay für leeren Canvas */}
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Workflow Builder</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        {leftPanelCollapsed ? 
                          'Öffnen Sie die linke Palette, um Komponenten hinzuzufügen' :
                          'Ziehen Sie Komponenten aus der linken Palette hierher'
                        }
                      </p>
                      {leftPanelCollapsed && (
                        <button
                          onClick={() => setLeftPanelCollapsed(false)}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm"
                        >
                          Palette öffnen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Right Panel - Collapsible Properties */}
        <div className={`transition-all duration-300 border-l border-border bg-card/50 backdrop-blur-sm ${
          rightPanelCollapsed ? 'w-12' : 'w-96'
        }`}>
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                {rightPanelCollapsed ? 
                  <ChevronLeft className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
              {!rightPanelCollapsed && (
                <div className="text-right">
                  <h3 className="text-lg font-semibold">Eigenschaften</h3>
                  <p className="text-xs text-muted-foreground">Node-Config</p>
                </div>
              )}
            </div>
            
            {/* Panel Content */}
            {!rightPanelCollapsed && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-center text-gray-500">
                  <p>Properties Panel vorübergehend deaktiviert</p>
                  <p className="text-sm">Wird nach Fehlerbehebung wieder aktiviert</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}