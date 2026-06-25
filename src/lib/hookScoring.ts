export type HookSignal = "question" | "stat" | "emotional";

export type HookScore = {
  score: number;
  reasons: string[];
};

const EMOTIONAL_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /^(i never|i always|i remember|when i|one day|here's why|the truth is|imagine|let me tell you)/i, label: "Personal story hook" },
  { re: /(changed my life|never thought|most important|the secret is|shocking|incredible|powerful moment)/i, label: "Emotional hook" },
];

export function scoreHook(text: string): HookScore {
  const normalized = text.trim();
  if (!normalized) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];
  const opener = normalized.slice(0, 140);

  if (/\?/.test(opener.slice(0, 100))) {
    score += 1.5;
    reasons.push("Opens with a question");
  } else if (
    /^(what|why|how|when|where|who|did you|have you|do you|can you|is it|are you)\b/i.test(
      normalized,
    )
  ) {
    score += 1.25;
    reasons.push("Question-style opener");
  }

  if (
    /\b\d{1,3}%|\b\d+[\d,]*\s*(percent|million|billion|thousand|years?|people|students|families)\b|\$\d+/i.test(
      opener,
    )
  ) {
    score += 1.25;
    reasons.push("Contains a stat or number");
  }

  for (const { re, label } of EMOTIONAL_PATTERNS) {
    if (re.test(opener)) {
      score += 1;
      reasons.push(label);
      break;
    }
  }

  return {
    score: Math.round(score * 100) / 100,
    reasons,
  };
}

export function openingTextAt(
  segments: { start: number; end: number; text: string }[],
  windowStart: number,
  leadSeconds = 8,
): string {
  const leadEnd = windowStart + leadSeconds;
  const parts: string[] = [];

  for (const segment of segments) {
    if (segment.end <= windowStart) continue;
    if (segment.start >= leadEnd) break;
    parts.push(segment.text);
  }

  return parts.join(" ").trim();
}
