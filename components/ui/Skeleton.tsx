// Shimmer placeholders shown while the month's data loads.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-44 rounded-card" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[84px] rounded-card" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-card" />
      <Skeleton className="h-80 rounded-card" />
      <Skeleton className="h-52 rounded-card" />
    </div>
  );
}
