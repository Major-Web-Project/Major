import React, { useState } from 'react';

export const StatisticsPieChart = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const total = data.assignments + data.selfStudy + data.lectures;

  const segments = [
    {
      name: 'Assignments',
      value: data.assignments,
      percentage: Math.round((data.assignments / total) * 100),
      color: '#ef4444', // red-500
      gradient: 'from-red-500 to-red-600',
      hoverColor: '#dc2626', // red-600
    },
    {
      name: 'Self Study',
      value: data.selfStudy,
      percentage: Math.round((data.selfStudy / total) * 100),
      color: '#22c55e', // green-500
      gradient: 'from-green-500 to-green-600',
      hoverColor: '#16a34a', // green-600
    },
    {
      name: 'Lectures',
      value: data.lectures,
      percentage: Math.round((data.lectures / total) * 100),
      color: '#3b82f6', // blue-500
      gradient: 'from-blue-500 to-blue-600',
      hoverColor: '#2563eb', // blue-600
    },
  ];

  // Calculate angles for pie segments
  let currentAngle = 0;
  const segmentsWithAngles = segments.map((segment) => {
    const angle = (segment.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    return {
      ...segment,
      startAngle,
      endAngle,
      angle,
    };
  });

  // Function to create SVG path for pie segment
  const createPath = (startAngle, endAngle, innerRadius = 0) => {
    const centerX = 100;
    const centerY = 100;
    const outerRadius = 80;

    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    if (innerRadius > 0) {
      const x3 = centerX + innerRadius * Math.cos(endAngleRad);
      const y3 = centerY + innerRadius * Math.sin(endAngleRad);
      const x4 = centerX + innerRadius * Math.cos(startAngleRad);
      const y4 = centerY + innerRadius * Math.sin(startAngleRad);

      return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
    } else {
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }
  };

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
              <div className="text-white text-lg font-bold">100%</div>
              <div className="text-gray-400 text-xs">Complete</div>
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
                  ? 'bg-white/20 scale-105'
                  : 'bg-white/10 hover:bg-white/15'
              }`}
              onMouseEnter={() => setHoveredSegment(segment.name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-3 h-3 rounded-full shadow-lg flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-white font-medium text-sm truncate">
                  {segment.name}
                </span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-white font-bold text-sm">
                  {segment.percentage}%
                </div>
                <div className="text-gray-400 text-xs">{segment.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
