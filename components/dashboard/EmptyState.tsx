import React from 'react';
import { Button } from '../Button';

interface EmptyStateProps {
  /**
   * Whether the current tab is UPCOMING or HISTORY. This is used to adjust
   * the messaging and whether a call to action is displayed.
   */
  listTab: 'UPCOMING' | 'HISTORY';
  /**
   * Handler fired when the user clicks the primary action to create a new
   * interview request. Only shown when in the UPCOMING tab.
   */
  onCreate: () => void;
}

/**
 * EmptyState displays a friendly placeholder when there are no interviews to
 * show in the current tab. It encourages the user to take the next step.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ listTab, onCreate }) => {
  const isUpcoming = listTab === 'UPCOMING';
  return (
    <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-700">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-600">
        {/* Clock icon for upcoming, archive icon for history */}
        {isUpcoming ? (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2M10 11v6m4-6v6"
            />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        No {isUpcoming ? 'Upcoming' : 'Past'} Interviews
      </h3>
      <p className="text-gray-400 mb-8 max-w-md">
        {isUpcoming
          ? 'Schedule a new interview to get started. Approved interviews will appear here.'
          : 'Completed and rejected interviews will appear here after their scheduled duration has passed.'}
      </p>
      {isUpcoming && (
        <Button onClick={onCreate} variant="secondary">
          Create Request
        </Button>
      )}
    </div>
  );
};

export default EmptyState;