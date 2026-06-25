import { describe, expect, it } from "vitest";
import {
  detectNicheTemplateId,
  formatTemplateKeywords,
  getNicheTemplate,
  NICHE_TEMPLATES,
} from "./nicheTemplates";

describe("nicheTemplates", () => {
  it("includes CCSI-aligned service area templates", () => {
    const labels = NICHE_TEMPLATES.map((template) => template.label);
    expect(labels).toContain("Health & human services");
    expect(labels).toContain("Education");
    expect(labels).toContain("Government & public sector");
  });

  it("formats keywords as a comma-separated string", () => {
    const template = getNicheTemplate("education");
    expect(template).toBeDefined();
    expect(formatTemplateKeywords(template!.keywords)).toContain("students, schools");
  });

  it("detects when the textarea matches a template", () => {
    const template = getNicheTemplate("equity-values");
    const input = formatTemplateKeywords(template!.keywords);
    expect(detectNicheTemplateId(input)).toBe("equity-values");
    expect(detectNicheTemplateId("custom, keywords")).toBe("");
  });
});
