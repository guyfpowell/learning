import { User, Skill, Lesson, UserProgress, NotificationPreference } from '@learning/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
  timestamp: string
}

interface AuthResponse {
  token: string
  user: User
}

interface QuizSubmitResponse {
  quizId: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  score: number
  explanation: string
}

interface ProgressResponse {
  currentStreak: number
  totalLessonsCompleted: number
  averageQuizScore: number
  completedLessons: Array<{
    lessonId: string
    completedAt: string
    quizScore: number | null
  }>
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value
      })
    } else if (typeof options.headers === 'object' && options.headers !== null) {
      Object.assign(headers, options.headers)
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'API request failed')
    }

    return data.data
  }

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me')
  }

  async getSkills(): Promise<Skill[]> {
    return this.request<Skill[]>('/lessons/skills')
  }

  async getTodayLesson(): Promise<Lesson> {
    return this.request<Lesson>('/lessons/today')
  }

  async getLesson(id: string): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${id}`)
  }

  async completeLesson(id: string): Promise<UserProgress> {
    return this.request<UserProgress>(`/lessons/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async submitQuiz(
    lessonId: string,
    quizId: string,
    answer: string
  ): Promise<QuizSubmitResponse> {
    return this.request<QuizSubmitResponse>(
      `/lessons/${lessonId}/quiz`,
      {
        method: 'POST',
        body: JSON.stringify({ quizId, answer }),
      }
    )
  }

  async getProgress(): Promise<ProgressResponse> {
    return this.request<ProgressResponse>('/users/progress')
  }

  async updateProfile(profile: {
    goal?: string
    preferredTime?: 'morning' | 'afternoon' | 'evening'
    timezone?: string
    learningStyle?: 'visual' | 'text' | 'mixed'
  }): Promise<User> {
    return this.request<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    })
  }

  async getNotificationPreferences(): Promise<NotificationPreference> {
    return this.request<NotificationPreference>('/notifications/preferences')
  }

  async updateNotificationPreferences(prefs: {
    enableDailyReminder?: boolean
    reminderTime?: 'morning' | 'afternoon' | 'evening'
    enableStreak?: boolean
    enableLessonAvailable?: boolean
  }): Promise<NotificationPreference> {
    return this.request<NotificationPreference>(
      '/notifications/preferences',
      {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      }
    )
  }
}

export const apiClient = new ApiClient()
