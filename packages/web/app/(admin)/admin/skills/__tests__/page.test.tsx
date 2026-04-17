import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SkillsPage from '../page'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    adminListSkills: jest.fn(),
    adminCreateSkill: jest.fn(),
    adminCreateSkillPath: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const MOCK_SKILLS = [
  {
    id: 's1',
    name: 'Product Strategy',
    description: 'Learn PM fundamentals',
    category: 'product-management',
    createdAt: '2026-01-01T00:00:00Z',
    _count: { skillPaths: 2 },
  },
  {
    id: 's2',
    name: 'AI Engineering',
    description: 'Build AI products',
    category: 'ai-engineering',
    createdAt: '2026-01-02T00:00:00Z',
    _count: { skillPaths: 1 },
  },
]

describe('SkillsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.adminListSkills as jest.Mock).mockResolvedValue(MOCK_SKILLS)
  })

  it('renders skill list with names and path counts', async () => {
    render(<SkillsPage />)

    await waitFor(() => {
      expect(screen.getByText('Product Strategy')).toBeInTheDocument()
      expect(screen.getByText('AI Engineering')).toBeInTheDocument()
    })

    expect(screen.getByText('2 paths')).toBeInTheDocument()
    expect(screen.getByText('1 path')).toBeInTheDocument()
  })

  it('shows category for each skill', async () => {
    render(<SkillsPage />)

    await waitFor(() => {
      expect(screen.getByText('product-management')).toBeInTheDocument()
      expect(screen.getByText('ai-engineering')).toBeInTheDocument()
    })
  })

  it('shows create skill form when New Skill button clicked', async () => {
    render(<SkillsPage />)

    await waitFor(() => screen.getByText('Product Strategy'))

    fireEvent.click(screen.getByRole('button', { name: /new skill/i }))

    expect(screen.getByPlaceholderText(/skill name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument()
  })

  it('calls adminCreateSkill with form values on submit', async () => {
    ;(apiClient.adminCreateSkill as jest.Mock).mockResolvedValue({
      id: 's3',
      name: 'New Skill',
      description: 'Desc',
      category: 'business',
      createdAt: '2026-01-03T00:00:00Z',
      _count: { skillPaths: 0 },
    })

    render(<SkillsPage />)
    await waitFor(() => screen.getByText('Product Strategy'))

    fireEvent.click(screen.getByRole('button', { name: /new skill/i }))

    fireEvent.change(screen.getByPlaceholderText(/skill name/i), {
      target: { value: 'New Skill' },
    })
    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: 'Desc' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create skill/i }))

    await waitFor(() => {
      expect(apiClient.adminCreateSkill).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Skill', description: 'Desc' })
      )
    })
  })

  it('shows create skill path form when New Path button clicked', async () => {
    render(<SkillsPage />)

    await waitFor(() => screen.getByText('Product Strategy'))

    fireEvent.click(screen.getByRole('button', { name: /new path/i }))

    expect(screen.getByRole('combobox', { name: /skill/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /level/i })).toBeInTheDocument()
  })

  it('calls adminCreateSkillPath with form values on submit', async () => {
    ;(apiClient.adminCreateSkillPath as jest.Mock).mockResolvedValue({
      id: 'sp3',
      skillId: 's1',
      level: 'beginner',
      durationHours: 10,
    })

    render(<SkillsPage />)
    await waitFor(() => screen.getByText('Product Strategy'))

    fireEvent.click(screen.getByRole('button', { name: /new path/i }))

    fireEvent.change(screen.getByRole('combobox', { name: /skill/i }), {
      target: { value: 's1' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /level/i }), {
      target: { value: 'beginner' },
    })
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '10' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create path/i }))

    await waitFor(() => {
      expect(apiClient.adminCreateSkillPath).toHaveBeenCalledWith(
        expect.objectContaining({ skillId: 's1', level: 'beginner', durationHours: 10 })
      )
    })
  })

  it('shows empty state when no skills exist', async () => {
    ;(apiClient.adminListSkills as jest.Mock).mockResolvedValue([])

    render(<SkillsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no skills/i)).toBeInTheDocument()
    })
  })
})
