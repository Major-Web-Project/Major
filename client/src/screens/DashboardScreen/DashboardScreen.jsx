import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { WeeklyActivityChart } from './components/WeeklyActivityChart';
import { StatusHistoryChart } from './components/StatusHistoryChart';
import { StatisticsPieChart } from './components/StatisticsPieChart';
import { DailyReportTable } from './components/DailyReportTable';
import { apiService } from '../../services/api';
import { aiAssistant } from '../../services/aiLearningService';
import { useNavigate } from "react-router-dom";

// Helper to group tasks by date
const groupTasksByDate = (tasks) => {
  const grouped = {};
  tasks.forEach(task => {
    let rawDate = task.data?.createdAt || task.createdAt;
    let date = 'unknown';
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().split('T')[0];
      }
    }
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({ ...task.data, id: task._id, createdAt: rawDate });
  });
  return Object.entries(grouped).map(([date, tasks]) => ({ date, tasks }));
};

export const DashboardScreen = ({ userProfile, learningData, dashboardData: aiDashboardData, aiTasksData }) => {
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [user, setUser] = useState(null);
  const [dailyReport, setDailyReport] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [statusHistoryLoading, setStatusHistoryLoading] = useState(true);
  const navigate = useNavigate();

  // Define fetchStatusHistory here so it can access the state setters
  const fetchStatusHistory = async () => {
    try {
      setStatusHistoryLoading(true);
      const res = await fetch('/api/dashboard/status-history', { credentials: 'include' });
      const data = await res.json();
      setStatusHistory(data.history || []);
    } catch (err) {
      setStatusHistory([]);
    } finally {
      setStatusHistoryLoading(false);
    }
  };

  const fetchWeeklyActivity = async () => {
    const weeklyRes = await apiService.getWeeklyActivity();
    setWeeklyActivity(weeklyRes.data.activities[0] || null);
  };

  const fetchAndGroupTasks = async () => {
    const tasksRes = await apiService.getTasks();
    const tasks = tasksRes.data.tasks || [];
    setAllTasks(tasks);
    const grouped = groupTasksByDate(tasks);
    setDailyReport(grouped);
  };

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const fetchDashboardData = async () => {
      try {
        const res = await apiService.getDashboardData();
        setDashboard(res.data.dashboard);
        setUser(res.data.user);
        await fetchAndGroupTasks();
        // Fetch weekly activity
        await fetchWeeklyActivity();

        // Initialize AI assistant if user profile exists
        if (userProfile) {
          aiAssistant.userProfile = userProfile;
          const insights = aiAssistant.getLearningAnalytics();
          setAiInsights(insights);
        }

        // Use AI dashboard data if available, otherwise use mock data
        if (aiDashboardData && aiTasksData) {
          setDashboard({
            ...res.data.dashboard,
            ...aiDashboardData,
            dailyReport: [{
              date: new Date().toISOString().split('T')[0],
              tasks: aiTasksData.map(task => ({
                id: task.id,
                name: task.title,
                status: task.status || 'pending',
                priority: task.priority,
                notes: task.description,
                estimatedTime: `${task.estimatedTime} hours`,
                createdAt: new Date().toISOString()
              }))
            }]
          });
        }

        // Simulate loading delay
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchStatusHistory();
  }, [userProfile, aiDashboardData, aiTasksData]);

  const handleStartAIAssessment = () => {
    navigate("/assessment");
  };

  const handleViewAIDashboard = () => {
    if (learningData) {
      const learningDashboardEvent = new CustomEvent('navigateToLearningDashboard');
      window.dispatchEvent(learningDashboardEvent);
    }
  };

  // Calculate total and completed tasks for the week
  const totalTasksThisWeek = (weeklyActivity?.days || []).reduce((sum, day) => sum + (day.totalTasks || 0), 0);
  const completedTasksThisWeek = (weeklyActivity?.days || []).reduce((sum, day) => sum + (day.completedTasks || 0), 0);

  // Only show days with tasks in the chart
  const weeklyActivityDataWithTasks = (weeklyActivity?.days || []).filter(day => day.hasTasks);

  // Defensive defaults for dashboard data
  const backendStreak = weeklyActivity?.streak ?? 0;
  const backendBestDay = weeklyActivity?.bestDay ?? 'N/A';
  const backendAvgGoal = weeklyActivity?.avgGoal ?? 100;
  const backendAvgCompleted = weeklyActivity?.avgCompleted ?? 0;
  const backendTotalTasks = weeklyActivity?.totalTasks ?? 0;
  const backendCompletedTasks = weeklyActivity?.completedTasks ?? 0;
  const statistics = dashboard?.statistics || { assignments: 0, selfStudy: 0, lectures: 0 };
  const totalTasks = dashboard?.totalTasks ?? 0;
  const completedTasks = dashboard?.completedTasks ?? 0;
  const pendingTasks = dashboard?.pendingTasks ?? 0;

  // After adding or completing a task, re-fetch status history
  const handleTaskCreatedOrCompleted = async () => {
    await fetchAndGroupTasks();
    await fetchWeeklyActivity();
    await fetchStatusHistory();
    // Re-fetch dashboard data for real-time statistics
    const res = await apiService.getDashboardData();
    setDashboard(res.data.dashboard);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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
        </div>

        <div className="relative z-20">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="absolute inset-0 bg-[#e9f1e4]/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-purple-900/60 dark:to-slate-900/80"></div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-500"></div>
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-60 animate-bounce animation-delay-200"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-300 rounded-full opacity-80 animate-bounce animation-delay-700"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-70 animate-bounce animation-delay-1200"></div>
        </div>
      </div>

      <div className="relative z-20 w-full">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Enhanced Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-6">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-cyan-400/50"
              />
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 font-poppins">
                  Dashboard Overview
                </h1>
                <p className="text-gray-300 text-lg">
                  {user?.role} • {user?.currentStreak} day learning streak 🔥
                </p>
                {learningData && (
                  <p className="text-cyan-400 text-sm mt-1">
                    🤖 AI Learning Path: {learningData.goalData?.learningPath || 'Active'}
                  </p>
                )}
              </div>
            </div>

            {/* AI Integration Status */}
            {!userProfile && (
              <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-md border border-purple-400/30 rounded-3xl shadow-2xl mb-6">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <h3 className="text-white font-bold text-2xl mb-4">Unlock AI-Powered Learning</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    Take our AI assessment to get personalized learning paths, daily tasks, and progress tracking
                  </p>
                  <Button
                    onClick={handleStartAIAssessment}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white rounded-xl transition-all duration-300 font-bold text-lg"
                  >
                    🚀 Start AI Assessment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* AI Dashboard Access */}
            {learningData && (
              <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-400/30 rounded-3xl shadow-2xl mb-6">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="text-white font-bold text-2xl mb-4">AI Learning Dashboard Active</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    Your personalized AI learning dashboard is ready with daily tasks and progress tracking
                  </p>
                  <Button
                    onClick={handleViewAIDashboard}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 font-bold text-lg"
                  >
                    🤖 View AI Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Enhanced User Stats with AI Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-mint-100 rounded-xl p-4 border border-mint-200 dark:bg-white/10 dark:border-white/20">
                <div className="text-sky-700 font-semibold text-sm dark:text-cyan-400">
                  {learningData ? 'AI Tasks Generated' : 'Courses Enrolled'}
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {learningData ? (aiTasksData?.length || 0) : user?.coursesEnrolled}
                </div>
              </div>
              <div className="bg-mint-100 rounded-xl p-4 border border-mint-200 dark:bg-white/10 dark:border-white/20">
                <div className="text-mint-700 font-semibold text-sm dark:text-green-400">
                  Tasks Completed
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {aiInsights?.totalTasksCompleted || user?.tasksCompleted}
                </div>
              </div>
              <div className="bg-mint-100 rounded-xl p-4 border border-mint-200 dark:bg-white/10 dark:border-white/20">
                <div className="text-lavender-700 font-semibold text-sm dark:text-purple-400">
                  Learning Hours
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {aiInsights?.timeSpentTotal?.toFixed(1) || user?.totalHoursLearned}h
                </div>
              </div>
              <div className="bg-mint-100 rounded-xl p-4 border border-mint-200 dark:bg-white/10 dark:border-white/20">
                <div className="text-pink-700 font-semibold text-sm dark:text-orange-400">
                  {learningData ? 'AI Efficiency' : 'Skills Gained'}
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {learningData 
                    ? `${Math.round((aiInsights?.averageEfficiency || 0) * 100)}%`
                    : (user?.skillsGained ? user.skillsGained.length : 0)
                  }
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          {aiInsights && learningData && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-indigo-700 mb-6 font-poppins flex items-center gap-3 dark:text-white">
                  <span className="text-4xl">🤖</span>
                  AI Learning Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-400/30">
                    <div className="text-blue-400 font-semibold text-sm mb-2">AI Efficiency Score</div>
                    <div className="text-indigo-700 text-3xl font-bold dark:text-white">
                      {Math.round((aiInsights.averageEfficiency || 0) * 100)}%
                    </div>
                    <div className="text-blue-300 text-xs">Based on task completion</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-400/30">
                    <div className="text-green-400 font-semibold text-sm mb-2">AI Tasks Completed</div>
                    <div className="text-indigo-700 text-3xl font-bold dark:text-white">
                      {aiInsights.totalTasksCompleted || 0}
                    </div>
                    <div className="text-green-300 text-xs">AI-generated assignments</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30">
                    <div className="text-purple-400 font-semibold text-sm mb-2">Learning Time</div>
                    <div className="text-indigo-700 text-3xl font-bold dark:text-white">
                      {(aiInsights.timeSpentTotal || 0).toFixed(1)}h
                    </div>
                    <div className="text-purple-300 text-xs">AI-tracked focus time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Activity Chart */}
            <div className="lg:col-span-3">
              <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 dark:bg-white/10 dark:border-white/20">
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-indigo-700 font-poppins flex items-center gap-3 dark:text-white">
                        <span className="text-4xl">📊</span>
                        Weekly Activity
                      </h2>
                      <p className="text-sky-700 text-lg dark:text-gray-300">
                        Your learning progress throughout the week
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-400/30">
                        <div className="text-cyan-400 font-semibold text-sm">
                          This Week
                        </div>
                        <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                          {weeklyActivityDataWithTasks.length
                            ? Math.round(
                                weeklyActivityDataWithTasks.reduce((acc, day) => acc + day.completed, 0) / weeklyActivityDataWithTasks.length
                              )
                            : 0
                          }
                          %
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                        <div className="text-green-400 font-semibold text-sm">
                          Goal Achievement
                        </div>
                        <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                          {completedTasksThisWeek}/{totalTasksThisWeek || 1}
                        </div>
                      </div>
                    </div>
                  </div>

                  <WeeklyActivityChart data={weeklyActivity?.days || []} allTasks={allTasks} />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="bg-sky-100/50 rounded-xl p-4 text-center dark:bg-white/10">
                      <div className="text-purple-400 font-semibold text-sm">
                        Best Day
                      </div>
                      <div className="text-indigo-700 text-lg font-bold dark:text-white">
                        {backendBestDay}
                      </div>
                    </div>
                    <div className="bg-sky-100/50 rounded-xl p-4 text-center dark:bg-white/10">
                      <div className="text-orange-400 font-semibold text-sm">
                        Avg Goal
                      </div>
                      <div className="text-indigo-700 text-lg font-bold dark:text-white">
                        {backendAvgGoal}%
                      </div>
                    </div>
                    <div className="bg-sky-100/50 rounded-xl p-4 text-center dark:bg-white/10">
                      <div className="text-cyan-400 font-semibold text-sm">
                        Avg Completed
                      </div>
                      <div className="text-indigo-700 text-lg font-bold dark:text-white">
                        {backendAvgCompleted}%
                      </div>
                    </div>
                    <div className="bg-sky-100/50 rounded-xl p-4 text-center dark:bg-white/10">
                      <div className="text-pink-400 font-semibold text-sm">
                        Streak
                      </div>
                      <div className="text-indigo-700 text-lg font-bold dark:text-white">
                        {backendStreak} days
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status History Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl h-full dark:bg-white/10 dark:border-white/20">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-indigo-700 mb-4 font-poppins dark:text-white">
                    Status History
                  </h2>
                  {statusHistoryLoading ? (
                    <div className="text-center text-sky-600 dark:text-gray-400">Loading status history...</div>
                  ) : (
                    <StatusHistoryChart data={statusHistory} />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Statistics Pie Chart */}
            <div className="lg:col-span-1">
              <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl h-full dark:bg-white/10 dark:border-white/20">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-indigo-700 mb-4 font-poppins dark:text-white">
                    Your Statistics
                  </h2>
                  <StatisticsPieChart data={dashboard?.statistics || { assignments: 0, selfStudy: 0, lectures: 0 }} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Daily Report */}
          <div className="mb-8">
            <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl dark:bg-white/10 dark:border-white/20">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-indigo-700 mb-4 font-poppins dark:text-white">
                  Daily Report
                </h2>
                <DailyReportTable
                  data={dailyReport}
                  setData={setDailyReport}
                  onTaskCreated={handleTaskCreatedOrCompleted}
                />
              </CardContent>
            </Card>
          </div>

          {/* User Achievements */}
          <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-indigo-700 mb-6 font-poppins flex items-center gap-3 dark:text-white">
                <span className="text-4xl">🏆</span>
                Your Achievements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(user?.achievements || []).map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30 text-center"
                  >
                    <div className="text-3xl mb-2">🏅</div>
                    <div className="text-indigo-700 font-bold text-sm dark:text-white">
                      {achievement}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};