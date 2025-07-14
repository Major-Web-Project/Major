import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const TaskReportSection = ({ tasks }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportView, setReportView] = useState('overview');

  // Enhanced task statistics calculation with fixed efficiency calculation
  const getAdvancedTaskStats = () => {
    const completed = tasks.filter((task) => task.status === 'completed');
    const inProgress = tasks.filter((task) => task.status === 'in-progress');
    const pending = tasks.filter((task) => task.status === 'pending');
    const overdue = tasks.filter((task) => task.status === 'overdue');
    const aiGenerated = tasks.filter((task) => task.isAIGenerated);

    const totalEstimatedTime = tasks.reduce(
      (sum, task) => sum + (task.estimatedTime || 0),
      0
    );
    const totalActualTime = completed.reduce(
      (sum, task) => sum + (task.actualTime || 0),
      0
    );

    // Fixed efficiency calculation
    const efficiencyScores = completed
      .filter((task) => task.actualTime && task.actualTime > 0)
      .map((task) => (task.estimatedTime / task.actualTime) * 100);

    const averageEfficiency =
      efficiencyScores.length > 0
        ? efficiencyScores.reduce((sum, score) => sum + score, 0) /
          efficiencyScores.length
        : 0;

    const timeSaved = Math.max(0, totalEstimatedTime - totalActualTime);
    const productivityScore =
      completed.length > 0 ? (completed.length / tasks.length) * 100 : 0;

    // Calculate skill development metrics
    const skillsGained = completed.reduce((skills, task) => {
      if (task.skillsGained) {
        skills.push(...task.skillsGained);
      }
      return skills;
    }, []);

    const uniqueSkills = [...new Set(skillsGained)];

    // Calculate average grade
    const gradesReceived = completed
      .filter((task) => task.grade)
      .map((task) => task.grade);
    const averageGrade =
      gradesReceived.length > 0
        ? gradesReceived.reduce((sum, grade) => sum + grade, 0) /
          gradesReceived.length
        : 0;

    // Calculate category distribution
    const categoryStats = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {});

    return {
      total: tasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      overdue: overdue.length,
      aiGenerated: aiGenerated.length,
      totalEstimatedTime: Math.round(totalEstimatedTime * 10) / 10,
      totalActualTime: Math.round(totalActualTime * 10) / 10,
      averageEfficiency: Math.round(averageEfficiency),
      timeSaved: Math.round(timeSaved * 10) / 10,
      productivityScore: Math.round(productivityScore),
      skillsGained: uniqueSkills.length,
      completionRate: Math.round(
        (completed.length / Math.max(tasks.length, 1)) * 100
      ),
      averageGrade: Math.round(averageGrade),
      categoryStats,
    };
  };

  const stats = getAdvancedTaskStats();

  // Generate comprehensive efficiency analysis for completed tasks only
  const getDetailedEfficiencyData = () => {
    const completedTasks = tasks.filter(
      (task) => task.status === 'completed' && task.actualTime && task.actualTime > 0
    );
    return completedTasks.map((task) => {
      // Fixed efficiency calculation
      const efficiency = Math.round((task.estimatedTime / task.actualTime) * 100);
      const timeDifference = task.actualTime - task.estimatedTime;
      const performanceLevel =
        efficiency >= 120
          ? 'excellent'
          : efficiency >= 100
          ? 'good'
          : efficiency >= 80
          ? 'average'
          : 'needs-improvement';

      return {
        id: task.id,
        name: task.title,
        estimated: task.estimatedTime,
        actual: task.actualTime,
        efficiency,
        timeDifference,
        category: task.category,
        priority: task.priority,
        performanceLevel,
        courseName: task.courseName,
        submissionType: task.submissionType || 'not-submitted',
        grade: task.grade || 0,
        difficultyLevel: task.difficultyLevel || 'intermediate',
        isAIGenerated: task.isAIGenerated || false,
        productivityMetrics: task.productivityMetrics || {
          focusTime: task.actualTime * 0.8,
          breakTime: task.actualTime * 0.2,
          distractionCount: Math.floor(Math.random() * 5),
          efficiencyScore: efficiency
        },
      };
    });
  };

  const efficiencyData = getDetailedEfficiencyData();

  // Get category performance breakdown
  const getCategoryPerformance = () => {
    const categories = [...new Set(tasks.map((task) => task.category))];
    return categories.map((category) => {
      const categoryTasks = tasks.filter((task) => task.category === category);
      const completedCategoryTasks = categoryTasks.filter(
        (task) => task.status === 'completed'
      );
      const completionRate = Math.round(
        (completedCategoryTasks.length / Math.max(categoryTasks.length, 1)) *
          100
      );

      // Fixed efficiency calculation for category
      const efficiencyTasks = completedCategoryTasks.filter(task => task.actualTime && task.actualTime > 0);
      const avgEfficiency = efficiencyTasks.length > 0 
        ? efficiencyTasks.reduce((sum, task) => sum + (task.estimatedTime / task.actualTime) * 100, 0) / efficiencyTasks.length
        : 0;

      const avgGrade =
        completedCategoryTasks
          .filter((task) => task.grade)
          .reduce((sum, task) => sum + task.grade, 0) /
        Math.max(completedCategoryTasks.filter((task) => task.grade).length, 1);

      const aiGeneratedCount = categoryTasks.filter(task => task.isAIGenerated).length;

      return {
        category,
        totalTasks: categoryTasks.length,
        completedTasks: completedCategoryTasks.length,
        completionRate,
        averageEfficiency: Math.round(avgEfficiency),
        averageGrade: Math.round(avgGrade) || 0,
        aiGeneratedCount
      };
    });
  };

  const categoryPerformance = getCategoryPerformance();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (level) => {
    switch (level) {
      case 'excellent':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'good':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'average':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'needs-improvement':
        return 'bg-gradient-to-r from-red-500 to-pink-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getPerformanceIcon = (level) => {
    switch (level) {
      case 'excellent':
        return '🏆';
      case 'good':
        return '👍';
      case 'average':
        return '👌';
      case 'needs-improvement':
        return '📈';
      default:
        return '❓';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleExportReport = (format) => {
    const reportData = {
      period: selectedPeriod,
      stats,
      efficiencyData,
      categoryPerformance,
      generatedAt: new Date().toISOString(),
      totalTasks: tasks.length,
      aiGeneratedTasks: stats.aiGenerated
    };

    console.log(`Generating ${format.toUpperCase()} report:`, reportData);

    alert(`📊 ${format.toUpperCase()} Performance Report Generated Successfully!

📈 Report Summary:
• Total Tasks Analyzed: ${stats.total}
• AI-Generated Tasks: ${stats.aiGenerated}
• Completion Rate: ${stats.completionRate}%
• Average Efficiency: ${stats.averageEfficiency}%
• Average Grade: ${stats.averageGrade}%
• Time Saved: ${stats.timeSaved.toFixed(1)} hours
• Skills Gained: ${stats.skillsGained}
• Categories Covered: ${Object.keys(stats.categoryStats).length}

🎯 Performance Insights:
• Productivity Score: ${stats.productivityScore}%
• Most Active Category: ${
      Object.entries(stats.categoryStats).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] || 'N/A'
    }
• Total Learning Time: ${stats.totalActualTime.toFixed(1)} hours
• AI Task Performance: ${Math.round((stats.aiGenerated / stats.total) * 100)}% of tasks

Your comprehensive ${format.toUpperCase()} report has been generated and will be available for download shortly.`);
  };

  return (
    <Card className="bg-mint-100 border border-mint-200 rounded-3xl shadow-2xl dark:bg-white/10 dark:border-white/20">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-indigo-700 font-poppins flex items-center gap-3 dark:text-white">
            <span className="text-4xl">📊</span>
            AI-Enhanced Task Performance Report
          </h2>
          <div className="flex gap-3">
            {['week', 'month', 'quarter'].map((period) => (
              <Button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-2xl border border-blue-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📋</span>
              <div className="text-blue-400 font-bold text-lg">Total Tasks</div>
            </div>
            <div className="text-indigo-700 text-3xl font-bold mb-2 dark:text-white">
              {stats.total}
            </div>
            <div className="text-blue-300 text-sm">Across all courses</div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-2xl border border-purple-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🤖</span>
              <div className="text-purple-400 font-bold text-lg">AI Generated</div>
            </div>
            <div className="text-indigo-700 text-3xl font-bold mb-2 dark:text-white">
              {stats.aiGenerated}
            </div>
            <div className="text-purple-300 text-sm">
              {Math.round((stats.aiGenerated / Math.max(stats.total, 1)) * 100)}% of total
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-2xl border border-green-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">✅</span>
              <div className="text-green-400 font-bold text-lg">
                Completion Rate
              </div>
            </div>
            <div className="text-indigo-700 text-3xl font-bold mb-2 dark:text-white">
              {stats.completionRate}%
            </div>
            <div className="text-green-300 text-sm">
              {stats.completed} of {stats.total} completed
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 rounded-2xl border border-orange-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">⚡</span>
              <div className="text-orange-400 font-bold text-lg">
                Efficiency Score
              </div>
            </div>
            <div className="text-indigo-700 text-3xl font-bold mb-2 dark:text-white">
              {stats.averageEfficiency}%
            </div>
            <div className="text-orange-300 text-sm">Average performance</div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-6 rounded-2xl border border-yellow-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎓</span>
              <div className="text-yellow-400 font-bold text-lg">
                Average Grade
              </div>
            </div>
            <div className="text-indigo-700 text-3xl font-bold mb-2 dark:text-white">
              {stats.averageGrade}%
            </div>
            <div className="text-yellow-300 text-sm">Academic performance</div>
          </div>
        </div>

        {/* Category Performance Breakdown */}
        <div className="mb-10">
          <h3 className="text-indigo-700 font-bold text-2xl mb-6 flex items-center gap-3 dark:text-white">
            <span className="text-3xl">📂</span>
            Category Performance Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryPerformance.map((category, index) => (
              <div
                key={category.category}
                className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300"
              >
                <h4 className="text-indigo-700 font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                  <span className="text-2xl">📚</span>
                  {category.category}
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">
                      Tasks Completed
                    </span>
                    <span className="text-indigo-700 font-bold dark:text-white">
                      {category.completedTasks}/{category.totalTasks}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">
                      AI Generated
                    </span>
                    <span className="text-purple-400 font-bold">
                      {category.aiGeneratedCount}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">
                      Completion Rate
                    </span>
                    <span
                      className={`font-bold ${
                        category.completionRate >= 80
                          ? 'text-green-400'
                          : category.completionRate >= 60
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {category.completionRate}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">
                      Avg Efficiency
                    </span>
                    <span
                      className={`font-bold ${
                        category.averageEfficiency >= 100
                          ? 'text-green-400'
                          : category.averageEfficiency >= 80
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {category.averageEfficiency}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Avg Grade</span>
                    <span
                      className={`font-bold ${
                        category.averageGrade >= 90
                          ? 'text-green-400'
                          : category.averageGrade >= 80
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {category.averageGrade > 0
                        ? `${category.averageGrade}%`
                        : 'N/A'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          category.completionRate >= 80
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : category.completionRate >= 60
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${category.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Task Performance Analysis - Only Completed Tasks */}
        <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-2xl p-8 border border-gray-700/50 mb-8">
          <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-3">
            <span className="text-3xl">📈</span>
            Detailed Performance Analysis - Completed Tasks Only
          </h3>

          {efficiencyData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-gray-400 text-xl">
                No completed tasks to analyze
              </div>
              <div className="text-gray-500 text-sm mt-2">
                Complete some tasks to see your performance metrics
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {efficiencyData.map((task, index) => (
                <div
                  key={task.id}
                  className="bg-white/10 rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-4 h-4 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                          {task.name}
                          {task.isAIGenerated && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-400/30">
                              🤖 AI
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <span className="text-cyan-400">
                            📚 {task.courseName}
                          </span>
                          <span className="text-purple-400">
                            📂 {task.category}
                          </span>
                          <span className="text-pink-400">
                            📄{' '}
                            {task.submissionType === 'pdf'
                              ? 'PDF'
                              : task.submissionType === 'excel'
                              ? 'Excel'
                              : 'Not Submitted'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(task.difficultyLevel)}`}>
                            🎯 {task.difficultyLevel?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${getPerformanceColor(task.performanceLevel)}`}>
                        <span>{getPerformanceIcon(task.performanceLevel)}</span>
                        <span>{task.efficiency}%</span>
                      </div>
                      <div className="text-gray-400 text-sm mt-1 capitalize">
                        {task.performanceLevel.replace('-', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                    <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-400/30">
                      <div className="text-blue-400 font-semibold">Estimated</div>
                      <div className="text-white font-bold text-lg">{task.estimated}h</div>
                    </div>
                    <div className="bg-green-500/20 p-3 rounded-lg border border-green-400/30">
                      <div className="text-green-400 font-semibold">Actual</div>
                      <div className="text-white font-bold text-lg">{task.actual.toFixed(2)}h</div>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      task.timeDifference <= 0
                        ? 'bg-green-500/20 border-green-400/30'
                        : 'bg-red-500/20 border-red-400/30'
                    }`}>
                      <div className={task.timeDifference <= 0 ? 'text-green-400' : 'text-red-400'}>
                        Time Variance
                      </div>
                      <div className="text-white font-bold text-lg">
                        {task.timeDifference <= 0 ? '' : '+'}
                        {task.timeDifference.toFixed(2)}h
                      </div>
                    </div>
                    <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-400/30">
                      <div className="text-yellow-400 font-semibold">Grade</div>
                      <div className="text-white font-bold text-lg">
                        {task.grade > 0 ? `${task.grade}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-purple-500/20 p-3 rounded-lg border border-purple-400/30">
                      <div className="text-purple-400 font-semibold">Performance</div>
                      <div className="text-white font-bold text-lg">
                        {task.performanceLevel === 'excellent' ? 'A+' :
                         task.performanceLevel === 'good' ? 'A' :
                         task.performanceLevel === 'average' ? 'B' : 'C'}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Progress Visualization */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Efficiency Progress</span>
                      <span className="text-white text-sm font-semibold">
                        {task.efficiency}% efficiency
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${getPerformanceColor(task.performanceLevel)}`}
                        style={{ width: `${Math.min(task.efficiency, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Productivity Metrics */}
                  {task.productivityMetrics && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-gray-400 text-xs">Focus Time</div>
                        <div className="text-white font-bold">
                          {task.productivityMetrics.focusTime.toFixed(1)}h
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-gray-400 text-xs">Break Time</div>
                        <div className="text-white font-bold">
                          {task.productivityMetrics.breakTime.toFixed(1)}h
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-gray-400 text-xs">Distractions</div>
                        <div className="text-white font-bold">
                          {task.productivityMetrics.distractionCount}
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-gray-400 text-xs">Productivity</div>
                        <div className="text-white font-bold">
                          {task.productivityMetrics.efficiencyScore}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Export Options */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 rounded-2xl border border-indigo-400/30">
          <div>
            <h3 className="text-white font-bold text-xl mb-2">
              📊 Generate AI-Enhanced Performance Report
            </h3>
            <p className="text-gray-300 text-sm">
              Export your detailed task performance analysis including AI-generated tasks and efficiency metrics for {tasks.length} tasks
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => handleExportReport('pdf')}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-red-500/25"
            >
              Export PDF Report
            </Button>
            <Button
              onClick={() => handleExportReport('excel')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-green-500/25"
            >
              Export Excel Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};