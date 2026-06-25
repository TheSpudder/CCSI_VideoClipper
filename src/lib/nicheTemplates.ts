export type NicheTemplate = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  audience: string;
};

export const NICHE_TEMPLATES: NicheTemplate[] = [
  {
    id: "impact-mission",
    label: "Impact & mission stories",
    description:
      "Emotional moments about community change and why the work matters — strong hooks for short-form.",
    audience: "General / donor / awareness",
    keywords: [
      "community",
      "impact",
      "change",
      "mission",
      "people-first",
      "strengthen",
      "flourish",
      "potential",
      "partner",
      "serve",
    ],
  },
  {
    id: "health-human-services",
    label: "Health & human services",
    description:
      "Crisis response, behavioral health, and family support — core CCSI service areas.",
    audience: "Health & human services",
    keywords: [
      "mental health",
      "behavioral health",
      "crisis",
      "families",
      "care",
      "support",
      "services",
      "trauma-informed",
      "wellness",
      "recovery",
    ],
  },
  {
    id: "education",
    label: "Education",
    description:
      "Schools, districts, and student outcomes — capacity-building in education systems.",
    audience: "Education",
    keywords: [
      "students",
      "schools",
      "educators",
      "learning",
      "districts",
      "classrooms",
      "education",
      "teachers",
      "staff",
      "systems",
    ],
  },
  {
    id: "government-public",
    label: "Government & public sector",
    description:
      "Local and state partnerships that improve how public services reach people.",
    audience: "Local & state government",
    keywords: [
      "government",
      "agencies",
      "public",
      "local",
      "statewide",
      "services",
      "partners",
      "policy",
      "county",
      "initiative",
    ],
  },
  {
    id: "organizational-development",
    label: "Organizational development",
    description:
      "Leadership, team resilience, and culture — clips that inspire internal and recruiting audiences.",
    audience: "Organizational development",
    keywords: [
      "leadership",
      "team",
      "culture",
      "resilient",
      "development",
      "training",
      "capacity",
      "collaboration",
      "practices",
      "together",
    ],
  },
  {
    id: "research-evaluation",
    label: "Research & evaluation",
    description:
      "Data-driven proof points and measurable outcomes — ideal for credibility clips.",
    audience: "Research & evaluation",
    keywords: [
      "data",
      "research",
      "evaluation",
      "outcomes",
      "measure",
      "results",
      "evidence",
      "impact",
      "report",
      "decisions",
    ],
  },
  {
    id: "operations-strategy",
    label: "Operations & business strategy",
    description:
      "Efficiency, scalability, and strategic alignment — B2B-style thought leadership clips.",
    audience: "Operations & strategy",
    keywords: [
      "operations",
      "strategy",
      "scalable",
      "efficient",
      "alignment",
      "goals",
      "capacity",
      "delivery",
      "sustainable",
      "solutions",
    ],
  },
  {
    id: "employee-spotlight",
    label: "Employee spotlight",
    description:
      "Personal stories and day-in-the-life moments — high engagement for social recruiting.",
    audience: "Culture & recruiting",
    keywords: [
      "story",
      "experience",
      "everyday",
      "spotlight",
      "hear",
      "share",
      "journey",
      "passion",
      "work",
      "team",
    ],
  },
  {
    id: "equity-values",
    label: "Equity & values",
    description:
      "CCSI's guiding values — equity, compassion, integrity — for values-driven brand content.",
    audience: "Culture & brand",
    keywords: [
      "equity",
      "compassion",
      "collaboration",
      "integrity",
      "imagination",
      "inclusive",
      "people-first",
      "trust",
      "values",
      "dignity",
    ],
  },
];

export function getNicheTemplate(id: string): NicheTemplate | undefined {
  return NICHE_TEMPLATES.find((template) => template.id === id);
}

export function formatTemplateKeywords(keywords: string[]): string {
  return keywords.join(", ");
}

export function templateKeywordsMatch(
  template: NicheTemplate,
  input: string,
): boolean {
  const parsed = input
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
  if (parsed.length !== template.keywords.length) return false;
  const expected = template.keywords.map((keyword) => keyword.toLowerCase());
  return expected.every((keyword, index) => parsed[index] === keyword);
}

export function detectNicheTemplateId(input: string): string {
  const match = NICHE_TEMPLATES.find((template) =>
    templateKeywordsMatch(template, input),
  );
  return match?.id ?? "";
}
