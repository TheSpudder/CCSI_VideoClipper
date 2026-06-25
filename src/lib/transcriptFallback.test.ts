import { describe, expect, it } from "vitest";
import { estimateSegmentsFromTranscript, resolveDuration } from "./transcriptFallback";

describe("resolveDuration", () => {
  it("prefers API duration over video metadata", () => {
    expect(resolveDuration(120, 100)).toBe(120);
  });

  it("falls back to video duration", () => {
    expect(resolveDuration(0, 457)).toBe(457);
  });
});

describe("estimateSegmentsFromTranscript", () => {
  it("creates timed pseudo-segments from match positions", () => {
    const transcript = "a".repeat(90) + " code " + "b".repeat(90);
    const segments = estimateSegmentsFromTranscript(transcript, ["code"], 100);

    expect(segments.length).toBe(1);
    expect(segments[0].start).toBeGreaterThan(40);
    expect(segments[0].end).toBeLessThan(60);
    expect(segments[0].text).toBe("code");
  });

  it("does not match substrings inside words", () => {
    const segments = estimateSegmentsFromTranscript(
      "WAIT for the AI tool",
      ["AI"],
      60,
    );
    expect(segments.length).toBe(1);
    expect(segments[0].text.toLowerCase()).toBe("ai");
  });
});
