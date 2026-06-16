"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type {
  JobStage,
  NotesStatus,
  NotesUpdateRequest,
  RecordingDetailResponse,
  TranscriptSegment,
} from "@salin/shared";

import type { ExportLinkItem } from "@/components/export-links";
import { NotesEditorTab } from "@/components/notes-editor-tab";
import { RecordingDetailHeader } from "@/components/recording-detail-header";
import { RecordingWorkspaceTabs } from "@/components/recording-workspace-tabs";
import { TranscriptWorkspaceTab } from "@/components/transcript-workspace-tab";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();
const terminalStages: JobStage[] = ["completed", "failed"];
const terminalNotesStatuses: NotesStatus[] = ["idle", "completed", "failed"];

function toNotesDraft(notes: RecordingDetailResponse["notes"]): NotesUpdateRequest {
  return {
    content: notes.content,
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
  const [renamingRecording, setRenamingRecording] = useState(false);
  const [speakerSavingTarget, setSpeakerSavingTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "notes">("transcript");
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<NotesUpdateRequest | null>(
    initialData ? toNotesDraft(initialData.notes) : null,
  );
  const [notesDirty, setNotesDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [speakerMessage, setSpeakerMessage] = useState<string | null>(null);
  const desktopAudioRef = useRef<HTMLAudioElement | null>(null);
  const mobileAudioRef = useRef<HTMLAudioElement | null>(null);
  const notesDirtyRef = useRef(false);
  const targetPauseTimeRef = useRef<{ id: string; time: number } | null>(null);
  const stage = data?.job.stage;
  const notesStatus = data?.notes.status;
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const transcriptExportLinks = useMemo<ExportLinkItem[]>(
    () => [
      {
        ariaLabel: "Export transcript TXT",
        href: apiClient.transcriptExportUrl(recordingId),
        label: "Transcript TXT",
      },
      {
        ariaLabel: "Export transcript PDF",
        href: apiClient.transcriptPdfExportUrl(recordingId),
        label: "Transcript PDF",
      },
    ],
    [recordingId],
  );

  const notesExportLinks = useMemo<ExportLinkItem[]>(
    () => [
      {
        ariaLabel: "Export notes TXT",
        href: apiClient.notesExportUrl(recordingId),
        label: "Notes TXT",
      },
      {
        ariaLabel: "Export notes PDF",
        href: apiClient.notesPdfExportUrl(recordingId),
        label: "Notes PDF",
      },
      {
        ariaLabel: "Export combined TXT",
        href: apiClient.combinedExportUrl(recordingId),
        label: "Combined TXT",
      },
      {
        ariaLabel: "Export combined PDF",
        href: apiClient.combinedPdfExportUrl(recordingId),
        label: "Combined PDF",
      },
    ],
    [recordingId],
  );

  useEffect(() => {
    notesDirtyRef.current = notesDirty;
  }, [notesDirty]);

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

  useEffect(() => {
    let intervalId: number | undefined;

    async function refreshWorkspace() {
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
    }

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
  }, [notesStatus, recordingId, stage]);

  const filteredSegments = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data.transcript_segments;
    }

    return data.transcript_segments.filter((segment) => {
      const haystack = `${segment.speaker_label} ${segment.text}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [data, deferredSearchQuery]);

  const speakerLabels = useMemo(() => {
    if (!data) {
      return [];
    }

    return Array.from(
      new Set(data.transcript_segments.map((segment) => segment.speaker_label)),
    ).sort((left, right) => left.localeCompare(right));
  }, [data]);

  if (!data) {
    return (
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4 lg:px-5">
        <Card className="p-5">
          <p className="font-medium text-ink">
            {error ? "Could not load recording" : "Loading recording workspace"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {error ?? "Fetching the latest job state and transcript data."}
          </p>
        </Card>
      </div>
    );
  }

  async function retryJob() {
    if (!data) {
      return;
    }

    const currentRecordingId = data.recording.id;

    setRetrying(true);
    setError(null);
    try {
      const response = await apiClient.retryRecording(currentRecordingId);
      setData((current) => (current ? { ...current, job: response.job } : current));
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed.");
    } finally {
      setRetrying(false);
    }
  }

  async function renameRecording(newName: string) {
    if (!data || !newName.trim() || newName === data.recording.filename) {
      return;
    }

    setRenamingRecording(true);
    setError(null);
    try {
      const response = await apiClient.renameRecording(recordingId, {
        filename: newName.trim(),
      });
      setData((current) =>
        current ? { ...current, recording: response.recording } : current,
      );
    } catch (renameError) {
      setError(
        renameError instanceof Error ? renameError.message : "Rename failed.",
      );
    } finally {
      setRenamingRecording(false);
    }
  }

  async function generateNotes() {
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

  async function renameSpeaker(fromLabel: string, toLabel: string) {
    setSpeakerSavingTarget("rename");
    setError(null);
    setSpeakerMessage(null);
    try {
      const response = await apiClient.renameSpeaker(recordingId, {
        from_label: fromLabel,
        to_label: toLabel,
      });
      setData((current) =>
        current
          ? { ...current, transcript_segments: response.transcript_segments }
          : current,
      );
      setSpeakerMessage("Speaker labels updated.");
    } catch (speakerError) {
      setError(
        speakerError instanceof Error
          ? speakerError.message
          : "Could not update speaker labels.",
      );
    } finally {
      setSpeakerSavingTarget(null);
    }
  }

  async function updateSegment(segmentId: string, speakerLabel: string, text: string) {
    setSpeakerSavingTarget(segmentId);
    setError(null);
    setSpeakerMessage(null);
    try {
      const response = await apiClient.updateSegment(recordingId, segmentId, {
        speaker_label: speakerLabel,
        text: text,
      });
      setData((current) =>
        current
          ? { ...current, transcript_segments: response.transcript_segments }
          : current,
      );
      setSpeakerMessage("Segment updated.");
    } catch (speakerError) {
      setError(
        speakerError instanceof Error
          ? speakerError.message
          : "Could not update the segment.",
      );
    } finally {
      setSpeakerSavingTarget(null);
    }
  }

  function seekToSegment(segment: TranscriptSegment) {
    setActiveSegmentId(segment.id);
    const targetId = segment.id;
    const startTime = segment.start_ms / 1000;
    const targetTime = segment.end_ms / 1000;
    targetPauseTimeRef.current = { id: targetId, time: targetTime };

    const isDesktop = window.innerWidth >= 1280;
    const activeRef = isDesktop ? desktopAudioRef : mobileAudioRef;
    const inactiveRef = isDesktop ? mobileAudioRef : desktopAudioRef;

    if (inactiveRef.current) {
      inactiveRef.current.pause();
    }

    const audio = activeRef.current;
    if (!audio) return;

    audio.currentTime = startTime;
    void audio.play().catch(() => undefined);

    const onTimeUpdate = () => {
      const target = targetPauseTimeRef.current;
      if (!target || target.id !== targetId) {
        audio.removeEventListener("timeupdate", onTimeUpdate);
        return;
      }

      const isOutOfSegment =
        audio.currentTime < startTime - 1 || audio.currentTime > targetTime + 1;

      if (audio.currentTime >= targetTime && !isOutOfSegment) {
        audio.pause();
        targetPauseTimeRef.current = null;
        audio.removeEventListener("timeupdate", onTimeUpdate);
      } else if (isOutOfSegment) {
        targetPauseTimeRef.current = null;
        audio.removeEventListener("timeupdate", onTimeUpdate);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
  }

  function handleDraftChange(nextDraft: NotesUpdateRequest) {
    setNotesDraft(nextDraft);
    setNotesDirty(true);
    setSaveMessage(null);
  }

  const notesBusy =
    generatingNotes ||
    data.notes.status === "queued" ||
    data.notes.status === "generating";

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4 lg:px-5">
      <div className="grid gap-4" data-testid="workspace-shell">
        <RecordingDetailHeader
          data={data}
          renaming={renamingRecording}
          retrying={retrying}
          onRename={renameRecording}
          onRetry={retryJob}
        />

        <div
          className="hidden items-start gap-4 xl:grid xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.84fr)]"
          data-testid="desktop-workspace-grid"
        >
          <TranscriptWorkspaceTab
            activeSegmentId={activeSegmentId}
            audioRef={desktopAudioRef}
            data={data}
            error={error}
            exportLinks={transcriptExportLinks}
            filteredSegments={filteredSegments}
            query={searchQuery}
            retrying={retrying}
            speakerLabels={speakerLabels}
            speakerMessage={speakerMessage}
            speakerSavingTarget={speakerSavingTarget}
            onQueryChange={setSearchQuery}
            onRenameSpeaker={renameSpeaker}
            onRetry={retryJob}
            onSeek={seekToSegment}
            onUpdateSegment={updateSegment}
          />
          <NotesEditorTab
            canGenerate={data.job.stage !== "failed" && data.transcript_segments.length > 0}
            dirty={notesDirty}
            draft={notesDraft ?? toNotesDraft(data.notes)}
            error={error}
            exportLinks={notesExportLinks}
            notes={data.notes}
            notesBusy={notesBusy}
            saveBusy={savingNotes}
            saveMessage={saveMessage}
            onDraftChange={handleDraftChange}
            onGenerate={generateNotes}
            onSave={saveNotes}
          />
        </div>

        <Tabs
          className="grid gap-3 xl:hidden"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "transcript" | "notes")}
        >
          <RecordingWorkspaceTabs />
          <TabsContent value="transcript">
            <TranscriptWorkspaceTab
              activeSegmentId={activeSegmentId}
              audioRef={mobileAudioRef}
              data={data}
              error={error}
              exportLinks={transcriptExportLinks}
              filteredSegments={filteredSegments}
              query={searchQuery}
              retrying={retrying}
              speakerLabels={speakerLabels}
              speakerMessage={speakerMessage}
              speakerSavingTarget={speakerSavingTarget}
              onQueryChange={setSearchQuery}
              onRenameSpeaker={renameSpeaker}
              onRetry={retryJob}
              onSeek={seekToSegment}
              onUpdateSegment={updateSegment}
            />
          </TabsContent>
          <TabsContent value="notes">
            <NotesEditorTab
              canGenerate={data.job.stage !== "failed" && data.transcript_segments.length > 0}
              dirty={notesDirty}
              draft={notesDraft ?? toNotesDraft(data.notes)}
              error={error}
              exportLinks={notesExportLinks}
              notes={data.notes}
              notesBusy={notesBusy}
              saveBusy={savingNotes}
              saveMessage={saveMessage}
              onDraftChange={handleDraftChange}
              onGenerate={generateNotes}
              onSave={saveNotes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
