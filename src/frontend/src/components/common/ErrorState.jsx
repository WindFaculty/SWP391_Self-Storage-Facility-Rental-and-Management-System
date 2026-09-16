export default function ErrorState({ message = 'Đã xảy ra lỗi!', onRetry }) {
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between">
      <span>⚠️ {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 transition cursor-pointer">
          Thử lại
        </button>
      )}
    </div>
  );
}