export default function GlobalNotFound() {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">ページが見つかりません</h2>
          <p className="text-gray-600 mb-6">
            お探しのページは存在しないか、移動された可能性があります。
          </p>
          <a
            href="/ja/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ダッシュボードに戻る
          </a>
        </div>
      </body>
    </html>
  );
}