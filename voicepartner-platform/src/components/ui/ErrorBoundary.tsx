'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

class ErrorBoundaryClass extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<any> }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={() => this.setState({ hasError: false })} />
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Etwas ist schiefgelaufen</h2>
            <p className="text-gray-600 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-gray-100 p-4 rounded-lg mb-4 text-sm">
                <summary className="cursor-pointer font-medium">Fehlerdetails (Development)</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                window.location.reload()
              }}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorBoundary({ children, fallback }: { 
  children: React.ReactNode
  fallback?: React.ComponentType<any>
}) {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  )
}

export default ErrorBoundary