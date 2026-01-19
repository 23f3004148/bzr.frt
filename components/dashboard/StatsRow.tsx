import React from 'react';

interface Stats {
  upcoming: number;
  pending: number;
  approved: number;
  completed: number;
}

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex-1 min-w-[140px] bg-gray-800 border border-gray-700 rounded-xl p-4">
    <div className="text-sm text-gray-400">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

const StatsRow: React.FC<{ stats: Stats }> = ({ stats }) => {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="Upcoming" value={stats.upcoming} />
      <StatCard label="Pending" value={stats.pending} />
      <StatCard label="Approved" value={stats.approved} />
      <StatCard label="Completed" value={stats.completed} />
    </div>
  );
};

export default StatsRow;
