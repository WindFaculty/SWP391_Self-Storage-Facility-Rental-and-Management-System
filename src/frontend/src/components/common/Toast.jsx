export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={`border px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${styles[type] || styles.info}`}>
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer">&times;</button>
        )}
      </div>
    </div>
  );
}