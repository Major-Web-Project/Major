import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { WeeklyActivityChart } from './components/WeeklyActivityChart';
import { StatusHistoryChart } from './components/StatusHistoryChart';
import { StatisticsPieChart } from './components/StatisticsPieChart';
import { DailyReportTable } from './components/DailyReportTable';
import { NavigationBarSection } from '../FrameScreen/sections/NavigationBarSection';
import { dashboardData, currentUser } from '../../data/mockData';
import { aiAssistant } from '../../services/aiLearningService';

export const DashboardScreen = ({ userProfile, learningData, dashboardData: aiDashboardData, aiTasksData }) => {
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [displayData, setDisplayData] = useState(dashboardData);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const fetchDashboardData = async () => {
      try {
        // Initialize AI assistant if user profile exists
        if (userProfile) {
          aiAssistant.userProfile = userProfile;
          const insights = aiAssistant.getLearningAnalytics();
          setAiInsights(insights);
        }

        // Use AI dashboard data if available, otherwise use mock data
        if (aiDashboardData && aiTasksData) {
          setDisplayData({
            ...dashboardData,
            ...aiDashboardData,
            // Convert AI tasks to daily report format
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
  }, [userProfile, aiDashboardData, aiTasksData]);

  const handleStartAIAssessment = () => {
    const assessmentEvent = new CustomEvent('navigateToAssessment');
    window.dispatchEvent(assessmentEvent);
  };

  const handleViewAIDashboard = () => {
    if (learningData) {
      const learningDashboardEvent = new CustomEvent('navigateToLearningDashboard');
      window.dispatchEvent(learningDashboardEvent);
    }
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
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80"></div>
        </div>

        <div className="relative z-20">
          <NavigationBarSection />
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

        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80"></div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
        </div>
      </div>

      <div className="relative z-20 w-full">
        <NavigationBarSection />

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Enhanced Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-6">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-cyan-400/50"
              />
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 font-poppins">
                  Dashboard Overview
                </h1>
                <p className="text-gray-300 text-lg">
                  {currentUser.role} • {currentUser.currentStreak} day learning streak 🔥
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
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-cyan-400 font-semibold text-sm">
                  {learningData ? 'AI Tasks Generated' : 'Courses Enrolled'}
                </div>
                <div className="text-white text-2xl font-bold">
                  {learningData ? (aiTasksData?.length || 0) : currentUser.coursesEnrolled}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-green-400 font-semibold text-sm">
                  Tasks Completed
                </div>
                <div className="text-white text-2xl font-bold">
                  {aiInsights?.totalTasksCompleted || currentUser.tasksCompleted}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-purple-400 font-semibold text-sm">
                  Learning Hours
                </div>
                <div className="text-white text-2xl font-bold">
                  {aiInsights?.timeSpentTotal?.toFixed(1) || currentUser.totalHoursLearned}h
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-orange-400 font-semibold text-sm">
                  {learningData ? 'AI Efficiency' : 'Skills Gained'}
                </div>
                <div className="text-white text-2xl font-bold">
                  {learningData 
                    ? `${Math.round((aiInsights?.averageEfficiency || 0) * 100)}%`
                    : currentUser.skillsGained.length
                  }
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          {aiInsights && learningData && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6 font-poppins flex items-center gap-3">
                  <span className="text-4xl">🤖</span>
                  AI Learning Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-400/30">
                    <div className="text-blue-400 font-semibold text-sm mb-2">AI Efficiency Score</div>
                    <div className="text-white text-3xl font-bold">
                      {Math.round((aiInsights.averageEfficiency || 0) * 100)}%
                    </div>
                    <div className="text-blue-300 text-xs">Based on task completion</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-400/30">
                    <div className="text-green-400 font-semibold text-sm mb-2">AI Tasks Completed</div>
                    <div className="text-white text-3xl font-bold">
                      {aiInsights.totalTasksCompleted || 0}
                    </div>
                    <div className="text-green-300 text-xs">AI-generated assignments</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30">
                    <div className="text-purple-400 font-semibold text-sm mb-2">Learning Time</div>
                    <div className="text-white text-3xl font-bold">
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
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-white font-poppins flex items-center gap-3">
                        <span className="text-4xl">📊</span>
                        Weekly Activity
                      </h2>
                      <p className="text-gray-300 text-lg">
                        Your learning progress throughout the week
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-400/30">
                        <div className="text-cyan-400 font-semibold text-sm">
                          This Week
                        </div>
                        <div className="text-white text-2xl font-bold">
                          {Math.round(
                            displayData.weeklyActivity.reduce(
                              (acc, day) => acc + day.completed,
                              0
                            ) / displayData.weeklyActivity.length
                          )}
                          %
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                        <div className="text-green-400 font-semibold text-sm">
                          Goal Achievement
                        </div>
                        <div className="text-white text-2xl font-bold">
                          {
                            displayData.weeklyActivity.filter(
                              (day) => day.completed >= day.goal
                            ).length
                          }
                          /7
                        </div>
                      </div>
                    </div>
                  </div>

                  <WeeklyActivityChart data={displayData.weeklyActivity} />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-purple-400 font-semibold text-sm">
                        Best Day
                      </div>
                      <div className="text-white text-lg font-bold">
                        {
                          displayData.weeklyActivity.reduce((best, day) =>
                            day.completed > best.completed ? day : best
                          ).day
                        }
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-orange-400 font-semibold text-sm">
                        Avg Goal
                      </div>
                      <div className="text-white text-lg font-bold">
                        {Math.round(
                          displayData.weeklyActivity.reduce(
                            (acc, day) => acc + day.goal,
                            0
                          ) / displayData.weeklyActivity.length
                        )}
                        %
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-cyan-400 font-semibold text-sm">
                        Avg Completed
                      </div>
                      <div className="text-white text-lg font-bold">
                        {Math.round(
                          displayData.weeklyActivity.reduce(
                            (acc, day) => acc + day.completed,
                            0
                          ) / displayData.weeklyActivity.length
                        )}
                        %
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-pink-400 font-semibold text-sm">
                        Streak
                      </div>
                      <div className="text-white text-lg font-bold">
                        {currentUser.currentStreak} days
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status History Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl h-full">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 font-poppins">
                    Status History
                  </h2>
                  <StatusHistoryChart data={displayData.statusHistory} />
                </CardContent>
              </Card>
            </div>

            {/* Statistics Pie Chart */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl h-full">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 font-poppins">
                    Your Statistics
                  </h2>
                  <StatisticsPieChart data={displayData.statistics} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Daily Report */}
          <div className="mb-8">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4 font-poppins">
                  Daily Report
                </h2>
                <DailyReportTable data={displayData.dailyReport} />
              </CardContent>
            </Card>
          </div>

          {/* User Achievements */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white mb-6 font-poppins flex items-center gap-3">
                <span className="text-4xl">🏆</span>
                Your Achievements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentUser.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30 text-center"
                  >
                    <div className="text-3xl mb-2">🏅</div>
                    <div className="text-white font-bold text-sm">
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