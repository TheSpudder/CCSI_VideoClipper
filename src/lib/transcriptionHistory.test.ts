import { describe, expect, it } from "vitest";
import {
  entryToCache,
  pruneHistoryEntries,
  sortHistorySummaries,
  type TranscriptionHistoryEntry,
} from "./transcriptionHistory";

describe("entryToCache", () => {
  it("maps history entry fields to transcription cache", () => {
    const entry: TranscriptionHistoryEntry = {
      id: "1",
      fileName: "demo.mp4",
      fileKey: "demo.mp4-100-1",
      transcribedAt: 1000,
      duration: 120,
      transcript: "hello world",
      apiSegments: [{ start: 0, end: 5, text: "hello" }],
      lastKeywords: "hello",
    };

    expect(entryToCache(entry)).toEqual({
      fileKey: "demo.mp4-100-1",
      transcript: "hello world",
      apiSegments: [{ start: 0, end: 5, text: "hello" }],
      duration: 120,
    });
  });
});

describe("sortHistorySummaries", () => {
  it("orders newest first", () => {
    const sorted = sortHistorySummaries([
      {
        id: "a",
        fileName: "a.mp4",
        fileKey: "a",
        transcribedAt: 100,
        duration: 10,
        lastKeywords: "x",
      },
      {
        id: "b",
        fileName: "b.mp4",
        fileKey: "b",
        transcribedAt: 300,
        duration: 20,
        lastKeywords: "y",
      },
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(["b", "a"]);
  });
});

describe("pruneHistoryEntries", () => {
  it("keeps only the newest entries up to the limit", () => {
    const entries: TranscriptionHistoryEntry[] = [
      {
        id: "old",
        fileName: "old.mp4",
        fileKey: "old",
        transcribedAt: 1,
        duration: 1,
        transcript: "",
        apiSegments: [],
        lastKeywords: "",
      },
      {
        id: "mid",
        fileName: "mid.mp4",
        fileKey: "mid",
        transcribedAt: 2,
        duration: 2,
        transcript: "",
        apiSegments: [],
        lastKeywords: "",
      },
      {
        id: "new",
        fileName: "new.mp4",
        fileKey: "new",
        transcribedAt: 3,
        duration: 3,
        transcript: "",
        apiSegments: [],
        lastKeywords: "",
      },
    ];

    expect(pruneHistoryEntries(entries, 2).map((entry) => entry.id)).toEqual([
      "new",
      "mid",
    ]);
  });
});
