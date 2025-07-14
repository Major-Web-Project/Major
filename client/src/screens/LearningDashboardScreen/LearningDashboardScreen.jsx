import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { aiAssistant } from '../../services/aiLearningService';

export const LearningDashboardScreen = ({ 
  learningData, 
  userProfile, 
  roadmap, 
  dashboardData, 
  aiTasksData, 
  onTaskComplete, 
  onUpdateProgress 
}) => {
  const [currentTasks, setCurrentTasks] = useState(aiTasksData || []);
  const [analytics, setAnalytics] = useState(dashboardData || null);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [taskTimers, setTaskTimers] = useState({});
  const [showSubmissionModal, setShowSubmissionModal] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Initialize AI assistant with user profile
    if (userProfile) {
      aiAssistant.userProfile = userProfile;
    }

    // Load analytics and recommendations
    const analyticsData = aiAssistant.getLearningAnalytics();
    const recs = aiAssistant.generateImprovementRecommendations(
      userProfile || {},
      analyticsData
    );
    
    setAnalytics(prev => ({ ...prev, ...analyticsData }));
    setRecommendations(recs);

    // Use provided AI tasks or generate new ones
    if (aiTasksData && aiTasksData.length > 0) {
      setCurrentTasks(aiTasksData);
    } else if (roadmap && userProfile) {
      const initialTasks = aiAssistant.generateDailyTasks(
        roadmap,
        learningData?.currentPhase || 1,
        learningData?.dayNumber || 1,
        userProfile
      );
      setCurrentTasks(initialTasks);
    }
  }, [learningData, userProfile, roadmap, dashboardData, aiTasksData]);

  // Update timers every second
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

  const handleStartTask = (taskId) => {
    const startTime = Date.now();
    setActiveTask(taskId);
    setTaskTimers(prev => ({
      ...prev,
      [taskId]: { 
        startTime, 
        isRunning: true, 
        elapsedTime: 0, 
        pausedTime: 0, 
        breakCount: 0 
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

  const handleCompleteTask = (taskId, quality = 'good', submissionType = 'pdf') => {
    const timer = taskTimers[taskId];
    if (!timer || !timer.startTime) {
      alert('⚠️ Please start the task timer first before submitting.');
      return;
    }

    const submitTime = Date.now();
    const totalElapsed = timer.elapsedTime || 0;
    const actualTimeHours = totalElapsed / (1000 * 60 * 60);
    
    // Stop timer
    setTaskTimers(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], isRunning: false }
    }));

    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    // FIXED: Use the new calculateEfficiency method from AI assistant
    const efficiency = aiAssistant.calculateEfficiency(task.estimatedTime, actualTimeHours);
    const timeDifference = actualTimeHours - task.estimatedTime;
    
    const completionData = {
      taskId,
      timeSpent: actualTimeHours,
      estimatedTime: task.estimatedTime,
      difficulty: task.difficulty || 3,
      quality,
      submissionType,
      efficiency,
      category: task.category,
      productivityMetrics: {
        focusTime: (totalElapsed - (timer.pausedTime || 0)) / (1000 * 60 * 60),
        breakTime: (timer.pausedTime || 0) / (1000 * 60 * 60),
        distractionCount: timer.breakCount || 0,
        efficiencyScore: efficiency
      }
    };

    // Track progress with AI
    const progressEntry = aiAssistant.trackProgress(taskId, completionData);
    
    // Update task status
    setCurrentTasks(tasks => 
      tasks.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: 'completed', 
              actualTime: actualTimeHours,
              submissionType,
              grade: Math.min(100, Math.max(60, 70 + efficiency * 0.3)),
              completedAt: new Date().toISOString()
            }
          : t
      )
    );

    setActiveTask(null);
    setShowSubmissionModal(null);

    // Update analytics
    const newAnalytics = aiAssistant.getLearningAnalytics();
    setAnalytics(prev => ({ ...prev, ...newAnalytics }));

    // Call parent callback
    if (onTaskComplete) {
      onTaskComplete(progressEntry);
    }

    // Show success message
    const performanceLevel = efficiency >= 120 ? 'Exceptional' : 
                            efficiency >= 100 ? 'Excellent' : 
                            efficiency >= 80 ? 'Good' : 
                            efficiency >= 60 ? 'Average' : 'Needs Improvement';
    
    setTimeout(() => {
      alert(`🎉 Task Submitted Successfully as ${submissionType.toUpperCase()}!

📊 Performance Report:
⏱️ Total Time: ${formatTime(totalElapsed)}
📈 Efficiency Score: ${efficiency}%
⚡ Time vs Estimate: ${timeDifference > 0 ? '+' : ''}${timeDifference.toFixed(2)} hours
🎯 Performance Level: ${performanceLevel}
🔄 Break Count: ${timer.breakCount || 0}
⏰ Focus Time: ${formatTime(totalElapsed - (timer.pausedTime || 0))}
☕ Break Time: ${formatTime(timer.pausedTime || 0)}

🏆 Achievement: ${
  efficiency >= 120 ? 'Speed Demon!' :
  efficiency >= 100 ? 'Time Master!' :
  efficiency >= 80 ? 'Efficient Learner!' :
  'Keep Improving!'
}

Your progress has been saved to your learning dashboard.`);
    }, 100);
  };

  const generateNewTasks = () => {
    if (!roadmap || !userProfile) return;
    
    const newDayNumber = (learningData?.dayNumber || 1) + 1;
    const newTasks = aiAssistant.generateDailyTasks(
      roadmap,
      learningData?.currentPhase || 1,
      newDayNumber,
      userProfile
    );
    
    setCurrentTasks(newTasks);
    if (onUpdateProgress) {
      onUpdateProgress({ dayNumber: newDayNumber });
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

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-primary">
      {/* Background Video */}
      <div className="fixed inset-0 w-full h-full z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.3) contrast(1.2)' }}
        >
          <source
            src="https://videos.pexels.com/video-files/3129671/3129671-uhd_3840_2160_30fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-[#e9f1e4]/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-purple-900/60 dark:to-slate-900/80"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 dark:bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 dark:bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 dark:bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-500"></div>
          <div className="absolute top-20 left-20 w-2 h-2 bg-white dark:bg-green-300 rounded-full opacity-60 animate-bounce animation-delay-200"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-300 dark:bg-yellow-300 rounded-full opacity-80 animate-bounce animation-delay-700"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-300 dark:bg-cyan-200 rounded-full opacity-70 animate-bounce animation-delay-1200"></div>
        </div>
      </div>

      <div className="relative z-20 w-full">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
              AI Learning Dashboard
            </h1>
            <p className="text-lg mb-6 text-indigo-700 dark:text-gray-300">
              Track your progress with AI-powered insights and personalized recommendations
            </p>
            {learningData && (
              <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-4 border border-purple-400/30 inline-block">
                <div className="text-white font-semibold">
                  Current Learning Path: {learningData.goalData?.learningPath || 'AI Personalized'}
                </div>
                <div className="text-indigo-700 text-sm dark:text-gray-300">
                  Phase {learningData.currentPhase} • Day {learningData.dayNumber}
                </div>
              </div>
            )}
          </div>

          {/* Progress Overview */}
          {analytics && (
            <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-8 dark:bg-white/10 dark:border-white/20">
              <CardContent className="p-8">
                <h3 className="text-indigo-700 font-bold text-2xl mb-6 dark:text-white">Your AI-Powered Progress Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-400/30">
                    <div className="text-blue-400 font-semibold text-sm mb-2">Tasks Completed</div>
                    <div className="text-indigo-900 text-3xl font-bold dark:text-white">{analytics.totalTasksCompleted || 0}</div>
                    <div className="text-indigo-700 text-xs dark:text-blue-300">AI-generated tasks</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-400/30">
                    <div className="text-green-400 font-semibold text-sm mb-2">Efficiency Score</div>
                    <div className="text-indigo-900 text-3xl font-bold dark:text-white">{Math.round((analytics.averageEfficiency || 0) * 100)}%</div>
                    <div className="text-indigo-700 text-xs dark:text-green-300">AI-calculated performance</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30">
                    <div className="text-purple-400 font-semibold text-sm mb-2">Consistency Rate</div>
                    <div className="text-indigo-900 text-3xl font-bold dark:text-white">{Math.round((analytics.consistencyRate || 0) * 25)}%</div>
                    <div className="text-indigo-700 text-xs dark:text-purple-300">Daily completion rate</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-400/30">
                    <div className="text-orange-400 font-semibold text-sm mb-2">Total Time</div>
                    <div className="text-indigo-900 text-3xl font-bold dark:text-white">{(analytics.timeSpentTotal || 0).toFixed(1)}h</div>
                    <div className="text-indigo-700 text-xs dark:text-orange-300">Learning time tracked</div>
                  </div>
                </div>

                {/* AI Insights */}
                {analytics.strongAreas && analytics.strongAreas.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-indigo-700 font-semibold text-lg mb-3 dark:text-white">🏆 AI-Identified Strong Areas</h4>
                    <div className="flex flex-wrap gap-3">
                      {analytics.strongAreas.map((area, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-400/30"
                        >
                          {area.category} ({Math.round((area.averageEfficiency || 0) * 100)}% efficiency)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.improvementAreas && analytics.improvementAreas.length > 0 && (
                  <div>
                    <h4 className="text-indigo-700 font-semibold text-lg mb-3 dark:text-white">📈 AI-Suggested Improvement Areas</h4>
                    <div className="flex flex-wrap gap-3">
                      {analytics.improvementAreas.map((area, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm border border-yellow-400/30"
                        >
                          {area.category} ({Math.round((area.averageEfficiency || 0) * 100)}% efficiency)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Today's AI-Generated Tasks */}
          <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-8 dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-indigo-700 font-bold text-2xl dark:text-white">Today's AI-Generated Tasks</h3>
                <Button
                  onClick={generateNewTasks}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl transition-all duration-300 font-semibold"
                >
                  🤖 Generate New AI Tasks
                </Button>
              </div>
              
              <div className="space-y-6">
                {currentTasks.map((task) => {
                  const timer = taskTimers[task.id];
                  const isTimerRunning = timer?.isRunning || false;
                  const elapsedTime = timer?.elapsedTime || 0;
                  
                  return (
                    <div
                      key={task.id}
                      className="p-6 bg-sky-100/30 rounded-xl border border-sky-200/50 hover:border-sky-300/50 transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:hover:border-white/20"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-indigo-700 font-semibold text-xl mb-2 dark:text-white">{task.title}</h4>
                          <p className="text-sky-700 mb-4 dark:text-gray-300">{task.description}</p>
                          
                          <div className="flex items-center gap-4 mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTaskStatusColor(task.status || 'pending')}`}>
                              {task.status || 'pending'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                              {task.priority} priority
                            </span>
                            <span className="text-sky-600 text-sm dark:text-gray-400">
                              ⏱️ {task.estimatedTime}h estimated
                            </span>
                            <span className="text-sky-600 text-sm dark:text-gray-400">
                              📂 {task.category}
                            </span>
                            <span className="text-cyan-400 text-sm">
                              🤖 AI-Generated
                            </span>
                          </div>

                          {task.topics && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {task.topics.map((topic, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-400/30"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Timer Display */}
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
                            <div className="text-blue-300 text-xs text-indigo-700 dark:text-blue-300">
                              Started: {new Date(timer.startTime).toLocaleTimeString()}
                            </div>
                            {(timer.pausedTime || 0) > 0 && (
                              <div className="text-yellow-300 text-xs">
                                Break time: {formatTime(timer.pausedTime)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Task Controls */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          {(!task.status || task.status === 'pending') && !timer?.startTime && (
                            <Button
                              onClick={() => handleStartTask(task.id)}
                              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 font-bold shadow-lg"
                            >
                              🚀 Start Task Timer
                            </Button>
                          )}
                          
                          {timer?.startTime && task.status !== 'completed' && (
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
                            </div>
                          )}
                        </div>

                        {task.status !== 'completed' && (
                          <Button
                            onClick={() => handleCompleteTask(task.id)}
                            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl transition-all duration-300 font-bold shadow-lg"
                          >
                            ✅ Complete Task
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearningDashboardScreen;