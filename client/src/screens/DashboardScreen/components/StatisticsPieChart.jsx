import React, { useState } from 'react';

export const StatisticsPieChart = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Defensive: Ensure data fields are numbers
  const assignments = Number(data.assignments) || 0;
  const selfStudy = Number(data.selfStudy) || 0;
  const lectures = Number(data.lectures) || 0;
  // Support total counts if provided (for future extension)
  const totalAssignments = Number(data.totalAssignments) || assignments;
  const totalSelfStudy = Number(data.totalSelfStudy) || selfStudy;
  const totalLectures = Number(data.totalLectures) || lectures;
  const total = assignments + selfStudy + lectures;

  // If total is zero, show empty chart
  const safeTotal = total > 0 ? total : 1;

  const segments = [
    {
      name: 'Assignments',
      value: assignments,
      total: totalAssignments,
      percentage: total > 0 ? Math.round((assignments / safeTotal) * 100) : 0,
      color: '#ef4444', // red-500
      gradient: 'from-red-500 to-red-600',
      hoverColor: '#dc2626', // red-600
    },
    {
      name: 'Self Study',
      value: selfStudy,
      total: totalSelfStudy,
      percentage: total > 0 ? Math.round((selfStudy / safeTotal) * 100) : 0,
      color: '#22c55e', // green-500
      gradient: 'from-green-500 to-green-600',
      hoverColor: '#16a34a', // green-600
    },
    {
      name: 'Lectures',
      value: lectures,
      total: totalLectures,
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

  // Helper to create an SVG arc path for a donut segment
  const describeArc = (cx, cy, r, thickness, startAngle, endAngle) => {
    const innerR = r - thickness;
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerR, innerR, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
  };

  function polarToCartesian(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  }

  // Calculate total percentage for center text
  const totalPercent = total > 0 ? 100 : 0;

  // Empty state
  if (assignments === 0 && selfStudy === 0 && lectures === 0) {
    return (
      <div className="w-full bg-transparent p-4 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-sky-600 text-lg dark:text-gray-400 mb-2">Complete tasks to see your statistics!</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent p-4">
      <div className="flex flex-col items-center h-full max-w-full">
        <div className="relative w-64 h-64 mb-4 flex-shrink-0 rounded-full" style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          overflow: 'visible',
        }}>
          <svg
            width="256"
            height="256"
            viewBox="0 0 256 256"
            className="w-full h-full"
            style={{ background: 'transparent' }}
          >
            {segmentsWithAngles.map((segment, index) => (
              <path
                key={index}
                d={describeArc(128, 128, 112, 24, segment.startAngle, segment.endAngle)}
                fill="none"
                stroke={segment.color}
                strokeWidth="24"
                strokeLinecap="round"
                className={`transition-all duration-500 cursor-pointer ${
                  hoveredSegment === segment.name
                    ? 'opacity-100 scale-105'
                    : 'opacity-90'
                }`}
                style={{
                  filter:
                    hoveredSegment === segment.name
                      ? `drop-shadow(0 0 20px ${segment.color}80)`
                      : 'none',
                  transformOrigin: '128px 128px',
                }}
                onMouseEnter={() => setHoveredSegment(segment.name)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            ))}
          </svg>
          {/* Tooltip on hover */}
          {hoveredSegment && (
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full bg-black/90 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 animate-fadeIn">
              {(() => {
                const seg = segments.find(s => s.name === hoveredSegment);
                return `${seg.name}: ${seg.value}${seg.total ? ` / ${seg.total}` : ''} completed (${seg.percentage}%)`;
              })()}
            </div>
          )}
        </div>
        {/* Glassmorphism Legend */}
        <div className="space-y-2 w-full max-w-full mt-2">
          {segmentsWithAngles.map((segment, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer w-full backdrop-blur-md bg-white/30 dark:bg-white/10 border border-white/20 shadow-md ${
                hoveredSegment === segment.name
                  ? 'scale-105 border-indigo-400'
                  : 'hover:scale-105 hover:border-indigo-300'
              }`}
              onMouseEnter={() => setHoveredSegment(segment.name)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{
                boxShadow: hoveredSegment === segment.name ? `0 0 12px 2px ${segment.color}40` : undefined,
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-4 h-4 rounded-full shadow-lg flex-shrink-0 border-2 border-white"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-indigo-700 font-semibold text-base truncate dark:text-white">
                  {segment.name}
                </span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-indigo-700 font-bold text-lg dark:text-white">
                  {segment.percentage}%
                </div>
                <div className="text-sky-600 text-sm dark:text-gray-400">
                  {segment.value}{segment.total ? ` / ${segment.total}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
