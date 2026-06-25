import { formatDuration, formatHistoryDate } from "../lib/format";
import { parseKeywords } from "../lib/keywords";
import type { TranscriptionHistorySummary } from "../lib/transcriptionHistory";

type TranscriptionHistoryProps = {
  entries: TranscriptionHistorySummary[];
  activeFileKey: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TranscriptionHistory({
  entries,
  activeFileKey,
  loading,
  onSelect,
  onDelete,
}: TranscriptionHistoryProps) {
  if (loading) {
    return (
      <section className="card history">
        <h2>History</h2>
        <p className="history__empty">Loading saved transcriptions…</p>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="card history">
        <h2>History</h2>
        <p className="history__empty">
          Transcripts you process will appear here so you can reopen them later.
        </p>
      </section>
    );
  }

  return (
    <section className="card history">
      <div className="history__header">
        <h2>History</h2>
        <span className="history__count">{entries.length} saved</span>
      </div>

      <ul className="history__list">
        {entries.map((entry) => {
          const keywordCount = parseKeywords(entry.lastKeywords).length;
          const isActive = activeFileKey != null && entry.fileKey === activeFileKey;

          return (
            <li key={entry.id} className="history__item">
              <button
                type="button"
                className={`history__select ${isActive ? "history__select--active" : ""}`}
                onClick={() => onSelect(entry.id)}
              >
                <span className="history__name" title={entry.fileName}>
                  {entry.fileName}
                </span>
                <span className="history__meta">
                  {formatHistoryDate(entry.transcribedAt)}
                  {entry.duration > 0 && ` · ${formatDuration(entry.duration)}`}
                  {keywordCount > 0 &&
                    ` · ${keywordCount} ${keywordCount === 1 ? "keyword" : "keywords"}`}
                </span>
                {!isActive && (
                  <span className="history__hint">Re-upload file to play video</span>
                )}
              </button>

              <button
                type="button"
                className="history__delete"
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete ${entry.fileName} from history`}
                title="Delete"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
