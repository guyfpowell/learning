'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

interface NotificationPreference {
  id: string
  userId: string
  enableDailyReminder: boolean
  reminderTime?: 'morning' | 'afternoon' | 'evening'
  enableStreak: boolean
  enableLessonAvailable: boolean
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const data = await apiClient.getNotificationPreferences()
        setPrefs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences')
      } finally {
        setLoading(false)
      }
    }

    loadPrefs()
  }, [])

  const handleSave = async () => {
    if (!prefs) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await apiClient.updateNotificationPreferences({
        enableDailyReminder: prefs.enableDailyReminder,
        reminderTime: prefs.reminderTime,
        enableStreak: prefs.enableStreak,
        enableLessonAvailable: prefs.enableLessonAvailable,
      })
      setSuccess('Settings saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Name
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        {prefs && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>

            <div className="space-y-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.enableDailyReminder}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      enableDailyReminder: e.target.checked,
                    })
                  }
                  disabled={submitting}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-gray-800 font-semibold">
                  Enable Daily Reminder
                </span>
              </label>

              {prefs.enableDailyReminder && (
                <div className="ml-7">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Reminder Time
                  </label>
                  <select
                    value={prefs.reminderTime || 'morning'}
                    onChange={(e) =>
                      setPrefs({
                        ...prefs,
                        reminderTime: e.target.value as 'morning' | 'afternoon' | 'evening',
                      })
                    }
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              )}

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.enableStreak}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      enableStreak: e.target.checked,
                    })
                  }
                  disabled={submitting}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-gray-800 font-semibold">
                  Notify on Streak Milestones
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.enableLessonAvailable}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      enableLessonAvailable: e.target.checked,
                    })
                  }
                  disabled={submitting}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-gray-800 font-semibold">
                  Notify When New Lesson Available
                </span>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {submitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
