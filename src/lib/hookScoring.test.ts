import { describe, expect, it } from "vitest";
import { openingTextAt, scoreHook } from "./hookScoring";

describe("scoreHook", () => {
  it("boosts question openers", () => {
    const result = scoreHook("Why do communities struggle with access to care?");
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some((reason) => reason.includes("question"))).toBe(true);
  });

  it("boosts stats and numbers", () => {
    const result = scoreHook("Over 40% of students benefit from trauma-informed support.");
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain("Contains a stat or number");
  });

  it("boosts emotional story hooks", () => {
    const result = scoreHook("When I started this work, I never thought it would change my life.");
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns zero for flat statements", () => {
    const result = scoreHook("We continued the meeting agenda.");
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });
});

describe("openingTextAt", () => {
  const segments = [
    { start: 0, end: 10, text: "Welcome everyone." },
    { start: 10, end: 20, text: "Why does this matter?" },
    { start: 20, end: 35, text: "Because communities need support." },
  ];

  it("collects text from segments near the window start", () => {
    expect(openingTextAt(segments, 10)).toContain("Why does this matter?");
  });
});
