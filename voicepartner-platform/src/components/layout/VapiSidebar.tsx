'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Bot,
  BarChart3,
  Phone,
  FileText,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronDown,
  Plus,
  Activity,
  Users,
  Folder,
  Zap
} from 'lucide-react'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Assistants',
    href: '/assistants',
    icon: Bot,
    children: [
      { name: 'All Assistants', href: '/assistants', icon: Bot },
      { name: 'Create New', href: '/assistants/create', icon: Plus },
      { name: 'Templates', href: '/assistants/templates', icon: Folder },
    ]
  },
  {
    name: 'Phone Numbers',
    href: '/phone-numbers',
    icon: Phone,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: Activity,
  },
  {
    name: 'Logs',
    href: '/logs',
    icon: FileText,
  },
  {
    name: 'Workflows',
    href: '/workflows',
    icon: Zap,
  },
  {
    name: 'Team',
    href: '/team',
    icon: Users,
  },
]

const bottomItems: SidebarItem[] = [
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
  },
]

export default function VapiSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['Assistants'])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const isChildActive = (children: SidebarItem[]) => {
    return children.some(child => isActive(child.href))
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-vapi-black border-r border-vapi-border-gray">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-vapi-border-gray">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-vapi-indigo flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-vapi-text-primary">
            VoicePartner
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.name)
          const itemActive = hasChildren ? isChildActive(item.children) : isActive(item.href)

          return (
            <div key={item.name}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    itemActive
                      ? 'bg-vapi-indigo text-vapi-text-primary'
                      : 'text-vapi-text-secondary hover:bg-vapi-dark-gray hover:text-vapi-text-primary'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isExpanded ? 'rotate-180' : ''
                    )}
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors space-x-3',
                    isActive(item.href)
                      ? 'bg-vapi-indigo text-vapi-text-primary'
                      : 'text-vapi-text-secondary hover:bg-vapi-dark-gray hover:text-vapi-text-primary'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-vapi-emerald text-vapi-text-primary text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Submenu */}
              {hasChildren && isExpanded && (
                <div className="mt-1 space-y-1 ml-6">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors space-x-3',
                          isActive(child.href)
                            ? 'bg-vapi-indigo text-vapi-text-primary'
                            : 'text-vapi-text-secondary hover:bg-vapi-dark-gray hover:text-vapi-text-primary'
                        )}
                      >
                        <ChildIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{child.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-vapi-border-gray">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors space-x-3 mb-1',
                isActive(item.href)
                  ? 'bg-vapi-indigo text-vapi-text-primary'
                  : 'text-vapi-text-secondary hover:bg-vapi-dark-gray hover:text-vapi-text-primary'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}

        {/* User Profile / Logout */}
        <div className="mt-4 pt-3 border-t border-vapi-border-gray">
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-vapi-text-secondary hover:bg-vapi-dark-gray hover:text-vapi-text-primary transition-colors space-x-3">
            <div className="h-6 w-6 rounded-full bg-vapi-indigo flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">U</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">User Account</div>
              <div className="text-xs text-vapi-text-secondary">Free Plan</div>
            </div>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}