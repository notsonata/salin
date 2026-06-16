import type {
  LanguageOption,
  NotesGenerationResponse,
  NotesUpdateRequest,
  ProcessingMode,
  RecordingCreateResponse,
  RecordingDetailResponse,
  RecordingListResponse,
  RecordingRenameRequest,
  RetryResponse,
  SegmentUpdateRequest,
  SpeakerCount,
  SpeakerRenameRequest,
  TranscriptSegmentsUpdateResponse,
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

  transcriptExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/transcript.txt`;
  }

  transcriptPdfExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/transcript.pdf`;
  }

  notesMarkdownExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/notes.md`;
  }

  notesExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/notes.txt`;
  }

  notesPdfExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/notes.pdf`;
  }

  combinedMarkdownExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/combined.md`;
  }

  combinedExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/combined.txt`;
  }

  combinedPdfExportUrl(recordingId: string): string {
    return `${this.baseUrl}/recordings/${recordingId}/exports/combined.pdf`;
  }

  async listRecordings(): Promise<RecordingListResponse> {
    const response = await fetch(`${this.baseUrl}/recordings`, {
      cache: "no-store",
    });

    return parseResponse<RecordingListResponse>(response);
  }

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

  async renameRecording(
    recordingId: string,
    payload: RecordingRenameRequest,
  ): Promise<RecordingDetailResponse> {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}/rename`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
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

  async updateNotes(
    recordingId: string,
    payload: NotesUpdateRequest,
  ): Promise<NotesGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}/notes`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return parseResponse<NotesGenerationResponse>(response);
  }

  async renameSpeaker(
    recordingId: string,
    payload: SpeakerRenameRequest,
  ): Promise<TranscriptSegmentsUpdateResponse> {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}/speakers/rename`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return parseResponse<TranscriptSegmentsUpdateResponse>(response);
  }

  async updateSegment(
    recordingId: string,
    segmentId: string,
    payload: SegmentUpdateRequest,
  ): Promise<TranscriptSegmentsUpdateResponse> {
    const response = await fetch(
      `${this.baseUrl}/recordings/${recordingId}/transcript-segments/${segmentId}`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    return parseResponse<TranscriptSegmentsUpdateResponse>(response);
  }
}
