import {
  countMatchesInText,
  findMatchedKeywordsInText,
} from "./keywords";
import { openingTextAt, scoreHook } from "./hookScoring";
import type { TimedSegment } from "../types/transcription";

export type SegmentScore = {
  start: number;
  end: number;
  text: string;
  matchCount: number;
  matchedKeywords: string[];
};

export type HeatmapBucket = {
  start: number;
  end: number;
  score: number;
  density: number;
};

export type PeakWindow = {
  start: number;
  end: number;
  score: number;
  matchedKeywords: string[];
  keywordScore?: number;
  hookScore?: number;
  hookReasons?: string[];
};

export type HeatmapOptions = {
  bucketSize?: number;
  windowSize?: number;
};

export type KeywordDensityResult = {
  segmentScores: SegmentScore[];
  heatmap: HeatmapBucket[];
  peak: PeakWindow | null;
};

const DEFAULT_BUCKET_SIZE = 10;
const DEFAULT_WINDOW_SIZE = 30;

export function scoreSegments(
  segments: TimedSegment[],
  keywords: string[],
): SegmentScore[] {
  return segments.map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text,
    matchCount: countMatchesInText(segment.text, keywords),
    matchedKeywords: findMatchedKeywordsInText(segment.text, keywords),
  }));
}

function overlapDuration(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): number {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

function segmentContribution(
  segment: SegmentScore,
  windowStart: number,
  windowEnd: number,
): number {
  if (segment.matchCount === 0) return 0;

  const overlap = overlapDuration(
    segment.start,
    segment.end,
    windowStart,
    windowEnd,
  );
  if (overlap === 0) return 0;

  const segmentDuration = segment.end - segment.start;
  const fraction =
    segmentDuration > 0 ? overlap / segmentDuration : 1;
  return segment.matchCount * fraction;
}

export function buildHeatmap(
  segmentScores: SegmentScore[],
  duration: number,
  options?: HeatmapOptions,
): HeatmapBucket[] {
  const bucketSize = options?.bucketSize ?? DEFAULT_BUCKET_SIZE;
  if (duration <= 0) return [];

  const bucketCount = Math.ceil(duration / bucketSize);
  const buckets: HeatmapBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const start = i * bucketSize;
    const end = Math.min((i + 1) * bucketSize, duration);
    let score = 0;

    for (const segment of segmentScores) {
      score += segmentContribution(segment, start, end);
    }

    const span = end - start;
    buckets.push({
      start,
      end,
      score: roundScore(score),
      density: span > 0 ? roundScore(score / span) : 0,
    });
  }

  return buckets;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

export const DEFAULT_CLIP_WINDOW_SECONDS = 45;
export const DEFAULT_CLIP_COUNT = 3;

function scoreWindow(
  segmentScores: SegmentScore[],
  start: number,
  end: number,
): PeakWindow | null {
  let score = 0;
  const keywordSet = new Set<string>();

  for (const segment of segmentScores) {
    const contribution = segmentContribution(segment, start, end);
    if (contribution > 0) {
      score += contribution;
      for (const keyword of segment.matchedKeywords) {
        keywordSet.add(keyword);
      }
    }
  }

  if (score <= 0) return null;

  return {
    start,
    end,
    score: roundScore(score),
    matchedKeywords: [...keywordSet],
  };
}

function scoreClipWindow(
  segmentScores: SegmentScore[],
  start: number,
  end: number,
): PeakWindow | null {
  const base = scoreWindow(segmentScores, start, end);
  if (!base) return null;

  const opener = openingTextAt(segmentScores, start);
  const hook = scoreHook(opener);

  return {
    ...base,
    keywordScore: base.score,
    hookScore: hook.score,
    hookReasons: hook.reasons,
    score: roundScore(base.score + hook.score),
  };
}

function windowsOverlap(a: PeakWindow, b: PeakWindow): boolean {
  return a.start < b.end && b.start < a.end;
}

export function findTopPeakWindows(
  segmentScores: SegmentScore[],
  duration: number,
  options?: HeatmapOptions & { count?: number },
): PeakWindow[] {
  if (duration <= 0) return [];

  const windowSize = options?.windowSize ?? DEFAULT_CLIP_WINDOW_SECONDS;
  const count = options?.count ?? DEFAULT_CLIP_COUNT;
  const step = 1;
  const effectiveWindow = Math.min(windowSize, duration);
  const candidates: PeakWindow[] = [];

  for (let start = 0; start <= duration - effectiveWindow + step; start += step) {
    const end = Math.min(start + effectiveWindow, duration);
    const candidate = scoreClipWindow(segmentScores, start, end);
    if (candidate) candidates.push(candidate);
  }

  candidates.sort((a, b) => b.score - a.score);

  const selected: PeakWindow[] = [];
  for (const candidate of candidates) {
    if (selected.some((window) => windowsOverlap(window, candidate))) continue;
    selected.push(candidate);
    if (selected.length >= count) break;
  }

  return selected.sort((a, b) => a.start - b.start);
}

export function findPeakWindow(
  segmentScores: SegmentScore[],
  duration: number,
  options?: HeatmapOptions,
): PeakWindow | null {
  if (duration <= 0) return null;

  const windowSize = options?.windowSize ?? DEFAULT_WINDOW_SIZE;
  const step = 1;
  const effectiveWindow = Math.min(windowSize, duration);

  let best: PeakWindow | null = null;

  for (let start = 0; start <= duration - effectiveWindow + step; start += step) {
    const end = Math.min(start + effectiveWindow, duration);
    const candidate = scoreWindow(segmentScores, start, end);
    if (!candidate) continue;
    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }

  return best;
}

export function analyzeKeywordDensity(
  segments: TimedSegment[],
  keywords: string[],
  duration: number,
  options?: HeatmapOptions,
): KeywordDensityResult {
  const segmentScores = scoreSegments(segments, keywords);
  const heatmap = buildHeatmap(segmentScores, duration, options);
  const peak = findPeakWindow(segmentScores, duration, options);

  return { segmentScores, heatmap, peak };
}
