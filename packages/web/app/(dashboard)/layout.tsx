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
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-blue-900 text-white shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Learn</h1>
          </div>
          <nav className="mt-8">
            <Link
              href="/dashboard"
              className="block px-6 py-3 hover:bg-blue-800 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/progress"
              className="block px-6 py-3 hover:bg-blue-800 transition"
            >
              Progress
            </Link>
            <Link
              href="/settings"
              className="block px-6 py-3 hover:bg-blue-800 transition"
            >
              Settings
            </Link>
          </nav>
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
