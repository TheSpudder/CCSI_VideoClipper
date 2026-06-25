import { describe, expect, it } from "vitest";
import {
  findKeywords,
  highlightTranscript,
  parseKeywords,
} from "./keywords";

describe("parseKeywords", () => {
  it("splits, trims, and deduplicates", () => {
    expect(parseKeywords(" AI, budget, AI , ")).toEqual(["AI", "budget"]);
  });
});

describe("findKeywords", () => {
  it("does not match substrings inside other words", () => {
    const transcript = "WAIT for the AI system";
    const results = findKeywords(transcript, ["AI"]);
    expect(results[0].count).toBe(1);
  });

  it("is case insensitive for whole words", () => {
    const transcript = "The ai tool and Ai platform";
    const results = findKeywords(transcript, ["AI"]);
    expect(results[0].count).toBe(2);
  });

  it("matches standalone budget but not rebudgeting", () => {
    const transcript = "The budget, budgets, and rebudgeting";
    const results = findKeywords(transcript, ["budget"]);
    expect(results[0].count).toBe(1);
  });

  it("matches multi-word phrases", () => {
    const transcript = "Please note the action item for today";
    const results = findKeywords(transcript, ["action item"]);
    expect(results[0].count).toBe(1);
  });

  it("matches acronyms with adjacent punctuation", () => {
    const transcript = "Using AI. (AI) is great";
    const results = findKeywords(transcript, ["AI"]);
    expect(results[0].count).toBe(2);
  });
});

describe("highlightTranscript", () => {
  it("highlights the same count as findKeywords", () => {
    const transcript = "WAIT for the AI system and another AI";
    const keywords = ["AI"];
    const matches = findKeywords(transcript, keywords);
    const html = highlightTranscript(transcript, keywords);
    const markCount = (html.match(/<mark>/g) ?? []).length;
    expect(markCount).toBe(matches[0].count);
  });

  it("does not highlight AI inside WAIT", () => {
    const html = highlightTranscript("WAIT for AI", ["AI"]);
    expect(html).toBe("WAIT for <mark>AI</mark>");
  });
});
