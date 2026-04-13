'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

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

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await apiClient.getProgress()
        setProgress(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress')
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">No progress data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl font-bold text-orange-600 mb-2">
            🔥 {progress.currentStreak}
          </div>
          <div className="text-gray-700 font-semibold">Current Streak</div>
          <div className="text-sm text-gray-500">Days in a row</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {progress.totalLessonsCompleted}
          </div>
          <div className="text-gray-700 font-semibold">Lessons Completed</div>
          <div className="text-sm text-gray-500">Total progress</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {Math.round(progress.averageQuizScore)}%
          </div>
          <div className="text-gray-700 font-semibold">Average Score</div>
          <div className="text-sm text-gray-500">Quiz performance</div>
        </div>
      </div>

      {/* Completed Lessons */}
      {progress.completedLessons.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Completed Lessons
          </h3>
          <div className="space-y-3">
            {progress.completedLessons.map((lesson, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    Lesson {idx + 1}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(lesson.completedAt).toLocaleDateString()}
                  </div>
                </div>
                {lesson.quizScore !== null && (
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {lesson.quizScore}%
                    </div>
                    <div className="text-sm text-gray-600">Quiz Score</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
