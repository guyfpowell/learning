'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Lesson } from '@learning/shared'
import { QuizSkeleton } from '@/components/Skeleton'
import { Confetti } from '@/components/Confetti'
import { useToast } from '@/components/Toast'

interface QuizFeedback {
  quizId: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
}

interface QuizResult {
  score: number
  feedbacks: QuizFeedback[]
  coaching: string | null
  streak: number
  milestone: string | null
}

const MILESTONE_STREAKS = [7, 30, 100]

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const data = await apiClient.getLesson(lessonId)
        setLesson(data)
      } catch {
        toast('Failed to load lesson', 'error')
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
      const response = await apiClient.submitQuiz(lessonId, currentQuiz.id, selectedAnswer)
      const quizResult = response as unknown as QuizResult
      setResult(quizResult)

      const mainFeedback = quizResult.feedbacks[0]
      setAnswerState(mainFeedback?.isCorrect ? 'correct' : 'incorrect')

      // Confetti on milestone streaks
      if (quizResult.milestone && MILESTONE_STREAKS.includes(quizResult.streak)) {
        setShowConfetti(true)
        toast(`🔥 ${quizResult.milestone}!`, 'success')
      }
    } catch {
      toast('Failed to submit answer', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (!lesson) return
    setAnswerState('idle')
    setResult(null)
    setSelectedAnswer('')

    if (currentQuizIndex < lesson.quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
    } else {
      router.push('/')
    }
  }

  if (loading) return <QuizSkeleton />

  if (!lesson || lesson.quizzes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">No quizzes available for this lesson</p>
      </div>
    )
  }

  const currentQuiz = lesson.quizzes[currentQuizIndex]
  const progress = ((currentQuizIndex + 1) / lesson.quizzes.length) * 100

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          {/* Progress bar */}
          <div className="mb-6" role="progressbar" aria-valuenow={currentQuizIndex + 1} aria-valuemin={1} aria-valuemax={lesson.quizzes.length} aria-label={`Question ${currentQuizIndex + 1} of ${lesson.quizzes.length}`}>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Question {currentQuizIndex + 1} of {lesson.quizzes.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {currentQuiz.question}
          </h2>

          {!result ? (
            <>
              <fieldset className="space-y-3 mb-8" aria-label="Quiz answer options">
                <legend className="sr-only">Select your answer</legend>
                {currentQuiz.options.map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      disabled={submitting}
                      className="sr-only"
                      aria-label={option}
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedAnswer === option ? 'border-blue-500' : 'border-gray-400'
                    }`}>
                      {selectedAnswer === option && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 text-sm">{option}</span>
                  </label>
                ))}
              </fieldset>

              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitting}
                aria-label="Submit answer"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    Submitting…
                  </span>
                ) : 'Submit Answer'}
              </button>
            </>
          ) : (
            <>
              {result.feedbacks.map((feedback) => (
                <div
                  key={feedback.quizId}
                  className={`mb-4 p-4 rounded-lg ${
                    feedback.isCorrect
                      ? 'animate-pulse-green bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                      : 'animate-shake bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <div className="font-bold text-base mb-1 flex items-center gap-2">
                    {feedback.isCorrect ? (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incorrect — the answer was: <span className="font-semibold">{feedback.correctAnswer}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{feedback.explanation}</p>
                </div>
              ))}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Score: <span className="text-gray-900 dark:text-gray-100">{result.score}%</span>
                </span>
                {result.streak > 0 && (
                  <span className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                    🔥 {result.streak}-day streak
                  </span>
                )}
              </div>

              {result.milestone && (
                <div
                  className="mb-4 p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg text-center font-bold"
                  role="status"
                  aria-live="polite"
                >
                  🎉 {result.milestone}! {result.streak >= 30 ? "You're unstoppable." : "Keep going!"}
                </div>
              )}

              {result.coaching && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                    AI Coaching
                  </div>
                  <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{result.coaching}</p>
                </div>
              )}

              <button
                onClick={handleNext}
                aria-label={currentQuizIndex < lesson.quizzes.length - 1 ? 'Go to next question' : 'Return to dashboard'}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {currentQuizIndex < lesson.quizzes.length - 1 ? 'Next Question' : 'Back to Dashboard'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
