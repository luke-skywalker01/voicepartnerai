'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Bot, 
  BarChart3, 
  Settings, 
  CreditCard,
  LogOut,
  Menu,
  X,
  Mic,
  Bell,
  User,
  Waves,
  Phone,
  PhoneOutgoing,
  GitBranch,
  FileText,
  Wrench
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Assistants', href: '/dashboard/assistants', icon: Bot },
  { name: 'Workflows', href: '/workflows', icon: GitBranch },
  { name: 'Phone Numbers', href: '/dashboard/phone-numbers', icon: Phone },
  { name: 'Calls', href: '/dashboard/calls', icon: PhoneOutgoing },
  { name: 'Outbound Campaigns', href: '/outbound', icon: PhoneOutgoing },
  { name: 'Files', href: '/dashboard/files', icon: FileText },
  { name: 'Tools', href: '/dashboard/tools', icon: Wrench },
  { name: 'Squads', href: '/dashboard/squads', icon: User },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Provider Keys', href: '/dashboard/provider-keys', icon: Settings },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Settings },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Settings },
  { name: 'Test Voice', href: '/dashboard/test', icon: Mic },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = useCallback(async () => {
    await signOut()
    router.push('/')
  }, [signOut, router])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  const activeItems = useMemo(() => 
    sidebarItems.map(item => ({
      ...item,
      isActive: pathname === item.href || pathname.startsWith(item.href + '/')
    })), [pathname]
  )

  const SidebarContent = useMemo(() => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-card">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            VoicePartnerAI
          </span>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="px-4 py-3 border-b border-border">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
        {activeItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                item.isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={closeSidebar}
            >
              <Icon className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                item.isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
              }`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Professional Plan
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-3 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="Abmelden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  ), [activeItems, user, handleSignOut, closeSidebar])

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar */}
      <div className="md:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-50">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSidebar} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card border-r border-border shadow-xl">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-white/10"
                  onClick={closeSidebar}
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              {SidebarContent}
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 w-64">
        <div className="flex flex-col w-full bg-card border-r border-border">
          {SidebarContent}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navbar */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <button
            className="px-4 border-r border-border text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary md:hidden transition-colors"
            onClick={openSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex"></div>
            <div className="ml-4 flex items-center space-x-2 md:space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-accent rounded-full"></span>
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-border">
                      <h3 className="text-sm font-medium text-foreground">Benachrichtigungen</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-4 hover:bg-muted/50 transition-colors border-b border-border/50">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Neuer Assistent erstellt</p>
                            <p className="text-xs text-muted-foreground mt-1">Ihr Voice AI Assistent "Kundenservice Bot" wurde erfolgreich konfiguriert.</p>
                            <p className="text-xs text-muted-foreground mt-1">vor 2 Minuten</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-muted/50 transition-colors border-b border-border/50">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Workflow ausgeführt</p>
                            <p className="text-xs text-muted-foreground mt-1">Terminbuchung-Workflow wurde 15x erfolgreich ausgeführt.</p>
                            <p className="text-xs text-muted-foreground mt-1">vor 1 Stunde</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Zahlungseingang</p>
                            <p className="text-xs text-muted-foreground mt-1">Ihre monatliche Rechnung wurde erfolgreich beglichen.</p>
                            <p className="text-xs text-muted-foreground mt-1">vor 3 Stunden</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-border">
                      <button className="text-xs text-accent hover:text-accent/80 transition-colors">
                        Alle Benachrichtigungen anzeigen
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-foreground">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Professional Plan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-background">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )

}