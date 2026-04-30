'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-64 bg-blue-900 dark:bg-gray-800 text-white shadow-lg flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Learn</h1>
          </div>
          <nav className="mt-4 flex-1" aria-label="Main navigation">
            <Link
              href="/"
              className="block px-6 py-3 hover:bg-blue-800 dark:hover:bg-gray-700 transition focus-visible:bg-blue-800 focus-visible:outline-none"
              aria-label="Go to dashboard"
            >
              Dashboard
            </Link>
            <Link
              href="/progress"
              className="block px-6 py-3 hover:bg-blue-800 dark:hover:bg-gray-700 transition focus-visible:bg-blue-800 focus-visible:outline-none"
              aria-label="View progress"
            >
              Progress
            </Link>
            <Link
              href="/settings"
              className="block px-6 py-3 hover:bg-blue-800 dark:hover:bg-gray-700 transition focus-visible:bg-blue-800 focus-visible:outline-none"
              aria-label="Open settings"
            >
              Settings
            </Link>
            <Link
              href="/team"
              className="block px-6 py-3 hover:bg-blue-800 dark:hover:bg-gray-700 transition focus-visible:bg-blue-800 focus-visible:outline-none"
              aria-label="View team dashboard"
            >
              Team
            </Link>
          </nav>
          <div className="p-6">
            <button
              onClick={handleLogout}
              aria-label="Log out of your account"
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow px-6 py-4 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Welcome back, {user?.name}!
            </h2>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-6" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
