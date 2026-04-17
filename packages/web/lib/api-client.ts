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

interface QuizFeedback {
  quizId: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
}

interface QuizSubmitResponse {
  score: number
  feedbacks: QuizFeedback[]
  lesson: Lesson
  coaching: string | null
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
        body: JSON.stringify({ answers: { [quizId]: answer } }),
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

  async registerPushToken(
    token: string,
    platform: 'expo' | 'web',
    deviceId?: string
  ): Promise<void> {
    await this.request<void>('/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform, deviceId }),
    })
  }

  // Admin endpoints
  async adminListSkills(): Promise<AdminSkill[]> {
    return this.request<AdminSkill[]>('/admin/skills')
  }

  async adminCreateSkill(input: AdminCreateSkillInput): Promise<AdminSkill> {
    return this.request<AdminSkill>('/admin/skills', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async adminListSkillPaths(skillId?: string): Promise<AdminSkillPath[]> {
    const params = skillId ? `?skillId=${skillId}` : ''
    return this.request<AdminSkillPath[]>(`/admin/skill-paths${params}`)
  }

  async adminCreateSkillPath(input: AdminCreateSkillPathInput): Promise<AdminSkillPath> {
    return this.request<AdminSkillPath>('/admin/skill-paths', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async adminListLessonsByPath(skillPathId: string): Promise<AdminLesson[]> {
    const params = new URLSearchParams({ skillPathId, page: '1' })
    const response = await this.request<AdminLessonsResponse>(`/admin/lessons?${params}`)
    return response.lessons
  }

  async adminListLessons(page: number, skill?: string, level?: string): Promise<AdminLessonsResponse> {
    const params = new URLSearchParams({ page: String(page) })
    if (skill) params.set('skill', skill)
    if (level) params.set('level', level)
    return this.request<AdminLessonsResponse>(`/admin/lessons?${params}`)
  }

  async adminCreateLesson(input: AdminCreateLessonInput): Promise<AdminLesson> {
    return this.request<AdminLesson>('/admin/lessons', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async adminUpdateLesson(id: string, input: AdminUpdateLessonInput): Promise<AdminLesson> {
    return this.request<AdminLesson>(`/admin/lessons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }

  async adminDeleteLesson(id: string): Promise<AdminLesson> {
    return this.request<AdminLesson>(`/admin/lessons/${id}`, {
      method: 'DELETE',
    })
  }

  async adminGetStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/admin/stats')
  }
}

export interface AdminSkill {
  id: string
  name: string
  description: string
  category: string
  createdAt: string
  _count: { skillPaths: number }
}

export interface AdminCreateSkillInput {
  name: string
  description: string
  category: string
}

export interface AdminCreateSkillPathInput {
  skillId: string
  level: string
  durationHours: number
}

export interface AdminSkillPath {
  id: string
  level: string
  durationHours: number
  skill: { id: string; name: string }
}

export interface AdminLesson {
  id: string
  title: string
  day: number
  content: string
  durationMinutes: number
  difficulty: string
  mediaUrl: string | null
  published: boolean
  publishedAt: string | null
  skillPathId: string
  createdAt: string
  skillPath?: { level: string; skill: { name: string } }
}

export interface AdminLessonsResponse {
  lessons: AdminLesson[]
  total: number
  page: number
  pageSize: number
}

export interface AdminCreateLessonInput {
  skillPathId: string
  day: number
  title: string
  content: string
  durationMinutes: number
  difficulty: string
  mediaUrl?: string
}

export interface AdminUpdateLessonInput {
  title?: string
  content?: string
  durationMinutes?: number
  difficulty?: string
  mediaUrl?: string
  published?: boolean
  day?: number
  skillPathId?: string
}

export interface AdminStats {
  totalUsers: number
  dau: number
  activeSubscribers: number
  mrr: number
  lessonCompletionRate: number
}

export const apiClient = new ApiClient()
