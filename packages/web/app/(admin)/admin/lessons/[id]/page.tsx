'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { apiClient, AdminSkillPath } from '@/lib/api-client'

interface QuizDraft {
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string
}

const EMPTY_QUIZ: QuizDraft = {
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: '',
}

interface LessonEditorPageProps {
  lessonId?: string
}

export default function LessonEditorPage({ lessonId: propLessonId }: LessonEditorPageProps = {}) {
  const router = useRouter()
  const params = useParams()
  const resolvedId = propLessonId ?? (params?.id as string)
  const isNew = resolvedId === 'new'

  const [skillPaths, setSkillPaths] = useState<AdminSkillPath[]>([])
  const [title, setTitle] = useState('')
  const [skillPathId, setSkillPathId] = useState('')
  const [day, setDay] = useState(1)
  const [durationMinutes, setDurationMinutes] = useState(5)
  const [difficulty, setDifficulty] = useState('beginner')
  const [mediaUrl, setMediaUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [quiz, setQuiz] = useState<QuizDraft>(EMPTY_QUIZ)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none min-h-[200px] focus:outline-none px-4 py-3',
      },
    },
  })

  const loadLesson = useCallback(async () => {
    if (isNew || !resolvedId) return
    try {
      const lesson = await apiClient.getLesson(resolvedId)
      setTitle(lesson.title)
      setSkillPathId(lesson.skillPathId ?? '')
      setDay(lesson.day ?? 1)
      setDurationMinutes(lesson.durationMinutes ?? 5)
      setDifficulty(lesson.difficulty ?? 'beginner')
      setMediaUrl(lesson.mediaUrl ?? '')
      setPublished((lesson as { published?: boolean }).published ?? false)
      editor?.commands.setContent(lesson.content ?? '')
      if (lesson.quizzes?.[0]) {
        const q = lesson.quizzes[0]
        setQuiz({
          question: q.question ?? '',
          optionA: q.options?.[0] ?? '',
          optionB: q.options?.[1] ?? '',
          optionC: q.options?.[2] ?? '',
          optionD: q.options?.[3] ?? '',
          correctAnswer: q.correctAnswer ?? 'A',
          explanation: q.explanation ?? '',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }, [isNew, resolvedId, editor])

  useEffect(() => {
    const init = async () => {
      try {
        const paths = await apiClient.adminListSkillPaths()
        setSkillPaths(paths)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skill paths')
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (editor) loadLesson()
  }, [editor, loadLesson])

  const buildPayload = () => ({
    title,
    skillPathId,
    day,
    content: editor?.getHTML() ?? '',
    durationMinutes,
    difficulty,
    mediaUrl: mediaUrl || undefined,
    published,
  })

  const handleSave = async () => {
    if (!title || !skillPathId) {
      setError('Title and skill path are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        await apiClient.adminCreateLesson(buildPayload())
      } else {
        await apiClient.adminUpdateLesson(resolvedId, buildPayload())
      }
      router.push('/admin/lessons')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!title || !skillPathId) {
      setError('Title and skill path are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { ...buildPayload(), published: true }
      if (isNew) {
        await apiClient.adminCreateLesson(payload)
      } else {
        await apiClient.adminUpdateLesson(resolvedId, payload)
      }
      router.push('/admin/lessons')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!resolvedId || isNew) return
    setDeleting(true)
    setError('')
    try {
      await apiClient.adminDeleteLesson(resolvedId)
      router.push('/admin/lessons')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading…</div>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isNew ? 'New Lesson' : 'Edit Lesson'}
        </h1>
        <button
          onClick={() => router.push('/admin/lessons')}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="Lesson title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Skill path + Day */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="skill-path-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Skill Path
            </label>
            <select
              id="skill-path-select"
              aria-label="Skill path"
              value={skillPathId}
              onChange={(e) => setSkillPathId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select skill path…</option>
              {skillPaths.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.skill.name} — {sp.level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Day
            </label>
            <input
              type="number"
              min={1}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Duration + Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Media URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Media URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://…"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
            {/* Toolbar */}
            <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              {[
                { label: 'B', action: () => editor?.chain().focus().toggleBold().run(), title: 'Bold' },
                { label: 'I', action: () => editor?.chain().focus().toggleItalic().run(), title: 'Italic' },
                { label: 'H2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), title: 'Heading 2' },
                { label: '• List', action: () => editor?.chain().focus().toggleBulletList().run(), title: 'Bullet list' },
              ].map(({ label, action, title }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  title={title}
                  className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                >
                  {label}
                </button>
              ))}
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3">
          <input
            id="published-toggle"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="published-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Published
          </label>
        </div>

        {/* Quiz section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Quiz</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Question
            </label>
            <input
              type="text"
              placeholder="Question"
              value={quiz.question}
              onChange={(e) => setQuiz((q) => ({ ...q, question: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
              const key = `option${letter}` as keyof QuizDraft
              return (
                <div key={letter}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Option {letter}
                  </label>
                  <input
                    type="text"
                    placeholder={`Option ${letter}`}
                    value={quiz[key]}
                    onChange={(e) => setQuiz((q) => ({ ...q, [key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correct Answer
            </label>
            <select
              value={quiz.correctAnswer}
              onChange={(e) => setQuiz((q) => ({ ...q, correctAnswer: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['A', 'B', 'C', 'D'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Explanation
            </label>
            <textarea
              placeholder="Why this answer is correct…"
              value={quiz.explanation}
              onChange={(e) => setQuiz((q) => ({ ...q, explanation: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            aria-label="Save"
            className="px-5 py-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 ml-auto"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
