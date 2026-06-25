type LogoProps = {
  className?: string;
};

const HEATMAP_COLORS = [
  "#dc2626", "#ef4444", "#f97316", "#eab308",
  "#84cc16", "#22c55e", "#16a34a", "#15803d",
  "#ef4444", "#f97316", "#eab308", "#eab308",
  "#22c55e", "#16a34a", "#15803d", "#166534",
  "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#eab308", "#22c55e", "#16a34a", "#15803d",
  "#84cc16", "#22c55e", "#16a34a", "#166534",
  "#22c55e", "#16a34a", "#15803d", "#166534",
  "#16a34a", "#15803d", "#166534", "#14532d",
];

export function Logo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 196 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="hotspot ai"
    >
      <defs>
        <linearGradient id="logo-ai-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#e91e8c" />
        </linearGradient>
        <clipPath id="logo-bubble-clip">
          <path d="M6 8C6 4.686 8.686 2 12 2H38C41.314 2 44 4.686 44 8V32C44 35.314 41.314 38 38 38H18L10 44V38H12C8.686 38 6 35.314 6 32V8Z" />
        </clipPath>
      </defs>

      <path
        d="M6 8C6 4.686 8.686 2 12 2H38C41.314 2 44 4.686 44 8V32C44 35.314 41.314 38 38 38H18L10 44V38H12C8.686 38 6 35.314 6 32V8Z"
        fill="#12121c"
      />

      <g clipPath="url(#logo-bubble-clip)">
        {HEATMAP_COLORS.map((color, i) => {
          const col = i % 6;
          const row = Math.floor(i / 6);
          return (
            <rect
              key={i}
              x={8 + col * 6}
              y={6 + row * 6}
              width="5"
              height="5"
              rx="0.75"
              fill={color}
            />
          );
        })}
      </g>

      <path d="M22 16 L32 23 L22 30 Z" fill="#08080c" />

      <text
        x="54"
        y="31"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="24"
        fontWeight="600"
        letterSpacing="-0.03em"
      >
        <tspan fill="currentColor">hotspot </tspan>
        <tspan fill="url(#logo-ai-gradient)">ai</tspan>
      </text>
    </svg>
  );
}
