'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Lesson, Quiz } from '@learning/shared'
import Link from 'next/link'

interface QuizResult {
  quizId: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  score: number
  explanation: string
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [result, setResult] = useState<QuizResult | null>(null)
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

  const handleSubmitAnswer = async () => {
    if (!lesson || !selectedAnswer || submitting) return

    const currentQuiz = lesson.quizzes[currentQuizIndex]
    setSubmitting(true)

    try {
      const response = await apiClient.submitQuiz(
        lessonId,
        currentQuiz.id,
        selectedAnswer
      )
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (!lesson) return

    if (currentQuizIndex < lesson.quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
      setSelectedAnswer('')
      setResult(null)
    } else {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!lesson || lesson.quizzes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">No quizzes available for this lesson</p>
      </div>
    )
  }

  const currentQuiz = lesson.quizzes[currentQuizIndex]

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-2">
            Question {currentQuizIndex + 1} of {lesson.quizzes.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuizIndex + 1) / lesson.quizzes.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {currentQuiz.question}
        </h2>

        {!result ? (
          <>
            <div className="space-y-3 mb-8">
              {currentQuiz.options.map((option) => (
                <label key={option} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="mr-3"
                    disabled={submitting}
                  />
                  <span className="text-gray-800">{option}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || submitting}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </>
        ) : (
          <>
            <div
              className={`mb-6 p-4 rounded-lg ${
                result.isCorrect
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <div className="font-bold text-lg mb-2">
                {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              <div className="text-sm mb-3">{result.explanation}</div>
              <div className="text-sm">Score: {result.score}%</div>
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              {currentQuizIndex < lesson.quizzes.length - 1
                ? 'Next Question'
                : 'Back to Dashboard'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
