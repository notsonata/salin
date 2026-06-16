"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";

import type {
  NotesUpdateRequest,
  RecordingDetailResponse,
  TranscriptSegment,
} from "@salin/shared";

import type { ExportLinkItem } from "@/components/export-links";
import { NotesEditorTab } from "@/components/notes-editor-tab";
import { RecordingDetailHeader } from "@/components/recording-detail-header";
import { RecordingWorkspaceTabs } from "@/components/recording-workspace-tabs";
import { TranscriptWorkspaceTab } from "@/components/transcript-workspace-tab";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { demoExportHref, demoRecordingDetail } from "@/lib/demo-recording";

function toNotesDraft(notes: RecordingDetailResponse["notes"]): NotesUpdateRequest {
  return {
    content: notes.content,
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
  const desktopAudioRef = useRef<HTMLAudioElement | null>(null);
  const mobileAudioRef = useRef<HTMLAudioElement | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredSegments = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data.transcript_segments;
    }

    return data.transcript_segments.filter((segment) => {
      const haystack = `${segment.speaker_label} ${segment.text}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [data.transcript_segments, deferredSearchQuery]);

  const speakerLabels = useMemo(
    () =>
      Array.from(
        new Set(data.transcript_segments.map((segment) => segment.speaker_label)),
      ).sort((left, right) => left.localeCompare(right)),
    [data.transcript_segments],
  );

  const transcriptExportLinks = useMemo<ExportLinkItem[]>(
    () => [
      {
        ariaLabel: "Export transcript TXT",
        href: demoExportHref("Transcript TXT"),
        label: "Transcript TXT",
      },
      {
        ariaLabel: "Export transcript PDF",
        href: demoExportHref("Transcript PDF"),
        label: "Transcript PDF",
      },
    ],
    [],
  );

  const notesExportLinks = useMemo<ExportLinkItem[]>(
    () => [
      {
        ariaLabel: "Export notes TXT",
        href: demoExportHref("Notes TXT"),
        label: "Notes TXT",
      },
      {
        ariaLabel: "Export notes PDF",
        href: demoExportHref("Notes PDF"),
        label: "Notes PDF",
      },
      {
        ariaLabel: "Export combined TXT",
        href: demoExportHref("Combined TXT"),
        label: "Combined TXT",
      },
      {
        ariaLabel: "Export combined PDF",
        href: demoExportHref("Combined PDF"),
        label: "Combined PDF",
      },
    ],
    [],
  );

  function seekToSegment(segment: TranscriptSegment) {
    setActiveSegmentId(segment.id);
    for (const ref of [desktopAudioRef, mobileAudioRef]) {
      if (!ref.current) {
        continue;
      }

      ref.current.currentTime = segment.start_ms / 1000;
      void ref.current.play().catch(() => undefined);
    }
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

  async function updateSegment(segmentId: string, speakerLabel: string, text: string) {
    setSpeakerSavingTarget(segmentId);
    setSpeakerMessage(null);
    setData((current) => ({
      ...current,
      transcript_segments: current.transcript_segments.map((segment) =>
        segment.id === segmentId
          ? { ...segment, speaker_label: speakerLabel, text: text, speaker_estimated: false }
          : segment,
      ),
    }));
    setSpeakerMessage("Segment updated in preview.");
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
    <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4 lg:px-5">
      <div className="grid gap-4" data-testid="workspace-shell">
        <RecordingDetailHeader
          data={data}
          renaming={false}
          retrying={false}
          onRename={async () => undefined}
          onRetry={() => undefined}
        />

        <div
          className="hidden items-start gap-4 xl:grid xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.84fr)]"
          data-testid="desktop-workspace-grid"
        >
          <TranscriptWorkspaceTab
            activeSegmentId={activeSegmentId}
            audioRef={desktopAudioRef}
            data={data}
            error={null}
            exportLinks={transcriptExportLinks}
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
            onUpdateSegment={updateSegment}
          />
          <NotesEditorTab
            canGenerate
            dirty={notesDirty}
            draft={notesDraft}
            error={null}
            exportLinks={notesExportLinks}
            notes={data.notes}
            notesBusy={false}
            saveBusy={false}
            saveMessage={saveMessage}
            onDraftChange={handleDraftChange}
            onGenerate={regenerateNotes}
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
              error={null}
              exportLinks={transcriptExportLinks}
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
              onUpdateSegment={updateSegment}
            />
          </TabsContent>
          <TabsContent value="notes">
            <NotesEditorTab
              canGenerate
              dirty={notesDirty}
              draft={notesDraft}
              error={null}
              exportLinks={notesExportLinks}
              notes={data.notes}
              notesBusy={false}
              saveBusy={false}
              saveMessage={saveMessage}
              onDraftChange={handleDraftChange}
              onGenerate={regenerateNotes}
              onSave={saveNotes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
