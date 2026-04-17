'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, AdminLesson } from '@/lib/api-client'

const LEVELS = ['', 'beginner', 'intermediate', 'advanced']

export default function AdminLessonsPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [skillFilter, setSkillFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadLessons = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiClient.adminListLessons(
        page,
        skillFilter || undefined,
        levelFilter || undefined,
      )
      setLessons(data.lessons)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }, [page, skillFilter, levelFilter])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  const togglePublished = async (lesson: AdminLesson) => {
    setTogglingId(lesson.id)
    try {
      const updated = await apiClient.adminUpdateLesson(lesson.id, {
        published: !lesson.published,
      })
      setLessons((prev) => prev.map((l) => (l.id === lesson.id ? updated : l)))
    } catch {
      setError('Failed to update lesson')
    } finally {
      setTogglingId(null)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lessons</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} total</p>
        </div>
        <button
          onClick={() => router.push('/admin/lessons/new')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          New Lesson
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Filter by skill…"
          value={skillFilter}
          onChange={(e) => { setSkillFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />
        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l || 'All levels'}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading…</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No lessons found. Create one to get started.
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Skill</th>
                  <th className="px-4 py-3 text-left">Level</th>
                  <th className="px-4 py-3 text-left">Day</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {lessons.map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/admin/lessons/${lesson.id}`)}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                      >
                        {lesson.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {lesson.skillPath?.skill.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">
                      {lesson.skillPath?.level ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {lesson.day}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lesson.published
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {lesson.published ? 'Published' : 'Unpublished'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500">
                      {new Date(lesson.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => togglePublished(lesson)}
                        disabled={togglingId === lesson.id}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                          lesson.published
                            ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                            : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 text-green-800 dark:text-green-300'
                        } disabled:opacity-50`}
                        aria-label={lesson.published ? 'Unpublish' : 'Publish'}
                      >
                        {togglingId === lesson.id ? '…' : lesson.published ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
