export default function AdminLoading() {
  return (
    <div>
      <div className="h-3 w-20 animate-pulse bg-line/70" />
      <div className="mt-4 h-9 w-48 animate-pulse bg-line/70" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="h-12 animate-pulse border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
