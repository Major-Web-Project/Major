import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { apiService } from '../../../services/api';


// TODO: Database Integration for Calendar Task Statistics
// Replace mock data with actual API calls to fetch daily task completion data
// Database Schema Required:
// 1. daily_task_stats table: user_id, date, total_tasks, completed_tasks, in_progress_tasks, pending_tasks, overdue_tasks
// 2. task_completion_history table: user_id, task_id, completion_date, completion_time, efficiency_score
// 3. user_daily_performance table: user_id, date, productivity_score, time_spent, goals_achieved, streak_count
// 4. calendar_events table: user_id, date, event_type, title, description, priority, status

// TODO: Replace with API call - GET /api/users/{userId}/daily-stats?month={month}&year={year}
// This should fetch daily task completion statistics for the entire month
const generateDummyDailyStats = (year, month) => {
  const stats = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const courses = [
    'Advanced React Development',
    'Database Design & Architecture', 
    'UX Research & Design Thinking',
    'Automated Testing & QA',
    'Advanced Machine Learning',
    'Digital Marketing Analytics',
    'Mobile App Optimization'
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate realistic random data
    const totalTasks = Math.floor(Math.random() * 8) + 2; // 2-10 tasks per day
    const completedTasks = Math.floor(Math.random() * totalTasks);
    const inProgressTasks = Math.floor(Math.random() * (totalTasks - completedTasks));
    const pendingTasks = totalTasks - completedTasks - inProgressTasks;
    const overdueTasks = Math.floor(Math.random() * 2); // 0-1 overdue tasks
    
    stats[dateStr] = {
      date: dateStr,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      totalTimeSpent: Math.round((Math.random() * 8 + 2) * 10) / 10, // 2-10 hours
      productivityScore: Math.round((completedTasks / totalTasks) * 100),
      streakCount: Math.floor(Math.random() * 15) + 1, // 1-15 day streak
      topCourse: courses[Math.floor(Math.random() * courses.length)]
    };
  }
  
  return stats;
};

export const CalendarSection = ({ tasks, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyStats, setDailyStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth(); // 0-based
        const res = await apiService.getCalendarDailyStats(month, year);
        setDailyStats(res.data.dailyStats || {});
      } catch (err) {
        setError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentMonth]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => 
      task.assignedDate === dateStr || 
      task.dueDate === dateStr ||
      (task.assignedDate <= dateStr && task.dueDate >= dateStr)
    );
  };

  const getStatsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dailyStats[dateStr] || null;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getCompletionColor = (completionRate) => {
    if (completionRate >= 90) return 'bg-green-500';
    if (completionRate >= 70) return 'bg-blue-500';
    if (completionRate >= 50) return 'bg-yellow-500';
    if (completionRate >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCompletionIcon = (completionRate) => {
    if (completionRate >= 90) return '🏆';
    if (completionRate >= 70) return '🎯';
    if (completionRate >= 50) return '📈';
    if (completionRate >= 30) return '⚡';
    return '📋';
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-600/30 bg-gray-800/20"></div>
      );
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayStats = getStatsForDate(date);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      const completionRate = dayStats && dayStats.totalTasks > 0 ? Math.round((dayStats.completedTasks / dayStats.totalTasks) * 100) : 0;
      const hasData = dayStats && dayStats.totalTasks > 0;
      days.push(
        <div
          key={day}
          onClick={() => onDateSelect(date)}
          className={`h-24 border border-sky-300/50 p-2 cursor-pointer transition-all duration-300 hover:bg-sky-100/50 relative overflow-hidden dark:border-gray-600/30 dark:hover:bg-white/10 ${
            isSelected ? 'bg-cyan-500/30 border-cyan-400 ring-2 ring-cyan-400/50' : ''
          } ${isToday ? 'ring-2 ring-yellow-400' : ''} ${
            hasData ? 'bg-gradient-to-br from-sky-200/50 to-sky-300/50 dark:from-gray-700/50 dark:to-gray-800/50' : 'bg-sky-50/50 dark:bg-gray-800/20'
          }`}
        >
          <div className={`text-sm font-bold mb-1 ${
            isToday ? 'text-yellow-400' : 
            hasData ? 'text-indigo-700 dark:text-white' : 'text-sky-600 dark:text-gray-500'
          }`}>
            {day}
          </div>
          {hasData && (
            <div className="space-y-1">
              <div className="w-full bg-sky-300/50 rounded-full h-1.5 overflow-hidden dark:bg-gray-600/50">
                <div 
                  className={`h-full transition-all duration-500 ${getCompletionColor(completionRate)}`}
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-700 font-semibold dark:text-white">
                  {dayStats.completedTasks}/{dayStats.totalTasks}
                </span>
                <span className="text-lg">
                  {getCompletionIcon(completionRate)}
                </span>
              </div>
              <div className={`text-xs font-bold text-center ${
                completionRate >= 70 ? 'text-green-400' : 
                completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {completionRate}%
              </div>
            </div>
          )}
          {/* Legacy Task Dots (for tasks not in stats) */}
          {getTasksForDate(date).length > 0 && !hasData && (
            <div className="flex flex-wrap gap-1">
              {getTasksForDate(date).slice(0, 3).map((task, index) => (
                <div
                  key={task.id || index}
                  className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  title={task.title}
                />
              ))}
              {getTasksForDate(date).length > 3 && (
                <div className="text-xs text-sky-600 dark:text-gray-400">+{getTasksForDate(date).length - 3}</div>
              )}
            </div>
          )}
          {/* Today Indicator */}
          {isToday && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          )}
          {/* High Productivity Badge */}
          {hasData && completionRate >= 90 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
              <span className="text-xs">⭐</span>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedDateStats = getStatsForDate(selectedDate);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="bg-mint-100 border border-mint-200 rounded-3xl shadow-2xl dark:bg-white/10 dark:border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-indigo-700 font-poppins flex items-center gap-2 dark:text-white">
            <span className="text-3xl">📅</span>
            Smart Calendar
          </h2>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigateMonth('prev')}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full border-0 text-white transition-all duration-300 hover:scale-110"
            >
              ‹
            </Button>
            <h3 className="text-xl font-semibold text-indigo-700 min-w-[200px] text-center dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <Button
              onClick={() => navigateMonth('next')}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full border-0 text-white transition-all duration-300 hover:scale-110"
            >
              ›
            </Button>
          </div>
        </div>

        {loading && <div className="text-center text-gray-500 py-8">Loading calendar...</div>}
        {error && <div className="text-center text-red-500 py-8">{error}</div>}

        {/* Calendar Grid */}
        {!loading && !error && (
          <div className="bg-sky-100/50 rounded-xl p-4 border border-sky-200/50 mb-6 dark:bg-gray-800/60 dark:border-gray-700/50">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {dayNames.map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-sky-700 font-medium dark:text-gray-300">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0">
              {renderCalendarDays()}
            </div>
          </div>
        )}

        {/* Selected Date Statistics */}
        {selectedDateStats && !loading && !error && (
          <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl p-6 border border-purple-400/30 mb-6 animate-fadeIn">
            <h3 className="text-indigo-700 font-bold text-xl mb-4 flex items-center gap-3 dark:text-white">
              <span className="text-2xl">📊</span>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-500/20 p-4 rounded-xl border border-blue-400/30 text-center">
                <div className="text-blue-400 font-semibold text-sm">Total Tasks</div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">{selectedDateStats.totalTasks}</div>
              </div>
              <div className="bg-green-500/20 p-4 rounded-xl border border-green-400/30 text-center">
                <div className="text-green-400 font-semibold text-sm">Completed</div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">{selectedDateStats.completedTasks}</div>
              </div>
              <div className="bg-yellow-500/20 p-4 rounded-xl border border-yellow-400/30 text-center">
                <div className="text-yellow-400 font-semibold text-sm">In Progress</div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">{selectedDateStats.inProgressTasks}</div>
              </div>
              <div className="bg-purple-500/20 p-4 rounded-xl border border-purple-400/30 text-center">
                <div className="text-purple-400 font-semibold text-sm">Productivity</div>
                <div className="text-indigo-700 text-2xl font-bold dark:text-white">{selectedDateStats.totalTasks > 0 ? Math.round((selectedDateStats.completedTasks / selectedDateStats.totalTasks) * 100) : 0}%</div>
              </div>
            </div>
            {/* You can add more detailed metrics here if your backend provides them */}
          </div>
        )}

        {/* Enhanced Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/20">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-300 text-sm">90%+ Complete</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/20">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-300 text-sm">70-89% Complete</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/20">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-300 text-sm">50-69% Complete</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/20">
            <div className="w-4 h-4 ring-2 ring-yellow-400 rounded"></div>
            <span className="text-gray-300 text-sm">Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};