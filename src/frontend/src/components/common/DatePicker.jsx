export default function DatePicker({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>}
      <input
        type="date"
        className={`w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition ${error ? 'border-rose-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}