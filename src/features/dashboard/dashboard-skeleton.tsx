export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* ヘッダースケルトン */}
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

      {/* お知らせカードスケルトン */}
      <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />

      {/* KPIカードスケルトン（4列） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* チャートスケルトン（2列） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
