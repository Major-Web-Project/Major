import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export const DailyTaskChargeSection = ({ tasks, selectedDate, onTaskComplete }) => {
  const [expandedTask, setExpandedTask] = useState(null);
  const [taskTimers, setTaskTimers] = useState({});
  const [showSubmissionModal, setShowSubmissionModal] = useState(null);

  // Update elapsed time for running timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTaskTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(taskId => {
          if (updated[taskId].isRunning && updated[taskId].startTime) {
            const now = Date.now();
            const elapsed = now - updated[taskId].startTime - (updated[taskId].pausedTime || 0);
            updated[taskId].elapsedTime = Math.max(0, elapsed);
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-red-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      default: return '❓';
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds < 0) return '00:00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStartTask = (taskId) => {
    const startTime = Date.now();
    setTaskTimers(prev => ({
      ...prev,
      [taskId]: { 
        startTime, 
        isRunning: true, 
        elapsedTime: 0, 
        pausedTime: 0, 
        breakCount: 0,
        lastPauseTime: null
      }
    }));
    
    console.log(`Starting task ${taskId} at ${new Date(startTime).toISOString()}`);
  };

  const handlePauseResumeTask = (taskId) => {
    const timer = taskTimers[taskId];
    if (!timer) return;

    if (timer.isRunning) {
      // Pause timer
      const pauseTime = Date.now();
      setTaskTimers(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isRunning: false,
          lastPauseTime: pauseTime,
          breakCount: prev[taskId].breakCount + 1
        }
      }));
    } else {
      // Resume timer
      const resumeTime = Date.now();
      const additionalPausedTime = timer.lastPauseTime ? resumeTime - timer.lastPauseTime : 0;
      
      setTaskTimers(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isRunning: true,
          pausedTime: (prev[taskId].pausedTime || 0) + additionalPausedTime,
          lastPauseTime: null
        }
      }));
    }
  };

  const handleShowSubmissionModal = (taskId) => {
    setShowSubmissionModal(taskId);
  };

  const handleSubmitTask = (taskId, format, quality = 'good') => {
    const submitTime = Date.now();
    const timer = taskTimers[taskId];
    
    if (timer && timer.startTime) {
      const totalElapsed = timer.elapsedTime || 0;
      const actualTimeHours = totalElapsed / (1000 * 60 * 60);
      
      // Stop timer
      setTaskTimers(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], isRunning: false }
      }));

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // FIXED: Proper efficiency calculation - (estimated / actual) * 100, capped at reasonable values
      let efficiency = 100; // Default if no actual time
      if (actualTimeHours > 0 && task.estimatedTime > 0) {
        efficiency = (task.estimatedTime / actualTimeHours) * 100;
        // Cap efficiency at reasonable values (10% to 200%)
        efficiency = Math.max(10, Math.min(200, efficiency));
      }
      
      const timeDifference = actualTimeHours - task.estimatedTime;
      
      const taskData = {
        taskId,
        startTime: new Date(timer.startTime).toISOString(),
        submitTime: new Date(submitTime).toISOString(),
        actualTime: actualTimeHours,
        submissionType: format,
        elapsedTime: totalElapsed,
        breakCount: timer.breakCount || 0,
        efficiency: Math.round(efficiency),
        quality,
        productivityMetrics: {
          focusTime: (totalElapsed - (timer.pausedTime || 0)) / (1000 * 60 * 60),
          breakTime: (timer.pausedTime || 0) / (1000 * 60 * 60),
          distractionCount: timer.breakCount || 0,
          efficiencyScore: Math.round(efficiency)
        }
      };

      console.log('Task Submission Data:', taskData);
      
      // Call parent callback if provided
      if (onTaskComplete) {
        onTaskComplete({
          taskId,
          timeSpent: actualTimeHours,
          estimatedTime: task.estimatedTime,
          difficulty: task.difficulty || 3,
          quality,
          efficiency: efficiency / 100, // Convert to decimal for AI service
          category: task.category
        });
      }
      
      const performanceLevel = efficiency >= 120 ? 'Exceptional' : 
                              efficiency >= 100 ? 'Excellent' : 
                              efficiency >= 80 ? 'Good' : 
                              efficiency >= 60 ? 'Average' : 'Needs Improvement';
      
      // Close modal first
      setShowSubmissionModal(null);
      
      // Show success message after modal closes
      setTimeout(() => {
        alert(`🎉 Task Submitted Successfully as ${format.toUpperCase()}!

📊 Comprehensive Performance Report:
⏱️ Total Time: ${formatTime(totalElapsed)}
📈 Efficiency Score: ${Math.round(efficiency)}%
⚡ Time vs Estimate: ${timeDifference > 0 ? '+' : ''}${timeDifference.toFixed(2)} hours
🎯 Performance Level: ${performanceLevel}
🔄 Break Count: ${timer.breakCount || 0}
⏰ Focus Time: ${formatTime(totalElapsed - (timer.pausedTime || 0))}
☕ Break Time: ${formatTime(timer.pausedTime || 0)}
🌟 Quality Rating: ${quality.charAt(0).toUpperCase() + quality.slice(1)}

🏆 Achievement Unlocked: ${
  efficiency >= 120 ? 'Speed Demon!' :
  efficiency >= 100 ? 'Time Master!' :
  efficiency >= 80 ? 'Efficient Learner!' :
  'Keep Improving!'
}

Your detailed analytics have been saved to your learning dashboard.`);
      }, 100);
      
    } else {
      alert('⚠️ Please start the task timer first before submitting.');
    }
  };

  return (
    <Card className="bg-mint-100 border border-mint-200 rounded-3xl shadow-2xl dark:bg-white/10 dark:border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-poppins flex items-center gap-2">
            <span className="text-3xl">📋</span>
            Daily Task Charge
          </h2>
          <div className="text-gray-300 text-right">
            <div className="text-lg font-semibold">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-gray-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📅</div>
            <div className="text-gray-400 text-xl mb-2">No tasks assigned for this date</div>
            <div className="text-gray-500 text-sm">Select a different date to view tasks</div>
          </div>
        ) : (
          <div className="space-y-6">
            {tasks.map((task, index) => {
              const timer = taskTimers[task.id];
              const isTimerRunning = timer?.isRunning || false;
              const elapsedTime = timer?.elapsedTime || 0;
              
              return (
                <div
                  key={task.id}
                  className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-2xl border border-white/20 overflow-hidden hover:border-white/30 transition-all duration-300 shadow-xl relative"
                >
                  {/* Enhanced Task Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getPriorityColor(task.priority)} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-indigo-700 font-bold text-2xl mb-2 dark:text-white">{task.title}</h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-cyan-400 text-sm font-semibold bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-400/30">
                                📚 {task.courseName}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                                {getStatusIcon(task.status)} {task.status.replace('-', ' ').toUpperCase()}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                task.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-green-500/20 text-green-400 border-green-500/30'
                              }`}>
                                {task.priority.toUpperCase()} PRIORITY
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(task.difficultyLevel)}`}>
                                🎯 {task.difficultyLevel.toUpperCase()}
                              </span>
                              {task.isAIGenerated && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium border bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  🤖 AI-GENERATED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sky-700 text-base mb-6 leading-relaxed bg-sky-100/50 p-4 rounded-lg border border-sky-200/50 dark:text-gray-300 dark:bg-black/20 dark:border-white/10">
                          {task.description}
                        </p>
                        
                        {/* Enhanced Task Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-6">
                          <div className="flex items-center gap-3 bg-sky-100/50 p-4 rounded-xl border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                            <span className="text-2xl">👤</span>
                            <div>
                              <div className="text-sky-600 text-xs dark:text-gray-400">Assigned by</div>
                              <div className="text-purple-400 font-semibold">{task.assignedBy}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-sky-100/50 p-4 rounded-xl border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                            <span className="text-2xl">📂</span>
                            <div>
                              <div className="text-sky-600 text-xs dark:text-gray-400">Category</div>
                              <div className="text-cyan-400 font-semibold">{task.category}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-sky-100/50 p-4 rounded-xl border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                            <span className="text-2xl">📅</span>
                            <div>
                              <div className="text-sky-600 text-xs dark:text-gray-400">Due Date</div>
                              <div className="text-pink-400 font-semibold">{formatDate(task.dueDate)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-sky-100/50 p-4 rounded-xl border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                            <span className="text-2xl">⏱️</span>
                            <div>
                              <div className="text-sky-600 text-xs dark:text-gray-400">Estimated</div>
                              <div className="text-green-400 font-semibold">{task.estimatedTime}h</div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Task Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-xl border border-indigo-400/30">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🎖️</span>
                              <div className="text-indigo-400 font-semibold">Grade Weight</div>
                            </div>
                            <div className="text-indigo-700 font-bold text-lg dark:text-white">{task.gradeWeight}%</div>
                            <div className="text-indigo-300 text-xs">of course grade</div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-400/30">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🔄</span>
                              <div className="text-orange-400 font-semibold">Attempts</div>
                            </div>
                            <div className="text-indigo-700 font-bold text-lg dark:text-white">{task.currentAttempt}/{task.maxAttempts}</div>
                            <div className="text-orange-300 text-xs">submissions allowed</div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-400/30">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🧠</span>
                              <div className="text-green-400 font-semibold">Skills</div>
                            </div>
                            <div className="text-indigo-700 font-bold text-lg dark:text-white">{task.skillsGained.length}</div>
                            <div className="text-green-300 text-xs">to be gained</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Timer Display */}
                      <div className="flex flex-col items-end gap-4">
                        {timer?.startTime && (
                          <div className="text-right bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-400/30 min-w-[250px]">
                            <div className="text-blue-400 text-sm font-semibold mb-1 flex items-center gap-2">
                              {isTimerRunning ? '🔴 LIVE TIMER' : '⏸️ PAUSED'}
                              {(timer.breakCount || 0) > 0 && (
                                <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded-full">
                                  {timer.breakCount} breaks
                                </span>
                              )}
                            </div>
                            <div className="text-indigo-700 font-mono text-2xl font-bold dark:text-white">
                              {formatTime(elapsedTime)}
                            </div>
                            <div className="text-blue-300 text-xs mt-1">
                              Started: {new Date(timer.startTime).toLocaleTimeString()}
                            </div>
                            {(timer.pausedTime || 0) > 0 && (
                              <div className="text-yellow-300 text-xs">
                                Break time: {formatTime(timer.pausedTime)}
                              </div>
                            )}
                            {isTimerRunning && task.estimatedTime > 0 && (
                              <div className="text-purple-300 text-xs mt-1">
                                Efficiency: {Math.round((task.estimatedTime / (elapsedTime / (1000 * 60 * 60))) * 100)}%
                              </div>
                            )}
                          </div>
                        )}
                        
                        <Button
                          onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-all duration-300 font-semibold"
                        >
                          {expandedTask === task.id ? '🔼 Hide Details' : '🔽 Show Details'}
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced Timer and Submit Controls */}
                    <div className="mt-8 pt-6 border-t border-white/20">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          {!timer?.startTime ? (
                            <Button
                              onClick={() => handleStartTask(task.id)}
                              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-green-500/25"
                            >
                              🚀 Start Task Timer
                            </Button>
                          ) : (
                            <div className="flex items-center gap-4 flex-wrap">
                              <Button
                                onClick={() => handlePauseResumeTask(task.id)}
                                className={`px-6 py-3 rounded-xl transition-all duration-300 font-bold ${
                                  isTimerRunning 
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400' 
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400'
                                } text-white shadow-lg`}
                              >
                                {isTimerRunning ? '⏸️ Pause Timer' : '▶️ Resume Timer'}
                              </Button>
                              
                              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                                isTimerRunning ? 'bg-green-500/20 border border-green-400/30' : 'bg-gray-500/20 border border-gray-400/30'
                              }`}>
                                <div className={`w-4 h-4 rounded-full ${isTimerRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                                <span className="text-indigo-700 font-semibold dark:text-white">
                                  {isTimerRunning ? 'Task in Progress...' : 'Task Timer Paused'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {timer?.startTime && (
                          <div className="flex gap-4">
                            <Button
                              onClick={() => handleShowSubmissionModal(task.id)}
                              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-purple-500/25"
                            >
                              📤 Submit Task
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task-Specific Submission Modal */}
                  {showSubmissionModal === task.id && (
                    <div 
                      className="absolute inset-0 z-50 flex items-center justify-center p-4"
                      style={{
                        background: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '1rem'
                      }}
                      onClick={(e) => {
                        if (e.target === e.currentTarget) {
                          setShowSubmissionModal(null);
                        }
                      }}
                    >
                      <div 
                        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 max-w-lg w-full border border-white/30 shadow-2xl transform transition-all duration-300 scale-100 max-h-[90%] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📤</span>
                          </div>
                          <h3 className="text-white font-bold text-2xl mb-2">
                            Submit Your Task
                          </h3>
                          <p className="text-gray-300">
                            Choose your submission format and quality level
                          </p>
                        </div>
                        
                        {/* Quality Selection */}
                        <div className="mb-6">
                          <h4 className="text-white font-semibold mb-3">How did you perform?</h4>
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {[
                              { value: 'excellent', label: 'Excellent', color: 'from-green-500 to-emerald-500', icon: '🏆' },
                              { value: 'good', label: 'Good', color: 'from-blue-500 to-cyan-500', icon: '👍' },
                              { value: 'struggled', label: 'Struggled', color: 'from-yellow-500 to-orange-500', icon: '💪' }
                            ].map((quality) => (
                              <div key={quality.value} className="space-y-3">
                                <div className={`p-3 bg-gradient-to-r ${quality.color} rounded-xl text-center text-white font-bold text-sm flex flex-col items-center gap-2`}>
                                  <span className="text-2xl">{quality.icon}</span>
                                  {quality.label}
                                </div>
                                
                                {/* Format options for each quality */}
                                <div className="space-y-2">
                                  <Button
                                    onClick={() => handleSubmitTask(task.id, 'pdf', quality.value)}
                                    className="w-full p-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-lg transition-all duration-300 font-semibold text-sm flex items-center gap-2"
                                  >
                                    <span className="text-lg">📄</span>
                                    PDF
                                  </Button>
                                  
                                  <Button
                                    onClick={() => handleSubmitTask(task.id, 'excel', quality.value)}
                                    className="w-full p-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all duration-300 font-semibold text-sm flex items-center gap-2"
                                  >
                                    <span className="text-lg">📊</span>
                                    Excel
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Cancel Button */}
                        <Button
                          onClick={() => setShowSubmissionModal(null)}
                          className="w-full p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 font-semibold border border-gray-600 hover:border-gray-500"
                        >
                          Cancel Submission
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Comprehensive Expanded Details */}
                  {expandedTask === task.id && (
                    <div className="border-t border-white/20 p-8 bg-gradient-to-r from-black/40 to-black/20 animate-fadeIn">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        {/* Left Column - Task Details */}
                        <div className="space-y-8">
                          <div>
                            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                              <span className="text-2xl">📝</span>
                              Learning Objectives
                            </h4>
                            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-xl border border-purple-400/30">
                              <ul className="space-y-2">
                                {task.learningObjectives.map((objective, index) => (
                                  <li key={index} className="text-gray-300 text-base flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    {objective}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                              <span className="text-2xl">🏷️</span>
                              Skills & Technologies
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {task.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 text-sm rounded-xl border border-cyan-400/30 font-semibold hover:scale-105 transition-transform duration-300"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                              <span className="text-2xl">📚</span>
                              Prerequisites & Resources
                            </h4>
                            <div className="space-y-4">
                              <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                <h5 className="text-orange-400 font-semibold mb-2">Prerequisites:</h5>
                                <ul className="space-y-1">
                                  {task.prerequisites.map((prereq, index) => (
                                    <li key={index} className="text-gray-300 text-sm flex items-center gap-2">
                                      <span className="text-orange-400">•</span>
                                      {prereq}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                <h5 className="text-blue-400 font-semibold mb-2">Resources:</h5>
                                <div className="space-y-2">
                                  {task.resources.map((resource, index) => (
                                    <div key={index} className="flex items-center gap-3 text-sm">
                                      <span className="text-blue-400">
                                        {resource.type === 'video' ? '🎥' : 
                                         resource.type === 'article' ? '📄' : 
                                         resource.type === 'documentation' ? '📖' : '🔗'}
                                      </span>
                                      <span className="text-gray-300">{resource.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Performance & Analytics */}
                        <div className="space-y-8">
                          <div>
                            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                              <span className="text-2xl">⏱️</span>
                              Time Tracking Analytics
                            </h4>
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-400/30">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-300">Estimated Duration</span>
                                  <span className="text-blue-400 font-bold text-xl">{task.estimatedTime} hours</span>
                                </div>
                              </div>
                              
                              {timer?.startTime && (
                                <>
                                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-400/30">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-300">Start Time</span>
                                      <span className="text-green-400 font-bold text-lg">
                                        {new Date(timer.startTime).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-400/30">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-300">Current Duration</span>
                                      <span className="text-purple-400 font-bold text-xl font-mono">
                                        {formatTime(elapsedTime)}
                                      </span>
                                    </div>
                                  </div>

                                  {isTimerRunning && task.estimatedTime > 0 && (
                                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-400/30">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Current Efficiency</span>
                                        <span className={`font-bold text-xl ${
                                          (elapsedTime / (1000 * 60 * 60)) <= task.estimatedTime ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                          {Math.round((task.estimatedTime / (elapsedTime / (1000 * 60 * 60))) * 100)}%
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {(timer.breakCount || 0) > 0 && (
                                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-400/30">
                                      <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                          <div className="text-yellow-400 text-sm">Break Count</div>
                                          <div className="text-white font-bold text-lg">{timer.breakCount}</div>
                                        </div>
                                        <div>
                                          <div className="text-yellow-400 text-sm">Break Time</div>
                                          <div className="text-white font-bold text-lg">{formatTime(timer.pausedTime || 0)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Skills to be Gained */}
                          <div>
                            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                              <span className="text-2xl">🎯</span>
                              Skills You'll Gain
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {task.skillsGained.map((skill, index) => (
                                <div key={index} className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-3 rounded-xl border border-emerald-400/30 flex items-center gap-3">
                                  <span className="text-emerald-400 text-lg">🌟</span>
                                  <span className="text-white font-semibold">{skill}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Performance History */}
                          {task.actualTime && (
                            <div>
                              <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                                <span className="text-2xl">📊</span>
                                Performance Report
                              </h4>
                              <div className="space-y-4">
                                <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Actual Time Taken</span>
                                    <span className="text-green-400 font-bold text-xl">{task.actualTime} hours</span>
                                  </div>
                                </div>
                                <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Overall Efficiency</span>
                                    <span className={`font-bold text-xl ${
                                      task.actualTime <= task.estimatedTime ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {Math.round((task.estimatedTime / task.actualTime) * 100)}%
                                    </span>
                                  </div>
                                </div>
                                {task.grade && (
                                  <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-300">Grade Received</span>
                                      <span className="text-yellow-400 font-bold text-xl">{task.grade}%</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};