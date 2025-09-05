// Cross-App Authentication System
// Handles authentication between Homepage and Workspace

interface UserSession {
  id: string
  email?: string
  name?: string
  timestamp: number
  source: 'homepage' | 'workspace' | 'direct'
  preferences?: {
    theme?: 'light' | 'dark'
    language?: 'de' | 'en'
  }
}

export class CrossAppAuth {
  private static instance: CrossAppAuth
  private currentSession: UserSession | null = null
  private sessionKey = 'voicepartner_session'

  private constructor() {
    this.loadSession()
  }

  static getInstance(): CrossAppAuth {
    if (!CrossAppAuth.instance) {
      CrossAppAuth.instance = new CrossAppAuth()
    }
    return CrossAppAuth.instance
  }

  // Create a new session when user comes from homepage
  createSession(source: 'homepage' | 'workspace' | 'direct', userData?: Partial<UserSession>): UserSession {
    const session: UserSession = {
      id: this.generateSessionId(),
      timestamp: Date.now(),
      source,
      ...userData
    }

    this.currentSession = session
    this.saveSession()
    return session
  }

  // Get current session
  getSession(): UserSession | null {
    return this.currentSession
  }

  // Check if user is authenticated (has valid session)
  isAuthenticated(): boolean {
    if (!this.currentSession) return false
    
    // Session expires after 24 hours
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    const sessionAge = Date.now() - this.currentSession.timestamp
    
    if (sessionAge > maxAge) {
      this.clearSession()
      return false
    }
    
    return true
  }

  // Update session with new data
  updateSession(updates: Partial<UserSession>): void {
    if (this.currentSession) {
      this.currentSession = { ...this.currentSession, ...updates }
      this.saveSession()
    }
  }

  // Clear session (logout)
  clearSession(): void {
    this.currentSession = null
    localStorage.removeItem(this.sessionKey)
    sessionStorage.removeItem(this.sessionKey)
  }

  // Save session to localStorage
  private saveSession(): void {
    if (this.currentSession) {
      const sessionData = JSON.stringify(this.currentSession)
      localStorage.setItem(this.sessionKey, sessionData)
      sessionStorage.setItem(this.sessionKey, sessionData)
    }
  }

  // Load session from localStorage
  private loadSession(): void {
    try {
      const sessionData = localStorage.getItem(this.sessionKey) || sessionStorage.getItem(this.sessionKey)
      if (sessionData) {
        this.currentSession = JSON.parse(sessionData)
        
        // Validate session age
        if (!this.isAuthenticated()) {
          this.currentSession = null
        }
      }
    } catch (error) {
      console.warn('Failed to load session:', error)
      this.currentSession = null
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  // Get session info for debugging
  getSessionInfo(): {
    isAuthenticated: boolean
    session: UserSession | null
    sessionAge?: number
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      session: this.currentSession,
      sessionAge: this.currentSession ? Date.now() - this.currentSession.timestamp : undefined
    }
  }

  // Handle cross-origin communication between apps
  setupCrossOriginListener(): void {
    window.addEventListener('message', (event) => {
      // Only accept messages from our own domains
      const allowedOrigins = [
        'http://localhost:8081', // Homepage
        'http://localhost:3003', // Workspace
        'https://voicepartner.ai', // Production homepage
        'https://workspace.voicepartner.ai' // Production workspace
      ]

      if (!allowedOrigins.includes(event.origin)) {
        return
      }

      if (event.data.type === 'AUTH_REQUEST') {
        // Send current session to requesting app
        event.source?.postMessage({
          type: 'AUTH_RESPONSE',
          session: this.currentSession,
          timestamp: Date.now()
        }, event.origin)
      }

      if (event.data.type === 'AUTH_UPDATE') {
        // Update session from other app
        if (event.data.session) {
          this.currentSession = event.data.session
          this.saveSession()
        }
      }
    })
  }

  // Request session from other app
  requestSessionFromOtherApp(targetOrigin: string): Promise<UserSession | null> {
    return new Promise((resolve) => {
      const messageHandler = (event: MessageEvent) => {
        if (event.origin === targetOrigin && event.data.type === 'AUTH_RESPONSE') {
          window.removeEventListener('message', messageHandler)
          if (event.data.session) {
            this.currentSession = event.data.session
            this.saveSession()
          }
          resolve(event.data.session || null)
        }
      }

      window.addEventListener('message', messageHandler)
      
      // Send request to other app
      window.postMessage({
        type: 'AUTH_REQUEST',
        timestamp: Date.now()
      }, targetOrigin)

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler)
        resolve(null)
      }, 5000)
    })
  }

  // Sync session to other app
  syncSessionToOtherApp(targetOrigin: string): void {
    if (this.currentSession) {
      window.postMessage({
        type: 'AUTH_UPDATE',
        session: this.currentSession,
        timestamp: Date.now()
      }, targetOrigin)
    }
  }
}

// Convenience functions
export const auth = CrossAppAuth.getInstance()

export function useAuth() {
  return {
    session: auth.getSession(),
    isAuthenticated: auth.isAuthenticated(),
    createSession: auth.createSession.bind(auth),
    updateSession: auth.updateSession.bind(auth),
    clearSession: auth.clearSession.bind(auth),
    getSessionInfo: auth.getSessionInfo.bind(auth)
  }
}

// Initialize cross-origin communication
if (typeof window !== 'undefined') {
  auth.setupCrossOriginListener()
}