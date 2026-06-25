export type TimedSegment = {
  start: number;
  end: number;
  text: string;
};

export type TranscribeResponse = {
  transcript: string;
  language: string;
  duration: number;
  segments: TimedSegment[];
};
