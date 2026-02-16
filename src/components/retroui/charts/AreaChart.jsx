
export function AreaChart({
  data,
  index,
  categories,
  colors = ["#6366f1"],
  className = "",
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(
    1, // Minimum 1 to avoid division by zero
    ...data.flatMap((item) => categories.map((cat) => Number(item[cat]) || 0)),
  );

  const points = Math.max(2, data.length); // Minimum 2 points
  const width = 100;
  const height = 100;
  const padding = 10;

  // Generate path for area chart
  const generatePath = (category, colorIndex) => {
    const categoryData = data.map((item) => Number(item[category]) || 0);

    const pathPoints = categoryData.map((value, i) => {
      const x =
        points > 1
          ? (i / (points - 1)) * (width - 2 * padding) + padding
          : width / 2;
      const y = height - padding - (value / maxValue) * (height - 2 * padding);
      return {
        x: isFinite(x) ? x : padding,
        y: isFinite(y) ? y : height - padding,
      };
    });

    const linePath = `M ${pathPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    const areaPath = `${linePath} L ${pathPoints[pathPoints.length - 1].x},${height - padding} L ${pathPoints[0].x},${height - padding} Z`;

    return { linePath, areaPath, pathPoints };
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {/* SVG Chart */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - padding - ratio * (height - 2 * padding);
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.3"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding - 2}
                  y={y}
                  fontSize="3"
                  fill="#9ca3af"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {Math.round(maxValue * ratio)}
                </text>
              </g>
            );
          })}

          {/* Area charts */}
          {categories.map((category, idx) => {
            const { linePath, areaPath, pathPoints } = generatePath(
              category,
              idx,
            );
            const color = colors[idx % colors.length];

            return (
              <g key={category}>
                {/* Area fill with gradient */}
                <defs>
                  <linearGradient
                    id={`gradient-${idx}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#gradient-${idx})`} />
                {/* Line stroke */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {pathPoints.map((point, i) => {
                  const value = Number(data[i][category]) || 0;

                  return (
                    <g key={i}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="1"
                        fill="white"
                        stroke={color}
                        strokeWidth="0.5"
                        className="hover:r-2 transition-all cursor-pointer"
                      />
                      <title>{`${data[i][index]}: ${value}`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-4 px-2">
          {data.map((item, i) => (
            <div key={i} className="text-xs text-gray-500 font-medium">
              {item[index]}
            </div>
          ))}
        </div>

        {/* Legend */}
        {categories.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-200">
            {categories.map((category, idx) => (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm border border-black"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="text-xs font-medium capitalize">
                  {category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
