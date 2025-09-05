'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Assistant Edit Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Fehler beim Laden
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Der Assistant konnte nicht geladen werden. Möglicherweise wurde er gelöscht oder es ist ein technischer Fehler aufgetreten.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </button>
            
            <Link
              href="/dashboard/assistants"
              className="flex items-center justify-center px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </Link>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technische Details
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}