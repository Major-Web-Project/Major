import React, { useState } from 'react';

export const StatisticsPieChart = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Defensive: Ensure data fields are numbers
  const assignments = Number(data.assignments) || 0;
  const selfStudy = Number(data.selfStudy) || 0;
  const lectures = Number(data.lectures) || 0;
  const total = assignments + selfStudy + lectures;

  // If total is zero, show empty chart
  const safeTotal = total > 0 ? total : 1;

  const segments = [
    {
      name: 'Assignments',
      value: assignments,
      percentage: total > 0 ? Math.round((assignments / safeTotal) * 100) : 0,
      color: '#ef4444', // red-500
      gradient: 'from-red-500 to-red-600',
      hoverColor: '#dc2626', // red-600
    },
    {
      name: 'Self Study',
      value: selfStudy,
      percentage: total > 0 ? Math.round((selfStudy / safeTotal) * 100) : 0,
      color: '#22c55e', // green-500
      gradient: 'from-green-500 to-green-600',
      hoverColor: '#16a34a', // green-600
    },
    {
      name: 'Lectures',
      value: lectures,
      percentage: total > 0 ? Math.round((lectures / safeTotal) * 100) : 0,
      color: '#3b82f6', // blue-500
      gradient: 'from-blue-500 to-blue-600',
      hoverColor: '#2563eb', // blue-600
    },
  ];

  // Calculate angles for pie segments
  let currentAngle = 0;
  const segmentsWithAngles = segments.map((segment) => {
    const angle = total > 0 ? (segment.value / safeTotal) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    return {
      ...segment,
      startAngle: isNaN(startAngle) ? 0 : startAngle,
      endAngle: isNaN(endAngle) ? 0 : endAngle,
      angle: isNaN(angle) ? 0 : angle,
    };
  });

  // Function to create SVG path for pie segment
  const createPath = (startAngle, endAngle) => {
    if (isNaN(startAngle) || isNaN(endAngle) || startAngle === endAngle) return '';
    const radius = 100;
    const centerX = 100;
    const centerY = 100;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');
  };

  // Calculate total percentage for center text
  const totalPercent = total > 0 ? 100 : 0;

  return (
    <div className="w-full bg-transparent p-4">
      {/* Chart Container - Fixed size to prevent overflow */}
      <div className="flex flex-col items-center h-full max-w-full">
        {/* SVG Pie Chart - Contained within bounds */}
        <div className="relative w-40 h-40 mb-4 flex-shrink-0">
          <svg
            width="160"
            height="160"
            viewBox="0 0 200 200"
            className="transform -rotate-90 w-full h-full"
          >
            <defs>
              {segmentsWithAngles.map((segment, index) => (
                <linearGradient
                  key={index}
                  id={`gradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={segment.color} />
                  <stop offset="100%" stopColor={segment.hoverColor} />
                </linearGradient>
              ))}
            </defs>

            {segmentsWithAngles.map((segment, index) => (
              <path
                key={index}
                d={createPath(segment.startAngle, segment.endAngle)}
                fill={`url(#gradient-${index})`}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                className={`transition-all duration-300 cursor-pointer ${
                  hoveredSegment === segment.name
                    ? 'opacity-100 scale-105'
                    : 'opacity-90'
                }`}
                style={{
                  filter:
                    hoveredSegment === segment.name
                      ? `drop-shadow(0 0 15px ${segment.color}50)`
                      : 'none',
                  transformOrigin: '100px 100px',
                }}
                onMouseEnter={() => setHoveredSegment(segment.name)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            ))}

            {/* Center circle for donut effect */}
            <circle
              cx="100"
              cy="100"
              r="35"
              fill="rgba(0,0,0,0.8)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-indigo-700 text-lg font-bold dark:text-white">{totalPercent}%</div>
              <div className="text-sky-600 text-xs dark:text-gray-400">Complete</div>
            </div>
          </div>
        </div>

        {/* Legend - Contained within bounds */}
        <div className="space-y-2 w-full max-w-full">
          {segmentsWithAngles.map((segment, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 cursor-pointer w-full ${
                hoveredSegment === segment.name
                  ? 'bg-sky-100/50 scale-105 dark:bg-white/20'
                  : 'bg-sky-50/50 hover:bg-sky-100/30 dark:bg-white/10 dark:hover:bg-white/15'
              }`}
              onMouseEnter={() => setHoveredSegment(segment.name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-3 h-3 rounded-full shadow-lg flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-indigo-700 font-medium text-sm truncate dark:text-white">
                  {segment.name}
                </span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-indigo-700 font-bold text-sm dark:text-white">
                  {segment.percentage}%
                </div>
                <div className="text-sky-600 text-xs dark:text-gray-400">{segment.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
