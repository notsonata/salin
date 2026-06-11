export type LanguageOption = "auto" | "tl" | "en";
export type ProcessingMode = "fast" | "accurate";
export type SpeakerCount = "auto" | "1" | "2" | "3" | "4" | "5_plus";
export type JobStage =
  | "uploaded"
  | "preprocessing"
  | "transcribing"
  | "completed"
  | "failed";

export interface RecordingSummary {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  language: LanguageOption;
  processing_mode: ProcessingMode;
  speaker_count: SpeakerCount;
  created_at: string;
  updated_at: string;
}

export interface ProcessingJobSummary {
  id: string;
  recording_id: string;
  stage: JobStage;
  retryable: boolean;
  retry_count: number;
  error_message: string | null;
  last_provider: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface TranscriptSegment {
  id: string;
  recording_id: string;
  index: number;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker_label: string;
  speaker_estimated: boolean;
  source_provider: string;
}

export interface ArtifactUrls {
  original?: string;
  normalized?: string;
}

export interface RecordingDetailResponse {
  recording: RecordingSummary;
  job: ProcessingJobSummary;
  transcript_segments: TranscriptSegment[];
  artifact_urls?: ArtifactUrls;
}

export interface RecordingCreateResponse {
  recording: RecordingSummary;
  job: ProcessingJobSummary;
}

export interface RetryResponse {
  recording_id: string;
  job: ProcessingJobSummary;
}
