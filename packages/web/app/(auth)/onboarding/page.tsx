'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Skill } from '@learning/shared'

export default function OnboardingPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkill, setSelectedSkill] = useState('')
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [timezone, setTimezone] = useState('UTC')
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const data = await apiClient.getSkills()
        setSkills(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skills')
      } finally {
        setLoading(false)
      }
    }

    loadSkills()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!selectedSkill) {
        throw new Error('Please select a skill')
      }

      await apiClient.updateProfile({
        goal: selectedSkill,
        preferredTime,
        timezone,
        learningStyle: 'mixed',
      })

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
      <p className="text-gray-600 mb-6">Let's set up your learning preferences</p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-3">
            Which skill would you like to learn?
          </label>
          <div className="space-y-2">
            {skills.map((skill) => (
              <label key={skill.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="skill"
                  value={skill.id}
                  checked={selectedSkill === skill.id}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="mr-3"
                  disabled={submitting}
                />
                <div>
                  <div className="font-semibold text-gray-900">{skill.name}</div>
                  <div className="text-sm text-gray-600">{skill.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Learning Level
          </label>
          <select
            value={learningLevel}
            onChange={(e) => setLearningLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={submitting}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Timezone
          </label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="UTC, America/New_York, etc."
            disabled={submitting}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Preferred Learning Time
          </label>
          <select
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value as 'morning' | 'afternoon' | 'evening')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={submitting}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedSkill}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {submitting ? 'Saving...' : 'Get Started'}
        </button>
      </form>
    </div>
  )
}
