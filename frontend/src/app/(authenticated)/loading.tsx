export default function AuthenticatedLoading() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="h-10 w-1/3 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
