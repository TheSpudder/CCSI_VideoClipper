import { describe, expect, it } from "vitest";
import {
  applyKeywordAnalysis,
  buildSegmentsForAnalysis,
  serializeKeywords,
} from "./keywordAnalysis";

describe("buildSegmentsForAnalysis", () => {
  it("uses API segments when present", () => {
    const api = [{ start: 0, end: 5, text: "hello budget" }];
    const result = buildSegmentsForAnalysis(api, "hello budget", ["budget"], 60);
    expect(result.timingSource).toBe("segments");
    expect(result.segments).toBe(api);
  });

  it("estimates segments when API segments are missing", () => {
    const result = buildSegmentsForAnalysis(
      [],
      "hello budget world",
      ["budget"],
      100,
    );
    expect(result.timingSource).toBe("estimated");
    expect(result.segments.length).toBe(1);
  });
});

describe("applyKeywordAnalysis", () => {
  it("returns matches and active keywords", () => {
    const result = applyKeywordAnalysis(
      "the budget and deadline",
      ["budget", "missing"],
      [{ start: 0, end: 10, text: "the budget and deadline" }],
      10,
    );
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].count).toBe(1);
    expect(result.activeKeywords.has("budget")).toBe(true);
  });
});

describe("serializeKeywords", () => {
  it("detects keyword list changes", () => {
    expect(serializeKeywords(["a", "b"])).not.toBe(serializeKeywords(["a", "c"]));
  });
});
