from __future__ import annotations

from salin_api.repositories.recordings import TranscriptSegmentInput
from salin_worker.providers.diarization import DiarizationSegment
from salin_worker.services.diarization import align_speaker_labels


def build_transcript_segment(
    *,
    index: int = 0,
    start_ms: int,
    end_ms: int,
    speaker_label: str = "Speaker",
    speaker_estimated: bool = True,
) -> TranscriptSegmentInput:
    return TranscriptSegmentInput(
        index=index,
        start_ms=start_ms,
        end_ms=end_ms,
        text="Kamusta sa class.",
        speaker_label=speaker_label,
        speaker_estimated=speaker_estimated,
        source_provider="groq",
    )


def test_align_speaker_labels_uses_largest_overlap() -> None:
    transcript_segments = [
        build_transcript_segment(index=0, start_ms=1_000, end_ms=4_000),
        build_transcript_segment(index=1, start_ms=4_000, end_ms=6_000),
    ]
    diarization_segments = [
        DiarizationSegment(start_ms=2_800, end_ms=6_000, speaker_label="Speaker 2"),
        DiarizationSegment(start_ms=0, end_ms=2_900, speaker_label="Speaker 1"),
    ]

    aligned_segments = align_speaker_labels(transcript_segments, diarization_segments)

    assert [segment.speaker_label for segment in aligned_segments] == [
        "Speaker 1",
        "Speaker 2",
    ]
    assert all(segment.speaker_estimated for segment in aligned_segments)


def test_align_speaker_labels_keeps_segment_when_no_diarization_overlap() -> None:
    transcript_segment = build_transcript_segment(
        start_ms=10_000,
        end_ms=12_000,
        speaker_label="Reviewed Speaker",
        speaker_estimated=False,
    )

    aligned_segments = align_speaker_labels(
        [transcript_segment],
        [DiarizationSegment(start_ms=0, end_ms=5_000, speaker_label="Speaker 1")],
    )

    assert aligned_segments == [transcript_segment]
