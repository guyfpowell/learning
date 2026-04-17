'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { ProgressSkeleton } from '@/components/Skeleton'

interface ProgressData {
  currentStreak: number
  totalLessonsCompleted: number
  averageQuizScore: number
  completedLessons: Array<{
    lessonId: string
    completedAt: string
    quizScore: number | null
  }>
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [barsVisible, setBarsVisible] = useState(false)

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await apiClient.getProgress()
        setProgress(data)
        // Animate bars after data loads
        setTimeout(() => setBarsVisible(true), 100)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress')
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [])

  if (loading) return <ProgressSkeleton />

  if (!progress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">No progress data available yet. Complete your first lesson!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="p-4 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Learning statistics">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2" aria-label={`${progress.currentStreak} day streak`}>
            🔥 {progress.currentStreak}
          </div>
          <div className="text-gray-700 dark:text-gray-300 font-semibold">Current Streak</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Days in a row</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2" aria-label={`${progress.totalLessonsCompleted} lessons completed`}>
            {progress.totalLessonsCompleted}
          </div>
          <div className="text-gray-700 dark:text-gray-300 font-semibold">Lessons Completed</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total progress</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2" aria-label={`${Math.round(progress.averageQuizScore)} percent average score`}>
            {Math.round(progress.averageQuizScore)}%
          </div>
          <div className="text-gray-700 dark:text-gray-300 font-semibold">Average Score</div>
          {/* Animated score bar */}
          <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" aria-hidden="true">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: barsVisible ? `${Math.round(progress.averageQuizScore)}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Completed Lessons */}
      {progress.completedLessons.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Completed Lessons
          </h2>
          <div className="space-y-3" role="list" aria-label="List of completed lessons">
            {progress.completedLessons.map((lesson, idx) => {
              const score = lesson.quizScore ?? 0
              const scoreColor =
                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-400'

              return (
                <div
                  key={idx}
                  role="listitem"
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      Lesson {idx + 1}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(lesson.completedAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>
                  {lesson.quizScore !== null && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm"
                        aria-label={`Quiz score: ${lesson.quizScore} percent`}>
                        {lesson.quizScore}%
                      </div>
                      <div className="h-1.5 w-16 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden" aria-hidden="true">
                        <div
                          className={`h-full ${scoreColor} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: barsVisible ? `${lesson.quizScore}%` : '0%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
