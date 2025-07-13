import React from 'react';

export const WeeklyActivityChart = ({ data }) => {
  const maxValue = 100; // Fixed max value for consistent scaling

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
        <div className="absolute left-2 top-4 bottom-16 flex flex-col gap-y-4 text-sky-600 text-xs dark:text-gray-400">
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
                className="absolute w-full border-t border-sky-300/50 dark:border-gray-600/30"
                style={{ bottom: `${value}%` }}
              />
            ))}
          </div>
        </div>

        {/* Chart Bars Area */}
        <div className="ml-10 mr-2 h-45 flex items-end justify-between gap-1 relative z-10 ">
          {data.map((item, index) => (
            <div
              key={item.day}
              className="flex flex-col items-center gap-3 flex-1 bottom-2"
            >
              {/* Bars Container */}
              <div className="relative w-full h-44 flex items-end justify-center gap-1 bottom-2">
                {/* Goal Bar */}
                <div className="relative flex flex-col justify-end">
                  <div
                    className="w-8 bg-blue-500 rounded-t-sm shadow-sm hover:bg-blue-400 transition-all duration-300 group"
                    style={{
                      height: `${(item.goal / maxValue) * 176}px`,
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                      Goal: {item.goal}%
                    </div>
                  </div>
                </div>

                {/* Completed Bar */}
                <div className="relative flex flex-col justify-end">
                  <div
                    className="w-8 bg-green-500 rounded-t-sm shadow-sm hover:bg-green-400 transition-all duration-300 group"
                    style={{
                      height: `${(item.completed / maxValue) * 176}px`,
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                      Done: {item.completed}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Label */}
              <div className="text-indigo-700 font-medium text-sm text-center dark:text-white">
                {item.day}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
