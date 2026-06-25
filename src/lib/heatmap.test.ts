import { describe, expect, it } from "vitest";
import {
  analyzeKeywordDensity,
  buildHeatmap,
  findPeakWindow,
  findTopPeakWindows,
  scoreSegments,
} from "./heatmap";
import type { TimedSegment } from "../types/transcription";

const segments: TimedSegment[] = [
  { start: 0, end: 10, text: "Welcome everyone to the meeting" },
  { start: 10, end: 20, text: "We need to discuss the budget today" },
  { start: 20, end: 30, text: "The budget deadline is important" },
  { start: 30, end: 40, text: "WAIT for the upcoming announcement" },
  { start: 60, end: 75, text: "budget deadline action item budget again" },
  { start: 75, end: 90, text: "more budget and deadline discussion" },
];

describe("scoreSegments", () => {
  it("scores keyword hits per segment with word boundaries", () => {
    const scores = scoreSegments(segments, ["AI", "budget"]);
    const aiSegment = scores.find((s) => s.text.includes("WAIT"));
    expect(aiSegment?.matchCount).toBe(0);

    const budgetSegment = scores.find((s) => s.start === 10);
    expect(budgetSegment?.matchCount).toBe(1);
    expect(budgetSegment?.matchedKeywords).toContain("budget");
  });
});

describe("buildHeatmap", () => {
  it("concentrates score in buckets with keyword-heavy segments", () => {
    const scores = scoreSegments(segments, ["budget", "deadline", "action item"]);
    const heatmap = buildHeatmap(scores, 90, { bucketSize: 10 });

    const bucketAt60 = heatmap.find((b) => b.start === 60);
    const bucketAt0 = heatmap.find((b) => b.start === 0);

    expect(bucketAt60).toBeDefined();
    expect(bucketAt0).toBeDefined();
    expect(bucketAt60!.score).toBeGreaterThan(bucketAt0!.score);
  });
});

describe("findPeakWindow", () => {
  it("finds the window with the most keyword concentration", () => {
    const scores = scoreSegments(segments, ["budget", "deadline", "action item"]);
    const peak = findPeakWindow(scores, 90, { windowSize: 30 });

    expect(peak).not.toBeNull();
    expect(peak!.start).toBeGreaterThanOrEqual(60);
    expect(peak!.end).toBeLessThanOrEqual(90);
    expect(peak!.score).toBeGreaterThan(2);
    expect(peak!.matchedKeywords).toContain("budget");
  });

  it("returns null when there are no keyword hits", () => {
    const scores = scoreSegments(segments, ["nonexistent"]);
    expect(findPeakWindow(scores, 90)).toBeNull();
  });

  it("handles videos shorter than the window size", () => {
    const short: TimedSegment[] = [
      { start: 0, end: 5, text: "budget budget" },
    ];
    const scores = scoreSegments(short, ["budget"]);
    const peak = findPeakWindow(scores, 5, { windowSize: 30 });

    expect(peak).not.toBeNull();
    expect(peak!.start).toBe(0);
    expect(peak!.end).toBe(5);
    expect(peak!.score).toBe(2);
  });
});

describe("findTopPeakWindows", () => {
  it("returns non-overlapping top windows for short-form clips", () => {
    const scores = scoreSegments(segments, ["budget", "deadline", "action item"]);
    const clips = findTopPeakWindows(scores, 90, {
      windowSize: 30,
      count: 3,
    });

    expect(clips.length).toBeGreaterThan(0);
    expect(clips.length).toBeLessThanOrEqual(3);

    for (let i = 0; i < clips.length; i++) {
      for (let j = i + 1; j < clips.length; j++) {
        const overlap =
          clips[i].start < clips[j].end && clips[j].start < clips[i].end;
        expect(overlap).toBe(false);
      }
    }
  });

  it("adds hook metadata when a clip opens with a strong hook", () => {
    const hookSegments: TimedSegment[] = [
      { start: 0, end: 12, text: "Why does the budget deadline matter for families?" },
      { start: 12, end: 24, text: "budget deadline budget deadline" },
    ];

    const scores = scoreSegments(hookSegments, ["budget", "deadline"]);
    const clips = findTopPeakWindows(scores, 24, { windowSize: 24, count: 1 });

    expect(clips[0]?.hookScore).toBeGreaterThan(0);
    expect(clips[0]?.hookReasons?.length).toBeGreaterThan(0);
  });

  it("uses hook score as a tie-breaker between similar keyword windows", () => {
    const segmentsA: TimedSegment[] = [
      { start: 0, end: 10, text: "Why does budget matter here?" },
      { start: 10, end: 20, text: "budget deadline" },
    ];
    const segmentsB: TimedSegment[] = [
      { start: 0, end: 10, text: "We discussed the budget today." },
      { start: 10, end: 20, text: "budget deadline" },
    ];

    const hookScores = scoreSegments(segmentsA, ["budget", "deadline"]);
    const plainScores = scoreSegments(segmentsB, ["budget", "deadline"]);

    const hookClip = findTopPeakWindows(hookScores, 20, { windowSize: 20, count: 1 })[0];
    const plainClip = findTopPeakWindows(plainScores, 20, { windowSize: 20, count: 1 })[0];

    expect(hookClip.score).toBeGreaterThan(plainClip.score);
    expect((hookClip.hookScore ?? 0)).toBeGreaterThan(plainClip.hookScore ?? 0);
  });
});

describe("analyzeKeywordDensity", () => {
  it("returns segment scores, heatmap buckets, and peak window", () => {
    const result = analyzeKeywordDensity(segments, ["budget"], 90);

    expect(result.segmentScores.length).toBe(segments.length);
    expect(result.heatmap.length).toBeGreaterThan(0);
    expect(result.peak).not.toBeNull();
  });
});
