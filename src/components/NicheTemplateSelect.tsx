import {
  formatTemplateKeywords,
  NICHE_TEMPLATES,
  type NicheTemplate,
} from "../lib/nicheTemplates";

type NicheTemplateSelectProps = {
  value: string;
  onChange: (templateId: string, template: NicheTemplate | null) => void;
  disabled?: boolean;
};

export function NicheTemplateSelect({
  value,
  onChange,
  disabled = false,
}: NicheTemplateSelectProps) {
  const selected = NICHE_TEMPLATES.find((template) => template.id === value);

  return (
    <div className="niche-select">
      <label htmlFor="niche-template">Niche template</label>
      <select
        id="niche-template"
        className="niche-select__dropdown"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const templateId = e.target.value;
          onChange(templateId, NICHE_TEMPLATES.find((t) => t.id === templateId) ?? null);
        }}
      >
        <option value="">Custom keywords</option>
        {NICHE_TEMPLATES.map((template) => (
          <option key={template.id} value={template.id}>
            {template.label}
          </option>
        ))}
      </select>

      {selected && (
        <div className="niche-select__details">
          <p className="niche-select__description">{selected.description}</p>
          <p className="niche-select__meta">
            Audience: {selected.audience} · {selected.keywords.length} keywords
          </p>
          <p className="niche-select__preview" aria-label="Template keywords">
            {formatTemplateKeywords(selected.keywords)}
          </p>
        </div>
      )}
    </div>
  );
}
