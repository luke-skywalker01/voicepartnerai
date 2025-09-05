import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware logic can be added here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to protected routes only if user is authenticated
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/assistants/:path*',
    '/api/agents/:path*'
  ]
}