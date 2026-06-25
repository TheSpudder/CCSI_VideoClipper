export type ProgressStage =
  | "uploading"
  | "extracting"
  | "transcribing"
  | "complete";

const STAGE_LABELS: Record<ProgressStage, string> = {
  uploading: "Uploading video…",
  extracting: "Extracting audio…",
  transcribing: "Transcribing (first run may download model)…",
  complete: "Done!",
};

type ProgressBarProps = {
  stage: ProgressStage;
  complete?: boolean;
};

export function ProgressBar({ stage, complete }: ProgressBarProps) {
  return (
    <div className="progress" role="status" aria-live="polite">
      <div className="progress__track">
        <div
          className={`progress__bar ${complete ? "progress__bar--complete" : "progress__bar--active"}`}
        />
      </div>
      <p className="progress__label">{STAGE_LABELS[stage]}</p>
    </div>
  );
}
