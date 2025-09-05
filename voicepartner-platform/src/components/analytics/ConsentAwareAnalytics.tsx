'use client'

import { useEffect } from 'react'
import { useCookieConsent } from '@/hooks/useCookieConsent'

// Google Analytics implementation with consent awareness
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

export const ConsentAwareAnalytics = () => {
  const { canUseAnalytics, preferences } = useCookieConsent()

  useEffect(() => {
    if (canUseAnalytics()) {
      initializeGoogleAnalytics()
    } else {
      disableGoogleAnalytics()
    }
  }, [canUseAnalytics])

  useEffect(() => {
    // Listen for preference changes
    const handlePreferenceChange = () => {
      if (canUseAnalytics()) {
        initializeGoogleAnalytics()
      } else {
        disableGoogleAnalytics()
      }
    }

    window.addEventListener('cookiePreferencesChanged', handlePreferenceChange)
    return () => window.removeEventListener('cookiePreferencesChanged', handlePreferenceChange)
  }, [canUseAnalytics])

  return null // This component doesn't render anything
}

const initializeGoogleAnalytics = () => {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not configured')
    return
  }

  // Initialize dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || []

  // Define gtag function
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }

  window.gtag = gtag

  // Initialize Google Analytics
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true, // GDPR compliance
    allow_google_signals: false, // Disable Google Signals for privacy
    allow_ad_personalization_signals: false, // Disable ad personalization
    cookie_flags: 'secure;samesite=strict', // Secure cookies
  })

  // Load Google Analytics script
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)
  }

  console.log('Google Analytics initialized with consent')
}

const disableGoogleAnalytics = () => {
  // Disable Google Analytics
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied'
    })
  }

  // Remove Google Analytics cookies
  const gaCookies = document.cookie.split(';').filter(cookie => 
    cookie.trim().startsWith('_ga') || 
    cookie.trim().startsWith('_gid')
  )

  gaCookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim()
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })

  console.log('Google Analytics disabled and cookies cleared')
}

// Export functions for manual tracking
export const trackEvent = (event: AnalyticsEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const { canUseAnalytics } = useCookieConsent()
    
    if (canUseAnalytics()) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      })
    }
  }
}

export const trackPageView = (url: string, title: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const { canUseAnalytics } = useCookieConsent()
    
    if (canUseAnalytics()) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_location: url,
        page_title: title,
      })
    }
  }
}

export default ConsentAwareAnalytics