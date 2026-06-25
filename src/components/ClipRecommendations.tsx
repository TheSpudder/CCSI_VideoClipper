import { formatDuration } from "../lib/format";
import type { PeakWindow } from "../lib/heatmap";

type ClipRecommendationsProps = {
  clips: PeakWindow[];
  formatTime?: (seconds: number) => string;
  onSeek?: (seconds: number) => void;
  hasVideo?: boolean;
};

const DEFAULT_CLIP_SECONDS = 45;

export function ClipRecommendations({
  clips,
  formatTime = formatDuration,
  onSeek,
  hasVideo = false,
}: ClipRecommendationsProps) {
  if (clips.length === 0) return null;

  return (
    <div className="clip-recs">
      <div className="clip-recs__header">
        <h3>Top clip picks</h3>
        <span className="clip-recs__hint">
          ~{DEFAULT_CLIP_SECONDS}s · ranked by keywords + hook strength
        </span>
      </div>

      <ol className="clip-recs__list">
        {clips.map((clip, index) => (
          <li key={`${clip.start}-${clip.end}`} className="clip-recs__item">
            <div className="clip-recs__rank">#{index + 1}</div>
            <div className="clip-recs__body">
              <p className="clip-recs__time">
                {formatTime(clip.start)} – {formatTime(clip.end)}
                <span className="clip-recs__score">
                  score {Math.round(clip.score * 10) / 10}
                </span>
              </p>
              {clip.hookReasons && clip.hookReasons.length > 0 && (
                <p className="clip-recs__hooks">
                  {clip.hookReasons.join(" · ")}
                </p>
              )}
              <p className="clip-recs__keywords">
                {clip.matchedKeywords.slice(0, 6).join(", ")}
                {clip.matchedKeywords.length > 6 && "…"}
              </p>
              {hasVideo && onSeek && (
                <button
                  type="button"
                  className="heatmap__jump-btn"
                  onClick={() => onSeek(clip.start)}
                >
                  Preview clip start
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
