import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

// Demo configuration for development

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Demo mode - simple authentication
          if (credentials.email === 'demo@voicepartnerai.com' && credentials.password === 'password') {
            return {
              id: 'demo-user',
              email: credentials.email,
              name: 'Demo User',
              plan: 'pro'
            }
          }

          // Accept any other credentials for demo purposes
          return {
            id: `user_${Date.now()}`,
            email: credentials.email,
            name: credentials.email.split('@')[0],
            plan: 'free'
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.plan = user.plan || 'free'
        token.provider = account?.provider || 'credentials'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.plan = token.plan as string
        session.user.provider = token.provider as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        // Handle Google OAuth sign-in
        if (account?.provider === 'google') {
          return true
        }
        return true
      } catch (error) {
        console.error('SignIn error:', error)
        return true // Allow sign in even if there's an error
      }
    }
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo-secret-key',
})

export { handler as GET, handler as POST }