import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LessonEditorPage from '../page'
import { apiClient } from '@/lib/api-client'

// Tiptap requires a full browser environment — stub it for jsdom
jest.mock('@tiptap/react', () => ({
  useEditor: () => ({
    getHTML: () => '<p>Mocked content</p>',
    commands: { setContent: jest.fn() },
    destroy: jest.fn(),
  }),
  EditorContent: ({ editor }: { editor: unknown }) =>
    editor ? <div data-testid="tiptap-editor">Editor</div> : null,
}))

jest.mock('@tiptap/starter-kit', () => ({ default: {} }))

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    adminListSkillPaths: jest.fn(),
    adminCreateLesson: jest.fn(),
    adminUpdateLesson: jest.fn(),
    adminDeleteLesson: jest.fn(),
    getLesson: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useParams: () => ({ id: 'new' }),
}))

const MOCK_SKILL_PATHS = [
  { id: 'path-1', level: 'beginner', durationHours: 4, skill: { id: 'skill-1', name: 'AI Basics' } },
]

const MOCK_LESSON = {
  id: 'lesson-1',
  title: 'Test Lesson',
  day: 1,
  content: '<p>Hello world</p>',
  durationMinutes: 5,
  difficulty: 'beginner',
  mediaUrl: null,
  published: true,
  publishedAt: null,
  skillPathId: 'path-1',
  createdAt: '2026-04-17T00:00:00Z',
  skillPath: { level: 'beginner', skill: { name: 'AI Basics' } },
}

describe('LessonEditorPage — create mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.adminListSkillPaths as jest.Mock).mockResolvedValue(MOCK_SKILL_PATHS)
  })

  it('renders create form with empty fields', async () => {
    render(<LessonEditorPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/lesson title/i)).toBeInTheDocument()
    })
  })

  it('renders skill path dropdown with options', async () => {
    render(<LessonEditorPage />)
    await waitFor(() => {
      expect(screen.getByText('AI Basics — beginner')).toBeInTheDocument()
    })
  })

  it('renders quiz section fields', async () => {
    render(<LessonEditorPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/question/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/option a/i)).toBeInTheDocument()
    })
  })

  it('creates lesson on save', async () => {
    ;(apiClient.adminCreateLesson as jest.Mock).mockResolvedValue({ ...MOCK_LESSON, id: 'new-id' })
    render(<LessonEditorPage />)
    await waitFor(() => screen.getByPlaceholderText(/lesson title/i))

    fireEvent.change(screen.getByPlaceholderText(/lesson title/i), {
      target: { value: 'My New Lesson' },
    })
    // Select skill path
    const select = screen.getByRole('combobox', { name: /skill path/i })
    fireEvent.change(select, { target: { value: 'path-1' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(apiClient.adminCreateLesson).toHaveBeenCalled()
    })
  })
})

describe('LessonEditorPage — edit mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.adminListSkillPaths as jest.Mock).mockResolvedValue(MOCK_SKILL_PATHS)
    ;(apiClient.getLesson as jest.Mock).mockResolvedValue(MOCK_LESSON)
    // Override useParams to return an existing id
    jest.resetModules()
  })

  it('loads existing lesson data', async () => {
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
      useParams: () => ({ id: 'lesson-1' }),
    }))
    ;(apiClient.getLesson as jest.Mock).mockResolvedValue(MOCK_LESSON)
    render(<LessonEditorPage lessonId="lesson-1" />)
    await waitFor(() => {
      expect(apiClient.getLesson).toHaveBeenCalledWith('lesson-1')
    })
  })

  it('updates lesson on save', async () => {
    ;(apiClient.adminUpdateLesson as jest.Mock).mockResolvedValue(MOCK_LESSON)
    render(<LessonEditorPage lessonId="lesson-1" />)
    await waitFor(() => screen.getByPlaceholderText(/lesson title/i))

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(apiClient.adminUpdateLesson).toHaveBeenCalledWith('lesson-1', expect.any(Object))
    })
  })

  it('soft-deletes lesson on delete', async () => {
    ;(apiClient.adminDeleteLesson as jest.Mock).mockResolvedValue({})
    render(<LessonEditorPage lessonId="lesson-1" />)
    await waitFor(() => screen.getByRole('button', { name: /delete/i }))

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(apiClient.adminDeleteLesson).toHaveBeenCalledWith('lesson-1')
    })
  })
})
