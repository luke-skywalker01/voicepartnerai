'use client'

import { useState } from 'react'
import { X, Bot, ArrowRight } from 'lucide-react'

interface QuickStartProps {
  onClose: () => void
}

export default function QuickStart({ onClose }: QuickStartProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Quick Start</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-medium">Erstellen Sie Ihren ersten Assistant</h3>
              <p className="text-sm text-muted-foreground">Beginnen Sie mit einem einfachen Voice Bot</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Später
          </button>
          <button
            onClick={() => {
              onClose()
              window.location.href = '/dashboard/assistants/new'
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
          >
            Jetzt starten
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}