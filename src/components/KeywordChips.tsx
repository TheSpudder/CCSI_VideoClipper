type KeywordChipsProps = {
  keywords: string[];
  activeKeywords?: Set<string>;
  onToggle?: (keyword: string) => void;
};

export function KeywordChips({
  keywords,
  activeKeywords,
  onToggle,
}: KeywordChipsProps) {
  if (!keywords.length) return null;

  const filterable = Boolean(onToggle && activeKeywords);

  return (
    <div className="chips" aria-label="Parsed keywords">
      {keywords.map((kw) => {
        if (!filterable) {
          return (
            <span key={kw} className="chip">
              {kw}
            </span>
          );
        }

        const active = activeKeywords!.has(kw);
        return (
          <button
            key={kw}
            type="button"
            className={`chip chip--toggle ${active ? "chip--active" : "chip--inactive"}`}
            onClick={() => onToggle!(kw)}
            aria-pressed={active}
          >
            {kw}
          </button>
        );
      })}
    </div>
  );
}
