import React from 'react';

export interface RadarStatItem {
  label: string;
  key: string;
  value: number; // Normalized 0-100
  displayValue?: string | number; // Formatted text e.g. "99/100" or "770 HP"
  max?: number;
}

export interface RadarChartProps {
  stats: RadarStatItem[];
  size?: number;
  accentColor?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  stats,
  size = 210,
  accentColor = '#00f0ff',
}) => {
  // Ensure we always have 5 stat points for the pentagon
  const defaultStats: RadarStatItem[] = [
    { label: 'Kecepatan', key: 'speed', value: 92, displayValue: '92/100' },
    { label: 'HP Mesin', key: 'hp', value: 85, displayValue: '85/100' },
    { label: 'Handling', key: 'handling', value: 90, displayValue: '90/100' },
    { label: 'Akselerasi', key: 'accel', value: 94, displayValue: '94/100' },
    { label: 'Armor', key: 'armor', value: 82, displayValue: '82/100' },
  ];

  const chartStats = stats && stats.length >= 5 ? stats.slice(0, 5) : defaultStats;
  const numPoints = 5;
  const center = size / 2;
  const radius = size * 0.35;

  // Concentric radar grid rings (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index: number, level: number) => {
    // Start from top (-PI/2) and rotate clockwise
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numPoints;
    const r = radius * level;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate SVG polygon points string for a given grid level
  const getPolygonPoints = (level: number) => {
    return Array.from({ length: numPoints })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, level);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Generate data polygon points
  const dataPoints = chartStats.map((item, i) => {
    const normalized = Math.max(0.18, Math.min(1.0, item.value / (item.max || 100)));
    return getCoordinates(i, normalized);
  });

  const dataPolygonString = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none">
      <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible drop-shadow-[0_0_12px_rgba(0,240,255,0.25)]"
        >
          <defs>
            {/* Holographic Cyan Gradient for Data Fill */}
            <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.08" />
            </radialGradient>

            {/* Glowing Line Filter */}
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Concentric Pentagon Grid Lines */}
          {gridLevels.map((lvl, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={getPolygonPoints(lvl)}
              fill="none"
              stroke="#00f0ff"
              strokeWidth={idx === gridLevels.length - 1 ? '1.2' : '0.7'}
              strokeOpacity={idx === gridLevels.length - 1 ? 0.35 : 0.15}
              strokeDasharray={idx < gridLevels.length - 1 ? '2 2' : 'none'}
            />
          ))}

          {/* Radial Spokes from Center to Vertices */}
          {Array.from({ length: numPoints }).map((_, i) => {
            const { x, y } = getCoordinates(i, 1.0);
            return (
              <line
                key={`spoke-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#00f0ff"
                strokeWidth="0.7"
                strokeOpacity="0.2"
              />
            );
          })}

          {/* Filled Data Polygon Area */}
          <polygon
            points={dataPolygonString}
            fill="url(#radarFillGrad)"
            stroke={accentColor}
            strokeWidth="1.8"
            filter="url(#radarGlow)"
            className="transition-all duration-400 ease-out"
          />

          {/* Glowing Vertex Dots & Values */}
          {dataPoints.map((pt, i) => (
            <g key={`vertex-${i}`} className="transition-all duration-400 ease-out">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#ffb703"
                stroke="#ffffff"
                strokeWidth="1.2"
                filter="url(#radarGlow)"
              />
              <circle cx={pt.x} cy={pt.y} r="1.5" fill="#070814" />
            </g>
          ))}
        </svg>

        {/* Outer Value Labels Positioned Around Pentagon */}
        {chartStats.map((item, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numPoints;
          const labelDist = radius * 1.34;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);

          const isTop = i === 0;
          const isRight = i === 1 || i === 2;

          return (
            <div
              key={`label-${i}`}
              className="absolute pointer-events-none transition-all duration-300"
              style={{
                left: `${(lx / size) * 100}%`,
                top: `${(ly / size) * 100}%`,
                transform: `translate(${isTop ? '-50%' : isRight ? '-5%' : '-95%'}, -50%)`,
              }}
            >
              <div
                className={`flex flex-col ${
                  isTop ? 'items-center text-center' : isRight ? 'items-start text-left' : 'items-end text-right'
                }`}
              >
                <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-wider uppercase text-gray-400 whitespace-nowrap leading-none">
                  {item.label}
                </span>
                <span className="text-[10px] sm:text-[11px] font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300 drop-shadow-[0_0_6px_rgba(0,240,255,0.6)] tabular-nums whitespace-nowrap mt-0.5">
                  {item.displayValue || `${item.value}/100`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Horizontal 5-Stat Grid Display: each as "87/100" with small label on top */}
      <div className="w-full grid grid-cols-5 gap-1 pt-2.5 border-t border-cyan-500/20 mt-1">
        {chartStats.map((item, idx) => (
          <div
            key={item.key || idx}
            className="text-center py-1 px-0.5 rounded-lg bg-black/50 border border-white/10 hover:border-cyan-400/30 transition-all flex flex-col items-center justify-center"
          >
            <div className="text-[7.5px] sm:text-[8px] uppercase font-mono text-gray-400 font-bold tracking-tight truncate w-full mb-0.5">
              {item.label}
            </div>
            <div className="text-[10px] sm:text-[11px] font-display font-black text-cyan-300 tabular-nums">
              {item.displayValue || `${item.value}/100`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
