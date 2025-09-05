'use client'

import { Bot, Plus, Zap } from 'lucide-react'

interface EmptyStateProps {
  onQuickStart: () => void
}

export default function EmptyState({ onQuickStart }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
          <Bot className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Willkommen bei VoicePartnerAI!
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Erstellen Sie Ihren ersten intelligenten Voice Assistant und bringen Sie 
          Ihr Business ins Gespräch. In wenigen Minuten einsatzbereit.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={onQuickStart}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
          >
            <Zap className="w-5 h-5 mr-2" />
            Quick Start - Ersten Assistant erstellen
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/assistants/new'}
            className="w-full border border-border hover:bg-muted px-8 py-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Manuell erstellen
          </button>
        </div>
      </div>
    </div>
  )
}