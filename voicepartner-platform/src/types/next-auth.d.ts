import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      plan: string
      provider: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    plan?: string
    provider?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    plan: string
    provider: string
  }
}