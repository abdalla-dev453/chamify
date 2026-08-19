export default function MiniLineChart({ points, labels, height = 180 }) {
    const width = 640;
    const padding = 24;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min;

    const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p - min) / range) * (height - padding * 2);
    return [x, y];
    });


    const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
    const areaPath = `${linePath} L${coords[coords.length - 1][0]},${height - padding} L${coords[0][0]},${
    height - padding
    } Z`;

    return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#178a4a" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#178a4a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={padding}
          x2={width - padding}
          y1={padding + (i * (height - padding * 2)) / 3}
          y2={padding + (i * (height - padding * 2)) / 3}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      <path d={areaPath} fill="url(#chartFill)" />
      <path d={linePath} fill="none" stroke="#178a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#ffffff" stroke="#178a4a" strokeWidth="2" />
      ))}

      {labels &&
        coords.map(([x], i) => (
          <text key={i} x={x} y={height - 4} fontSize="10" textAnchor="middle" fill="#94a3b8">
            {labels[i]}
          </text>
        ))}
    </svg>
  );
}