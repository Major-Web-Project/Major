import React from 'react';

export const StatusHistoryChart = ({ data }) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue;

  // Generate SVG path for the line chart
  const generatePath = () => {
    const width = 400;
    const height = 200;
    const padding = 20;

    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        ((item.value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Generate area path for gradient fill
  const generateAreaPath = () => {
    const width = 400;
    const height = 200;
    const padding = 20;

    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        ((item.value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const lastX = lastPoint.split(',')[0];
    const firstX = firstPoint.split(',')[0];

    return `M ${firstX},${height - padding} L ${points.join(
      ' L '
    )} L ${lastX},${height - padding} Z`;
  };

  return (
    <div className="w-full h-80 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-400 text-sm">Progress Over Time</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
          <span className="text-white text-sm">Performance</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-56 overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 200"
          className="absolute inset-0"
        >
          {/* Grid Lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 20"
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

          {/* Data points */}
          {data.map((item, index) => {
            const width = 400;
            const height = 200;
            const padding = 20;
            const x =
              padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y =
              height -
              padding -
              ((item.value - minValue) / range) * (height - 2 * padding);

            return (
              <g key={index}>
                {/* Outer glow */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="rgba(147, 51, 234, 0.3)"
                  className="animate-pulse"
                />
                {/* Main point */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="url(#lineGradient)"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 transition-all duration-300 cursor-pointer"
                />

                {/* Tooltip on hover */}
                <g className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <rect
                    x={x - 25}
                    y={y - 35}
                    width="50"
                    height="25"
                    rx="4"
                    fill="rgba(0,0,0,0.8)"
                  />
                  <text
                    x={x}
                    y={y - 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {item.value}%
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-gray-400 text-xs py-4">
          <span>{maxValue}%</span>
          <span>{Math.round((maxValue + minValue) / 2)}%</span>
          <span>{minValue}%</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-gray-400 text-xs px-6">
          <span>Jan 1</span>
          <span>Jan 6</span>
          <span>Jan 12</span>
        </div>
      </div>
    </div>
  );
};
