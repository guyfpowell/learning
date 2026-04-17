import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminLessonsPage from '../page'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    adminListLessons: jest.fn(),
    adminUpdateLesson: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const MOCK_LESSON = {
  id: 'lesson-1',
  title: 'Test Lesson',
  day: 1,
  content: 'Content',
  durationMinutes: 5,
  difficulty: 'beginner',
  mediaUrl: null,
  published: true,
  publishedAt: null,
  skillPathId: 'path-1',
  createdAt: '2026-04-17T00:00:00Z',
  skillPath: { level: 'beginner', skill: { name: 'AI Basics' } },
}

const MOCK_RESPONSE = {
  lessons: [MOCK_LESSON],
  total: 1,
  page: 1,
  pageSize: 20,
}

describe('AdminLessonsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.adminListLessons as jest.Mock).mockResolvedValue(MOCK_RESPONSE)
  })

  it('renders lesson table with data', async () => {
    render(<AdminLessonsPage />)
    await waitFor(() => {
      expect(screen.getByText('Test Lesson')).toBeInTheDocument()
      expect(screen.getByText('AI Basics')).toBeInTheDocument()
    })
  })

  it('shows New Lesson button', async () => {
    render(<AdminLessonsPage />)
    await waitFor(() => {
      expect(screen.getByText('New Lesson')).toBeInTheDocument()
    })
  })

  it('shows published badge for published lesson', async () => {
    render(<AdminLessonsPage />)
    await waitFor(() => {
      expect(screen.getByText('Published')).toBeInTheDocument()
    })
  })

  it('shows Unpublished badge for unpublished lesson', async () => {
    ;(apiClient.adminListLessons as jest.Mock).mockResolvedValue({
      ...MOCK_RESPONSE,
      lessons: [{ ...MOCK_LESSON, published: false }],
    })
    render(<AdminLessonsPage />)
    await waitFor(() => {
      expect(screen.getByText('Unpublished')).toBeInTheDocument()
    })
  })

  it('shows empty state when no lessons', async () => {
    ;(apiClient.adminListLessons as jest.Mock).mockResolvedValue({
      lessons: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })
    render(<AdminLessonsPage />)
    await waitFor(() => {
      expect(screen.getByText(/no lessons/i)).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    ;(apiClient.adminListLessons as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<AdminLessonsPage />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('calls togglePublished when toggle button clicked', async () => {
    ;(apiClient.adminUpdateLesson as jest.Mock).mockResolvedValue({ ...MOCK_LESSON, published: false })
    render(<AdminLessonsPage />)
    await waitFor(() => screen.getByText('Test Lesson'))

    const toggleButton = screen.getByRole('button', { name: /unpublish/i })
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(apiClient.adminUpdateLesson).toHaveBeenCalledWith('lesson-1', { published: false })
    })
  })
})
