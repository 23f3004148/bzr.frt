import React from 'react';

interface Props {
  listTab: 'UPCOMING' | 'HISTORY';
  setListTab: (tab: 'UPCOMING' | 'HISTORY') => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

const TabsAndFilters: React.FC<Props> = ({ listTab, setListTab, searchTerm, setSearchTerm }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="inline-flex bg-gray-800 p-1 rounded-lg border border-gray-700">
        <button
          onClick={() => setListTab('UPCOMING')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            listTab === 'UPCOMING' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setListTab('HISTORY')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            listTab === 'HISTORY' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          History
        </button>
      </div>
      <div className="flex-1 flex justify-end">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search interviews..."
          className="w-full sm:w-64 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default TabsAndFilters;
