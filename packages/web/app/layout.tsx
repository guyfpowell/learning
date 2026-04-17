import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider, OfflineBanner } from '@/components/Toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Learning App',
  description: 'AI-native micro-learning platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <OfflineBanner />
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
