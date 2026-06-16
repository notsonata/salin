"use client";

import { useMemo, useRef, useState } from "react";

import type {
  NotesUpdateRequest,
  RecordingDetailResponse,
  TranscriptSegment,
} from "@salin/shared";

import type { ExportTargetLinks } from "@/components/export-links";
import { NotesEditorTab } from "@/components/notes-editor-tab";
import { RecordingDetailHeader } from "@/components/recording-detail-header";
import { RecordingWorkspaceTabs } from "@/components/recording-workspace-tabs";
import { TranscriptWorkspaceTab } from "@/components/transcript-workspace-tab";
import { demoExportHref, demoRecordingDetail } from "@/lib/demo-recording";

function toNotesDraft(notes: RecordingDetailResponse["notes"]): NotesUpdateRequest {
  return {
    summary: notes.summary,
    key_points: [...notes.key_points],
    decisions: [...notes.decisions],
    action_items: [...notes.action_items],
    questions: [...notes.questions],
  };
}

export function DemoRecordingWorkspace() {
  const [data, setData] = useState<RecordingDetailResponse>(demoRecordingDetail);
  const [activeTab, setActiveTab] = useState<"transcript" | "notes">("transcript");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [speakerSavingTarget, setSpeakerSavingTarget] = useState<string | null>(null);
  const [speakerMessage, setSpeakerMessage] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<NotesUpdateRequest>(() =>
    toNotesDraft(demoRecordingDetail.notes),
  );
  const [notesDirty, setNotesDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredSegments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data.transcript_segments;
    }

    return data.transcript_segments.filter((segment) => {
      const haystack = `${segment.speaker_label} ${segment.text}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [data.transcript_segments, searchQuery]);

  const speakerLabels = useMemo(
    () =>
      Array.from(
        new Set(data.transcript_segments.map((segment) => segment.speaker_label)),
      ).sort((left, right) => left.localeCompare(right)),
    [data.transcript_segments],
  );

  const transcriptExportTarget = useMemo<ExportTargetLinks>(
    () => ({
      pdfHref: demoExportHref("Transcript PDF"),
      txtHref: demoExportHref("Transcript TXT"),
    }),
    [],
  );

  const notesExportTarget = useMemo<ExportTargetLinks>(
    () => ({
      pdfHref: demoExportHref("Notes PDF"),
      txtHref: demoExportHref("Notes TXT"),
    }),
    [],
  );

  const notesWithTranscriptExportTarget = useMemo<ExportTargetLinks>(
    () => ({
      pdfHref: demoExportHref("Combined PDF"),
      txtHref: demoExportHref("Combined TXT"),
    }),
    [],
  );

  function seekToSegment(segment: TranscriptSegment) {
    setActiveSegmentId(segment.id);
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = segment.start_ms / 1000;
    void audioRef.current.play().catch(() => undefined);
  }

  async function renameSpeaker(fromLabel: string, toLabel: string) {
    setSpeakerSavingTarget("rename");
    setSpeakerMessage(null);
    setData((current) => ({
      ...current,
      transcript_segments: current.transcript_segments.map((segment) =>
        segment.speaker_label === fromLabel
          ? { ...segment, speaker_label: toLabel, speaker_estimated: false }
          : segment,
      ),
    }));
    setSpeakerMessage("Speaker labels updated in preview.");
    setSpeakerSavingTarget(null);
  }

  async function updateSegmentSpeaker(segmentId: string, speakerLabel: string) {
    setSpeakerSavingTarget(segmentId);
    setSpeakerMessage(null);
    setData((current) => ({
      ...current,
      transcript_segments: current.transcript_segments.map((segment) =>
        segment.id === segmentId
          ? { ...segment, speaker_label: speakerLabel, speaker_estimated: false }
          : segment,
      ),
    }));
    setSpeakerMessage("Speaker label updated in preview.");
    setSpeakerSavingTarget(null);
  }

  function handleDraftChange(nextDraft: NotesUpdateRequest) {
    setNotesDraft(nextDraft);
    setNotesDirty(true);
    setSaveMessage(null);
  }

  function saveNotes() {
    setData((current) => ({
      ...current,
      notes: {
        ...current.notes,
        ...notesDraft,
        status: "completed",
        error_message: null,
        updated_at: "2026-06-16T09:28:00.000Z",
      },
    }));
    setNotesDirty(false);
    setSaveMessage("Preview notes saved.");
  }

  function regenerateNotes() {
    setData((current) => ({
      ...current,
      notes: {
        ...demoRecordingDetail.notes,
        generation_count: current.notes.generation_count + 1,
        updated_at: "2026-06-16T09:29:00.000Z",
      },
    }));
    setNotesDraft(toNotesDraft(demoRecordingDetail.notes));
    setNotesDirty(false);
    setSaveMessage(null);
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] auto-rows-max content-start gap-6">
      <RecordingDetailHeader data={data} retrying={false} onRetry={() => undefined} />
      <RecordingWorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "transcript" ? (
        <TranscriptWorkspaceTab
          activeSegmentId={activeSegmentId}
          audioRef={audioRef}
          data={data}
          error={null}
          exportTarget={transcriptExportTarget}
          filteredSegments={filteredSegments}
          query={searchQuery}
          retrying={false}
          speakerLabels={speakerLabels}
          speakerMessage={speakerMessage}
          speakerSavingTarget={speakerSavingTarget}
          onQueryChange={setSearchQuery}
          onRenameSpeaker={renameSpeaker}
          onRetry={() => undefined}
          onSeek={seekToSegment}
          onUpdateSegmentSpeaker={updateSegmentSpeaker}
        />
      ) : (
        <NotesEditorTab
          canGenerate
          dirty={notesDirty}
          draft={notesDraft}
          error={null}
          exportTarget={notesExportTarget}
          includeTranscriptExportTarget={notesWithTranscriptExportTarget}
          notes={data.notes}
          notesBusy={false}
          saveBusy={false}
          saveMessage={saveMessage}
          onDraftChange={handleDraftChange}
          onGenerate={regenerateNotes}
          onSave={saveNotes}
        />
      )}
    </div>
  );
}
