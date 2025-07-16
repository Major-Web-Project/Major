import React, { useState } from 'react';

export const StatusHistoryChart = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const history = data || [];
  const safeHistory = history.map(item => ({
    date: item?.date || '',
    value: typeof item?.value === 'number' ? item.value : 0
  }));

  const maxValue = Math.max(...safeHistory.map((d) => d.value));
  const minValue = Math.min(...safeHistory.map((d) => d.value));
  const range = maxValue - minValue;

  // Generate SVG path for the line chart
  const generatePath = () => {
    if (safeHistory.length === 0) return '';
    const width = 400;
    const height = 350;
    const padding = 20;
    const points = safeHistory.map((item, index) => {
      const x = padding + (index / (safeHistory.length - 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        ((item.value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    if (points.length === 0) return '';
    return `M ${points.join(' L ')}`;
  };

  // Generate area path for gradient fill
  const generateAreaPath = () => {
    if (safeHistory.length === 0) return '';
    const width = 400;
    const height = 350;
    const padding = 20;
    const points = safeHistory.map((item, index) => {
      const x = padding + (index / (safeHistory.length - 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        ((item.value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    if (points.length === 0) return '';
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (!firstPoint || !lastPoint) return '';
    const lastX = lastPoint.split(',')[0];
    const firstX = firstPoint.split(',')[0];
    return `M ${firstX},${height - padding} L ${points.join(' L ')} L ${lastX},${height - padding} Z`;
  };

  // Helper to format date as 'MMM d'
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="w-full h-[500px] bg-gradient-to-br from-sky-100/50 to-sky-200/50 rounded-2xl p-6 backdrop-blur-sm border border-sky-200/50 dark:from-gray-900/50 dark:to-gray-800/50 dark:border-white/10">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sky-600 text-sm dark:text-gray-400">Progress Over Time</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
          <span className="text-indigo-700 text-sm dark:text-white">Performance</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative w-full h-[350px] overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 350"
          className="absolute inset-0"
        >
          {/* Grid Lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="35"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 35"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </pattern>

            {/* Gradient for area fill */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
            </linearGradient>

            {/* Gradient for line */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Area under curve */}
          <path
            d={generateAreaPath()}
            fill="url(#areaGradient)"
            className="animate-fadeIn"
          />

          {/* Main line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-fadeIn"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))',
            }}
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sky-600 text-xs py-4 dark:text-gray-400">
          <span>{maxValue}%</span>
          <span>{Math.round((maxValue + minValue) / 2)}%</span>
          <span>{minValue}%</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-sky-600 text-xs px-6 dark:text-gray-400">
          {safeHistory.length > 0 ? (
            <>
              <span>{formatDate(safeHistory[0].date)}</span>
              <span>{formatDate(safeHistory[Math.floor(safeHistory.length / 2)].date)}</span>
              <span>{formatDate(safeHistory[safeHistory.length - 1].date)}</span>
            </>
          ) : (
            <>
              <span>Jan 1</span>
              <span>Jan 6</span>
              <span>Jan 12</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
