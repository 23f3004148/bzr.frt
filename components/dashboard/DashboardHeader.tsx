import React from 'react';
import { Button } from '../Button';

interface DashboardHeaderProps {
  currentUsername: string;
  onJoin: () => void;
  onCreate: () => void;
  onLogout: () => void;
  onBack?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentUsername,
  onJoin,
  onCreate,
  onLogout,
  onBack
}) => {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-gray-800 text-gray-300 hover:text-white"
            title="Back"
          >
            ←
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold">My Interviews</h2>
          <p className="text-sm text-gray-400">Welcome, <span className="text-blue-300">{currentUsername}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onJoin}>Join Mentor Meeting</Button>
        <Button onClick={onCreate}>Create New</Button>
        <Button variant="danger" onClick={onLogout}>Logout</Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
