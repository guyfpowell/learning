'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient, AdminLesson, AdminSkillPath } from '@/lib/api-client'

interface LessonRow extends AdminLesson {
  originalDay: number
}

export default function SkillPathDetailPage() {
  const params = useParams()
  const skillPathId = params?.id as string

  const [skillPath, setSkillPath] = useState<AdminSkillPath | null>(null)
  const [lessons, setLessons] = useState<LessonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [paths, rawLessons] = await Promise.all([
        apiClient.adminListSkillPaths(),
        apiClient.adminListLessonsByPath(skillPathId),
      ])
      const path = paths.find((p) => p.id === skillPathId) ?? null
      setSkillPath(path)
      setLessons(rawLessons.map((l) => ({ ...l, originalDay: l.day })))
    } catch {
      // errors surfaced via empty state
    } finally {
      setLoading(false)
    }
  }, [skillPathId])

  useEffect(() => {
    if (skillPathId) loadData()
  }, [skillPathId, loadData])

  const moveLesson = (from: number, to: number) => {
    if (to < 0 || to >= lessons.length) return
    const next = [...lessons]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setLessons(next)
  }

  const handleDragStart = (index: number) => setDraggedIndex(index)

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return
    moveLesson(draggedIndex, targetIndex)
    setDraggedIndex(null)
  }

  const hasOrderChanged = lessons.some((l, i) => l.day !== i + 1)

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const updates = lessons
        .map((l, i) => ({ lesson: l, newDay: i + 1 }))
        .filter(({ lesson, newDay }) => lesson.day !== newDay)
      await Promise.all(updates.map(({ lesson, newDay }) =>
        apiClient.adminUpdateLesson(lesson.id, { day: newDay })
      ))
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (lessonId: string) => {
    await apiClient.adminDeleteLesson(lessonId)
    await loadData()
  }

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading…</div>
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/skills" className="text-sm text-blue-600 hover:underline">
            ← Skills
          </Link>
          <h1 className="text-2xl font-bold mt-1">
            {skillPath
              ? `${skillPath.skill.name} — ${skillPath.level}`
              : 'Skill Path'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/lessons/new"
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add Lesson
          </Link>
          {hasOrderChanged && (
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50 hover:bg-green-700"
            >
              {saving ? 'Saving…' : 'Save Order'}
            </button>
          )}
        </div>
      </div>

      {lessons.length === 0 && (
        <p className="text-gray-500 text-sm">
          No lessons in this path. Add one above.
        </p>
      )}

      {lessons.length > 0 && (
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              data-testid="lesson-row"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={`flex items-center gap-3 border rounded p-3 bg-white cursor-grab ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <span className="text-xs text-gray-400 w-12 shrink-0">
                Day {index + 1}
              </span>
              <span className="flex-1 text-sm font-medium truncate">
                {lesson.title}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {lesson.durationMinutes}min
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                  lesson.published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {lesson.published ? 'Published' : 'Draft'}
              </span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => moveLesson(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="text-xs px-1 py-0.5 border rounded disabled:opacity-30 hover:bg-gray-100"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveLesson(index, index + 1)}
                  disabled={index === lessons.length - 1}
                  aria-label="Move down"
                  className="text-xs px-1 py-0.5 border rounded disabled:opacity-30 hover:bg-gray-100"
                >
                  ▼
                </button>
                <Link
                  href={`/admin/lessons/${lesson.id}`}
                  className="text-xs px-2 py-0.5 border rounded hover:bg-gray-100"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleRemove(lesson.id)}
                  aria-label="Remove"
                  className="text-xs px-2 py-0.5 border rounded text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
