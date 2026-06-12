import type {
  LanguageOption,
  NotesGenerationResponse,
  ProcessingMode,
  RecordingCreateResponse,
  RecordingDetailResponse,
  RetryResponse,
  SpeakerCount,
} from "./api-types";

export interface CreateRecordingInput {
  file: File;
  language: LanguageOption;
  processing_mode: ProcessingMode;
  speaker_count: SpeakerCount;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    const detail =
      typeof payload?.detail === "string" ? payload.detail : "Request failed";
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export class SalinApiClient {
  constructor(private readonly baseUrl: string) {}

  async createRecording(input: CreateRecordingInput): Promise<RecordingCreateResponse> {
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("language", input.language);
    formData.append("processing_mode", input.processing_mode);
    formData.append("speaker_count", input.speaker_count);

    const response = await fetch(`${this.baseUrl}/recordings`, {
      method: "POST",
      body: formData,
    });

    return parseResponse<RecordingCreateResponse>(response);
  }

  async getRecording(recordingId: string): Promise<RecordingDetailResponse> {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}`, {
      cache: "no-store",
    });

    return parseResponse<RecordingDetailResponse>(response);
  }

  async retryRecording(recordingId: string): Promise<RetryResponse> {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}/retry`, {
      method: "POST",
    });

    return parseResponse<RetryResponse>(response);
  }

  async generateNotes(recordingId: string): Promise<NotesGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}/notes/generate`, {
      method: "POST",
    });

    return parseResponse<NotesGenerationResponse>(response);
  }
}
