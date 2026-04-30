'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { apiClient, TeamSummary, MemberProgress, SkillGap, LeaderboardEntry } from '@/lib/api-client'

const PLACEHOLDER_TEAM_ID = 'demo-team'

export default function TeamPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<TeamSummary | null>(null)
  const [members, setMembers] = useState<MemberProgress[]>([])
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamId] = useState(PLACEHOLDER_TEAM_ID)

  useEffect(() => {
    async function load() {
      try {
        const [s, m, g, l] = await Promise.all([
          apiClient.getTeamAnalytics(teamId),
          apiClient.getTeamMemberProgress(teamId),
          apiClient.getTeamSkillGaps(teamId),
          apiClient.getTeamLeaderboard(teamId),
        ])
        setSummary(s)
        setMembers(m)
        setSkillGaps(g)
        setLeaderboard(l)
      } catch (err: any) {
        setError(err.message || 'Failed to load team data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [teamId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your team's learning progress</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Members" value={summary.memberCount} />
          <StatCard label="Total Completions" value={summary.totalCompletions} />
          <StatCard label="Avg Quiz Score" value={`${Math.round(summary.avgQuizScore)}%`} />
          <StatCard label="Avg Streak" value={`${Math.round(summary.avgStreak)}d`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Member progress table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Member Progress</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {members.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">No member progress yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Member</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Streak</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Lessons</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{m.name}</p>
                        {m.currentSkill && (
                          <p className="text-xs text-gray-400">{m.currentSkill}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{m.streak}d</td>
                      <td className="px-4 py-3 text-right text-gray-700">{m.lessonsCompleted}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{Math.round(m.avgScore)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Leaderboard</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {leaderboard.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">No activity yet.</p>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.userId} className="flex items-center px-4 py-3 gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{entry.name}</p>
                    <p className="text-xs text-gray-400">{entry.lessonsCompleted} lessons</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{entry.streak}d streak</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Skill gap analysis */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Skill Gap Analysis</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {skillGaps.length === 0 ? (
            <p className="text-gray-500 text-sm">Not enough quiz data to show skill gaps yet.</p>
          ) : (
            skillGaps.map((gap) => (
              <div key={gap.skillName}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{gap.skillName}</span>
                  <span className="text-gray-500">{Math.round(gap.avgScore)}% avg ({gap.sampleSize} answers)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${gap.avgScore < 50 ? 'bg-red-400' : gap.avgScore < 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.round(gap.avgScore)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
