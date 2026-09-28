export function SpotCardSkeleton() {
  return (
    <div className="card-flat overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-5 w-1/3 rounded mt-3" />
      </div>
    </div>
  );
}

export function SpotGridSkeleton({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SpotCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="card flex items-center justify-between">
      <div className="space-y-2">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card space-y-2">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-7 w-16 rounded" />
    </div>
  );
}
