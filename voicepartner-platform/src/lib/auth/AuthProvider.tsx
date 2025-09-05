'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only run on client side
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('demo_user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Auth init error:', error)
        localStorage.removeItem('demo_user')
      } finally {
        setLoading(false)
      }
    }

    // Ensure we're on client side
    if (typeof window !== 'undefined') {
      initAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const demoUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
      plan: 'free',
      createdAt: new Date().toISOString()
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(demoUser))
    }
    setUser(demoUser)
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const demoUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      plan: 'free',
      createdAt: new Date().toISOString()
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(demoUser))
    }
    setUser(demoUser)
  }

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_user')
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}