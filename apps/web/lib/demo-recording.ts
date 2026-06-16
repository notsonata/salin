import type { RecordingDetailResponse } from "@salin/shared";

const demoAudio =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

export const demoRecordingDetail: RecordingDetailResponse = {
  recording: {
    id: "preview_recording",
    filename: "taglish-lecture-preview.mp3",
    content_type: "audio/mpeg",
    file_size: 24800000,
    language: "auto",
    processing_mode: "accurate",
    speaker_count: "auto",
    created_at: "2026-06-16T09:00:00.000Z",
    updated_at: "2026-06-16T09:24:00.000Z",
  },
  job: {
    id: "preview_job",
    recording_id: "preview_recording",
    stage: "completed",
    retryable: false,
    retry_count: 0,
    error_message: null,
    last_provider: "groq",
    created_at: "2026-06-16T09:00:00.000Z",
    updated_at: "2026-06-16T09:24:00.000Z",
    started_at: "2026-06-16T09:01:00.000Z",
    completed_at: "2026-06-16T09:24:00.000Z",
  },
  artifact_urls: {
    original: demoAudio,
    normalized: demoAudio,
  },
  transcript_segments: [
    {
      id: "preview_seg_1",
      recording_id: "preview_recording",
      index: 0,
      start_ms: 0,
      end_ms: 4800,
      text: "Good morning everyone, today pag-uusapan natin yung structure ng research interview.",
      speaker_label: "Speaker 1",
      speaker_estimated: true,
      source_provider: "groq",
    },
    {
      id: "preview_seg_2",
      recording_id: "preview_recording",
      index: 1,
      start_ms: 5200,
      end_ms: 10600,
      text: "Sir, kailangan po ba na exact yung questions or pwede siyang maging conversational?",
      speaker_label: "Speaker 2",
      speaker_estimated: true,
      source_provider: "groq",
    },
    {
      id: "preview_seg_3",
      recording_id: "preview_recording",
      index: 2,
      start_ms: 11200,
      end_ms: 18100,
      text: "Conversational is okay, basta consistent yung goal. You still need timestamps para madali balikan yung important answers.",
      speaker_label: "Speaker 1",
      speaker_estimated: true,
      source_provider: "groq",
    },
    {
      id: "preview_seg_4",
      recording_id: "preview_recording",
      index: 3,
      start_ms: 19600,
      end_ms: 25600,
      text: "So after transcription, we review the audio, fix speaker labels, then generate notes from the transcript?",
      speaker_label: "Speaker 2",
      speaker_estimated: true,
      source_provider: "groq",
    },
    {
      id: "preview_seg_5",
      recording_id: "preview_recording",
      index: 4,
      start_ms: 27000,
      end_ms: 33800,
      text: "Exactly. The notes should come from stored transcript data, not directly from the raw audio file.",
      speaker_label: "Speaker 1",
      speaker_estimated: true,
      source_provider: "groq",
    },
  ],
  notes: {
    status: "completed",
    summary:
      "The recording explains how to run a structured but conversational research interview, then review the transcript through timestamps before generating notes.",
    key_points: [
      "Interview questions can be conversational as long as the research goal stays consistent.",
      "Clickable timestamps help reviewers verify important answers against the audio.",
      "Speaker labels are useful, but they should remain editable because they are estimated.",
    ],
    decisions: [
      "Use the stored transcript as the source for notes generation.",
      "Review timestamps before finalizing notes or exports.",
    ],
    action_items: [
      "Prepare an interview guide before recording.",
      "Rename estimated speakers after transcript review.",
      "Export the transcript and notes after edits are saved.",
    ],
    questions: [
      "How many speakers should be expected for the real interview?",
      "Which transcript sections need manual verification before export?",
    ],
    error_message: null,
    source_provider: "openrouter:preview",
    generation_count: 1,
    started_at: "2026-06-16T09:25:00.000Z",
    completed_at: "2026-06-16T09:25:12.000Z",
    updated_at: "2026-06-16T09:25:12.000Z",
  },
};

export function demoExportHref(label: string) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(`${label} preview export`)}`;
}
