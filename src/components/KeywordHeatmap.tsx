import { useMemo, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import type { HeatmapBucket, PeakWindow } from "../lib/heatmap";

export type BucketSize = 5 | 10 | 30;

type KeywordHeatmapProps = {
  buckets: HeatmapBucket[];
  duration: number;
  peak: PeakWindow | null;
  bucketSize: BucketSize;
  onBucketSizeChange: (size: BucketSize) => void;
  formatTime: (seconds: number) => string;
  onSeek?: (seconds: number) => void;
};

function scoreColor(score: number, maxScore: number, emptyColor: string): string {
  if (score <= 0 || maxScore <= 0) return emptyColor;

  const t = Math.min(1, score / maxScore);
  const stops = [
    { pos: 0, color: [22, 163, 74] },
    { pos: 0.5, color: [234, 179, 8] },
    { pos: 1, color: [220, 38, 38] },
  ];

  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].pos && t <= stops[i + 1].pos) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const range = upper.pos - lower.pos || 1;
  const local = (t - lower.pos) / range;
  const rgb = lower.color.map((c, i) =>
    Math.round(c + (upper.color[i] - c) * local),
  );
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function axisLabels(duration: number, formatTime: (s: number) => string): string[] {
  if (duration <= 0) return ["0:00"];

  const count = 5;
  return Array.from({ length: count }, (_, i) => {
    const seconds = (duration / (count - 1)) * i;
    return formatTime(seconds);
  });
}

export function KeywordHeatmap({
  buckets,
  duration,
  peak,
  bucketSize,
  onBucketSizeChange,
  formatTime,
  onSeek,
}: KeywordHeatmapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const theme = useTheme();
  const emptyColor = theme === "light" ? "#e8e8ef" : "#1a1b26";

  const maxScore = useMemo(
    () => Math.max(0, ...buckets.map((b) => b.score)),
    [buckets],
  );

  const labels = useMemo(
    () => axisLabels(duration, formatTime),
    [duration, formatTime],
  );

  const hovered = hoveredIndex != null ? buckets[hoveredIndex] : null;

  const tooltipStyle =
    hoveredIndex != null && buckets.length > 0
      ? { left: `${((hoveredIndex + 0.5) / buckets.length) * 100}%` }
      : undefined;

  const peakStyle =
    peak && duration > 0
      ? {
          left: `${(peak.start / duration) * 100}%`,
          width: `${((peak.end - peak.start) / duration) * 100}%`,
        }
      : null;

  const handleBucketClick = (bucket: HeatmapBucket) => {
    onSeek?.(bucket.start);
  };

  return (
    <div className="heatmap">
      <div className="heatmap__controls">
        <span className="heatmap__controls-label">Bucket size</span>
        {([5, 10, 30] as const).map((size) => (
          <button
            key={size}
            type="button"
            className={`heatmap__size-btn ${bucketSize === size ? "heatmap__size-btn--active" : ""}`}
            onClick={() => onBucketSizeChange(size)}
          >
            {size}s
          </button>
        ))}
      </div>

      <div className="heatmap__track-wrap">
        <div className="heatmap__track" role="img" aria-label="Keyword density over time">
          {buckets.map((bucket, index) => (
            <button
              key={bucket.start}
              type="button"
              className={`heatmap__cell ${hoveredIndex === index ? "heatmap__cell--hover" : ""}`}
              style={{ backgroundColor: scoreColor(bucket.score, maxScore, emptyColor) }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleBucketClick(bucket)}
              aria-label={`${formatTime(bucket.start)} to ${formatTime(bucket.end)}, ${Math.round(bucket.score)} matches`}
            />
          ))}
          {peakStyle && (
            <button
              type="button"
              className="heatmap__peak"
              style={peakStyle}
              onClick={() => onSeek?.(peak!.start)}
              aria-label={`Peak window ${formatTime(peak!.start)} to ${formatTime(peak!.end)}`}
            />
          )}
        </div>
        {hovered && tooltipStyle && (
          <div className="heatmap__tooltip" style={tooltipStyle} role="tooltip">
            {formatTime(hovered.start)} – {formatTime(hovered.end)} ·{" "}
            {Math.round(hovered.score)}{" "}
            {Math.round(hovered.score) === 1 ? "match" : "matches"}
            {onSeek && " · click to jump"}
          </div>
        )}
      </div>

      <div className="heatmap__axis">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {peak && (
        <div className="heatmap__peak-row">
          <p className="heatmap__peak-label">
            Peak window: {formatTime(peak.start)} – {formatTime(peak.end)}
          </p>
          {onSeek && (
            <button
              type="button"
              className="heatmap__jump-btn"
              onClick={() => onSeek(peak.start)}
            >
              Jump to hotspot
            </button>
          )}
        </div>
      )}

      <div className="heatmap__legend">
        <span>Low</span>
        <div className="heatmap__legend-bar" />
        <span>High</span>
      </div>
    </div>
  );
}
