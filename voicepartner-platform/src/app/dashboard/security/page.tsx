'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Key, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Globe, 
  Settings, 
  Clock, 
  User, 
  Users, 
  Computer, 
  Smartphone, 
  Ban, 
  Flag, 
  Search, 
  Filter, 
  RefreshCw,
  Download,
  MoreVertical,
  Trash2,
  Edit,
  Activity,
  MapPin,
  Wifi,
  Server,
  Database,
  Network,
  FileX,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Target,
  Zap,
  Bell
} from 'lucide-react'

interface SecurityEvent {
  id: string
  type: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network' | 'compliance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: string
  source: string
  userId?: string
  ipAddress: string
  userAgent?: string
  location?: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  actions: string[]
}

interface SecurityMetrics {
  overview: {
    totalEvents: number
    criticalEvents: number
    activeThreats: number
    blockedAttempts: number
    complianceScore: number
    lastIncident: string
    trends: {
      events: number
      threats: number
      compliance: number
    }
  }
  authentication: {
    totalLogins: number
    failedLogins: number
    suspiciousLogins: number
    mfaEnabled: number
    passwordStrength: number
    sessionTimeouts: number
  }
  apiSecurity: {
    totalRequests: number
    blockedRequests: number
    rateLimitHits: number
    invalidTokens: number
    suspiciousPatterns: number
    anomalousActivity: number
  }
  dataProtection: {
    encryptedConnections: number
    dataLeaks: number
    unauthorizedAccess: number
    backupIntegrity: number
    retentionCompliance: number
    gdprRequests: number
  }
  networkSecurity: {
    firewallRules: number
    blockedIPs: number
    ddosAttempts: number
    vpnConnections: number
    secureProtocols: number
    certificateStatus: string
  }
}

interface SecurityRule {
  id: string
  name: string
  type: 'firewall' | 'access_control' | 'rate_limiting' | 'content_filtering' | 'geo_blocking'
  status: 'active' | 'inactive' | 'testing'
  description: string
  conditions: string[]
  actions: string[]
  triggeredCount: number
  lastTriggered?: string
  createdAt: string
  updatedAt: string
}

export default function SecurityPage() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showResolved, setShowResolved] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadSecurityData = async () => {
    try {
      // Mock comprehensive security data
      const mockMetrics: SecurityMetrics = {
        overview: {
          totalEvents: 1458,
          criticalEvents: 12,
          activeThreats: 3,
          blockedAttempts: 245,
          complianceScore: 94.7,
          lastIncident: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          trends: {
            events: -8.2,
            threats: -15.6,
            compliance: 2.3
          }
        },
        authentication: {
          totalLogins: 2847,
          failedLogins: 156,
          suspiciousLogins: 23,
          mfaEnabled: 87.3,
          passwordStrength: 92.1,
          sessionTimeouts: 45
        },
        apiSecurity: {
          totalRequests: 124567,
          blockedRequests: 1234,
          rateLimitHits: 456,
          invalidTokens: 89,
          suspiciousPatterns: 34,
          anomalousActivity: 12
        },
        dataProtection: {
          encryptedConnections: 99.8,
          dataLeaks: 0,
          unauthorizedAccess: 3,
          backupIntegrity: 100,
          retentionCompliance: 98.2,
          gdprRequests: 7
        },
        networkSecurity: {
          firewallRules: 127,
          blockedIPs: 1456,
          ddosAttempts: 5,
          vpnConnections: 89,
          secureProtocols: 100,
          certificateStatus: 'valid'
        }
      }

      const mockEvents: SecurityEvent[] = [
        {
          id: 'evt_001',
          type: 'authentication',
          severity: 'high',
          title: 'Multiple Failed Login Attempts',
          description: 'User attempted to login 5 times with incorrect credentials',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          source: 'Authentication Service',
          userId: 'user_12345',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'New York, NY',
          resolved: false,
          actions: ['Account temporarily locked', 'User notified via email']
        },
        {
          id: 'evt_002',
          type: 'network',
          severity: 'critical',
          title: 'Suspicious Network Traffic',
          description: 'Detected unusual outbound traffic pattern suggesting potential data exfiltration',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          source: 'Network Monitor',
          ipAddress: '10.0.0.15',
          location: 'Unknown',
          resolved: false,
          actions: ['Traffic blocked', 'Investigation initiated', 'Security team alerted']
        },
        {
          id: 'evt_003',
          type: 'system',
          severity: 'medium',
          title: 'Unauthorized API Access Attempt',
          description: 'Invalid API key used to access protected resources',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: 'API Gateway',
          ipAddress: '203.0.113.45',
          userAgent: 'curl/7.68.0',
          location: 'Frankfurt, DE',
          resolved: true,
          resolvedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          resolvedBy: 'Security Team',
          actions: ['Request blocked', 'IP added to watchlist']
        },
        {
          id: 'evt_004',
          type: 'data_access',
          severity: 'low',
          title: 'Unusual Data Access Pattern',
          description: 'User accessed large amount of sensitive data outside normal hours',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          source: 'Data Access Monitor',
          userId: 'user_67890',
          ipAddress: '172.16.0.10',
          location: 'London, UK',
          resolved: true,
          resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolvedBy: 'Data Protection Officer',
          actions: ['Manager notified', 'Access logged for audit']
        },
        {
          id: 'evt_005',
          type: 'compliance',
          severity: 'medium',
          title: 'GDPR Data Request',
          description: 'User requested deletion of personal data under GDPR Article 17',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          source: 'Compliance System',
          userId: 'user_11111',
          ipAddress: '198.51.100.25',
          location: 'Paris, FR',
          resolved: false,
          actions: ['Data deletion scheduled', 'Legal team notified']
        }
      ]

      const mockRules: SecurityRule[] = [
        {
          id: 'rule_001',
          name: 'Rate Limiting - API',
          type: 'rate_limiting',
          status: 'active',
          description: 'Limit API requests to 1000 per hour per IP',
          conditions: ['IP-based tracking', 'Rolling window: 1 hour'],
          actions: ['Block excess requests', 'Log incident', 'Notify admin'],
          triggeredCount: 156,
          lastTriggered: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rule_002',
          name: 'Geo-blocking High Risk Countries',
          type: 'geo_blocking',
          status: 'active',
          description: 'Block access from high-risk geographic locations',
          conditions: ['Country blacklist', 'VPN detection'],
          actions: ['Block access', 'Log attempt', 'Require additional verification'],
          triggeredCount: 89,
          lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rule_003',
          name: 'Failed Login Protection',
          type: 'access_control',
          status: 'active',
          description: 'Lock account after 5 failed login attempts',
          conditions: ['Failed attempts: 5', 'Time window: 15 minutes'],
          actions: ['Lock account temporarily', 'Send notification email', 'Log security event'],
          triggeredCount: 23,
          lastTriggered: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rule_004',
          name: 'DDoS Protection',
          type: 'firewall',
          status: 'active',
          description: 'Protect against distributed denial of service attacks',
          conditions: ['Traffic spike detection', 'Pattern analysis'],
          actions: ['Enable rate limiting', 'Block suspicious IPs', 'Scale infrastructure'],
          triggeredCount: 7,
          lastTriggered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setSecurityMetrics(mockMetrics)
      setSecurityEvents(mockEvents)
      setSecurityRules(mockRules)
    } catch (error) {
      console.error('Failed to load security data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadSecurityData()
  }

  const resolveEvent = async (eventId: string) => {
    setSecurityEvents(events => 
      events.map(event => 
        event.id === eventId 
          ? { ...event, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'Current User' }
          : event
      )
    )
  }

  const toggleRule = async (ruleId: string) => {
    setSecurityRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
          : rule
      )
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldX className="h-4 w-4" />
      case 'high': return <ShieldAlert className="h-4 w-4" />
      case 'medium': return <Shield className="h-4 w-4" />
      case 'low': return <ShieldCheck className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'authentication': return <Key className="h-4 w-4" />
      case 'authorization': return <Lock className="h-4 w-4" />
      case 'data_access': return <Database className="h-4 w-4" />
      case 'system': return <Server className="h-4 w-4" />
      case 'network': return <Network className="h-4 w-4" />
      case 'compliance': return <FileX className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredEvents = securityEvents.filter(event => {
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity
    const matchesType = selectedType === 'all' || event.type === selectedType
    const matchesResolved = showResolved || !event.resolved
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.source.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSeverity && matchesType && matchesResolved && matchesSearch
  })

  useEffect(() => {
    loadSecurityData()
    
    // Auto-refresh every 30 seconds for security events
    const interval = setInterval(loadSecurityData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Center</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage security events, threats, and compliance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Security Overview */}
      {securityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Events</p>
                <p className="text-3xl font-bold text-foreground">{securityMetrics.overview.totalEvents}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {securityMetrics.overview.criticalEvents} critical
                </p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-3xl font-bold text-foreground">{securityMetrics.overview.activeThreats}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blocked Attempts</p>
                <p className="text-3xl font-bold text-foreground">{securityMetrics.overview.blockedAttempts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 24 hours
                </p>
              </div>
              <Ban className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-3xl font-bold text-foreground">{securityMetrics.overview.complianceScore}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{securityMetrics.overview.trends.compliance.toFixed(1)}% this month
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Security Metrics Grid */}
      {securityMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authentication Security */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2 text-blue-600" />
              Authentication Security
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.authentication.mfaEnabled.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">MFA Enabled</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.authentication.failedLogins}</p>
                <p className="text-xs text-muted-foreground">Failed Logins</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.authentication.suspiciousLogins}</p>
                <p className="text-xs text-muted-foreground">Suspicious</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.authentication.passwordStrength.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Strong Passwords</p>
              </div>
            </div>
          </div>

          {/* API Security */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2 text-purple-600" />
              API Security
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.apiSecurity.blockedRequests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Blocked Requests</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.apiSecurity.rateLimitHits}</p>
                <p className="text-xs text-muted-foreground">Rate Limit Hits</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.apiSecurity.invalidTokens}</p>
                <p className="text-xs text-muted-foreground">Invalid Tokens</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <p className="text-2xl font-bold">{securityMetrics.apiSecurity.anomalousActivity}</p>
                <p className="text-xs text-muted-foreground">Anomalous Activity</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Events */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Security Events</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="authentication">Authentication</option>
              <option value="authorization">Authorization</option>
              <option value="data_access">Data Access</option>
              <option value="system">System</option>
              <option value="network">Network</option>
              <option value="compliance">Compliance</option>
            </select>
            
            <button
              onClick={() => setShowResolved(!showResolved)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                showResolved 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
              }`}
            >
              {showResolved ? 'Hide Resolved' : 'Show Resolved'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className={`border rounded-lg p-4 ${
              event.severity === 'critical' ? 'border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10' :
              event.severity === 'high' ? 'border-orange-200 bg-orange-50 dark:border-orange-900/20 dark:bg-orange-900/10' :
              event.severity === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/20 dark:bg-yellow-900/10' :
              'border-border'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(event.type)}
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getSeverityColor(event.severity)}`}>
                      {getSeverityIcon(event.severity)}
                      <span className="capitalize">{event.severity}</span>
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{event.source}</span>
                      <span>{formatDate(event.timestamp)}</span>
                      <span>{event.ipAddress}</span>
                      {event.location && <span>{event.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {event.resolved ? (
                    <div className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      <span className="text-xs text-green-600">Resolved</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => resolveEvent(event.id)}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              
              {event.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions Taken</h5>
                  <div className="flex flex-wrap gap-2">
                    {event.actions.map((action, index) => (
                      <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Rules */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Security Rules & Policies</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Rule Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Triggered</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Last Triggered</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {securityRules.map((rule) => (
                <tr key={rule.id} className="border-t border-border hover:bg-muted/25 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-muted rounded text-sm capitalize">
                      {rule.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`px-2 py-1 rounded text-sm font-medium flex items-center space-x-1 ${
                        rule.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}
                    >
                      {rule.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span className="capitalize">{rule.status}</span>
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{rule.triggeredCount}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">
                      {rule.lastTriggered ? formatDate(rule.lastTriggered) : 'Never'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}