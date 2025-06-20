import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { NavigationBarSection } from '../FrameScreen/sections/NavigationBarSection';
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
    <div className="min-h-screen relative overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80"></div>
      </div>

      <div className="relative z-20 w-full">
        <NavigationBarSection />

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
              AI Learning Dashboard
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Track your progress with AI-powered insights and personalized recommendations
            </p>
            {learningData && (
              <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-4 border border-purple-400/30 inline-block">
                <div className="text-white font-semibold">
                  Current Learning Path: {learningData.goalData?.learningPath || 'AI Personalized'}
                </div>
                <div className="text-gray-300 text-sm">
                  Phase {learningData.currentPhase} • Day {learningData.dayNumber}
                </div>
              </div>
            )}
          </div>

          {/* Progress Overview */}
          {analytics && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">Your AI-Powered Progress Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-400/30">
                    <div className="text-blue-400 font-semibold text-sm mb-2">Tasks Completed</div>
                    <div className="text-white text-3xl font-bold">{analytics.totalTasksCompleted || 0}</div>
                    <div className="text-blue-300 text-xs">AI-generated tasks</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-400/30">
                    <div className="text-green-400 font-semibold text-sm mb-2">Efficiency Score</div>
                    <div className="text-white text-3xl font-bold">{Math.round((analytics.averageEfficiency || 0) * 100)}%</div>
                    <div className="text-green-300 text-xs">AI-calculated performance</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30">
                    <div className="text-purple-400 font-semibold text-sm mb-2">Consistency Rate</div>
                    <div className="text-white text-3xl font-bold">{Math.round((analytics.consistencyRate || 0) * 25)}%</div>
                    <div className="text-purple-300 text-xs">Daily completion rate</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-400/30">
                    <div className="text-orange-400 font-semibold text-sm mb-2">Total Time</div>
                    <div className="text-white text-3xl font-bold">{(analytics.timeSpentTotal || 0).toFixed(1)}h</div>
                    <div className="text-orange-300 text-xs">Learning time tracked</div>
                  </div>
                </div>

                {/* AI Insights */}
                {analytics.strongAreas && analytics.strongAreas.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-white font-semibold text-lg mb-3">🏆 AI-Identified Strong Areas</h4>
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
                    <h4 className="text-white font-semibold text-lg mb-3">📈 AI-Suggested Improvement Areas</h4>
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
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-2xl">Today's AI-Generated Tasks</h3>
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
                      className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-xl mb-2">{task.title}</h4>
                          <p className="text-gray-300 mb-4">{task.description}</p>
                          
                          <div className="flex items-center gap-4 mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTaskStatusColor(task.status || 'pending')}`}>
                              {task.status || 'pending'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                              {task.priority} priority
                            </span>
                            <span className="text-gray-400 text-sm">
                              ⏱️ {task.estimatedTime}h estimated
                            </span>
                            <span className="text-gray-400 text-sm">
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
                            <div className="text-white font-mono text-2xl font-bold">
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
                              
                              <Button
                                onClick={() => setShowSubmissionModal(task.id)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl transition-all duration-300 font-bold shadow-lg"
                              >
                                📤 Submit Task
                              </Button>
                            </div>
                          )}
                        </div>

                        {task.status === 'completed' && (
                          <div className="text-center">
                            <div className="text-green-400 text-2xl mb-1">✅</div>
                            <div className="text-green-400 text-sm font-semibold">Completed</div>
                            {task.actualTime && (
                              <div className="text-gray-400 text-xs">
                                {task.actualTime.toFixed(2)}h actual
                              </div>
                            )}
                            {task.submissionType && (
                              <div className="text-cyan-400 text-xs">
                                Submitted as {task.submissionType.toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">🤖 AI Personalized Recommendations</h3>
                
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl border ${
                        rec.priority === 'high' ? 'bg-red-500/10 border-red-400/30' :
                        rec.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-400/30' :
                        'bg-blue-500/10 border-blue-400/30'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          rec.priority === 'high' ? 'bg-red-500/20' :
                          rec.priority === 'medium' ? 'bg-yellow-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          🤖
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-lg mb-2">{rec.area}</h4>
                          <p className="text-gray-300 mb-3">{rec.suggestion}</p>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {rec.priority} priority
                            </span>
                            <span className="text-green-400 text-sm">
                              Expected: {rec.expectedImprovement}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Phase Progress */}
          {roadmap && learningData && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">AI-Personalized Learning Path Progress</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30">
                    <div className="text-purple-400 font-semibold text-sm mb-2">Current Phase</div>
                    <div className="text-white text-xl font-bold mb-1">
                      Phase {learningData.currentPhase}
                    </div>
                    <div className="text-purple-300 text-sm">
                      {roadmap.phases[learningData.currentPhase - 1]?.title}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-6 rounded-xl border border-cyan-400/30">
                    <div className="text-cyan-400 font-semibold text-sm mb-2">Day</div>
                    <div className="text-white text-xl font-bold mb-1">
                      Day {learningData.dayNumber}
                    </div>
                    <div className="text-cyan-300 text-sm">
                      of {roadmap.phases[learningData.currentPhase - 1]?.duration * 7} days
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-400/30">
                    <div className="text-green-400 font-semibold text-sm mb-2">Overall Progress</div>
                    <div className="text-white text-xl font-bold mb-1">
                      {Math.round((learningData.currentPhase / roadmap.phases.length) * 100)}%
                    </div>
                    <div className="text-green-300 text-sm">
                      {learningData.currentPhase} of {roadmap.phases.length} phases
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Submission Modal */}
      {showSubmissionModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSubmissionModal(null);
            }
          }}
        >
          <div 
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 max-w-lg w-full border border-white/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'excellent', label: 'Excellent', color: 'from-green-500 to-emerald-500', icon: '🏆' },
                  { value: 'good', label: 'Good', color: 'from-blue-500 to-cyan-500', icon: '👍' },
                  { value: 'struggled', label: 'Struggled', color: 'from-yellow-500 to-orange-500', icon: '💪' }
                ].map((quality) => (
                  <button
                    key={quality.value}
                    onClick={() => {
                      // Store quality selection and show format options
                      const qualityLevel = quality.value;
                      setShowSubmissionModal({ taskId: showSubmissionModal, quality: qualityLevel });
                    }}
                    className={`p-4 bg-gradient-to-r ${quality.color} hover:scale-105 text-white rounded-xl transition-all duration-300 font-bold text-sm flex flex-col items-center gap-2`}
                  >
                    <span className="text-2xl">{quality.icon}</span>
                    {quality.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection (shown after quality is selected) */}
            {typeof showSubmissionModal === 'object' && showSubmissionModal.quality && (
              <div className="space-y-4 mb-8">
                <h4 className="text-white font-semibold mb-3">Choose submission format:</h4>
                <Button
                  onClick={() => handleCompleteTask(showSubmissionModal.taskId, showSubmissionModal.quality, 'pdf')}
                  className="w-full p-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-xl transition-all duration-300 font-bold text-lg shadow-lg flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xl font-bold">Submit as PDF</div>
                    <div className="text-sm opacity-80">Document format for reports and presentations</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleCompleteTask(showSubmissionModal.taskId, showSubmissionModal.quality, 'excel')}
                  className="w-full p-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all duration-300 font-bold text-lg shadow-lg flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xl font-bold">Submit as Excel</div>
                    <div className="text-sm opacity-80">Spreadsheet format for data and calculations</div>
                  </div>
                </Button>
              </div>
            )}
            
            <Button
              onClick={() => setShowSubmissionModal(null)}
              className="w-full p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 font-semibold border border-gray-600"
            >
              Cancel Submission
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};