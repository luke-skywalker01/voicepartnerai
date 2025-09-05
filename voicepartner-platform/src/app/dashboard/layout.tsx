'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <DashboardLayout>{children}</DashboardLayout>
}