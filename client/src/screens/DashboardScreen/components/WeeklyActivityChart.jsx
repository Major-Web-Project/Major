import React from 'react';

export const WeeklyActivityChart = ({ data, allTasks }) => {
  const maxValue = 100;

  const today = new Date();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function calculateDailyProgress(allTasks, currentDate = new Date()) {
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const parseDate = (dateStr) => new Date(dateStr);

    // TASKS THAT WERE PENDING AT START OF DAY
    const tasksPendingAtStartOfDay = allTasks.filter(task => {
      const createdAt = parseDate(task.createdAt);
      const updatedAt = parseDate(task.updatedAt);
      const status = task.data?.status;

      // Task must have been created before today ends
      if (createdAt > endOfDay) return false;

      // If it was already completed before the day started, it's not a goal
      if (status === 'completed' && updatedAt < startOfDay) return false;

      // If still pending at start of day, or completed during today
      return createdAt <= endOfDay;
    });

    // TASKS COMPLETED TODAY
    const tasksCompletedToday = allTasks.filter(task => {
      const updatedAt = parseDate(task.updatedAt);
      const status = task.data?.status;

      return status === 'completed' && updatedAt >= startOfDay && updatedAt <= endOfDay;
    });

    const totalGoal = tasksPendingAtStartOfDay.length;
    const completedCount = tasksCompletedToday.length;
    const completionPercent = totalGoal === 0 ? 0 : Math.round((completedCount / totalGoal) * 100);

    return {
      totalGoal,
      completedCount,
      completionPercent,
    };
  }

  // Generate data for the last 7 days
  const dataToRender = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dayOfWeek = dayLabels[date.getDay()];
    const dateString = date.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local time

    const progress = calculateDailyProgress(allTasks, date);

    const cappedCompletionPercent = Math.min(100, progress.completionPercent);

    return {
      day: dayOfWeek,
      date: dateString,
      goal: progress.totalGoal, // optional: for tooltip
      completed: cappedCompletionPercent,
      totalTasks: progress.totalGoal,
      completedTasks: progress.completedCount,
    };
  });

  const todayIndex = dataToRender.findIndex((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getFullYear() === today.getFullYear() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getDate() === today.getDate()
    );
  });

  const maxGoalTasks = Math.max(...dataToRender.map((d) => d.goal), 1); // avoid division by zero

  // Log today's progress
  const todayProgress = calculateDailyProgress(allTasks);

  return (
    <div className="w-full bg-transparent">
      {/* Chart Title and Legend */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-indigo-700 text-sm font-medium dark:text-white">Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-indigo-700 text-sm font-medium dark:text-white">Completed</span>
          </div>
        </div>
        <div className="text-sky-600 text-sm dark:text-gray-400">Weekly Progress %</div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-sky-100/50 rounded-xl p-6 border border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 bottom-16 flex flex-col gap-y-4 text-neutral-700 text-xs dark:text-gray-400">
          <span>100%</span>
          <span>80%</span>
          <span>60%</span>
          <span>40%</span>
          <span>20%</span>
          <span>0%</span>
        </div>

        {/* Horizontal Grid Lines */}
        <div className="absolute left-10 right-2 top-4 bottom-16">
          <div className="relative h-full">
            {[0, 20, 40, 60, 80, 100].map((value) => (
              <div
                key={value}
                className="absolute w-full border-t border-neutral-600"
                style={{ bottom: `${value}%` }}
              />
            ))}
          </div>
        </div>

        {/* Chart Bars Area */}
        <div className="ml-10 mr-2 h-[170px] flex items-end justify-between gap-1 relative z-10">
          {dataToRender.map((item, index) => {
            const isToday = index === todayIndex;
            const isLast = index === dataToRender.length - 1;

            const goalHeight = 140;

            return (
              <div
                key={item.day + (item.date || index)}
                className={`flex flex-col items-center gap-3 flex-1 bottom-2 relative
                  ${isToday ? 'border-2 border-black dark:border-white shadow-[0_0_0_4px_rgba(128,128,128,0.15)] dark:shadow-[0_0_0_4px_rgba(128,128,128,0.25)] rounded-xl z-20' : ''}
                  ${isLast && !isToday ? 'z-10' : ''}`}
              >
                {isLast && !isToday && (
                  <div
                    className="absolute left-0 right-0 -top-4 -bottom-4 rounded-xl border-2 border-black dark:border-white pointer-events-none shadow-[0_0_16px_rgba(0,0,0,0.22)] dark:shadow-[0_0_16px_rgba(255,255,255,0.18)]"
                    style={{ boxSizing: 'border-box' }}
                  />
                )}

                {/* Bars Container */}
                <div className="relative w-full h-[170px] flex items-end justify-center gap-1">
                  {/* Goal Bar */}
                  <div className="relative flex flex-col justify-end group">
                    <div
                      className="w-8 rounded-t-sm shadow-sm transition-all duration-300 bg-blue-500 hover:bg-blue-400"
                      style={{ height: `${goalHeight}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                        Goal (Pending/In-progress): {item.goal}
                      </div>
                    </div>
                  </div>

                  {/* Completed Bar */}
                  <div className="relative flex flex-col justify-end group">
                    <div
                      className="w-8 rounded-t-sm shadow-sm transition-all duration-300 bg-green-500 hover:bg-green-400"
                      style={{ height: `${(item.completed / maxValue) * goalHeight}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                        Completed Tasks: {item.completedTasks}
                        <br />
                        Completion: {item.completed}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day Label */}
                <div className="text-indigo-700 font-medium text-sm text-center dark:text-white">
                  {item.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
