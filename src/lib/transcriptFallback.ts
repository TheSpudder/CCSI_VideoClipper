import { findMatchRanges } from "./keywords";
import type { TimedSegment } from "../types/transcription";

const MATCH_WINDOW_SECONDS = 2;

export function estimateSegmentsFromTranscript(
  transcript: string,
  keywords: string[],
  duration: number,
): TimedSegment[] {
  if (!transcript.trim() || duration <= 0 || !keywords.length) return [];

  const segments: TimedSegment[] = [];
  const halfWindow = MATCH_WINDOW_SECONDS / 2;

  for (const keyword of keywords) {
    for (const range of findMatchRanges(transcript, keyword)) {
      const mid = (range.start + range.end) / 2;
      const center =
        transcript.length > 0 ? (mid / transcript.length) * duration : 0;

      segments.push({
        start: Math.max(0, center - halfWindow),
        end: Math.min(duration, center + halfWindow),
        text: transcript.slice(range.start, range.end),
      });
    }
  }

  return segments.sort((a, b) => a.start - b.start);
}

export function resolveDuration(
  apiDuration: number | undefined,
  videoDuration: number | null,
): number {
  if (apiDuration != null && apiDuration > 0) return apiDuration;
  if (videoDuration != null && videoDuration > 0) return videoDuration;
  return 0;
}
