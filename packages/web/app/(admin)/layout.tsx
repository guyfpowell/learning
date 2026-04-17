'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin/skills', label: 'Skills' },
  { href: '/admin/lessons', label: 'Lessons' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/stats', label: 'Stats' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, user, router])

  if (loading || !isAuthenticated || user?.role !== 'admin') {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-56 bg-gray-900 dark:bg-gray-950 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Admin</p>
          <h1 className="text-lg font-bold mt-1">Learn CMS</h1>
        </div>
        <nav className="flex-1 p-3" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition ${
                pathname.startsWith(href)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6" id="main-content">
        {children}
      </main>
    </div>
  )
}
