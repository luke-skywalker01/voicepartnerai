import { useState, useEffect } from 'react'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
}

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)
  const [hasConsent, setHasConsent] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load preferences from localStorage
    const savedConsent = localStorage.getItem('cookie-consent')
    const lastInteraction = localStorage.getItem('cookie-last-interaction')

    if (savedConsent && lastInteraction) {
      try {
        const savedPreferences = JSON.parse(savedConsent)
        setPreferences(savedPreferences)
        setHasConsent(true)
        
        // Check if consent is still valid (1 year)
        const lastInteractionDate = new Date(lastInteraction)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        
        if (lastInteractionDate < oneYearAgo) {
          // Consent expired, reset
          localStorage.removeItem('cookie-consent')
          localStorage.removeItem('cookie-last-interaction')
          setHasConsent(false)
          setPreferences(defaultPreferences)
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error)
        setHasConsent(false)
      }
    }

    setIsLoaded(true)

    // Listen for preference changes
    const handlePreferenceChange = (event: CustomEvent) => {
      setPreferences(event.detail)
      setHasConsent(true)
    }

    window.addEventListener('cookiePreferencesChanged', handlePreferenceChange as EventListener)

    return () => {
      window.removeEventListener('cookiePreferencesChanged', handlePreferenceChange as EventListener)
    }
  }, [])

  const updatePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences))
    localStorage.setItem('cookie-last-interaction', new Date().toISOString())
    setPreferences(newPreferences)
    setHasConsent(true)

    // Dispatch event
    window.dispatchEvent(new CustomEvent('cookiePreferencesChanged', { 
      detail: newPreferences 
    }))
  }

  const revokeConsent = () => {
    localStorage.removeItem('cookie-consent')
    localStorage.removeItem('cookie-last-interaction')
    setPreferences(defaultPreferences)
    setHasConsent(false)

    // Clear all non-necessary cookies
    const allCookies = document.cookie.split(';')
    for (let cookie of allCookies) {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      // Don't delete necessary cookies
      if (!name.startsWith('auth-') && !name.startsWith('session-') && name !== 'cookie-consent') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    }
  }

  const canUseAnalytics = () => preferences.analytics && hasConsent
  const canUseMarketing = () => preferences.marketing && hasConsent
  const canUsePreferences = () => preferences.preferences && hasConsent

  return {
    preferences,
    hasConsent,
    isLoaded,
    updatePreferences,
    revokeConsent,
    canUseAnalytics,
    canUseMarketing,
    canUsePreferences,
  }
}