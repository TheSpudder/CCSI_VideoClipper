import type { TranscriptionCache } from "./keywordAnalysis";
import type { TimedSegment } from "../types/transcription";

const DB_NAME = "hotspot-ai";
const DB_VERSION = 1;
const STORE = "transcription-history";
export const MAX_HISTORY_ENTRIES = 20;

export type TranscriptionHistoryEntry = {
  id: string;
  fileName: string;
  fileKey: string;
  transcribedAt: number;
  duration: number;
  transcript: string;
  apiSegments: TimedSegment[];
  lastKeywords: string;
};

export type TranscriptionHistorySummary = Pick<
  TranscriptionHistoryEntry,
  "id" | "fileName" | "fileKey" | "transcribedAt" | "duration" | "lastKeywords"
>;

export type SaveTranscriptionHistoryInput = {
  fileName: string;
  fileKey: string;
  duration: number;
  transcript: string;
  apiSegments: TimedSegment[];
  lastKeywords: string;
};

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("fileKey", "fileKey", { unique: false });
        store.createIndex("transcribedAt", "transcribedAt", { unique: false });
      }
    };
  });
}

function getAllEntries(db: IDBDatabase): Promise<TranscriptionHistoryEntry[]> {
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  return requestToPromise(store.getAll());
}

function putEntry(
  db: IDBDatabase,
  entry: TranscriptionHistoryEntry,
): Promise<void> {
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  return requestToPromise(store.put(entry)).then(() => undefined);
}

function deleteEntry(db: IDBDatabase, id: string): Promise<void> {
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  return requestToPromise(store.delete(id)).then(() => undefined);
}

export function entryToCache(
  entry: TranscriptionHistoryEntry,
): TranscriptionCache {
  return {
    fileKey: entry.fileKey,
    transcript: entry.transcript,
    apiSegments: entry.apiSegments,
    duration: entry.duration,
  };
}

export function toHistorySummary(
  entry: TranscriptionHistoryEntry,
): TranscriptionHistorySummary {
  return {
    id: entry.id,
    fileName: entry.fileName,
    fileKey: entry.fileKey,
    transcribedAt: entry.transcribedAt,
    duration: entry.duration,
    lastKeywords: entry.lastKeywords,
  };
}

export function sortHistorySummaries(
  entries: TranscriptionHistorySummary[],
): TranscriptionHistorySummary[] {
  return [...entries].sort((a, b) => b.transcribedAt - a.transcribedAt);
}

export function pruneHistoryEntries(
  entries: TranscriptionHistoryEntry[],
  maxEntries: number,
): TranscriptionHistoryEntry[] {
  return [...entries]
    .sort((a, b) => b.transcribedAt - a.transcribedAt)
    .slice(0, maxEntries);
}

async function findByFileKey(
  db: IDBDatabase,
  fileKey: string,
): Promise<TranscriptionHistoryEntry | null> {
  const tx = db.transaction(STORE, "readonly");
  const index = tx.objectStore(STORE).index("fileKey");
  const matches = await requestToPromise(index.getAll(fileKey));
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.transcribedAt - a.transcribedAt)[0];
}

async function pruneToMax(db: IDBDatabase, maxEntries: number): Promise<void> {
  const entries = await getAllEntries(db);
  const keep = pruneHistoryEntries(entries, maxEntries);
  const keepIds = new Set(keep.map((entry) => entry.id));

  for (const entry of entries) {
    if (!keepIds.has(entry.id)) {
      await deleteEntry(db, entry.id);
    }
  }
}

export async function listTranscriptionHistory(): Promise<
  TranscriptionHistorySummary[]
> {
  const db = await openDb();
  try {
    const entries = await getAllEntries(db);
    return sortHistorySummaries(entries.map(toHistorySummary));
  } finally {
    db.close();
  }
}

export async function getTranscriptionHistory(
  id: string,
): Promise<TranscriptionHistoryEntry | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const entry = await requestToPromise(store.get(id));
    return entry ?? null;
  } finally {
    db.close();
  }
}

export async function findHistoryByFileKey(
  fileKey: string,
): Promise<TranscriptionHistoryEntry | null> {
  const db = await openDb();
  try {
    return findByFileKey(db, fileKey);
  } finally {
    db.close();
  }
}

export async function saveTranscriptionHistory(
  input: SaveTranscriptionHistoryInput,
): Promise<TranscriptionHistoryEntry> {
  const db = await openDb();
  try {
    const existing = await findByFileKey(db, input.fileKey);
    const entry: TranscriptionHistoryEntry = {
      id: existing?.id ?? crypto.randomUUID(),
      fileName: input.fileName,
      fileKey: input.fileKey,
      transcribedAt: Date.now(),
      duration: input.duration,
      transcript: input.transcript,
      apiSegments: input.apiSegments,
      lastKeywords: input.lastKeywords,
    };

    await putEntry(db, entry);
    await pruneToMax(db, MAX_HISTORY_ENTRIES);
    return entry;
  } finally {
    db.close();
  }
}

export async function deleteTranscriptionHistory(id: string): Promise<void> {
  const db = await openDb();
  try {
    await deleteEntry(db, id);
  } finally {
    db.close();
  }
}
