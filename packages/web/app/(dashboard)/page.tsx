'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Lesson } from '@learning/shared'
import Link from 'next/link'

interface ProgressData {
  currentStreak: number
  totalLessonsCompleted: number
  averageQuizScore: number
}

export default function DashboardHome() {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lessonData, progressData] = await Promise.all([
          apiClient.getTodayLesson().catch(() => null),
          apiClient.getProgress().catch(() => null),
        ])
        setLesson(lessonData)
        setProgress(progressData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

      {/* Streak Card */}
      {progress && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-600 mb-2">
              🔥 {progress.currentStreak}
            </div>
            <div className="text-xl text-gray-700">Day Streak</div>
            <div className="text-sm text-gray-500 mt-2">
              Keep it up! Complete a lesson today
            </div>
          </div>
        </div>
      )}

      {/* Today's Lesson */}
      {lesson ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Today's Lesson
          </h3>
          <div className="mb-4">
            <h4 className="text-xl font-semibold text-gray-800">
              {lesson.title}
            </h4>
            <p className="text-gray-600 mt-2">
              {lesson.durationMinutes} minutes • Difficulty:{' '}
              <span className="font-semibold">{lesson.difficulty}</span>
            </p>
          </div>
          <Link
            href={`/lessons/${lesson.id}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Start Lesson
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            No lessons available yet. Complete your onboarding profile first.
          </p>
        </div>
      )}

      {/* Stats */}
      {progress && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600">
              {progress.totalLessonsCompleted}
            </div>
            <div className="text-gray-600 text-sm">Lessons Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(progress.averageQuizScore)}%
            </div>
            <div className="text-gray-600 text-sm">Average Score</div>
          </div>
        </div>
      )}
    </div>
  )
}
