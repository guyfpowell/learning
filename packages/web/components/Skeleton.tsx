export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard" aria-busy="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center space-y-3">
          <Skeleton className="h-14 w-32 mx-auto rounded" />
          <Skeleton className="h-5 w-24 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="max-w-2xl mx-auto" aria-label="Loading quiz" aria-busy="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-12 w-36 rounded-lg" />
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading progress" aria-busy="true">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
