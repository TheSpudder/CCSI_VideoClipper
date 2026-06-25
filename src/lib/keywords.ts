export type KeywordMatch = {
  keyword: string;
  count: number;
  snippets: string[];
};

export type MatchRange = {
  start: number;
  end: number;
};

export function parseKeywords(input: string): string[] {
  return [...new Set(input.split(",").map((k) => k.trim()).filter(Boolean))];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildKeywordPattern(keyword: string): RegExp {
  const escaped = escapeRegex(keyword.trim());
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

function snippetAround(text: string, index: number, radius = 60): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export function findMatchRanges(
  transcript: string,
  keyword: string,
): MatchRange[] {
  const pattern = buildKeywordPattern(keyword);
  const ranges: MatchRange[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(transcript)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }

  return ranges;
}

function mergeRanges(ranges: MatchRange[]): MatchRange[] {
  if (!ranges.length) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: MatchRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export function countMatchesInText(text: string, keywords: string[]): number {
  return keywords.reduce(
    (total, keyword) => total + findMatchRanges(text, keyword).length,
    0,
  );
}

export function findMatchedKeywordsInText(
  text: string,
  keywords: string[],
): string[] {
  return keywords.filter(
    (keyword) => findMatchRanges(text, keyword).length > 0,
  );
}

export function findKeywords(
  transcript: string,
  keywords: string[],
): KeywordMatch[] {
  return keywords.map((keyword) => {
    const ranges = findMatchRanges(transcript, keyword);
    const snippets = ranges
      .slice(0, 5)
      .map((r) => snippetAround(transcript, r.start));

    return { keyword, count: ranges.length, snippets };
  });
}

export function highlightTranscript(
  transcript: string,
  keywords: string[],
): string {
  if (!keywords.length) return escapeHtml(transcript);

  const allRanges = mergeRanges(
    keywords.flatMap((kw) => findMatchRanges(transcript, kw)),
  );

  if (!allRanges.length) return escapeHtml(transcript);

  let html = "";
  let cursor = 0;

  for (const { start, end } of allRanges) {
    html += escapeHtml(transcript.slice(cursor, start));
    html += `<mark>${escapeHtml(transcript.slice(start, end))}</mark>`;
    cursor = end;
  }

  html += escapeHtml(transcript.slice(cursor));
  return html;
}

export function highlightSnippet(snippet: string, keyword: string): string {
  const pattern = buildKeywordPattern(keyword);
  return escapeHtml(snippet).replace(
    pattern,
    (match) => `<strong class="snippet-hit">${match}</strong>`,
  );
}
