'use client'

import { ReactNode } from 'react'
import { useAuth } from './auth-context'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  return <>{children}</>
}
