import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'Không có dữ liệu hiển thị',
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-950/60">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center">
                <LoadingSpinner size="md" text="Đang tải dữ liệu..." />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-slate-800/30 transition-colors duration-150"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-5 py-3.5 text-slate-300">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
