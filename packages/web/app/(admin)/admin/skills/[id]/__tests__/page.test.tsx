import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SkillPathDetailPage from '../page'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    adminListSkillPaths: jest.fn(),
    adminListLessonsByPath: jest.fn(),
    adminUpdateLesson: jest.fn(),
    adminDeleteLesson: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'sp1' }),
  useRouter: () => ({ push: jest.fn() }),
}))

const MOCK_PATH = {
  id: 'sp1',
  level: 'beginner',
  durationHours: 10,
  skill: { id: 's1', name: 'Product Strategy' },
}

const MOCK_LESSONS = [
  {
    id: 'l1',
    title: 'Intro to PM',
    day: 1,
    content: 'Content 1',
    durationMinutes: 10,
    difficulty: 'beginner',
    mediaUrl: null,
    published: true,
    publishedAt: null,
    skillPathId: 'sp1',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'l2',
    title: 'Stakeholder Management',
    day: 2,
    content: 'Content 2',
    durationMinutes: 15,
    difficulty: 'beginner',
    mediaUrl: null,
    published: true,
    publishedAt: null,
    skillPathId: 'sp1',
    createdAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'l3',
    title: 'Roadmapping',
    day: 3,
    content: 'Content 3',
    durationMinutes: 12,
    difficulty: 'intermediate',
    mediaUrl: null,
    published: true,
    publishedAt: null,
    skillPathId: 'sp1',
    createdAt: '2026-01-03T00:00:00Z',
  },
]

describe('SkillPathDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.adminListSkillPaths as jest.Mock).mockResolvedValue([MOCK_PATH])
    ;(apiClient.adminListLessonsByPath as jest.Mock).mockResolvedValue(MOCK_LESSONS)
    ;(apiClient.adminUpdateLesson as jest.Mock).mockResolvedValue({})
    ;(apiClient.adminDeleteLesson as jest.Mock).mockResolvedValue({})
  })

  it('renders skill name and level in header', async () => {
    render(<SkillPathDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/product strategy/i)).toBeInTheDocument()
      expect(screen.getByText(/beginner/i)).toBeInTheDocument()
    })
  })

  it('renders lessons ordered by day', async () => {
    render(<SkillPathDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Intro to PM')).toBeInTheDocument()
      expect(screen.getByText('Stakeholder Management')).toBeInTheDocument()
      expect(screen.getByText('Roadmapping')).toBeInTheDocument()
    })

    const rows = screen.getAllByTestId('lesson-row')
    expect(rows[0]).toHaveTextContent('Intro to PM')
    expect(rows[1]).toHaveTextContent('Stakeholder Management')
    expect(rows[2]).toHaveTextContent('Roadmapping')
  })

  it('shows day number for each lesson', async () => {
    render(<SkillPathDetailPage />)

    await waitFor(() => screen.getByText('Intro to PM'))

    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
    expect(screen.getByText('Day 3')).toBeInTheDocument()
  })

  it('calls adminUpdateLesson for each reordered lesson on Save Order', async () => {
    render(<SkillPathDetailPage />)

    await waitFor(() => screen.getByText('Intro to PM'))

    // Move lesson 1 down by clicking the move-down button
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    fireEvent.click(moveDownButtons[0])

    fireEvent.click(screen.getByRole('button', { name: /save order/i }))

    await waitFor(() => {
      expect(apiClient.adminUpdateLesson).toHaveBeenCalledWith('l1', { day: 2 })
      expect(apiClient.adminUpdateLesson).toHaveBeenCalledWith('l2', { day: 1 })
    })
  })

  it('calls adminDeleteLesson when Remove button clicked', async () => {
    render(<SkillPathDetailPage />)

    await waitFor(() => screen.getByText('Intro to PM'))

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    fireEvent.click(removeButtons[0])

    await waitFor(() => {
      expect(apiClient.adminDeleteLesson).toHaveBeenCalledWith('l1')
    })
  })

  it('shows Add Lesson link pointing to lesson editor', async () => {
    render(<SkillPathDetailPage />)

    await waitFor(() => screen.getByText('Intro to PM'))

    const addLink = screen.getByRole('link', { name: /add lesson/i })
    expect(addLink).toHaveAttribute('href', '/admin/lessons/new')
  })

  it('shows empty state when no lessons exist', async () => {
    ;(apiClient.adminListLessonsByPath as jest.Mock).mockResolvedValue([])

    render(<SkillPathDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/no lessons/i)).toBeInTheDocument()
    })
  })
})
