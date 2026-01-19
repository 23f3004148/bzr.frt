import React from 'react';

const colorMap: Record<string, string> = {
  PENDING: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  APPROVED: 'bg-green-900/50 text-green-300 border-green-700',
  REJECTED: 'bg-red-900/50 text-red-300 border-red-700',
  COMPLETED: 'bg-blue-900/50 text-blue-200 border-blue-700',
  EXPIRED: 'bg-slate-900/50 text-slate-300 border-slate-700',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const klass = colorMap[status] || 'bg-gray-800 text-gray-200 border-gray-700';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold uppercase ${klass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
