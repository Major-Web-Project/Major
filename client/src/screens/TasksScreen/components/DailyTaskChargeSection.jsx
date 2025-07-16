import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button'; // Assuming Button component exists
import { apiService } from '../../../services/api'; // Assuming apiService exists

export const DailyTaskChargeSection = ({ selectedDate }) => {
  // State for tasks, loading, error, and expanded task view
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  // --- FIX: New helper function to format UTC dates to local time (IST) ---
  const formatToLocalTime = (utcDateString) => {
    if (!utcDateString) return null;
    const date = new Date(utcDateString);
    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) return null;
    // Use 'en-IN' for Indian time format
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // This effect hook handles all data fetching and is triggered only when the selected date changes.
  useEffect(() => {
    if (!selectedDate) return;

    // Use an AbortController to cancel previous fetch requests if the date changes quickly.
    const controller = new AbortController();

    const fetchTasksForDate = async () => {
      setLoading(true);
      setError(null);
      setTasks([]); // Clear previous tasks to prevent showing stale data

      // --- FIX: Create a timezone-safe date string (YYYY-MM-DD) ---
      // This ensures the date sent to the backend matches the local calendar date.
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const selectedDateString = `${year}-${month}-${day}`;

      try {
        const response = await apiService.getTasksByDate(selectedDateString, controller.signal);
        const tasksForDate = Array.isArray(response.data) ? response.data : [];
        setTasks(tasksForDate);
      } catch (err) {
        // Ignore errors from intentionally canceled requests
        if (err.name !== 'CanceledError') {
          setError('Failed to fetch tasks. Please try again.');
          console.error('Failed to fetch tasks:', err);
        }
      } finally {
        // Ensure loading is only set to false if the request wasn't canceled
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTasksForDate();

    // Cleanup function: This runs when the date changes, canceling the old request.
    return () => {
      controller.abort();
    };
  }, [selectedDate]); // This effect depends only on selectedDate

  // --- Style and Icon Helper Functions (No changes needed here) ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress': return 'bg-yellow-100/80 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30';
      case 'pending': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-100/80 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="w-full bg-mint-100 rounded-2xl p-4 sm:p-6 border border-mint-200 dark:bg-gradient-to-br dark:from-gray-900/50 dark:to-gray-800/50 dark:border-white/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-indigo-700 flex items-center gap-2 dark:text-white">
          <span className="text-2xl">📋</span>
          Daily Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
      </div>

      <div className="space-y-4 overflow-x-auto">
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="col-span-5 text-indigo-700 font-semibold text-sm dark:text-white">Task Name</div>
          <div className="col-span-2 text-indigo-700 font-semibold text-sm dark:text-white">Status</div>
          <div className="col-span-2 text-indigo-700 font-semibold text-sm dark:text-white">Priority</div>
          <div className="col-span-2 text-indigo-700 font-semibold text-sm dark:text-white">Time</div>
          <div className="col-span-1 text-indigo-700 font-semibold text-sm dark:text-white text-right">Actions</div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-cyan-400">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></span>
            <p className="mt-2">Loading Tasks...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 bg-red-500/10 rounded-lg">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤷</div>
            <div className="text-sky-600 text-lg dark:text-gray-400">No tasks found for this date.</div>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div key={task.id || index} className="space-y-2">
              <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 items-center">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">{index + 1}</div>
                  <div>
                    <div className="text-indigo-700 font-medium dark:text-white">{task.name || 'N/A'}</div>
                    <div className="text-sky-700 text-xs mt-1 dark:text-white">ID: {task.id}</div>
                  </div>
                </div>
                <div className="col-span-2"><span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}><span>{getStatusIcon(task.status)}</span>{(task.status && typeof task.status === 'string') ? task.status.replace('-', ' ') : 'N/A'}</span></div>
                <div className="col-span-2"><span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}><span>{getPriorityIcon(task.priority)}</span>{task.priority || 'N/A'}</span></div>
                <div className="col-span-2"><span className="text-indigo-700 text-sm dark:text-white">{formatToLocalTime(task.completionTime) || task.estimatedTime || 'N/A'}</span></div>
                <div className="col-span-1 flex items-center justify-end">
                  <Button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-indigo-700 dark:text-white text-xs rounded-lg transition-all">
                    {expandedTask === task.id ? 'Hide' : 'Details'}
                  </Button>
                </div>
              </div>

              <div className="lg:hidden bg-white/10 rounded-xl border border-white/20 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-indigo-700 font-medium dark:text-white truncate">{task.name || 'N/A'}</div>
                      <div className="text-sky-700 text-xs dark:text-white">ID: {task.id}</div>
                    </div>
                  </div>
                  <Button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-indigo-700 dark:text-white text-xs rounded-lg transition-all">
                    {expandedTask === task.id ? 'Hide' : 'Details'}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}><span>{getStatusIcon(task.status)}</span><span className="dark:text-white">{(task.status && typeof task.status === 'string') ? task.status.replace('-', ' ') : 'N/A'}</span></span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}><span>{getPriorityIcon(task.priority)}</span><span className="dark:text-white">{task.priority || 'N/A'}</span></span>
                  <span className="text-indigo-700 text-xs dark:text-white">{formatToLocalTime(task.completionTime) || task.estimatedTime || 'N/A'}</span>
                </div>
              </div>

              {expandedTask === task.id && (
                <div className="ml-0 lg:ml-4 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 animate-fadeIn">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-white font-semibold mb-2">📝 Notes:</h4>
                      <p className="text-sky-700 text-sm leading-relaxed bg-black/20 p-3 rounded-lg dark:text-white">{task.notes || 'No notes available'}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/10 p-3 rounded-lg"><div className="text-cyan-400 font-semibold text-sm">Task ID</div><div className="text-indigo-700 text-sm truncate dark:text-white">{task.id}</div></div>
                      <div className="bg-white/10 p-3 rounded-lg"><div className="text-purple-400 font-semibold text-sm">Created</div><div className="text-indigo-700 text-sm dark:text-white">{new Date(task.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div></div>
                      <div className="bg-white/10 p-3 rounded-lg"><div className="text-pink-400 font-semibold text-sm">Duration</div><div className="text-indigo-700 text-sm dark:text-white">{task.estimatedTime || 'Not set'}</div></div>
                      <div className="bg-white/10 p-3 rounded-lg"><div className="text-green-400 font-semibold text-sm">Completed At</div><div className="text-indigo-700 text-sm dark:text-white">{formatToLocalTime(task.completionTime) || 'N/A'}</div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 sm:p-4 rounded-xl border border-green-500/30">
            <div className="text-green-400 font-semibold text-sm">Completed</div>
            <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">{tasks.filter((t) => t.status === 'completed').length}</div>
            <div className="text-mint-700 text-xs dark:text-green-300">{Math.round((tasks.filter((t) => t.status === 'completed').length / (tasks.length || 1)) * 100)}% done</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 sm:p-4 rounded-xl border border-yellow-500/30">
            <div className="text-yellow-700 font-semibold text-sm dark:text-yellow-400">In Progress</div>
            <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">{tasks.filter((t) => t.status === 'in-progress').length}</div>
            <div className="text-yellow-700 text-xs dark:text-yellow-300">Active tasks</div>
          </div>
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 p-3 sm:p-4 rounded-xl border border-red-500/30">
            <div className="text-red-400 font-semibold text-sm">Pending</div>
            <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">{tasks.filter((t) => t.status === 'pending').length}</div>
            <div className="text-pink-700 text-xs dark:text-red-300">Waiting to start</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 sm:p-4 rounded-xl border border-purple-500/30">
            <div className="text-purple-400 font-semibold text-sm">Total Tasks</div>
            <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">{tasks.length}</div>
            <div className="text-purple-700 text-xs dark:text-purple-300">{tasks.filter((t) => t.priority === 'high').length} high priority</div>
          </div>
        </div>
      )}
    </div>
  );
};
