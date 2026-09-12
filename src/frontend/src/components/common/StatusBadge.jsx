import React from 'react';

export const StatusBadge = ({ status, type = 'status', className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Roles
      case 'SYSTEM_ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'BUSINESS_OPERATIONS_MANAGER':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      case 'FACILITY_MANAGER':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
      case 'FACILITY_STAFF':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'CUSTOMER':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';

      // General Statuses
      case 'ACTIVE':
      case 'AVAILABLE':
      case 'SUCCESS':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'OCCUPIED':
      case 'RENTED':
      case 'PENDING':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'MAINTENANCE':
      case 'SUSPENDED':
      case 'FAILED':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {formatText(status)}
    </span>
  );
};
