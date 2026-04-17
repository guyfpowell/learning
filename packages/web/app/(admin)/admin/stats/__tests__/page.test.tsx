import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import StatsPage from '../page'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    adminGetStats: jest.fn(),
  },
}))

const MOCK_STATS = {
  totalUsers: 1234,
  dau: 87,
  activeSubscribers: 320,
  mrr: 0,
  lessonCompletionRate: 0.75,
}

describe('StatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.adminGetStats as jest.Mock).mockResolvedValue(MOCK_STATS)
  })

  it('renders Total Users card', async () => {
    render(<StatsPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
    })
  })

  it('renders DAU card', async () => {
    render(<StatsPage />)

    await waitFor(() => {
      expect(screen.getByText('Daily Active Users')).toBeInTheDocument()
      expect(screen.getByText('87')).toBeInTheDocument()
    })
  })

  it('renders Active Subscribers card', async () => {
    render(<StatsPage />)

    await waitFor(() => {
      expect(screen.getByText('Active Subscribers')).toBeInTheDocument()
      expect(screen.getByText('320')).toBeInTheDocument()
    })
  })

  it('renders Lesson Completion Rate as percentage', async () => {
    render(<StatsPage />)

    await waitFor(() => {
      expect(screen.getByText('Lesson Completion Rate')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('last 7 days')).toBeInTheDocument()
    })
  })

  it('renders MRR card with stub note', async () => {
    render(<StatsPage />)

    await waitFor(() => {
      expect(screen.getByText('MRR')).toBeInTheDocument()
      expect(screen.getByText('$0')).toBeInTheDocument()
      expect(screen.getByText('pending Stripe integration')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    ;(apiClient.adminGetStats as jest.Mock).mockReturnValue(new Promise(() => {}))

    render(<StatsPage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error state on failure', async () => {
    ;(apiClient.adminGetStats as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<StatsPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })
})
