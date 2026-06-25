import { findKeywords } from "./keywords";
import { estimateSegmentsFromTranscript } from "./transcriptFallback";
import type { TimedSegment } from "../types/transcription";

export type TimingSource = "segments" | "estimated" | "none";

export type TranscriptionCache = {
  fileKey: string;
  transcript: string;
  apiSegments: TimedSegment[];
  duration: number;
};

export function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function serializeKeywords(keywords: string[]): string {
  return keywords.join("\0");
}

export function buildSegmentsForAnalysis(
  apiSegments: TimedSegment[],
  transcript: string,
  keywords: string[],
  duration: number,
): { segments: TimedSegment[]; timingSource: TimingSource } {
  if (apiSegments.length > 0) {
    return { segments: apiSegments, timingSource: "segments" };
  }

  if (transcript && duration > 0 && keywords.length > 0) {
    const estimated = estimateSegmentsFromTranscript(
      transcript,
      keywords,
      duration,
    );
    return {
      segments: estimated,
      timingSource: estimated.length > 0 ? "estimated" : "none",
    };
  }

  return { segments: [], timingSource: "none" };
}

export function applyKeywordAnalysis(
  transcript: string,
  keywords: string[],
  apiSegments: TimedSegment[],
  duration: number,
) {
  const { segments, timingSource } = buildSegmentsForAnalysis(
    apiSegments,
    transcript,
    keywords,
    duration,
  );

  return {
    segments,
    timingSource,
    matches: findKeywords(transcript, keywords),
    activeKeywords: new Set(keywords),
  };
}
