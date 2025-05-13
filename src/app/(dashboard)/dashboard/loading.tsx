import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Title and Energy Skeleton */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Skeleton className="h-7 w-32" />
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
