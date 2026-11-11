const WeatherSkeleton = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6">
        <div className="h-4 w-48 bg-white/20 rounded mb-4" />
        <div className="h-16 w-32 bg-white/20 rounded mb-2" />
        <div className="h-4 w-64 bg-white/20 rounded" />
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
            <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
};

export default WeatherSkeleton;
