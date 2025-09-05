import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getUserWithTenant, setTenantContext } from '@/lib/database'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')

export interface AuthenticatedUser {
  id: string
  email: string
  tenantId: string
  subscriptionTier: string
  tenant: {
    id: string
    name: string
    slug: string
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' }, 
        { status: 401 }
      )
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.sub as string

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' }, 
        { status: 401 }
      )
    }

    // Get user with tenant info
    const user = await getUserWithTenant(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      )
    }

    // Set tenant context for Row Level Security
    await setTenantContext(user.tenantId)

    // Transform user data for handler
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      subscriptionTier: user.subscriptionTier,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug
      }
    }

    return await handler(request, authenticatedUser)
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Unauthorized - Token verification failed' }, 
      { status: 401 }
    )
  }
}

// Helper to create demo user when no authentication is available
export function createDemoUser(): AuthenticatedUser {
  const demoUserId = 'demo-user-' + Math.random().toString(36).substr(2, 9)
  return {
    id: demoUserId,
    email: 'demo@voicepartnerai.com',
    tenantId: 'demo-tenant',
    subscriptionTier: 'starter',
    tenant: {
      id: 'demo-tenant',
      name: 'Demo Tenant',
      slug: 'demo'
    }
  }
}

// Demo mode for development
export async function withAuthOrDemo(
  request: NextRequest,
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  // Check if we're in demo mode (no database connection or development)
  const isDemoMode = process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL

  if (isDemoMode) {
    const demoUser = createDemoUser()
    return await handler(request, demoUser)
  }

  // Use full authentication in production
  return await withAuth(request, handler)
}