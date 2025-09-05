'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import VapiSidebar from './VapiSidebar'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  Search,
  Bell,
  User,
  Moon,
  Sun,
  Settings
} from 'lucide-react'

interface BreadcrumbItem {
  name: string
  href?: string
}

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  
  const breadcrumbs: BreadcrumbItem[] = []
  
  // Always start with Dashboard
  if (segments[0] !== 'dashboard') {
    breadcrumbs.push({ name: 'Dashboard', href: '/dashboard' })
  }
  
  // Map segments to breadcrumb names
  const segmentMap: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'assistants': 'Assistants',
    'create': 'Create Assistant',
    'edit': 'Edit Assistant',
    'phone-numbers': 'Phone Numbers',
    'analytics': 'Analytics',
    'logs': 'Call Logs',
    'workflows': 'Workflows',
    'team': 'Team',
    'billing': 'Billing',
    'settings': 'Settings',
    'help': 'Help & Support',
    'templates': 'Templates'
  }
  
  segments.forEach((segment, index) => {
    const name = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const href = index === segments.length - 1 ? undefined : '/' + segments.slice(0, index + 1).join('/')
    breadcrumbs.push({ name, href })
  })
  
  return breadcrumbs
}

interface VapiMainLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function VapiMainLayout({ 
  children, 
  title, 
  subtitle, 
  actions 
}: VapiMainLayoutProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const [isDark, setIsDark] = React.useState(true)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showProfile, setShowProfile] = React.useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="flex h-screen bg-vapi-black">
      {/* Sidebar */}
      <VapiSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-vapi-black border-b border-vapi-border-gray flex items-center justify-between px-6">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.name}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-vapi-text-secondary flex-shrink-0" />
                )}
                {breadcrumb.href ? (
                  <a
                    href={breadcrumb.href}
                    className="text-vapi-text-secondary hover:text-vapi-text-primary transition-colors"
                  >
                    {breadcrumb.name}
                  </a>
                ) : (
                  <span className="text-vapi-text-primary font-medium">
                    {breadcrumb.name}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 text-vapi-text-secondary absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 bg-vapi-dark-gray border border-vapi-border-gray rounded-lg text-sm text-vapi-text-primary placeholder-vapi-text-secondary focus:outline-none focus:ring-2 focus:ring-vapi-indigo focus:border-transparent"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-dark-gray rounded-lg transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-dark-gray rounded-lg transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-vapi-red rounded-full"></div>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-vapi-dark-gray border border-vapi-border-gray rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-vapi-border-gray">
                    <h3 className="text-sm font-semibold text-vapi-text-primary">Notifications</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-vapi-text-secondary">No new notifications</p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="p-1 text-vapi-text-secondary hover:text-vapi-text-primary transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-vapi-indigo flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-vapi-dark-gray border border-vapi-border-gray rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-vapi-border-gray">
                    <p className="text-sm font-medium text-vapi-text-primary">User Account</p>
                    <p className="text-xs text-vapi-text-secondary">user@example.com</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-black rounded-md transition-colors flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Account Settings</span>
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-vapi-text-secondary hover:text-vapi-text-primary hover:bg-vapi-black rounded-md transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Header */}
        {(title || subtitle || actions) && (
          <div className="px-6 py-6 border-b border-vapi-border-gray bg-vapi-black">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h1 className="text-2xl font-semibold text-vapi-text-primary mb-1">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-vapi-text-secondary">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-vapi-black">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}