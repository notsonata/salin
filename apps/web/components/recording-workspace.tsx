"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  JobStage,
  NotesUpdateRequest,
  NotesStatus,
  RecordingDetailResponse,
  TranscriptSegment,
} from "@salin/shared";

import { Card } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { NotesEditorTab } from "@/components/notes-editor-tab";
import { RecordingDetailHeader } from "@/components/recording-detail-header";
import { RecordingWorkspaceTabs } from "@/components/recording-workspace-tabs";
import { TranscriptWorkspaceTab } from "@/components/transcript-workspace-tab";

const apiClient = createBrowserClient();
const terminalStages: JobStage[] = ["completed", "failed"];
const terminalNotesStatuses: NotesStatus[] = ["idle", "completed", "failed"];

function toNotesDraft(notes: RecordingDetailResponse["notes"]): NotesUpdateRequest {
  return {
    summary: notes.summary,
    key_points: [...notes.key_points],
    decisions: [...notes.decisions],
    action_items: [...notes.action_items],
    questions: [...notes.questions],
  };
}

export function RecordingWorkspace({
  initialData,
  recordingId,
}: {
  initialData?: RecordingDetailResponse | null;
  recordingId: string;
}) {
  const [data, setData] = useState<RecordingDetailResponse | null>(initialData ?? null);
  const [retrying, setRetrying] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "notes">("transcript");
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<NotesUpdateRequest | null>(
    initialData ? toNotesDraft(initialData.notes) : null,
  );
  const [notesDirty, setNotesDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notesDirtyRef = useRef(false);
  const stage = data?.job.stage;
  const notesStatus = data?.notes.status;

  useEffect(() => {
    notesDirtyRef.current = notesDirty;
  }, [notesDirty]);

  const refreshWorkspace = useCallback(async () => {
    try {
      const nextData = await apiClient.getRecording(recordingId);
      setData(nextData);
      if (!notesDirtyRef.current) {
        setNotesDraft(toNotesDraft(nextData.notes));
      }
    } catch (pollError) {
      setError(
        pollError instanceof Error ? pollError.message : "Could not refresh status.",
      );
    }
  }, [recordingId]);

  useEffect(() => {
    let intervalId: number | undefined;

    void refreshWorkspace();

    if (
      !stage ||
      !terminalStages.includes(stage) ||
      !notesStatus ||
      !terminalNotesStatuses.includes(notesStatus)
    ) {
      intervalId = window.setInterval(() => {
        void refreshWorkspace();
      }, 2000);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [notesStatus, refreshWorkspace, stage]);

  useEffect(() => {
    if (!notesDirty) {
      return undefined;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [notesDirty]);

  const filteredSegments = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data.transcript_segments;
    }

    return data.transcript_segments.filter((segment) => {
      const haystack = `${segment.speaker_label} ${segment.text}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [data, searchQuery]);

  if (!data) {
    return (
      <Card className="p-5">
        <p className="font-medium text-ink">
          {error ? "Could not load recording" : "Loading recording workspace"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {error ?? "Fetching the latest job state and transcript data."}
        </p>
      </Card>
    );
  }

  async function retryJob() {
    if (!data) {
      return;
    }

    setRetrying(true);
    setError(null);
    try {
      const response = await apiClient.retryRecording(data.recording.id);
      setData((current) => (current ? { ...current, job: response.job } : current));
    } catch (retryError) {
      setError(
        retryError instanceof Error ? retryError.message : "Retry failed.",
      );
    } finally {
      setRetrying(false);
    }
  }

  async function generateNotes() {
    if (!data) {
      return;
    }

    if (
      notesDirty &&
      !window.confirm("You have unsaved note edits. Regenerating will replace them. Continue?")
    ) {
      return;
    }

    setGeneratingNotes(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await apiClient.generateNotes(recordingId);
      setData((current) => (current ? { ...current, notes: response.notes } : current));
      setNotesDraft(toNotesDraft(response.notes));
      setNotesDirty(false);
    } catch (notesError) {
      setError(
        notesError instanceof Error ? notesError.message : "Notes generation failed.",
      );
    } finally {
      setGeneratingNotes(false);
    }
  }

  async function saveNotes() {
    if (!notesDraft) {
      return;
    }

    setSavingNotes(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await apiClient.updateNotes(recordingId, notesDraft);
      setData((current) => (current ? { ...current, notes: response.notes } : current));
      setNotesDraft(toNotesDraft(response.notes));
      setNotesDirty(false);
      setSaveMessage("Notes saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  function seekToSegment(segment: TranscriptSegment) {
    setActiveSegmentId(segment.id);
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = segment.start_ms / 1000;
    void audioRef.current.play().catch(() => undefined);
  }

  function exportTranscript() {
    if (!data) {
      return;
    }

    const content = data.transcript_segments
      .map(
        (segment) =>
          `[${formatTimestamp(segment.start_ms)}] ${segment.speaker_label}: ${segment.text}`,
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.recording.filename.replace(/\.[^.]+$/, "")}-transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const notesBusy =
    generatingNotes ||
    data.notes.status === "queued" ||
    data.notes.status === "generating";

  function handleDraftChange(nextDraft: NotesUpdateRequest) {
    setNotesDraft(nextDraft);
    setNotesDirty(true);
    setSaveMessage(null);
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-6">
      <RecordingDetailHeader data={data} retrying={retrying} onRetry={retryJob} />
      <RecordingWorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "transcript" ? (
        <TranscriptWorkspaceTab
          activeSegmentId={activeSegmentId}
          audioRef={audioRef}
          data={data}
          error={error}
          filteredSegments={filteredSegments}
          query={searchQuery}
          retrying={retrying}
          onExport={exportTranscript}
          onQueryChange={setSearchQuery}
          onRetry={retryJob}
          onSeek={seekToSegment}
        />
      ) : (
        <NotesEditorTab
          canGenerate={data.job.stage === "completed" && data.transcript_segments.length > 0}
          dirty={notesDirty}
          draft={notesDraft ?? toNotesDraft(data.notes)}
          error={error}
          notes={data.notes}
          notesBusy={notesBusy}
          saveBusy={savingNotes}
          saveMessage={saveMessage}
          onDraftChange={handleDraftChange}
          onGenerate={generateNotes}
          onSave={saveNotes}
        />
      )}
    </div>
  );
}
