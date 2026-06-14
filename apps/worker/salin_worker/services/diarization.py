from __future__ import annotations

from dataclasses import replace

from salin_api.repositories.recordings import TranscriptSegmentInput

from salin_worker.providers.diarization import DiarizationSegment


def align_speaker_labels(
    transcript_segments: list[TranscriptSegmentInput],
    diarization_segments: list[DiarizationSegment],
) -> list[TranscriptSegmentInput]:
    ordered_diarization_segments = sorted(
        diarization_segments,
        key=lambda segment: (segment.start_ms, segment.end_ms, segment.speaker_label),
    )

    aligned_segments: list[TranscriptSegmentInput] = []
    for transcript_segment in transcript_segments:
        best_segment = _best_overlapping_segment(
            transcript_segment=transcript_segment,
            diarization_segments=ordered_diarization_segments,
        )
        if best_segment is None:
            aligned_segments.append(transcript_segment)
            continue

        aligned_segments.append(
            replace(
                transcript_segment,
                speaker_label=best_segment.speaker_label,
                speaker_estimated=True,
            )
        )

    return aligned_segments


def _best_overlapping_segment(
    *,
    transcript_segment: TranscriptSegmentInput,
    diarization_segments: list[DiarizationSegment],
) -> DiarizationSegment | None:
    best_segment: DiarizationSegment | None = None
    best_overlap_ms = 0

    for diarization_segment in diarization_segments:
        overlap_ms = _overlap_ms(
            transcript_segment.start_ms,
            transcript_segment.end_ms,
            diarization_segment.start_ms,
            diarization_segment.end_ms,
        )
        if overlap_ms > best_overlap_ms:
            best_segment = diarization_segment
            best_overlap_ms = overlap_ms

    return best_segment


def _overlap_ms(
    left_start_ms: int,
    left_end_ms: int,
    right_start_ms: int,
    right_end_ms: int,
) -> int:
    return max(0, min(left_end_ms, right_end_ms) - max(left_start_ms, right_start_ms))
