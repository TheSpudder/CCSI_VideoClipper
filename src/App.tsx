import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipRecommendations } from "./components/ClipRecommendations";
import { KeywordChips } from "./components/KeywordChips";
import { Logo } from "./components/Logo";
import { NicheTemplateSelect } from "./components/NicheTemplateSelect";

import {

  KeywordHeatmap,

  type BucketSize,

} from "./components/KeywordHeatmap";

import { ProgressBar, type ProgressStage } from "./components/ProgressBar";
import { ThemeToggle } from "./components/ThemeToggle";
import { TranscriptionHistory } from "./components/TranscriptionHistory";
import { VideoPlayer } from "./components/VideoPlayer";

import { formatDuration, formatFileSize } from "./lib/format";

import {

  analyzeKeywordDensity,

  DEFAULT_CLIP_WINDOW_SECONDS,

  findTopPeakWindows,

  type HeatmapBucket,

  type PeakWindow,

  scoreSegments,

} from "./lib/heatmap";

import {

  applyKeywordAnalysis,

  fileKey,

  serializeKeywords,

  type TimingSource,

  type TranscriptionCache,

} from "./lib/keywordAnalysis";

import {

  highlightSnippet,

  highlightTranscript,

  parseKeywords,

  type KeywordMatch,

} from "./lib/keywords";

import { resolveDuration } from "./lib/transcriptFallback";

import {
  detectNicheTemplateId,
  formatTemplateKeywords,
} from "./lib/nicheTemplates";

import {
  deleteTranscriptionHistory,
  entryToCache,
  findHistoryByFileKey,
  getTranscriptionHistory,
  listTranscriptionHistory,
  saveTranscriptionHistory,
  type TranscriptionHistorySummary,
} from "./lib/transcriptionHistory";

import type { TranscribeResponse } from "./types/transcription";



type ApiHealth = {

  status: string;

  ffmpeg: boolean;

  model: string;

  model_loaded: boolean;

  segments_supported?: boolean;

};



type LoadingMode = "transcribe" | "keywords" | null;



function StepTitle({ step, children }: { step: number; children: string }) {

  return (

    <h2>

      <span className="step-badge">{step}</span>

      {children}

    </h2>

  );

}



function App() {

  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);



  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [keywords, setKeywords] = useState("");

  const [selectedNicheId, setSelectedNicheId] = useState("");

  const [transcript, setTranscript] = useState("");

  const [transcriptionCache, setTranscriptionCache] =

    useState<TranscriptionCache | null>(null);

  const [lastAnalyzedKeywords, setLastAnalyzedKeywords] = useState("");

  const [segments, setSegments] = useState<TranscriptionCache["apiSegments"]>([]);

  const [timingSource, setTimingSource] = useState<TimingSource>("none");

  const [transcriptDuration, setTranscriptDuration] = useState<number | null>(

    null,

  );

  const [matches, setMatches] = useState<KeywordMatch[]>([]);

  const [heatmap, setHeatmap] = useState<HeatmapBucket[]>([]);

  const [peakWindow, setPeakWindow] = useState<PeakWindow | null>(null);

  const [bucketSize, setBucketSize] = useState<BucketSize>(10);

  const [activeKeywords, setActiveKeywords] = useState<Set<string>>(new Set());

  const [seekHint, setSeekHint] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [loadingMode, setLoadingMode] = useState<LoadingMode>(null);

  const [progressStage, setProgressStage] = useState<ProgressStage>("uploading");

  const [progressComplete, setProgressComplete] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const [dragging, setDragging] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<ApiHealth | null>(null);

  const [historyEntries, setHistoryEntries] = useState<
    TranscriptionHistorySummary[]
  >([]);

  const [historyLoading, setHistoryLoading] = useState(true);



  const keywordList = parseKeywords(keywords);

  const activeKeywordList = useMemo(

    () => keywordList.filter((kw) => activeKeywords.has(kw)),

    [keywordList, activeKeywords],

  );

  const hasTranscript = Boolean(transcript && transcriptionCache);

  const keywordsDirty =

    hasTranscript &&

    keywordList.length > 0 &&

    serializeKeywords(keywordList) !== lastAnalyzedKeywords;

  const canTranscribe =

    Boolean(videoFile) && keywordList.length > 0 && !loading && Boolean(health);

  const canUpdateKeywords =

    hasTranscript && keywordList.length > 0 && !loading && keywordsDirty;

  const foundCount = matches.filter((m) => m.count > 0).length;

  const hasHeatmapData = heatmap.some((b) => b.score > 0);

  const showKeywordFilter = Boolean(transcript && segments.length > 0);

  const topClips = useMemo(() => {

    if (!segments.length || !transcriptDuration || activeKeywordList.length === 0) {

      return [];

    }

    const segmentScores = scoreSegments(segments, activeKeywordList);

    return findTopPeakWindows(segmentScores, transcriptDuration, {

      windowSize: DEFAULT_CLIP_WINDOW_SECONDS,

      count: 3,

    });

  }, [segments, activeKeywordList, transcriptDuration]);

  const activeFileKey =
    videoFile != null
      ? fileKey(videoFile)
      : transcriptionCache?.fileKey ?? null;



  const refreshHistory = useCallback(() => {
    return listTranscriptionHistory().then(setHistoryEntries);
  }, []);



  useEffect(() => {

    fetch("/api/health")

      .then((res) => (res.ok ? res.json() : null))

      .then((data) => setHealth(data))

      .catch(() => setHealth(null));

  }, []);



  useEffect(() => {

    refreshHistory().finally(() => setHistoryLoading(false));

  }, [refreshHistory]);



  useEffect(() => {

    if (!loading || loadingMode !== "transcribe") return;



    setProgressStage("uploading");

    setProgressComplete(false);



    const extractTimer = setTimeout(() => setProgressStage("extracting"), 500);

    const transcribeTimer = setTimeout(() => setProgressStage("transcribing"), 2000);



    return () => {

      clearTimeout(extractTimer);

      clearTimeout(transcribeTimer);

    };

  }, [loading, loadingMode]);



  useEffect(() => {

    if (!transcriptDuration || !segments.length || activeKeywordList.length === 0) {

      setHeatmap([]);

      setPeakWindow(null);

      return;

    }



    const density = analyzeKeywordDensity(

      segments,

      activeKeywordList,

      transcriptDuration,

      { bucketSize },

    );

    setHeatmap(density.heatmap);

    setPeakWindow(density.peak);

  }, [segments, activeKeywordList, transcriptDuration, bucketSize]);



  const resetResults = useCallback(() => {

    setTranscript("");

    setTranscriptionCache(null);

    setLastAnalyzedKeywords("");

    setSegments([]);

    setTimingSource("none");

    setTranscriptDuration(null);

    setMatches([]);

    setHeatmap([]);

    setPeakWindow(null);

    setActiveKeywords(new Set());

    setSeekHint(null);

  }, []);



  const clearVideo = useCallback(() => {

    if (videoUrl) URL.revokeObjectURL(videoUrl);

    setVideoFile(null);

    setVideoUrl(null);

    setVideoDuration(null);

    resetResults();

    setError(null);

    if (fileInputRef.current) fileInputRef.current.value = "";

  }, [resetResults, videoUrl]);



  const toggleKeyword = useCallback((keyword: string) => {

    setActiveKeywords((prev) => {

      const next = new Set(prev);

      if (next.has(keyword)) {

        if (next.size === 1) return next;

        next.delete(keyword);

      } else {

        next.add(keyword);

      }

      return next;

    });

  }, []);



  const seekToTime = useCallback(

    (seconds: number) => {

      const video = videoRef.current;

      if (video) {

        video.currentTime = seconds;

        video.scrollIntoView({ behavior: "smooth", block: "nearest" });

        void video.play().catch(() => {});

      }



      const el = transcriptRef.current;

      if (el && transcriptDuration && transcriptDuration > 0) {

        const ratio = seconds / transcriptDuration;

        el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);

      }



      setSeekHint(seconds);

    },

    [transcriptDuration],

  );



  const runAnalysisFromCache = useCallback(

    (cache: TranscriptionCache, keywordsToApply: string[]) => {

      const analysis = applyKeywordAnalysis(

        cache.transcript,

        keywordsToApply,

        cache.apiSegments,

        cache.duration,

      );



      setTranscript(cache.transcript);

      setSegments(analysis.segments);

      setTimingSource(analysis.timingSource);

      setTranscriptDuration(cache.duration);

      setMatches(analysis.matches);

      setActiveKeywords(analysis.activeKeywords);

      setLastAnalyzedKeywords(serializeKeywords(keywordsToApply));

    },

    [],

  );



  const restoreFromHistory = useCallback(

    async (id: string) => {

      const entry = await getTranscriptionHistory(id);

      if (!entry) return;



      const cache = entryToCache(entry);

      const currentKey = videoFile ? fileKey(videoFile) : null;



      if (currentKey && currentKey !== entry.fileKey) {

        if (videoUrl) URL.revokeObjectURL(videoUrl);

        setVideoFile(null);

        setVideoUrl(null);

        setVideoDuration(null);

        if (fileInputRef.current) fileInputRef.current.value = "";

      }



      setKeywords(entry.lastKeywords);

      setSelectedNicheId(detectNicheTemplateId(entry.lastKeywords));

      setTranscriptionCache(cache);

      runAnalysisFromCache(cache, parseKeywords(entry.lastKeywords));

      setError(null);

      setShowSuccess(false);

    },

    [runAnalysisFromCache, videoFile, videoUrl],

  );



  const handleDeleteHistory = useCallback(

    async (id: string) => {

      await deleteTranscriptionHistory(id);

      await refreshHistory();

    },

    [refreshHistory],

  );



  const handleFile = useCallback(

    (file: File | null) => {

      if (!file) return;



      if (videoUrl) URL.revokeObjectURL(videoUrl);



      const url = URL.createObjectURL(file);

      const key = fileKey(file);

      setVideoFile(file);

      setVideoUrl(url);

      resetResults();

      setError(null);

      setVideoDuration(null);



      void findHistoryByFileKey(key).then((entry) => {

        if (!entry) return;

        const cache = entryToCache(entry);

        setKeywords(entry.lastKeywords);

        setSelectedNicheId(detectNicheTemplateId(entry.lastKeywords));

        setTranscriptionCache(cache);

        runAnalysisFromCache(cache, parseKeywords(entry.lastKeywords));

      });



      const video = document.createElement("video");

      video.preload = "metadata";

      video.onloadedmetadata = () => {

        setVideoDuration(video.duration);

      };

      video.onerror = () => setVideoDuration(null);

      video.src = url;

    },

    [resetResults, runAnalysisFromCache, videoUrl],

  );



  const onDrop = useCallback(

    (e: React.DragEvent) => {

      e.preventDefault();

      setDragging(false);

      const file = e.dataTransfer.files[0];

      if (file?.type.startsWith("video/")) handleFile(file);

    },

    [handleFile],

  );



  const updateKeywords = useCallback(() => {

    if (!transcriptionCache || !keywordList.length) return;



    setLoading(true);

    setLoadingMode("keywords");

    setError(null);



    requestAnimationFrame(() => {

      runAnalysisFromCache(transcriptionCache, keywordList);

      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 1200);

      setLoading(false);

      setLoadingMode(null);

    });

  }, [keywordList, runAnalysisFromCache, transcriptionCache]);



  const transcribeVideo = useCallback(

    async (force = false) => {

      if (!videoFile || !keywordList.length) return;



      const key = fileKey(videoFile);

      if (

        !force &&

        transcriptionCache?.fileKey === key &&

        transcriptionCache.transcript

      ) {

        updateKeywords();

        return;

      }



      setLoading(true);

      setLoadingMode("transcribe");

      setError(null);

      resetResults();

      setShowSuccess(false);



      const formData = new FormData();

      formData.append("file", videoFile);



      try {

        const res = await fetch("/api/transcribe", {

          method: "POST",

          body: formData,

        });



        const data = (await res.json()) as TranscribeResponse & {

          detail?: unknown;

        };



        if (!res.ok) {

          const detail = data.detail;

          const message =

            typeof detail === "string"

              ? detail

              : Array.isArray(detail)

                ? detail.map((d: { msg?: string }) => d.msg).join(", ")

                : "Transcription failed";

          throw new Error(message);

        }



        const duration = resolveDuration(data.duration, videoDuration);

        const cache: TranscriptionCache = {

          fileKey: key,

          transcript: data.transcript,

          apiSegments: data.segments ?? [],

          duration,

        };



        setProgressStage("complete");

        setProgressComplete(true);

        await new Promise((r) => setTimeout(r, 400));



        setTranscriptionCache(cache);

        runAnalysisFromCache(cache, keywordList);

        await saveTranscriptionHistory({

          fileName: videoFile.name,

          fileKey: key,

          duration,

          transcript: data.transcript,

          apiSegments: data.segments ?? [],

          lastKeywords: keywords,

        });

        await refreshHistory();

        setShowSuccess(true);

        setTimeout(() => setShowSuccess(false), 2000);

      } catch (err) {

        setError(err instanceof Error ? err.message : "Something went wrong");

      } finally {

        setLoading(false);

        setLoadingMode(null);

        setProgressComplete(false);

      }

    },

    [

      keywordList,

      keywords,

      refreshHistory,

      resetResults,

      runAnalysisFromCache,

      transcriptionCache,

      updateKeywords,

      videoDuration,

      videoFile,

    ],

  );



  const highlighted =

    transcript && keywordList.length

      ? highlightTranscript(transcript, keywordList)

      : "";



  const statusPill = loading

    ? "pill pill--processing"

    : health

      ? health.ffmpeg

        ? "pill pill--ready"

        : "pill pill--warn"

      : "pill pill--offline";



  const statusText = loading

    ? "Processing"

    : health

      ? health.ffmpeg

        ? `Ready · model ${health.model}`

        : "ffmpeg missing"

      : "API offline";



  const apiNeedsRestart =

    health != null && health.segments_supported === false;



  const showHeatmapSection =

    Boolean(transcript) &&

    transcriptDuration != null &&

    foundCount > 0 &&

    segments.length > 0;



  const primaryLabel = loading

    ? loadingMode === "keywords"

      ? "Updating keywords…"

      : "Transcribing…"

    : hasTranscript

      ? keywordsDirty

        ? "Update keywords"

        : "Keywords up to date"

      : "Transcribe video";



  return (

    <div className="app">

      <header className="header">

        <div className="header__top">

          <Logo className="header__logo" />

          <div className="header__actions">
            <span className={statusPill}>{statusText}</span>
            <ThemeToggle />
          </div>

        </div>

        <p className="header__tagline">
          Upload a video, transcribe it locally, and find your keywords.
        </p>

        {apiNeedsRestart && (

          <p className="banner banner--warn">

            API is outdated — restart with <code>npm run dev:all</code> for

            timed segments and heatmap support.

          </p>

        )}

      </header>



      <div className="layout">

        <div className="layout__input">

          <section className="card">

            <StepTitle step={1}>Upload video</StepTitle>

            <div

              className={`dropzone ${dragging ? "dropzone--active" : ""} ${videoFile ? "dropzone--filled" : ""}`}

              onDragOver={(e) => {

                e.preventDefault();

                setDragging(true);

              }}

              onDragLeave={() => setDragging(false)}

              onDrop={onDrop}

              onClick={() => !videoFile && fileInputRef.current?.click()}

              role="button"

              tabIndex={0}

              onKeyDown={(e) => {

                if (e.key === "Enter" || e.key === " ")

                  fileInputRef.current?.click();

              }}

            >

              {videoFile ? (

                <div className="file-info">

                  <p className="file-name">{videoFile.name}</p>

                  <p className="file-meta">

                    {formatFileSize(videoFile.size)}

                    {videoDuration != null && ` · ${formatDuration(videoDuration)}`}

                  </p>

                  {hasTranscript && (

                    <p className="cache-badge">Transcript cached</p>

                  )}

                  <button

                    type="button"

                    className="file-clear"

                    onClick={(e) => {

                      e.stopPropagation();

                      clearVideo();

                    }}

                  >

                    Remove

                  </button>

                </div>

              ) : (

                <>

                  <p className="dropzone__icon">🎬</p>

                  <p>Drop a video here or click to browse</p>

                </>

              )}

              <input

                ref={fileInputRef}

                type="file"

                accept="video/*"

                hidden

                disabled={loading}

                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}

              />

            </div>

          </section>



          <TranscriptionHistory

            entries={historyEntries}

            activeFileKey={activeFileKey}

            loading={historyLoading}

            onSelect={restoreFromHistory}

            onDelete={handleDeleteHistory}

          />



          <section className="card">

            <StepTitle step={2}>Keywords</StepTitle>

            <NicheTemplateSelect

              value={selectedNicheId}

              disabled={loading && loadingMode === "transcribe"}

              onChange={(templateId, template) => {

                setSelectedNicheId(templateId);

                if (template) {

                  setKeywords(formatTemplateKeywords(template.keywords));

                }

              }}

            />

            <label htmlFor="keywords">Comma-separated keywords to search for</label>

            <textarea

              id="keywords"

              placeholder="e.g. community, impact, mental health, students"

              value={keywords}

              onChange={(e) => {

                setKeywords(e.target.value);

                setSelectedNicheId(detectNicheTemplateId(e.target.value));

              }}

              rows={3}

              disabled={loading && loadingMode === "transcribe"}

            />

            <KeywordChips

              keywords={keywordList}

              activeKeywords={showKeywordFilter ? activeKeywords : undefined}

              onToggle={showKeywordFilter ? toggleKeyword : undefined}

            />

            {showKeywordFilter && (

              <p className="chips-hint">Click keywords to filter the heatmap</p>

            )}

            {hasTranscript && keywordsDirty && (

              <p className="chips-hint chips-hint--dirty">

                Keywords changed — update to refresh matches instantly (no

                re-transcribe).

              </p>

            )}

          </section>



          {error && <p className="error">{error}</p>}



          <div className="action-row">

            <button

              className="primary-btn"

              type="button"

              disabled={

                loading ||

                !health ||

                !videoFile ||

                !keywordList.length ||

                (hasTranscript ? !canUpdateKeywords : !canTranscribe)

              }

              onClick={() =>

                hasTranscript ? updateKeywords() : transcribeVideo()

              }

            >

              {loading && <span className="btn-spinner" aria-hidden />}

              {primaryLabel}

            </button>

            {hasTranscript && (

              <button

                className="secondary-btn"

                type="button"

                disabled={loading || !canTranscribe}

                onClick={() => transcribeVideo(true)}

              >

                Re-transcribe video

              </button>

            )}

          </div>

        </div>



        <div className="layout__output">

          {videoUrl && transcript && (

            <section className="card">

              <VideoPlayer

                ref={videoRef}

                src={videoUrl}

                currentHint={seekHint}

              />

            </section>

          )}



          <section className={`card ${showSuccess ? "card--success" : ""}`}>

            <StepTitle step={3}>Transcript</StepTitle>

            {loading && loadingMode === "transcribe" ? (

              <ProgressBar stage={progressStage} complete={progressComplete} />

            ) : transcript ? (

              <>

                <div

                  ref={transcriptRef}

                  className="transcript"

                  dangerouslySetInnerHTML={{ __html: highlighted }}

                />

                {segments.length > 0 && transcriptDuration != null && (

                  <p className="transcript-meta">

                    {segments.length} timed segments ·{" "}

                    {formatDuration(transcriptDuration)}

                    {hasTranscript && " · transcript cached"}

                  </p>

                )}

              </>

            ) : (

              <div className="placeholder">

                Transcript will appear here after processing.

              </div>

            )}

          </section>



          {showHeatmapSection && (

            <section className="card">

              <StepTitle step={4}>Keyword heatmap</StepTitle>

              {hasHeatmapData ? (

                <KeywordHeatmap

                  buckets={heatmap}

                  duration={transcriptDuration!}

                  peak={peakWindow}

                  bucketSize={bucketSize}

                  onBucketSizeChange={setBucketSize}

                  formatTime={formatDuration}

                  onSeek={seekToTime}

                />

              ) : (

                <div className="placeholder">

                  No keyword density in the selected time range. Try enabling

                  more keywords above.

                </div>

              )}

            </section>

          )}



          {transcript && foundCount > 0 && timingSource === "none" && (

            <section className="card">

              <StepTitle step={4}>Keyword heatmap</StepTitle>

              <p className="banner banner--warn">

                Heatmap unavailable — no timed segment data and no video

                duration to estimate from. Restart the API with{" "}

                <code>npm run dev:all</code> and re-process your video.

              </p>

            </section>

          )}



          <section className="card">

            <StepTitle step={5}>Keyword matches</StepTitle>

            {matches.length > 0 ? (

              <>

                <p className="match-summary">

                  {foundCount} of {matches.length} keywords found

                </p>

                <ClipRecommendations

                  clips={topClips}

                  formatTime={formatDuration}

                  onSeek={seekToTime}

                  hasVideo={Boolean(videoUrl)}

                />

                {peakWindow && topClips.length === 0 && (

                  <div className="peak-callout">

                    <p className="peak-callout__title">Keyword hotspot</p>

                    <p className="peak-callout__time">

                      {formatDuration(peakWindow.start)} –{" "}

                      {formatDuration(peakWindow.end)} ·{" "}

                      {Math.round(peakWindow.score)}{" "}

                      {Math.round(peakWindow.score) === 1 ? "match" : "matches"}

                    </p>

                    <p className="peak-callout__keywords">

                      {peakWindow.matchedKeywords.join(", ")}

                    </p>

                    {videoUrl && (

                      <button

                        type="button"

                        className="heatmap__jump-btn"

                        onClick={() => seekToTime(peakWindow.start)}

                      >

                        Jump to hotspot in video

                      </button>

                    )}

                  </div>

                )}

                <ul className="matches">

                  {matches.map((m) => (

                    <li

                      key={m.keyword}

                      className={m.count ? "match--found" : "match--none"}

                    >

                      <div className="match__header">

                        <strong>{m.keyword}</strong>

                        <span>

                          {m.count} {m.count === 1 ? "match" : "matches"}

                        </span>

                      </div>

                      {m.snippets.length > 0 && (

                        <ul className="snippets">

                          {m.snippets.map((s, i) => (

                            <li

                              key={i}

                              dangerouslySetInnerHTML={{

                                __html: highlightSnippet(s, m.keyword),

                              }}

                            />

                          ))}

                        </ul>

                      )}

                    </li>

                  ))}

                </ul>

              </>

            ) : (

              <div className="placeholder">

                Matched keywords will appear here.

              </div>

            )}

          </section>

        </div>

      </div>

    </div>

  );

}



export default App;


