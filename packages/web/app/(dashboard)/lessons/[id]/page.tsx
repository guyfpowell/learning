'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Lesson } from '@learning/shared'
import Link from 'next/link'

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const data = await apiClient.getLesson(lessonId)
        setLesson(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }

    loadLesson()
  }, [lessonId])

  const handleComplete = async () => {
    setSubmitting(true)
    try {
      await apiClient.completeLesson(lessonId)
      setCompleted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete lesson')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Lesson not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {lesson.title}
          </h1>
          <div className="flex gap-4 text-gray-600">
            <span>Day {lesson.day}</span>
            <span>•</span>
            <span>{lesson.durationMinutes} minutes</span>
            <span>•</span>
            <span className="capitalize">{lesson.difficulty}</span>
          </div>
        </div>

        {lesson.mediaUrl && (
          <div className="mb-8">
            <img
              src={lesson.mediaUrl}
              alt={lesson.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="prose max-w-none mb-8">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {lesson.content}
          </div>
        </div>

        {!completed ? (
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {submitting ? 'Completing...' : 'Complete Lesson'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 text-green-700 rounded-lg">
              ✓ Lesson completed! Ready for the quiz?
            </div>
            <Link
              href={`/lessons/${lessonId}/quiz`}
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Take Quiz
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
