import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'

// Mock fetch
global.fetch = jest.fn()

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('renders children', () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('initializes with no user when no token in storage', async () => {
    const TestComponent = () => {
      const { isAuthenticated } = useAuth()
      return <div>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })

  it('loads user when valid token exists', async () => {
    localStorage.setItem('auth_token', 'valid-token')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
        },
      }),
    })

    const TestComponent = () => {
      const { user, isAuthenticated } = useAuth()
      return (
        <div>
          {isAuthenticated ? `Hello ${user?.name}` : 'Not authenticated'}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Hello Test User')).toBeInTheDocument()
    })
  })

  it('clears token on auth failure', async () => {
    localStorage.setItem('auth_token', 'invalid-token')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    })

    const TestComponent = () => {
      const { isAuthenticated } = useAuth()
      return <div>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })
})
