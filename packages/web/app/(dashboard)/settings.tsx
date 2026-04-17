'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { useWebPush } from '@/lib/useWebPush'
import { useDarkMode } from '@/lib/useDarkMode'
import { useToast } from '@/components/Toast'

interface NotificationPreference {
  id: string
  userId: string
  enableDailyReminder: boolean
  reminderTime?: 'morning' | 'afternoon' | 'evening'
  enableStreak: boolean
  enableLessonAvailable: boolean
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled: boolean
  label: string
  id: string
}) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-gray-800 dark:text-gray-200 font-medium text-sm cursor-pointer select-none">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { status: pushStatus, subscribe: subscribePush } = useWebPush()
  const [darkMode, setDarkMode] = useDarkMode()
  const { toast } = useToast()

  useEffect(() => {
    apiClient.getNotificationPreferences()
      .then(setPrefs)
      .catch(() => toast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!prefs) return
    setSubmitting(true)
    try {
      await apiClient.updateNotificationPreferences({
        enableDailyReminder: prefs.enableDailyReminder,
        reminderTime: prefs.reminderTime,
        enableStreak: prefs.enableStreak,
        enableLessonAvailable: prefs.enableLessonAvailable,
      })
      toast('Settings saved', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save settings', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4" aria-busy="true" aria-label="Loading settings">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Profile */}
      <section aria-labelledby="profile-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 id="profile-heading" className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              id="name-field"
              type="text"
              value={user?.name || ''}
              disabled
              aria-readonly="true"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="email-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              id="email-field"
              type="email"
              value={user?.email || ''}
              disabled
              aria-readonly="true"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section aria-labelledby="appearance-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 id="appearance-heading" className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
        <Toggle
          id="dark-mode-toggle"
          label="Dark mode"
          checked={darkMode}
          onChange={setDarkMode}
          disabled={false}
        />
      </section>

      {/* Notifications */}
      {prefs && (
        <section aria-labelledby="notifications-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 id="notifications-heading" className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Notifications</h2>

          <div className="space-y-5">
            <Toggle
              id="daily-reminder-toggle"
              label="Daily lesson reminder"
              checked={prefs.enableDailyReminder}
              onChange={(v) => setPrefs({ ...prefs, enableDailyReminder: v })}
              disabled={submitting}
            />

            {prefs.enableDailyReminder && (
              <div className="ml-0 pl-4 border-l-2 border-blue-200 dark:border-blue-700">
                <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder time
                </label>
                <select
                  id="reminder-time"
                  value={prefs.reminderTime || 'morning'}
                  onChange={(e) => setPrefs({ ...prefs, reminderTime: e.target.value as 'morning' | 'afternoon' | 'evening' })}
                  disabled={submitting}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select reminder time"
                >
                  <option value="morning">Morning (8 AM)</option>
                  <option value="afternoon">Afternoon (1 PM)</option>
                  <option value="evening">Evening (7 PM)</option>
                </select>
              </div>
            )}

            <Toggle
              id="streak-toggle"
              label="Streak milestone notifications"
              checked={prefs.enableStreak}
              onChange={(v) => setPrefs({ ...prefs, enableStreak: v })}
              disabled={submitting}
            />

            <Toggle
              id="lesson-available-toggle"
              label="New lesson available alerts"
              checked={prefs.enableLessonAvailable}
              onChange={(v) => setPrefs({ ...prefs, enableLessonAvailable: v })}
              disabled={submitting}
            />

            {/* Browser push subscription */}
            {pushStatus !== 'unsupported' && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Browser Push
                </p>
                {pushStatus === 'subscribed' ? (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                    Browser notifications enabled
                  </p>
                ) : pushStatus === 'denied' ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Blocked — update site permissions in your browser to enable.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={subscribePush}
                    className="text-sm px-4 py-2 border border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Enable browser push notifications"
                  >
                    Enable browser notifications
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={submitting}
              aria-label="Save notification settings"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Saving…
                </span>
              ) : 'Save Settings'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
