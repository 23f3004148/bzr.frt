import React, { useMemo } from 'react';
import { SavedInterview } from '../../types';
import { Button } from '../Button';
import StatusBadge from './StatusBadge';
import { FiEdit2, FiTrash2, FiRefreshCw, FiClock } from 'react-icons/fi';

interface InterviewCardProps {
  schedule: SavedInterview;
  listTab: 'UPCOMING' | 'HISTORY';
  /**
   * Handler to edit the interview schedule. Only used on the upcoming tab.
   */
  onEdit: (schedule: SavedInterview) => void;
  /**
   * Handler to delete the interview schedule. Only used on the upcoming tab.
   */
  onDelete: (schedule: SavedInterview) => void;
  /**
   * Handler to launch the interview session. Only used on the upcoming tab.
   */
  onLaunch: (schedule: SavedInterview) => void;
  /**
   * Handler to reuse a past interview request. Only used on the history tab.
   */
  onReuse: (schedule: SavedInterview) => void;
}

/**
 * InterviewCard renders a single interview schedule as a card. It adapts
 * its appearance and actions based on whether the schedule is in the
 * upcoming or history tab. It displays key details like title, date,
 * duration, status, response style and a progress indicator for used
 * session time.
 */
const InterviewCard: React.FC<InterviewCardProps> = ({ schedule, listTab, onEdit, onDelete, onLaunch, onReuse }) => {
  // Determine if the interview has expired either because its scheduled
  // window has passed or because the session consumed its full duration.
  const isExpired = useMemo(() => {
    const usedSeconds = schedule.sessionSecondsUsed || 0;
    const durationSeconds = (schedule.durationMinutes || 60) * 60;
    if (durationSeconds > 0 && usedSeconds >= durationSeconds) {
      return true;
    }
    if (!schedule.scheduledAt) return false;
    const startTime = new Date(schedule.scheduledAt).getTime();
    const expiresAt = schedule.expiresAt ? new Date(schedule.expiresAt).getTime() : NaN;
    const endTime = Number.isFinite(expiresAt) ? expiresAt : startTime + durationSeconds * 1000;
    return Date.now() > endTime;
  }, [schedule]);

  // Compute progress of session consumption for a small visual indicator.
  const progress = useMemo(() => {
    const usedSeconds = schedule.sessionSecondsUsed || 0;
    const durationSeconds = (schedule.durationMinutes || 60) * 60;
    return durationSeconds > 0 ? Math.min(usedSeconds / durationSeconds, 1) : 0;
  }, [schedule]);

  // Compute a human readable time until start (for upcoming approved)
  const timeUntilStart = useMemo(() => {
    if (!schedule.scheduledAt) return '';
    const now = Date.now();
    const target = new Date(schedule.scheduledAt).getTime();
    const diffMs = target - now;
    if (diffMs <= 0) return '';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [schedule]);

  return (
    <div
      className={`glass-panel p-6 rounded-xl border border-gray-700 transition-all flex flex-col relative overflow-hidden ${
        listTab === 'HISTORY' || isExpired ? 'opacity-75 grayscale-[20%]' : 'hover:border-blue-500/50'
      }`}
    >
      {/* Action buttons for upcoming schedules (edit/delete) */}
      {listTab === 'UPCOMING' && !isExpired && (
        <div className="absolute top-0 right-0 p-4 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(schedule);
            }}
            className="text-blue-400 hover:text-blue-300 p-2 bg-gray-900/80 rounded-full hover:bg-gray-800 transition-colors"
            title="Edit Request"
            aria-label="Edit interview"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(schedule);
            }}
            className="text-red-400 hover:text-red-300 p-2 bg-gray-900/80 rounded-full hover:bg-gray-800 transition-colors"
            title="Delete Request"
            aria-label="Delete interview"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-4 pr-16">
          <div className="flex justify-between items-start mb-2">
            <StatusBadge status={schedule.status || 'PENDING'} />
          </div>
          <h3 className="text-xl font-bold text-white mb-1 truncate">{schedule.title}</h3>
          <div className="text-xs text-gray-500 font-mono space-y-1">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {schedule.scheduledAt ? new Date(schedule.scheduledAt).toLocaleString() : 'No date'}
              {timeUntilStart && schedule.status === 'APPROVED' && !isExpired && (
                <span className="ml-2 text-blue-400">(in {timeUntilStart})</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-blue-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Duration: {schedule.durationMinutes || 60} mins
            </div>
          </div>
        </div>
      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center text-sm text-gray-400">
          <span className="w-24 shrink-0 text-gray-500">Style:</span>
          <span className="truncate text-blue-300">{schedule.responseStyle}</span>
        </div>
        <div className="text-xs text-gray-500 mt-2 bg-gray-800/50 p-2 rounded truncate">
          JD: {schedule.jobDescription.substring(0, 60)}{schedule.jobDescription.length > 60 ? '...' : ''}
        </div>
      </div>
      {/* Progress indicator for used session time */}
      {schedule.sessionSecondsUsed && schedule.durationMinutes && (
        <div className="mt-1 mb-4">
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Used {Math.floor((schedule.sessionSecondsUsed || 0) / 60)}min of {schedule.durationMinutes}min
          </p>
        </div>
      )}
      {/* Footer actions depending on tab */}
      {listTab === 'UPCOMING' ? (
        <>
          {schedule.status === 'APPROVED' && !isExpired ? (
            <Button onClick={() => onLaunch(schedule)} fullWidth className="mt-auto">
              Launch Session
            </Button>
          ) : (
            <Button
              disabled
              fullWidth
              className="mt-auto bg-gray-800 text-white cursor-not-allowed border-gray-700"
            >
              {schedule.status === 'REJECTED'
                ? 'Request Rejected'
                : schedule.status === 'IN_PROGRESS'
                ? 'In Progress'
                : schedule.status === 'COMPLETED'
                ? 'Completed'
                : isExpired
                ? 'Expired'
                : 'Waiting Approval'}
            </Button>
          )}
        </>
      ) : (
        <div className="mt-auto space-y-2">
          <Button
            variant="secondary"
            type="button"
            className="w-full py-2 text-xs uppercase tracking-wide"
            onClick={() => onReuse(schedule)}
          >
            Reuse Request
          </Button>
          <div className="text-center text-sm text-gray-500 italic py-2 border-t border-gray-700">
            {schedule.status === 'REJECTED' ? 'Rejected' : 'Completed / Expired'}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCard;
