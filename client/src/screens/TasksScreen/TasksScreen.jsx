import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CalendarSection } from './components/CalendarSection';
import { DailyTaskChargeSection } from './components/DailyTaskChargeSection';
import { TaskReportSection } from './components/TaskReportSection';
import { apiService } from '../../services/api';

export const TasksScreen = ({ userProfile, learningData, aiTasksData, roadmap, goalData, onTaskComplete }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForDate, setTasksForDate] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [errorTasks, setErrorTasks] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchUserTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await apiService.getTasks();
        // Map backend tasks to UI format (flatten data field)
        const userTasks = res.data.tasks.map(task => ({
          id: task._id,
          ...task.data,
          status: task.status || (task.data ? task.data.status : "pending") || "pending"
        }));
        setTasks(userTasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchUserTasks();
  }, []);

  // Fetch tasks for the selected date from backend
  useEffect(() => {
    const fetchTasksForDate = async () => {
      setLoadingTasks(true);
      setErrorTasks(null);
      try {
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const res = await apiService.getTasksByDate(dateStr);
        // Flatten the data field for each task
        const mappedTasks = (res.data.tasks || []).map(task => ({
          id: task._id,
          ...task.data,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }));
        setTasksForDate(mappedTasks);
      } catch (err) {
        setErrorTasks('Failed to fetch tasks for this date');
        setTasksForDate([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasksForDate();
  }, [selectedDate]);

  // Get current course name for display
  const getCurrentCourseName = () => {
    if (learningData && goalData) {
      return `AI ${goalData.learningPath || 'Personalized Learning'}`;
    }
    return 'Current Course';
  };

  if (loadingTasks) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-mint-100 text-indigo-700 dark:bg-background dark:text-primary">
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

        <div className="relative z-20">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-indigo-700 text-2xl font-semibold dark:text-white">
                Loading your AI tasks...
              </p>
              <p className="text-sky-600 text-lg mt-2 dark:text-gray-400">
                Generating personalized assignments and deadlines
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-mint-100 text-indigo-700 dark:bg-background dark:text-primary">
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
          {/* Enhanced Header with AI Integration */}
          <div className="mb-10">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 font-poppins">
              AI Task Management
            </h1>
            <p className="text-gray-300 text-xl mb-6 dark:text-gray-300">
              Track your AI-generated learning tasks and monitor your progress
            </p>

            {/* Current Course Display */}
            <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl p-6 mb-6 border border-purple-400/30">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🎓</span>
                <div>
                  <div className="text-indigo-700 font-bold text-xl dark:text-white">
                    Current Course: {getCurrentCourseName()}
                  </div>
                  <div className="text-sky-700 text-sm dark:text-gray-300">
                    {learningData ? (
                      <>
                        Phase {learningData.currentPhase} • Day {learningData.dayNumber} • 
                        AI-Powered Learning Path
                      </>
                    ) : (
                      'Your personalized learning journey'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-sky-100/50 backdrop-blur-sm rounded-xl p-4 border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                <div className="text-cyan-400 font-semibold text-sm">
                  Total Tasks
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {tasksForDate.length}
                </div>
                <div className="text-sky-600 text-xs dark:text-gray-400">
                  {tasksForDate.filter(t => t.isAIGenerated).length} AI-generated
                </div>
              </div>
              <div className="bg-sky-100/50 backdrop-blur-sm rounded-xl p-4 border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                <div className="text-green-400 font-semibold text-sm">
                  Completed
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {tasksForDate.filter((t) => t.status === 'completed').length}
                </div>
                <div className="text-sky-600 text-xs dark:text-gray-400">
                  {Math.round(
                    (tasksForDate.filter((t) => t.status === 'completed').length /
                      Math.max(tasksForDate.length, 1)) * 100
                  )}% completion rate
                </div>
              </div>
              <div className="bg-sky-100/50 backdrop-blur-sm rounded-xl p-4 border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                <div className="text-purple-400 font-semibold text-sm">
                  In Progress
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {tasksForDate.filter(t => t.status === 'in-progress').length}
                </div>
                <div className="text-sky-600 text-xs dark:text-gray-400">Active tasks</div>
              </div>
              <div className="bg-sky-100/50 backdrop-blur-sm rounded-xl p-4 border border-sky-200/50 dark:bg-white/10 dark:border-white/20">
                <div className="text-orange-400 font-semibold text-sm">
                  Productivity
                </div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">
                  {tasksForDate.length > 0 ? Math.round((tasksForDate.filter(t => t.status === 'completed').length / tasksForDate.length) * 100) : 0}%
                </div>
                <div className="text-sky-600 text-xs dark:text-gray-400">Today's productivity</div>
              </div>
            </div>
          </div>

          {/* Main Side-by-Side Layout */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Calendar on the left */}
            <div className="w-full lg:w-1/2 xl:w-2/5">
              <CalendarSection
                tasks={tasksForDate}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
            {/* Daily Report Table on the right */}
            <div className="w-full lg:w-1/2 xl:w-3/5">
              <DailyTaskChargeSection
                selectedDate={selectedDate}
                tasks={tasksForDate}
                loading={loadingTasks}
                error={errorTasks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};