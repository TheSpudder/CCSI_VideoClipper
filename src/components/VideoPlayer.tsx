import { forwardRef } from "react";
import { formatDuration } from "../lib/format";

type VideoPlayerProps = {
  src: string;
  currentHint?: number | null;
};

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ src, currentHint }, ref) {
    return (
      <div className="video-player">
        <video ref={ref} src={src} controls className="video-player__el" />
        {currentHint != null && (
          <p className="video-player__hint">
            Playing from {formatDuration(currentHint)}
          </p>
        )}
      </div>
    );
  },
);
