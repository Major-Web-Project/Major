import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';

export const DailyReportTable = ({ data: initialData }) => {
  const [data, setData] = useState(initialData);
  const [selectedDate, setSelectedDate] = useState(0);
  const [expandedTask, setExpandedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    status: 'pending',
    priority: 'medium',
    notes: '',
    estimatedTime: '',
  });

  const currentReport = data[selectedDate];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
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
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task.id);
    setEditForm(task);
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;

    const updatedData = [...data];
    const reportIndex = selectedDate;
    const taskIndex = updatedData[reportIndex].tasks.findIndex(
      (t) => t.id === editingTask
    );

    if (taskIndex !== -1) {
      updatedData[reportIndex].tasks[taskIndex] = {
        ...updatedData[reportIndex].tasks[taskIndex],
        ...editForm,
        completionTime:
          editForm.status === 'completed'
            ? new Date().toLocaleTimeString()
            : undefined,
      };
      setData(updatedData);
    }

    setEditingTask(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({});
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const updatedData = [...data];
      updatedData[selectedDate].tasks = updatedData[selectedDate].tasks.filter(
        (t) => t.id !== taskId
      );
      setData(updatedData);
    }
  };

  const handleAddTask = () => {
    if (!newTaskForm.name?.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      name: newTaskForm.name,
      status: newTaskForm.status,
      priority: newTaskForm.priority,
      notes: newTaskForm.notes || '',
      createdAt: new Date().toISOString(),
      estimatedTime: newTaskForm.estimatedTime,
    };

    const updatedData = [...data];
    updatedData[selectedDate].tasks.push(newTask);
    setData(updatedData);

    // Reset form
    setNewTaskForm({
      name: '',
      status: 'pending',
      priority: 'medium',
      notes: '',
      estimatedTime: '',
    });
    setShowAddTask(false);
  };

  const handleStatusChange = (taskId, newStatus) => {
    const updatedData = [...data];
    const reportIndex = selectedDate;
    const taskIndex = updatedData[reportIndex].tasks.findIndex(
      (t) => t.id === taskId
    );

    if (taskIndex !== -1) {
      updatedData[reportIndex].tasks[taskIndex] = {
        ...updatedData[reportIndex].tasks[taskIndex],
        status: newStatus,
        completionTime:
          newStatus === 'completed'
            ? new Date().toLocaleTimeString()
            : undefined,
      };
      setData(updatedData);
    }
  };

  const handlePriorityChange = (taskId, newPriority) => {
    const updatedData = [...data];
    const reportIndex = selectedDate;
    const taskIndex = updatedData[reportIndex].tasks.findIndex(
      (t) => t.id === taskId
    );

    if (taskIndex !== -1) {
      updatedData[reportIndex].tasks[taskIndex] = {
        ...updatedData[reportIndex].tasks[taskIndex],
        priority: newPriority,
      };
      setData(updatedData);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-white/10">
      {/* Header with Date Selector and Add Task Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Daily Tasks
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* Date Selector */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {data.map((report, index) => (
              <Button
                key={index}
                onClick={() => setSelectedDate(index)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  selectedDate === index
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {new Date(report.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Button>
            ))}
          </div>

          {/* Add Task Button */}
          <Button
            onClick={() => setShowAddTask(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-lg transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">➕</span>
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 animate-fadeIn">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">✨</span>
            Add New Task
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Task Name
              </label>
              <input
                type="text"
                value={newTaskForm.name}
                onChange={(e) =>
                  setNewTaskForm({ ...newTaskForm, name: e.target.value })
                }
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                placeholder="Enter task name..."
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Estimated Time
              </label>
              <input
                type="text"
                value={newTaskForm.estimatedTime}
                onChange={(e) =>
                  setNewTaskForm({
                    ...newTaskForm,
                    estimatedTime: e.target.value,
                  })
                }
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                placeholder="e.g., 2 hours"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Priority
              </label>
              <select
                value={newTaskForm.priority}
                onChange={(e) =>
                  setNewTaskForm({ ...newTaskForm, priority: e.target.value })
                }
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Status</label>
              <select
                value={newTaskForm.status}
                onChange={(e) =>
                  setNewTaskForm({ ...newTaskForm, status: e.target.value })
                }
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-300 text-sm mb-2">Notes</label>
              <textarea
                value={newTaskForm.notes}
                onChange={(e) =>
                  setNewTaskForm({ ...newTaskForm, notes: e.target.value })
                }
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 h-20"
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
        {/* Desktop Table Header - Hidden on mobile */}
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="col-span-4 text-gray-300 font-semibold text-sm">
            Task Name
          </div>
          <div className="col-span-2 text-gray-300 font-semibold text-sm">
            Status
          </div>
          <div className="col-span-2 text-gray-300 font-semibold text-sm">
            Priority
          </div>
          <div className="col-span-2 text-gray-300 font-semibold text-sm">
            Time
          </div>
          <div className="col-span-2 text-gray-300 font-semibold text-sm">
            Actions
          </div>
        </div>

        {/* Task Rows */}
        {currentReport.tasks.map((task, index) => (
          <div key={task.id} className="space-y-2">
            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              {/* Task Name */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  {editingTask === task.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                    />
                  ) : (
                    <>
                      <div className="text-white font-medium">{task.name}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        ID: {task.id}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center">
                {editingTask === task.id ? (
                  <select
                    value={editForm.status || task.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        task.status
                      )}`}
                    >
                      <span>{getStatusIcon(task.status)}</span>
                      {task.status.replace('-', ' ')}
                    </span>
                    {/* Quick Status Change Buttons */}
                    <div className="flex gap-1">
                      {task.status !== 'completed' && (
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, 'completed')
                          }
                          className="w-6 h-6 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400 text-xs transition-all duration-300"
                          title="Mark as completed"
                        >
                          ✓
                        </button>
                      )}
                      {task.status !== 'in-progress' && (
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, 'in-progress')
                          }
                          className="w-6 h-6 bg-yellow-500/20 hover:bg-yellow-500/40 rounded text-yellow-400 text-xs transition-all duration-300"
                          title="Mark as in progress"
                        >
                          ⟳
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="col-span-2 flex items-center">
                {editingTask === task.id ? (
                  <select
                    value={editForm.priority || task.priority}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value })
                    }
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <span>{getPriorityIcon(task.priority)}</span>
                      {task.priority}
                    </span>
                    {/* Quick Priority Change */}
                    <div className="flex gap-1">
                      {task.priority !== 'high' && (
                        <button
                          onClick={() => handlePriorityChange(task.id, 'high')}
                          className="w-6 h-6 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 text-xs transition-all duration-300"
                          title="Set high priority"
                        >
                          ↑
                        </button>
                      )}
                      {task.priority !== 'low' && (
                        <button
                          onClick={() => handlePriorityChange(task.id, 'low')}
                          className="w-6 h-6 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400 text-xs transition-all duration-300"
                          title="Set low priority"
                        >
                          ↓
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Completion Time */}
              <div className="col-span-2 flex items-center">
                <span className="text-gray-300 text-sm">
                  {task.completionTime || task.estimatedTime || 'N/A'}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center gap-2">
                {editingTask === task.id ? (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() =>
                        setExpandedTask(
                          expandedTask === task.id ? null : task.id
                        )
                      }
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      {expandedTask === task.id ? 'Hide' : 'Details'}
                    </Button>
                    <Button
                      onClick={() => handleEditTask(task)}
                      className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      Delete
                    </Button>
                  </>
                )}
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
                    {editingTask === task.id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      />
                    ) : (
                      <>
                        <div className="text-white font-medium truncate">
                          {task.name}
                        </div>
                        <div className="text-gray-400 text-xs">
                          ID: {task.id}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Priority Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {editingTask === task.id ? (
                  <>
                    <select
                      value={editForm.status || task.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs flex-1 min-w-0"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="in-progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                    <select
                      value={editForm.priority || task.priority}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value })
                      }
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs flex-1 min-w-0"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </>
                ) : (
                  <>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        task.status
                      )}`}
                    >
                      <span>{getStatusIcon(task.status)}</span>
                      <span className="hidden sm:inline">
                        {task.status.replace('-', ' ')}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <span>{getPriorityIcon(task.priority)}</span>
                      <span className="hidden sm:inline">{task.priority}</span>
                    </span>
                    <span className="text-gray-300 text-xs">
                      {task.completionTime || task.estimatedTime || 'N/A'}
                    </span>
                  </>
                )}
              </div>

              {/* Quick Action Buttons */}
              {editingTask !== task.id && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400 text-xs transition-all duration-300 flex items-center gap-1"
                      title="Mark as completed"
                    >
                      ✓ <span className="hidden sm:inline">Complete</span>
                    </button>
                  )}
                  {task.status !== 'in-progress' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'in-progress')}
                      className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/40 rounded text-yellow-400 text-xs transition-all duration-300 flex items-center gap-1"
                      title="Mark as in progress"
                    >
                      ⟳ <span className="hidden sm:inline">Progress</span>
                    </button>
                  )}
                  {task.priority !== 'high' && (
                    <button
                      onClick={() => handlePriorityChange(task.id, 'high')}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 text-xs transition-all duration-300 flex items-center gap-1"
                      title="Set high priority"
                    >
                      ↑ <span className="hidden sm:inline">High</span>
                    </button>
                  )}
                  {task.priority !== 'low' && (
                    <button
                      onClick={() => handlePriorityChange(task.id, 'low')}
                      className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400 text-xs transition-all duration-300 flex items-center gap-1"
                      title="Set low priority"
                    >
                      ↓ <span className="hidden sm:inline">Low</span>
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {editingTask === task.id ? (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white text-xs rounded-lg transition-all duration-300 flex-1 min-w-0"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-all duration-300 flex-1 min-w-0"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() =>
                        setExpandedTask(
                          expandedTask === task.id ? null : task.id
                        )
                      }
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      {expandedTask === task.id ? 'Hide' : 'Details'}
                    </Button>
                    <Button
                      onClick={() => handleEditTask(task)}
                      className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white text-xs rounded-lg transition-all duration-300"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedTask === task.id && (
              <div className="ml-0 lg:ml-4 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 animate-fadeIn">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-white font-semibold mb-2">📝 Notes:</h4>
                    {editingTask === task.id ? (
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
                        }
                        className="w-full bg-white/10 border border-white/20 rounded p-3 text-white text-sm h-20"
                      />
                    ) : (
                      <p className="text-gray-300 text-sm leading-relaxed bg-black/20 p-3 rounded-lg">
                        {task.notes || 'No notes available'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-cyan-400 font-semibold text-sm">
                        Task ID
                      </div>
                      <div className="text-white text-sm truncate">
                        {task.id}
                      </div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-purple-400 font-semibold text-sm">
                        Created
                      </div>
                      <div className="text-white text-sm">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-pink-400 font-semibold text-sm">
                        Duration
                      </div>
                      <div className="text-white text-sm">
                        {task.completionTime || task.estimatedTime || 'Not set'}
                      </div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-green-400 font-semibold text-sm">
                        Progress
                      </div>
                      <div className="text-white text-sm">
                        {task.status === 'completed'
                          ? '100%'
                          : task.status === 'in-progress'
                          ? '50%'
                          : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {currentReport.tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-gray-400 text-lg">No tasks for this date</div>
            <Button
              onClick={() => setShowAddTask(true)}
              className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-6 py-3 rounded-lg transition-all duration-300"
            >
              Add Your First Task
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Summary Stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 sm:p-4 rounded-xl border border-green-500/30">
          <div className="text-green-400 font-semibold text-sm">Completed</div>
          <div className="text-white text-xl sm:text-2xl font-bold">
            {currentReport.tasks.filter((t) => t.status === 'completed').length}
          </div>
          <div className="text-green-300 text-xs">
            {Math.round(
              (currentReport.tasks.filter((t) => t.status === 'completed')
                .length /
                Math.max(currentReport.tasks.length, 1)) *
                100
            )}
            % done
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 sm:p-4 rounded-xl border border-yellow-500/30">
          <div className="text-yellow-400 font-semibold text-sm">
            In Progress
          </div>
          <div className="text-white text-xl sm:text-2xl font-bold">
            {
              currentReport.tasks.filter((t) => t.status === 'in-progress')
                .length
            }
          </div>
          <div className="text-yellow-300 text-xs">Active tasks</div>
        </div>
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 p-3 sm:p-4 rounded-xl border border-red-500/30">
          <div className="text-red-400 font-semibold text-sm">Pending</div>
          <div className="text-white text-xl sm:text-2xl font-bold">
            {currentReport.tasks.filter((t) => t.status === 'pending').length}
          </div>
          <div className="text-red-300 text-xs">Waiting to start</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 sm:p-4 rounded-xl border border-purple-500/30">
          <div className="text-purple-400 font-semibold text-sm">
            Total Tasks
          </div>
          <div className="text-white text-xl sm:text-2xl font-bold">
            {currentReport.tasks.length}
          </div>
          <div className="text-purple-300 text-xs">
            {currentReport.tasks.filter((t) => t.priority === 'high').length}{' '}
            high priority
          </div>
        </div>
      </div>
    </div>
  );
};
