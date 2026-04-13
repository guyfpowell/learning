import { apiClient } from '../api-client'

// Mock fetch
global.fetch = jest.fn()

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('register', () => {
    it('registers a user and returns auth response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            token: 'test-token',
            user: {
              id: 'user1',
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        }),
      })

      const result = await apiClient.register(
        'test@example.com',
        'password123',
        'Test User'
      )

      expect(result.token).toBe('test-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('throws error on registration failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Email already registered',
        }),
      })

      await expect(
        apiClient.register('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already registered')
    })
  })

  describe('login', () => {
    it('logs in user and returns auth response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            token: 'test-token',
            user: {
              id: 'user1',
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        }),
      })

      const result = await apiClient.login(
        'test@example.com',
        'password123'
      )

      expect(result.token).toBe('test-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('throws error on invalid credentials', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid credentials',
        }),
      })

      await expect(
        apiClient.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getMe', () => {
    it('fetches current user with token', async () => {
      localStorage.setItem('auth_token', 'test-token')
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

      const result = await apiClient.getMe()

      expect(result.email).toBe('test@example.com')
      const call = (global.fetch as jest.Mock).mock.calls[0]
      expect(call[1].headers.Authorization).toBe('Bearer test-token')
    })
  })

  describe('getSkills', () => {
    it('fetches all skills', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: 'skill1', name: 'Product Strategy', description: 'Learn...' },
            { id: 'skill2', name: 'AI Engineering', description: 'Learn...' },
          ],
        }),
      })

      const result = await apiClient.getSkills()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Product Strategy')
    })
  })
})
