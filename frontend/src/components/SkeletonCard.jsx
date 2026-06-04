export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="h-0.5 w-full shimmer" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded shimmer" />
              <div className="h-3 w-16 rounded shimmer" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="h-5 w-20 rounded shimmer" />
            <div className="h-3 w-12 rounded shimmer ml-auto" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl p-3" style={{ background: "var(--surface)" }}>
              <div className="h-3 w-12 rounded shimmer mx-auto mb-2" />
              <div className="h-4 w-16 rounded shimmer mx-auto" />
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)" }}>
          <div className="h-3 w-full rounded shimmer" />
          <div className="h-3 w-4/5 rounded shimmer" />
          <div className="h-3 w-3/5 rounded shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full shimmer" />
          <div className="h-6 w-16 rounded-full shimmer" />
          <div className="h-6 w-18 rounded-full shimmer" />
        </div>
      </div>
    </div>
  )
}
