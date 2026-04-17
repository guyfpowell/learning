'use client'

import { useState, useEffect } from 'react'
import { apiClient, AdminStats } from '@/lib/api-client'

interface StatCardProps {
  label: string
  value: string
  sub?: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .adminGetStats()
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading…</div>
  }

  if (error || !stats) {
    return <div className="p-6 text-red-600 text-sm">{error ?? 'No data'}</div>
  }

  const completionPct = `${Math.round(stats.lessonCompletionRate * 100)}%`
  const mrrDisplay = `$${stats.mrr.toLocaleString()}`

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Platform Stats</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
        />
        <StatCard
          label="Daily Active Users"
          value={stats.dau.toLocaleString()}
          sub="lessons completed today"
        />
        <StatCard
          label="Active Subscribers"
          value={stats.activeSubscribers.toLocaleString()}
        />
        <StatCard
          label="Lesson Completion Rate"
          value={completionPct}
          sub="last 7 days"
        />
        <StatCard
          label="MRR"
          value={mrrDisplay}
          sub="pending Stripe integration"
        />
      </div>
    </div>
  )
}
