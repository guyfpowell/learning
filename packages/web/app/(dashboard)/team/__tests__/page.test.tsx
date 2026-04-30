import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TeamPage from '../page'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Alice', role: 'admin' } }),
}))

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getTeamAnalytics: jest.fn(),
    getTeamMemberProgress: jest.fn(),
    getTeamSkillGaps: jest.fn(),
    getTeamLeaderboard: jest.fn(),
  },
}))

const MOCK_SUMMARY = { memberCount: 5, totalCompletions: 42, avgQuizScore: 74, avgStreak: 6 }
const MOCK_MEMBERS = [
  { userId: 'u1', name: 'Alice', email: 'alice@co.com', lessonsCompleted: 12, avgScore: 85, streak: 10, lastActive: null, currentSkill: 'Prompt Engineering' },
  { userId: 'u2', name: 'Bob', email: 'bob@co.com', lessonsCompleted: 5, avgScore: 60, streak: 3, lastActive: null, currentSkill: null },
]
const MOCK_GAPS = [
  { skillName: 'AI Governance', avgScore: 45, sampleSize: 8 },
  { skillName: 'Prompt Engineering', avgScore: 80, sampleSize: 15 },
]
const MOCK_LEADERBOARD = [
  { userId: 'u1', name: 'Alice', streak: 10, lessonsCompleted: 12 },
  { userId: 'u2', name: 'Bob', streak: 3, lessonsCompleted: 5 },
]

describe('TeamPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.getTeamAnalytics as jest.Mock).mockResolvedValue(MOCK_SUMMARY)
    ;(apiClient.getTeamMemberProgress as jest.Mock).mockResolvedValue(MOCK_MEMBERS)
    ;(apiClient.getTeamSkillGaps as jest.Mock).mockResolvedValue(MOCK_GAPS)
    ;(apiClient.getTeamLeaderboard as jest.Mock).mockResolvedValue(MOCK_LEADERBOARD)
  })

  it('renders team dashboard heading', async () => {
    render(<TeamPage />)
    await waitFor(() => {
      expect(screen.getByText('Team Dashboard')).toBeInTheDocument()
    })
  })

  it('displays summary stats', async () => {
    render(<TeamPage />)
    await waitFor(() => {
      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Total Completions')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()  // totalCompletions (unique)
      expect(screen.getAllByText(/74%/).length).toBeGreaterThan(0) // avgQuizScore
    })
  })

  it('displays member progress table', async () => {
    render(<TeamPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Prompt Engineering').length).toBeGreaterThan(0)
    })
  })

  it('displays leaderboard with rank badges', async () => {
    render(<TeamPage />)
    await waitFor(() => {
      expect(screen.getByText(/10d streak/)).toBeInTheDocument()
      expect(screen.getByText(/3d streak/)).toBeInTheDocument()
    })
  })

  it('displays skill gap bars', async () => {
    render(<TeamPage />)
    await waitFor(() => {
      expect(screen.getByText('AI Governance')).toBeInTheDocument()
      expect(screen.getByText('45% avg (8 answers)')).toBeInTheDocument()
    })
  })

  it('shows loading spinner initially', () => {
    ;(apiClient.getTeamAnalytics as jest.Mock).mockReturnValue(new Promise(() => {}))
    ;(apiClient.getTeamMemberProgress as jest.Mock).mockReturnValue(new Promise(() => {}))
    ;(apiClient.getTeamSkillGaps as jest.Mock).mockReturnValue(new Promise(() => {}))
    ;(apiClient.getTeamLeaderboard as jest.Mock).mockReturnValue(new Promise(() => {}))

    render(<TeamPage />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows error message on failure', async () => {
    ;(apiClient.getTeamAnalytics as jest.Mock).mockRejectedValue(new Error('Server error'))

    render(<TeamPage />)
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })
})
