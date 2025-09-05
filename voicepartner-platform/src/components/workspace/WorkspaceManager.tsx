'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Mail, 
  Shield, 
  Crown, 
  UserPlus,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  CreditCard,
  BarChart3
} from 'lucide-react'

// Types
interface Workspace {
  id: number
  name: string
  slug: string
  description?: string
  plan: string
  member_count: number
  current_credits: number
  credits_limit: number
  member_limit: number
  created_at: string
  user_role: string
}

interface Member {
  id: number
  user_id: number
  email: string
  first_name?: string
  last_name?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
  invited_at?: string
  invited_by_email?: string
  is_active: boolean
}

interface WorkspaceStats {
  total_assistants: number
  total_phone_numbers: number
  total_calls_this_month: number
  credits_used_this_month: number
  active_members: number
}

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer'
}

const ROLE_DESCRIPTIONS = {
  owner: 'Vollzugriff - kann alles verwalten und Workspace löschen',
  admin: 'Kann Mitglieder verwalten und alle Ressourcen bearbeiten',
  member: 'Kann Ressourcen erstellen und eigene bearbeiten',
  viewer: 'Kann nur Ressourcen ansehen'
}

export default function WorkspaceManager() {
  const [activeTab, setActiveTab] = useState('overview')
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState<WorkspaceStats | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  
  // Invite states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviteMessage, setInviteMessage] = useState('')

  // Get workspace ID from URL or context
  const workspaceId = 1 // TODO: Get from URL params or context

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceData()
      if (activeTab === 'members') {
        fetchMembers()
      }
      if (activeTab === 'overview') {
        fetchStats()
      }
    }
  }, [workspaceId, activeTab])

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workspaces/${workspaceId}`)
      const data = await response.json()
      if (response.ok) {
        setWorkspace(data)
        setEditName(data.name)
        setEditDescription(data.description || '')
      }
    } catch (error) {
      console.error('Failed to fetch workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`)
      const data = await response.json()
      if (response.ok) {
        setMembers(data)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/stats`)
      const data = await response.json()
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSaveWorkspace = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription
        })
      })

      if (response.ok) {
        const updatedWorkspace = await response.json()
        setWorkspace(updatedWorkspace)
        setIsEditing(false)
        alert('Workspace erfolgreich aktualisiert!')
      } else {
        throw new Error('Failed to update workspace')
      }
    } catch (error) {
      console.error('Failed to update workspace:', error)
      alert('Fehler beim Aktualisieren des Workspace')
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      alert('Bitte E-Mail-Adresse eingeben')
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Einladung erfolgreich versendet!')
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteMessage('')
        fetchMembers() // Refresh members list
      } else {
        alert(`Fehler: ${data.detail || 'Einladung fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Failed to invite member:', error)
      alert('Fehler beim Senden der Einladung')
    }
  }

  const handleRemoveMember = async (memberId: number, memberEmail: string) => {
    if (!confirm(`Möchten Sie ${memberEmail} wirklich aus dem Workspace entfernen?`)) {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Mitglied erfolgreich entfernt')
        fetchMembers()
      } else {
        const data = await response.json()
        alert(`Fehler: ${data.detail || 'Entfernen fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert('Fehler beim Entfernen des Mitglieds')
    }
  }

  const handleChangeRole = async (memberId: number, newRole: string, memberEmail: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole
        })
      })

      if (response.ok) {
        alert(`Rolle von ${memberEmail} erfolgreich geändert`)
        fetchMembers()
      } else {
        const data = await response.json()
        alert(`Fehler: ${data.detail || 'Rollenänderung fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Failed to change role:', error)
      alert('Fehler beim Ändern der Rolle')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin': return <Shield className="h-4 w-4 text-blue-600" />
      case 'member': return <Users className="h-4 w-4 text-green-600" />
      case 'viewer': return <Users className="h-4 w-4 text-gray-600" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full flex items-center ${colors[role as keyof typeof colors]}`}>
        {getRoleIcon(role)}
        <span className="ml-1">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</span>
      </span>
    )
  }

  const canManageMembers = workspace?.user_role === 'owner' || workspace?.user_role === 'admin'
  const canEditWorkspace = workspace?.user_role === 'owner'

  if (loading && !workspace) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-bold bg-background border border-border rounded px-2 py-1"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Workspace-Beschreibung"
                    className="text-sm text-muted-foreground bg-background border border-border rounded px-2 py-1 w-full"
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold flex items-center">
                    {workspace?.name}
                    {canEditWorkspace && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="ml-2 p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </h1>
                  <p className="text-muted-foreground">
                    {workspace?.description || 'Keine Beschreibung'}
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveWorkspace}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditName(workspace?.name || '')
                    setEditDescription(workspace?.description || '')
                  }}
                  className="border border-border px-4 py-2 rounded-md hover:bg-muted"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <>
                <div className="text-right">
                  <div className="text-sm font-medium">{workspace?.current_credits?.toFixed(1)} Credits</div>
                  <div className="text-xs text-muted-foreground">{workspace?.plan} Plan</div>
                </div>
                {getRoleBadge(workspace?.user_role || 'member')}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border border-border rounded-lg">
        <div className="border-b border-border px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Mitglieder ({workspace?.member_count || 0})
            </button>
            {canEditWorkspace && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Einstellungen
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stats.active_members}</p>
                      <p className="text-sm text-muted-foreground">Aktive Mitglieder</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stats.total_assistants}</p>
                      <p className="text-sm text-muted-foreground">AI Assistenten</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stats.total_calls_this_month}</p>
                      <p className="text-sm text-muted-foreground">Anrufe diesen Monat</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stats.credits_used_this_month.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">Credits verbraucht</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Workspace-Informationen</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <span className="ml-2 font-medium capitalize">{workspace?.plan}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Erstellt:</span>
                    <span className="ml-2 font-medium">
                      {workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString('de-DE') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Mitglieder-Limit:</span>
                    <span className="ml-2 font-medium">{workspace?.member_limit}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Credits-Limit:</span>
                    <span className="ml-2 font-medium">{workspace?.credits_limit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team-Mitglieder</h3>
                {canManageMembers && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Mitglied einladen
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.first_name && member.last_name 
                            ? `${member.first_name} ${member.last_name}`
                            : member.email
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Beigetreten: {new Date(member.joined_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getRoleBadge(member.role)}
                      
                      {canManageMembers && member.role !== 'owner' && (
                        <div className="flex space-x-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value, member.email)}
                            className="text-sm border border-border rounded px-2 py-1 bg-background"
                            disabled={workspace?.user_role !== 'owner'}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          
                          <button
                            onClick={() => handleRemoveMember(member.id, member.email)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Mitglied entfernen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && canEditWorkspace && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Gefahrenzone</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Das Löschen eines Workspace kann nicht rückgängig gemacht werden. 
                      Alle Daten gehen verloren.
                    </p>
                    <button className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">
                      Workspace löschen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Mitglied einladen</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">E-Mail-Adresse</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rolle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nachricht (optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Persönliche Nachricht für die Einladung..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleInviteMember}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Einladung senden
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}