'use client'

import React, { Suspense } from 'react'
import LoadingSpinner from './LoadingSpinner'
import ErrorBoundary from './ErrorBoundary'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  error?: React.ComponentType<any>
}

export function LazyWrapper({ 
  children, 
  fallback = <LoadingSpinner size="md" text="Komponente wird geladen..." />,
  error 
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={error}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default LazyWrapper