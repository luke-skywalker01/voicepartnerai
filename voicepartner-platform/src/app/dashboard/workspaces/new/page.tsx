'use client'

import { useState } from 'react'
import { ArrowLeft, Building, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan: 'free'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Workspace-Namen ein')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const workspace = await response.json()
        alert('Workspace erfolgreich erstellt!')
        router.push(`/dashboard/workspaces/${workspace.id}`)
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.detail || 'Workspace konnte nicht erstellt werden'}`)
      }
    } catch (error) {
      console.error('Failed to create workspace:', error)
      alert('Fehler beim Erstellen des Workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/workspaces" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <Building className="h-6 w-6 mr-3" />
              Neuen Workspace erstellen
            </h1>
            <p className="text-muted-foreground">
              Erstellen Sie einen neuen Workspace für Ihr Team
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workspace Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Workspace-Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mein Unternehmen"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dieser Name wird für alle Teammitglieder sichtbar sein.
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Beschreibung (optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kurze Beschreibung des Workspace..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>

              {/* Plan Selection */}
              <div>
                <label htmlFor="plan" className="block text-sm font-medium mb-2">
                  Plan
                </label>
                <select
                  id="plan"
                  value={formData.plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="free">Free (bis zu 5 Mitglieder, 100 Credits)</option>
                  <option value="pro">Pro (bis zu 50 Mitglieder, 1000 Credits)</option>
                  <option value="enterprise">Enterprise (Unbegrenzt)</option>
                </select>
              </div>

              {/* Plan Features */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Enthaltene Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Team-Kollaboration mit Rollen-System</li>
                  <li>• Geteilte AI-Assistenten und Ressourcen</li>
                  <li>• Centralized Billing und Usage Analytics</li>
                  <li>• Workspace-basierte Berechtigungen</li>
                  {formData.plan !== 'free' && (
                    <>
                      <li>• Erweiterte Team-Features</li>
                      <li>• Priority Support</li>
                    </>
                  )}
                  {formData.plan === 'enterprise' && (
                    <>
                      <li>• Custom Integrations</li>
                      <li>• Dedicated Account Manager</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className={`flex-1 py-3 px-4 rounded-md font-medium flex items-center justify-center ${
                    loading || !formData.name.trim()
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Erstelle Workspace...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Workspace erstellen
                    </>
                  )}
                </button>
                
                <Link
                  href="/dashboard/workspaces"
                  className="px-4 py-3 border border-border rounded-md hover:bg-muted text-center"
                >
                  Abbrechen
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}