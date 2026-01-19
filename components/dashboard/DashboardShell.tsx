import React from 'react';

interface DashboardShellProps {
  children: React.ReactNode;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-6xl space-y-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardShell;
