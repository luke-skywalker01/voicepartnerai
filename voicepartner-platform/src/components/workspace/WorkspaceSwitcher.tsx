'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ChevronDown, 
  Plus, 
  Check, 
  Building, 
  Crown, 
  Shield, 
  Users, 
  Settings,
  LogOut,
  Loader2
} from 'lucide-react'

// Types
interface Workspace {
  id: number
  name: string
  slug: string
  role: string
  member_count: number
  plan: string
  is_current?: boolean
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: number
  onWorkspaceChange?: (workspaceId: number) => void
  className?: string
}

const ROLE_ICONS = {
  owner: <Crown className="h-3 w-3 text-yellow-600" />,
  admin: <Shield className="h-3 w-3 text-blue-600" />,
  member: <Users className="h-3 w-3 text-green-600" />,
  viewer: <Users className="h-3 w-3 text-gray-600" />
}

const PLAN_COLORS = {
  free: 'text-gray-600',
  pro: 'text-blue-600',
  enterprise: 'text-purple-600'
}

export default function WorkspaceSwitcher({ 
  currentWorkspaceId, 
  onWorkspaceChange,
  className = '' 
}: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [switchingTo, setSwitchingTo] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (workspaces.length > 0 && currentWorkspaceId) {
      const current = workspaces.find(w => w.id === currentWorkspaceId)
      setCurrentWorkspace(current || workspaces[0])
    }
  }, [workspaces, currentWorkspaceId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchWorkspaces = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workspaces')
      const data = await response.json()
      
      if (response.ok) {
        setWorkspaces(data)
        
        // Set current workspace if not set
        if (!currentWorkspace && data.length > 0) {
          const defaultWorkspace = data.find((w: Workspace) => w.is_current) || data[0]
          setCurrentWorkspace(defaultWorkspace)
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkspaceSwitch = async (workspace: Workspace) => {
    if (workspace.id === currentWorkspace?.id) {
      setIsOpen(false)
      return
    }

    try {
      setSwitchingTo(workspace.id)
      
      const response = await fetch(`/api/workspaces/${workspace.id}/switch`, {
        method: 'POST'
      })

      if (response.ok) {
        setCurrentWorkspace(workspace)
        onWorkspaceChange?.call(null, workspace.id)
        setIsOpen(false)
        
        // Refresh page to update all workspace-dependent data
        window.location.reload()
      } else {
        throw new Error('Failed to switch workspace')
      }
    } catch (error) {
      console.error('Failed to switch workspace:', error)
      alert('Fehler beim Wechseln des Workspace')
    } finally {
      setSwitchingTo(null)
    }
  }

  const handleCreateWorkspace = () => {
    setIsOpen(false)
    // Navigate to workspace creation page
    window.location.href = '/dashboard/workspaces/new'
  }

  const handleManageWorkspace = () => {
    setIsOpen(false)
    // Navigate to workspace management page
    window.location.href = `/dashboard/workspaces/${currentWorkspace?.id}`
  }

  if (loading && workspaces.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Lade Workspaces...</span>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleCreateWorkspace}
          className="flex items-center space-x-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          <span>Workspace erstellen</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Current Workspace Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-left border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm truncate">{currentWorkspace.name}</span>
              {ROLE_ICONS[currentWorkspace.role as keyof typeof ROLE_ICONS]}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className={`capitalize ${PLAN_COLORS[currentWorkspace.plan as keyof typeof PLAN_COLORS]}`}>
                {currentWorkspace.plan}
              </span>
              <span>•</span>
              <span>{currentWorkspace.member_count} Mitglieder</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Workspace List */}
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
              Workspaces wechseln
            </div>
            
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSwitch(workspace)}
                className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors"
                disabled={switchingTo === workspace.id}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">{workspace.name}</span>
                        {ROLE_ICONS[workspace.role as keyof typeof ROLE_ICONS]}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className={`capitalize ${PLAN_COLORS[workspace.plan as keyof typeof PLAN_COLORS]}`}>
                          {workspace.plan}
                        </span>
                        <span>•</span>
                        <span>{workspace.member_count} Mitglieder</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {switchingTo === workspace.id && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {workspace.id === currentWorkspace?.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleCreateWorkspace}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Neuen Workspace erstellen</span>
            </button>
            
            {(currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin') && (
              <button
                onClick={handleManageWorkspace}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none transition-colors flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Workspace verwalten</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}