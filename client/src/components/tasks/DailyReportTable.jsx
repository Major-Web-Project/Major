import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { useTasks } from '../../contexts/TasksContext';
import { utcToLocalDateString } from '../../utils/dateUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CategoryTaskCards } from './CategoryTaskCards';
import { TaskSubmitButton } from './TaskSubmitButton';
import AnimatedTitle from '../ui/AnimatedTitle.jsx';

const SPOTLIGHT_TEXT = 'Daily Tasks';

export const DailyReportTable = ({ onTaskCreated, selectedDate, onDateSelect }) => {
  const { createTask, getTasksByDate, refreshTasks, viewTaskSubmission } = useTasks();
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [submissionTask, setSubmissionTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCategoryView, setShowCategoryView] = useState(false);


  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    status: 'pending',
    priority: 'medium',
    notes: '',
    estimatedTime: '',
    type: 'assignment',
  });

  // Typewriter animation state
  const container = useRef();
  const [typed, setTyped] = useState('');
  const [spotlightPos, setSpotlightPos] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // IntersectionObserver to trigger and reset typewriter
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false);
          setTyped('');
          setIsDone(false);
          setSpotlightPos(0);
        }
      },
      { threshold: 0.3 }
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!isInView) return;
    if (typed.length < SPOTLIGHT_TEXT.length) {
      const timeout = setTimeout(() => {
        setTyped(SPOTLIGHT_TEXT.slice(0, typed.length + 1));
        setSpotlightPos(typed.length + 1);
      }, 60);
      return () => clearTimeout(timeout);
    } else if (typed.length === SPOTLIGHT_TEXT.length) {
      setIsDone(true);
    }
  }, [typed, isInView]);

  // Fetch tasks for selected date
  useEffect(() => {
    const fetchTasksForDate = async () => {
      if (!selectedDate) return;

      try {
        const tasks = await getTasksByDate(selectedDate);
        setTasksForSelectedDate(tasks);
      } catch (error) {
        console.error('Error fetching tasks for date:', error);
        setTasksForSelectedDate([]);
      }
    };

    fetchTasksForDate();
  }, [selectedDate, getTasksByDate]);





  // Helper functions
  const formatLocalDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-yellow-100/80 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30';
      case 'pending':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-100/80 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  };





  // Event handlers
  const handleAddTask = async () => {
    if (!newTaskForm.name?.trim()) return;

    const newTaskData = {
      name: newTaskForm.name,
      status: newTaskForm.status,
      priority: newTaskForm.priority,
      notes: newTaskForm.notes || '',
      estimatedTime: newTaskForm.estimatedTime,
      completionTime: newTaskForm.status === 'completed' ? new Date().toLocaleTimeString() : undefined,
      type: newTaskForm.type,
    };

    try {
      await createTask({ data: newTaskData }, selectedDate);

      // Refresh tasks for the selected date
      const updatedTasks = await getTasksByDate(selectedDate);
      setTasksForSelectedDate(updatedTasks);

      setNewTaskForm({
        name: '',
        status: 'pending',
        priority: 'medium',
        notes: '',
        estimatedTime: '',
        type: 'assignment',
      });
      setShowAddTask(false);

      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      alert('Failed to create task. Please try again.');
      console.error(error);
    }
  };



  // Handle task submission completion - refresh the date-specific tasks
  const handleTaskSubmissionComplete = async () => {
    try {
      const updatedTasks = await getTasksByDate(selectedDate);
      setTasksForSelectedDate(updatedTasks);
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error('Failed to refresh tasks after submission:', error);
    }
  };

  // Handle viewing task submission
  const handleViewSubmission = async (taskId) => {
    try {
      console.log('[DailyReportTable] Viewing submission for task:', taskId);
      await viewTaskSubmission(taskId);
    } catch (error) {
      console.error('[DailyReportTable] Failed to view submission:', error);
      alert(`Unable to view submission: ${error.message}`);
    }
  };

  // Spotlight mask style
  const charWidth = 22;
  const spotlightX = 32 + (spotlightPos - 1) * charWidth;
  const maskStyle = !isDone ? {
    WebkitMaskImage: `radial-gradient(circle 38px at ${spotlightX}px 50%, white 80%, transparent 100%)`,
    maskImage: `radial-gradient(circle 38px at ${spotlightX}px 50%, white 80%, transparent 100%)`,
    transition: 'WebkitMaskImage 0.1s, maskImage 0.1s',
  } : {};

  return (
    <div ref={container} className="w-full bg-mint-100 rounded-2xl p-4 sm:p-6 border border-mint-200 dark:bg-gradient-to-br dark:from-gray-900/50 dark:to-gray-800/50 dark:border-white/10 relative">
      {/* Header with Date Picker and Add Task Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <AnimatedTitle 
          text={SPOTLIGHT_TEXT}
          fontSize="48px"
          fontWeight="900"
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCategoryView(false)}
              className={!showCategoryView
                ? 'px-6 py-3 rounded-xl font-bold shadow-lg transition-colors duration-200'
                : 'px-6 py-3 rounded-xl hover:bg-white/10 transition-colors duration-200'
              }
              style={!showCategoryView
                ? { backgroundColor: 'white', color: 'black' }
                : { backgroundColor: 'transparent', color: 'white' }
              }
            >
              📋 List
            </Button>
            <Button
              onClick={() => setShowCategoryView(true)}
              className={showCategoryView
                ? 'px-6 py-3 rounded-xl font-bold shadow-lg transition-colors duration-200'
                : 'px-6 py-3 rounded-xl hover:bg-white/10 transition-colors duration-200'
              }
              style={showCategoryView
                ? { backgroundColor: 'white', color: 'black' }
                : { backgroundColor: 'transparent', color: 'white' }
              }
            >
              📂 Categories
            </Button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <DatePicker
              selected={selectedDate}
              onChange={async (date) => {
                if (onDateSelect) {
                  onDateSelect(date);
                  const tasks = await getTasksByDate(date);
                  setTasksForSelectedDate(tasks);
                }
              }}
              maxDate={new Date()}
              dateFormat="MMM d, yyyy"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              calendarClassName="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
              popperPlacement="bottom-end"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>

          {/* Add Task Button */}
          {isToday() && (
            <Button
              onClick={() => setShowAddTask(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-lg transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-lg">➕</span>
              <span className="hidden sm:inline">Add Task</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category View */}
      {showCategoryView ? (
        <CategoryTaskCards
          tasks={tasksForSelectedDate}
          onTaskClick={handleTaskClick}
        />
      ) : (
        <>
          {/* Add Task Form */}
          {showAddTask && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 animate-fadeIn">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">✨</span>
                Add New Task
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-indigo-700 text-sm mb-2 dark:text-gray-300" htmlFor="add-task-name">
                    Task Name
                  </label>
                  <input
                    id="add-task-name"
                    type="text"
                    value={newTaskForm.name}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, name: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-black placeholder-sky-600"
                    placeholder="Enter task name..."
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-indigo-700 text-sm mb-2 dark:text-gray-300" htmlFor="add-task-estimated-time">
                    Estimated Time
                  </label>
                  <input
                    id="add-task-estimated-time"
                    type="text"
                    value={newTaskForm.estimatedTime}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, estimatedTime: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-black placeholder-sky-600"
                    placeholder="e.g., 2 hours"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-indigo-700 text-sm mb-2 dark:text-gray-300">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-black"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-indigo-700 text-sm mb-2 dark:text-gray-300">Status</label>
                  <select
                    value={newTaskForm.status}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, status: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-black"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-indigo-700 text-sm mb-2 dark:text-gray-300">Type</label>
                  <select
                    value={newTaskForm.type}
                    onChange={e => setNewTaskForm({ ...newTaskForm, type: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-black"
                  >
                    <option value="assignment">📕 Assignment</option>
                    <option value="selfStudy">📗 Self Study</option>
                    <option value="lecture">📘 Lecture</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-indigo-700 text-sm mb-2 dark:text-gray-300">Notes</label>
                  <textarea
                    value={newTaskForm.notes}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-black placeholder-sky-600 h-20"
                    placeholder="Add any notes or details..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleAddTask}
                  disabled={!newTaskForm.name?.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  Create Task
                </Button>
                <Button
                  onClick={() => setShowAddTask(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tasks Table */}
          <div className="space-y-4 overflow-x-auto">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="col-span-4 text-indigo-700 font-semibold text-sm dark:text-white">Task Name</div>
              <div className="col-span-2 text-indigo-700 font-semibold text-sm dark:text-white">Status</div>
              <div className="col-span-2 text-indigo-700 font-semibold text-sm dark:text-white">Priority</div>
              <div className="col-span-2 text-indigo-700 font-semibold text-sm dark:text-white">Time</div>
              <div className="col-span-2 text-indigo-700 font-semibold text-sm dark:text-white">Actions</div>
            </div>

            {/* Task Rows */}
            {(tasksForSelectedDate || []).map((task, index) => (
              <div key={task.id} className="space-y-2">
                {/* Desktop Layout */}
                <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                  {/* Task Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-indigo-700 font-medium dark:text-white">{task.name}</div>
                      <div className="text-sky-700 text-xs mt-1 dark:text-white">ID: {task.id}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      <span>{getStatusIcon(task.status)}</span>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      <span>{getPriorityIcon(task.priority)}</span>
                      {task.priority}
                    </span>
                  </div>

                  {/* Completion Time */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-indigo-700 text-sm dark:text-white">
                      {task.completionTime || task.estimatedTime || 'N/A'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Button
                      onClick={() => {
                        setExpandedTask(expandedTask === task.id ? null : task.id);
                        setSubmissionTask(null); // Reset submission mode when toggling details
                      }}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-indigo-700 dark:text-white text-xs rounded-lg transition-all duration-300"
                    >
                      {expandedTask === task.id ? 'Hide' : 'Details'}
                    </Button>
                    <Button
                      onClick={() => {
                        if (task.status === 'completed' && task.submissionFile) {
                          // Handle view submission
                          handleViewSubmission(task.id);
                          return;
                        }
                        // Expand task and set to submission mode
                        setExpandedTask(task.id);
                        setSubmissionTask(task.id);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      {task.status === 'completed' && task.submissionFile ? '👁️ View' : '🚀 Submit'}
                    </Button>
                  </div>
                </div>

                {/* Mobile/Tablet Layout */}
                <div className="lg:hidden bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 p-4">
                  {/* Task Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-indigo-700 font-medium dark:text-white truncate">{task.name}</div>
                        <div className="text-sky-700 text-xs dark:text-white">ID: {task.id}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Priority Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      <span>{getStatusIcon(task.status)}</span>
                      <span className="hidden sm:inline dark:text-white">{task.status.replace('-', ' ')}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      <span>{getPriorityIcon(task.priority)}</span>
                      <span className="hidden sm:inline dark:text-white">{task.priority}</span>
                    </span>
                    <span className="text-indigo-700 text-xs dark:text-white">
                      {task.completionTime || task.estimatedTime || 'N/A'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      onClick={() => {
                        setExpandedTask(expandedTask === task.id ? null : task.id);
                        setSubmissionTask(null); // Reset submission mode when toggling details
                      }}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-indigo-700 dark:text-white text-xs rounded-lg transition-all duration-300"
                    >
                      {expandedTask === task.id ? 'Hide' : 'Details'}
                    </Button>
                    <Button
                      onClick={() => {
                        if (task.status === 'completed' && task.submissionFile) {
                          // Handle view submission
                          handleViewSubmission(task.id);
                          return;
                        }
                        // Expand task and set to submission mode
                        setExpandedTask(task.id);
                        setSubmissionTask(task.id);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      {task.status === 'completed' && task.submissionFile ? '👁️ View' : '🚀 Submit'}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTask === task.id && (
                  <div className="ml-0 lg:ml-4 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 animate-fadeIn">
                    {/* Show Submission Form if in submission mode */}
                    {submissionTask === task.id ? (
                      <TaskSubmitButton
                        task={task}
                        expandedTask={expandedTask}
                        setExpandedTask={setExpandedTask}
                        showSubmissionForm={true}
                        onSubmissionComplete={handleTaskSubmissionComplete}
                      />
                    ) : (
                      /* Show Task Details */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-semibold">📋 Task Details</h4>
                          <Button
                            onClick={() => setSubmissionTask(task.id)}
                            className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs rounded-lg"
                          >
                            🚀 Submit Task
                          </Button>
                        </div>
                        
                        <div>
                          <h5 className="text-white font-semibold mb-2">📝 Notes:</h5>
                          <p className="text-sky-700 text-sm leading-relaxed bg-black/20 p-3 rounded-lg dark:text-white">
                            {task.notes || 'No notes available'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-cyan-400 font-semibold text-sm">Task ID</div>
                            <div className="text-indigo-700 text-sm truncate dark:text-white">{task.id}</div>
                          </div>
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-purple-400 font-semibold text-sm">Created</div>
                            <div className="text-indigo-700 text-sm dark:text-white">
                              {formatLocalDate(task.createdAt)}
                            </div>
                          </div>
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-pink-400 font-semibold text-sm">Duration</div>
                            <div className="text-indigo-700 text-sm dark:text-white">
                              {task.completionTime || task.estimatedTime || 'Not set'}
                            </div>
                          </div>
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-green-400 font-semibold text-sm">Progress</div>
                            <div className="text-indigo-700 text-sm dark:text-white">
                              {task.status === 'completed' ? '100%' : task.status === 'in-progress' ? '50%' : '0%'}
                            </div>
                          </div>
                        </div>

                        {/* Submission Info for completed tasks */}
                        {task.status === 'completed' && task.submissionType && (
                          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                            <h5 className="text-green-400 font-semibold mb-2">✅ Submission Details</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-green-300 text-sm">Type</div>
                                <div className="text-white text-sm font-medium">{task.submissionType}</div>
                              </div>
                              <div>
                                <div className="text-green-300 text-sm">Time Spent</div>
                                <div className="text-white text-sm font-medium">{task.timeSpent || 'N/A'}</div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleViewSubmission(task.id)}
                              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg"
                            >
                              📄 View Submission
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}


              </div>
            ))}

            {/* Empty State */}
            {(tasksForSelectedDate || []).length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-sky-600 text-lg dark:text-gray-400">No tasks for this date</div>
                {isToday() && (
                  <Button
                    onClick={() => setShowAddTask(true)}
                    className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    Add Your First Task
                  </Button>
                )}
              </div>
            )}

            {/* Enhanced Summary Stats */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 sm:p-4 rounded-xl border border-green-500/30">
                <div className="text-green-400 font-semibold text-sm">Completed</div>
                <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">
                  {(tasksForSelectedDate || []).filter((t) => t.status === 'completed').length}
                </div>
                <div className="text-green-300 text-xs">
                  {Math.round(((tasksForSelectedDate || []).filter((t) => t.status === 'completed').length / Math.max((tasksForSelectedDate || []).length, 1)) * 100)}% done
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 sm:p-4 rounded-xl border border-yellow-500/30">
                <div className="text-yellow-400 font-semibold text-sm">In Progress</div>
                <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">
                  {(tasksForSelectedDate || []).filter((t) => t.status === 'in-progress').length}
                </div>
                <div className="text-yellow-300 text-xs">Active tasks</div>
              </div>
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 p-3 sm:p-4 rounded-xl border border-red-500/30">
                <div className="text-red-400 font-semibold text-sm">Pending</div>
                <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">
                  {(tasksForSelectedDate || []).filter((t) => t.status === 'pending').length}
                </div>
                <div className="text-red-300 text-xs">Awaiting start</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 p-3 sm:p-4 rounded-xl border border-purple-500/30">
                <div className="text-purple-400 font-semibold text-sm">Total</div>
                <div className="text-indigo-700 text-xl sm:text-2xl font-bold dark:text-white">
                  {(tasksForSelectedDate || []).length}
                </div>
                <div className="text-purple-300 text-xs">All tasks</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};