import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

// Mock user database - In production, use a real database
const users = [
  {
    id: '1',
    email: 'demo@voicepartnerai.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    name: 'Demo User',
    plan: 'pro' as const,
    createdAt: '2024-01-01T00:00:00Z'
  }
]

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Find user
    const user = users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json(
        { message: 'Ungültige Anmeldedaten' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Ungültige Anmeldedaten' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      plan: user.plan
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set('voicepartner_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Anmeldung fehlgeschlagen' },
      { status: 500 }
    )
  }
}