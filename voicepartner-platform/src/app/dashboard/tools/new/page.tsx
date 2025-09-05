'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewToolPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the edit page with 'new' as the ID
    router.replace('/dashboard/tools/new/edit')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Neues Tool wird erstellt...</p>
      </div>
    </div>
  )
}