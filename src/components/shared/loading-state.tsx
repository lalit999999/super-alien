interface LoadingStateProps {
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 6, className = "" }: LoadingStateProps) {
  return (
    <div className={`space-y-3 p-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#E7D8C8]" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex justify-between gap-2">
              <div className="h-3 w-28 animate-pulse rounded bg-[#E7D8C8]" />
              <div className="h-3 w-12 animate-pulse rounded bg-[#EFE5D5]" />
            </div>
            <div className={`h-2.5 animate-pulse rounded bg-[#EFE5D5] ${i % 2 === 0 ? "w-48" : "w-40"}`} />
            <div className={`h-2 animate-pulse rounded bg-[#EFE5D5] ${i % 3 === 0 ? "w-36" : "w-44"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardLoadingState({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#E7D8C8] bg-white p-5">
          <div className="mb-3 h-10 w-10 animate-pulse rounded-xl bg-[#EFE5D5]" />
          <div className="h-3 w-20 animate-pulse rounded bg-[#E7D8C8]" />
          <div className="mt-2 h-6 w-12 animate-pulse rounded bg-[#EFE5D5]" />
        </div>
      ))}
    </div>
  );
}
