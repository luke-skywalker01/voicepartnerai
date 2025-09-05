'use client'

import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import WorkspaceManager from '@/components/workspace/WorkspaceManager'

export default function WorkspacesPage() {
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
              <h1 className="text-2xl font-bold text-foreground">
                Workspace-Verwaltung
              </h1>
              <p className="text-muted-foreground">
                Verwalten Sie Ihr Team und Workspace-Einstellungen
              </p>
            </div>
          </div>
          
          <Link
            href="/dashboard/workspaces/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Workspace
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <WorkspaceManager />
      </div>
    </div>
  )
}