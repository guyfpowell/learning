'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiClient, AdminSkill } from '@/lib/api-client'

const CATEGORIES = ['product-management', 'ai-engineering', 'business', 'design', 'data-science']

export default function SkillsPage() {
  const [skills, setSkills] = useState<AdminSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showSkillForm, setShowSkillForm] = useState(false)
  const [showPathForm, setShowPathForm] = useState(false)

  const [skillName, setSkillName] = useState('')
  const [skillDescription, setSkillDescription] = useState('')
  const [skillCategory, setSkillCategory] = useState(CATEGORIES[0])
  const [skillSubmitting, setSkillSubmitting] = useState(false)

  const [pathSkillId, setPathSkillId] = useState('')
  const [pathLevel, setPathLevel] = useState('beginner')
  const [pathDuration, setPathDuration] = useState('')
  const [pathSubmitting, setPathSubmitting] = useState(false)

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.adminListSkills()
      setSkills(data)
    } catch {
      setError('Failed to load skills')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    setSkillSubmitting(true)
    try {
      await apiClient.adminCreateSkill({
        name: skillName,
        description: skillDescription,
        category: skillCategory,
      })
      setSkillName('')
      setSkillDescription('')
      setSkillCategory(CATEGORIES[0])
      setShowSkillForm(false)
      await loadSkills()
    } catch {
      // keep form open on error
    } finally {
      setSkillSubmitting(false)
    }
  }

  const handleCreatePath = async (e: React.FormEvent) => {
    e.preventDefault()
    setPathSubmitting(true)
    try {
      await apiClient.adminCreateSkillPath({
        skillId: pathSkillId,
        level: pathLevel,
        durationHours: Number(pathDuration),
      })
      setPathSkillId('')
      setPathLevel('beginner')
      setPathDuration('')
      setShowPathForm(false)
      await loadSkills()
    } catch {
      // keep form open on error
    } finally {
      setPathSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Skills &amp; Paths</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSkillForm((v) => !v); setShowPathForm(false) }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            New Skill
          </button>
          <button
            onClick={() => { setShowPathForm((v) => !v); setShowSkillForm(false) }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            New Path
          </button>
        </div>
      </div>

      {showSkillForm && (
        <form
          onSubmit={handleCreateSkill}
          className="mb-6 p-4 border rounded bg-gray-50 space-y-3"
        >
          <h2 className="font-semibold">New Skill</h2>
          <input
            type="text"
            placeholder="Skill Name"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Description"
            value={skillDescription}
            onChange={(e) => setSkillDescription(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <select
            value={skillCategory}
            onChange={(e) => setSkillCategory(e.target.value)}
            aria-label="Category"
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={skillSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
          >
            {skillSubmitting ? 'Creating…' : 'Create Skill'}
          </button>
        </form>
      )}

      {showPathForm && (
        <form
          onSubmit={handleCreatePath}
          className="mb-6 p-4 border rounded bg-gray-50 space-y-3"
        >
          <h2 className="font-semibold">New Skill Path</h2>
          <label className="block text-sm">
            <span className="block mb-1">Skill</span>
            <select
              value={pathSkillId}
              onChange={(e) => setPathSkillId(e.target.value)}
              required
              aria-label="Skill"
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select skill…</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block mb-1">Level</span>
            <select
              value={pathLevel}
              onChange={(e) => setPathLevel(e.target.value)}
              aria-label="Level"
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block text-sm" htmlFor="path-duration">
            Duration (hours)
          </label>
          <input
            id="path-duration"
            type="number"
            placeholder="Duration hours"
            value={pathDuration}
            onChange={(e) => setPathDuration(e.target.value)}
            required
            min={1}
            aria-label="Duration"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pathSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50"
          >
            {pathSubmitting ? 'Creating…' : 'Create Path'}
          </button>
        </form>
      )}

      {loading && <p className="text-gray-500 text-sm">Loading skills…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && skills.length === 0 && (
        <p className="text-gray-500 text-sm">No skills found. Create one above.</p>
      )}

      {!loading && skills.length > 0 && (
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.id} className="border rounded p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{skill.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{skill.description}</p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {skill.category}
                  </span>
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                  {skill._count.skillPaths === 1
                    ? '1 path'
                    : `${skill._count.skillPaths} paths`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
