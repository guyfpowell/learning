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

  describe('submitQuiz', () => {
    it('sends answers in correct format and returns quiz result with coaching', async () => {
      const mockResult = {
        score: 100,
        feedbacks: [
          {
            quizId: 'q1',
            question: 'What is X?',
            userAnswer: 'A',
            correctAnswer: 'A',
            isCorrect: true,
            explanation: 'Because A.',
          },
        ],
        lesson: { id: 'l1', title: 'Test' },
        coaching: 'Well done! Keep it up.',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResult }),
      })

      const result = await apiClient.submitQuiz('lesson-1', 'q1', 'A')

      // Verify request body uses answers object format
      const call = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body).toEqual({ answers: { q1: 'A' } })

      expect(result.score).toBe(100)
      expect(result.coaching).toBe('Well done! Keep it up.')
    })

    it('returns null coaching for non-pro users', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { score: 50, feedbacks: [], lesson: {}, coaching: null },
        }),
      })

      const result = await apiClient.submitQuiz('lesson-1', 'q1', 'B')
      expect(result.coaching).toBeNull()
    })
  })
})
