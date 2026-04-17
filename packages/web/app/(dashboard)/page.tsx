'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Lesson } from '@learning/shared'
import Link from 'next/link'
import { DashboardSkeleton } from '@/components/Skeleton'

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
  const [streakAnimated, setStreakAnimated] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lessonData, progressData] = await Promise.all([
          apiClient.getTodayLesson().catch(() => null),
          apiClient.getProgress().catch(() => null),
        ])
        setLesson(lessonData)
        setProgress(progressData)
        // Trigger streak counter animation on mount
        setTimeout(() => setStreakAnimated(true), 200)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) return <DashboardSkeleton />

  const showStreakBanner = progress && progress.currentStreak > 3

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="p-4 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Streak-at-risk banner */}
      {showStreakBanner && (
        <div
          role="status"
          className="p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg flex items-center gap-3 text-sm"
          aria-label={`Keep your ${progress.currentStreak}-day streak alive`}
        >
          <span className="text-xl" aria-hidden="true">🔥</span>
          <span className="text-orange-800 dark:text-orange-300 font-medium">
            You're on a <strong>{progress.currentStreak}-day streak</strong> — keep it alive!
          </span>
        </div>
      )}

      {/* Streak Card */}
      {progress && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-center">
            <div
              className={`text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2 transition-transform ${
                streakAnimated ? 'animate-count-up' : ''
              }`}
              aria-label={`${progress.currentStreak} day streak`}
            >
              🔥 {progress.currentStreak}
            </div>
            <div className="text-xl text-gray-700 dark:text-gray-300">Day Streak</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {progress.currentStreak === 0
                ? 'Start your streak — complete a lesson today'
                : 'Amazing! Complete today\'s lesson to keep going'}
            </div>
          </div>
        </div>
      )}

      {/* Today's Lesson */}
      {lesson ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Today's Lesson
          </h2>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {lesson.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              {lesson.durationMinutes} min &middot;{' '}
              <span className="capitalize font-medium">{lesson.difficulty}</span>
            </p>
          </div>
          <Link
            href={`/lessons/${lesson.id}`}
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label={`Start lesson: ${lesson.title}`}
          >
            Start Lesson
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-gray-600 dark:text-gray-400">
            No lessons available yet. Complete your onboarding profile first.
          </p>
        </div>
      )}

      {/* Stats */}
      {progress && (
        <div className="grid grid-cols-2 gap-4" role="region" aria-label="Learning statistics">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" aria-label={`${progress.totalLessonsCompleted} lessons completed`}>
              {progress.totalLessonsCompleted}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Lessons Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" aria-label={`${Math.round(progress.averageQuizScore)} percent average score`}>
              {Math.round(progress.averageQuizScore)}%
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Average Score</div>
          </div>
        </div>
      )}
    </div>
  )
}
